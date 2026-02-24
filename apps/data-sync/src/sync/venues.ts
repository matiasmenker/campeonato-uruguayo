import type { PrismaClient } from "db";
import type { VenueDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const mapVenue = (venueDto: VenueDto, countryId: number, cityId: number | null) => {
  return {
    sportmonksId: venueDto.id,
    name: venueDto.name,
    city: venueDto.city_name ?? null,
    capacity: venueDto.capacity ?? null,
    imagePath: venueDto.image_path ?? null,
    countryId,
    cityId,
  };
};

const syncVenues = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("🚀 Syncing Venues...");

  const venuesResponse = await client.getAllPages<VenueDto>("/venues", { perPage: 100 });

  log.info(`📥 Venues fetched from API: ${venuesResponse.length}`);

  let savedVenues = 0;
  let skippedVenues = 0;

  for (let i = 0; i < venuesResponse.length; i++) {
    const venueDto = venuesResponse[i];

    if (!venueDto.name) {
      log.warn(`⚠️  Venue skipped: ${venueDto.city_name}`);
      skippedVenues += 1;
      continue;
    }

    const countrySportmonksId = venueDto.country_id ?? null;
    if (!countrySportmonksId) {
      log.warn(`⚠️  Venue skipped: ${venueDto.name}`);
      skippedVenues += 1;
      continue;
    }

    const country = await db.country.findUnique({
      where: { sportmonksId: countrySportmonksId },
    });
    if (!country) {
      log.warn(`⚠️  Venue skipped: ${venueDto.id}`);
      skippedVenues += 1;
      continue;
    }

    const citySportmonksId = venueDto.city_id ?? null;
    const cityName = venueDto.city_name ?? "Unknown";
    let cityId: number | null = null;

    if (citySportmonksId) {
      const city = await db.city.upsert({
        where: { sportmonksId: citySportmonksId },
        create: {
          sportmonksId: citySportmonksId,
          countryId: country.id,
          name: cityName,
        },
        update: {
          countryId: country.id,
          name: cityName,
        },
      });
      cityId = city.id;
    }

    const venue = mapVenue(venueDto, country.id, cityId);
    await db.venue.upsert({
      where: { sportmonksId: venue.sportmonksId },
      create: venue,
      update: venue,
    });
    savedVenues += 1;

    const processed = i + 1;
    if (processed % 25 === 0 || processed === venuesResponse.length) {
      log.info(`💾 Progress: ${processed}/${venuesResponse.length} venues`);
    }
  }

  const totalRows = await db.venue.count();
  log.info(
    [
      "✅ Venues saved to database",
      `   🟢 Saved (inserted/updated): ${savedVenues}`,
      `   🟡 Skipped: ${skippedVenues}`,
      `   📦 Total rows in Venue table: ${totalRows}`,
    ].join("\n")
  );
};

export { syncVenues };
