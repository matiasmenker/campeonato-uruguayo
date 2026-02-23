import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import type { VenueRaw } from "sportmonks-client";

export interface SyncVenuesDeps {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

/**
 * Sync venues. Cities are derived from venue data.
 * Countries and cities must be synced first (via syncCountries and city upserts here).
 */
export async function syncVenues({ client, db, log }: SyncVenuesDeps): Promise<void> {
  const ctx = log.child({ block: "venues" });
  ctx.info("🏟️ Syncing venues and cities...");

  const items = await client.getAllPages<VenueRaw>("/venues", {
    include: "country,city",
    filters: "populate",
    perPage: 50,
    onPage: (data, page) => {
      ctx.info(`  📥 Downloaded page ${page}: ${data.length} venues`);
    },
  });

  const countryCache = new Map<number, number>();
  const cityCache = new Map<number, number>();

  for (let i = 0; i < items.length; i++) {
    const v = items[i];
    const countrySportmonksId = v.country_id ?? v.country?.id ?? null;
    let countryId: number | null = null;
    if (countrySportmonksId) {
      if (!countryCache.has(countrySportmonksId)) {
        const country = await db.country.findUnique({
          where: { sportmonksId: countrySportmonksId },
        });
        if (country) countryCache.set(countrySportmonksId, country.id);
      }
      countryId = countryCache.get(countrySportmonksId) ?? null;
    }

    const citySportmonksId =
      v.city_id ?? v.city_data?.id ?? (typeof v.city === "object" && v.city ? v.city.id : null);
    const cityName =
      v.city_name ??
      (typeof v.city === "string" ? v.city : null) ??
      v.city_data?.name ??
      (typeof v.city === "object" && v.city ? v.city.name : null);

    let cityId: number | null = null;
    if (citySportmonksId && countryId) {
      if (!cityCache.has(citySportmonksId)) {
        const city = await db.city.upsert({
          where: { sportmonksId: citySportmonksId },
          create: {
            sportmonksId: citySportmonksId,
            countryId,
            name: cityName ?? "Unknown",
          },
          update: { name: cityName ?? "Unknown" },
        });
        cityCache.set(citySportmonksId, city.id);
      }
      cityId = cityCache.get(citySportmonksId) ?? null;
    }

    const venueCity = cityName ?? null;
    await db.venue.upsert({
      where: { sportmonksId: v.id },
      create: {
        sportmonksId: v.id,
        name: v.name,
        city: venueCity,
        capacity: v.capacity ?? null,
        imagePath: v.image_path ?? null,
        countryId,
        cityId,
      },
      update: {
        name: v.name,
        city: venueCity,
        capacity: v.capacity ?? null,
        imagePath: v.image_path ?? null,
        countryId,
        cityId,
      },
    });
    if ((i + 1) % 100 === 0) {
      ctx.info(`  💾 Progress: ${i + 1}/${items.length} venues`);
    }
  }

  ctx.info(`✅ Venues: ${items.length} synced`);
}
