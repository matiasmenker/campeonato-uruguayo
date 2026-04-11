import { createRequire } from "module";
import type { VenueDto } from "sportmonks-client";
import type { SyncDependencies } from "./shared.js";

const require = createRequire(import.meta.url);
const venueImageOverrides: { sportmonksId: number; imagePath: string }[] = require("./venue-image-overrides.json");

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
  log.info("=== VENUES START ===");
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
      update: {
        name: venue.name,
        city: venue.city,
        capacity: venue.capacity,
        countryId: venue.countryId,
        cityId: venue.cityId,
        ...(venue.imagePath !== null ? { imagePath: venue.imagePath } : {}),
      },
    });
    savedVenues += 1;

    const processed = i + 1;
    if (processed % 25 === 0 || processed === venuesResponse.length) {
      log.info(`💾 Progress: ${processed}/${venuesResponse.length} venues`);
    }
  }

  let patchedImages = 0;
  for (const override of venueImageOverrides) {
    const updated = await db.venue.updateMany({
      where: { sportmonksId: override.sportmonksId, imagePath: null },
      data: { imagePath: override.imagePath },
    });
    if (updated.count > 0) patchedImages += 1;
  }
  if (patchedImages > 0) {
    log.info(`🖼️  Applied ${patchedImages} manual image override(s)`);
  }

  const totalRows = await db.venue.count();
  log.info("✅ Venues sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedVenues}`);
  log.info(`🟡 Skipped: ${skippedVenues}`);
  log.info(`📦 Total rows in Venue table: ${totalRows}`);
  log.info("=== VENUES END ===");
};

export { syncVenues };
