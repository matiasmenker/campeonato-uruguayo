import type { Country, PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import { CountryDto } from "sportmonks-client";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const mapCountry = (countryDto: CountryDto) => {
  const officialName = countryDto.official_name.trim();
  const imageUrl = countryDto.image_path.trim();

  return {
    sportmonksId: countryDto.id,
    name: countryDto.name,
    officialName,
    code: countryDto.iso2,
    imageUrl,
  };
};

const syncCountries = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  const BATCH_SIZE = 20;
  log.info("🌍 Syncing Countries...");

  const countriesResponse = await client.get<CountryDto[]>(
    "https://api.sportmonks.com/v3/core/countries",
    {
      filters: "populate",
      perPage: 500,
    }
  );

  log.info(`✅ Countries fetched from API: ${countriesResponse.length}`);

  const countriesToPersist = countriesResponse
    .filter((country) => {
      if (!country.image_path || !country.iso2 || !country.iso3) {
        log.warn(`⚠️  Skipping country: ${country.name}`);
        return false;
      }
      return true;
    })
    .map(mapCountry);

  const skippedCountries = countriesResponse.length - countriesToPersist.length;
  for (let i = 0; i < countriesToPersist.length; i += BATCH_SIZE) {
    const batch = countriesToPersist.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((country) => {
        return db.country.upsert({
          where: { sportmonksId: country.sportmonksId },
          create: country as Country,
          update: country as Country,
        });
      })
    );

    const processed = Math.min(i + BATCH_SIZE, countriesToPersist.length);
    if (processed % 25 === 0 || processed === countriesToPersist.length) {
      log.info(`💾 Progress: ${processed}/${countriesToPersist.length} countries`);
    }
  }

  const upsertedCountries = countriesToPersist.length;
  const persistedCountries = await db.country.count();
  log.info("✅ Countries added in database", {
    upsertedCountries,
    skippedCountries,
    persistedCountries,
  });
};

export { syncCountries };
