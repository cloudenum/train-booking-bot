import { DateTime } from "luxon";

/**
 * Process this program options
 *
 * @param {import("commander").OptionValues} commandOptions
 * @returns {import("commander").OptionValues}
 */
export function processProgramOptions(commandOptions) {
  const options = {};
  if (commandOptions.departureDate) {
    options.departureDate = DateTime.fromISO(commandOptions.departureDate);
  }

  if (
    commandOptions.minPrice !== undefined &&
    commandOptions.minPrice !== null
  ) {
    options.minPrice = parseInt(commandOptions.minPrice);
  }

  if (
    commandOptions.maxPrice !== undefined &&
    commandOptions.maxPrice !== null
  ) {
    options.maxPrice = parseInt(commandOptions.maxPrice);
  }

  return {
    ...commandOptions,
    ...options,
  };
}
