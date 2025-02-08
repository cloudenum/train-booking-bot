import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Parse a phone number into its country code and national number
 *
 * @param {string} input
 * @returns {{countryCode: string, nationalNumber: string}}
 */
export function parsePhoneNumber(input) {
  const phoneNumber = parsePhoneNumberFromString(input, "ID");
  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new Error("Invalid phone number");
  }
  return {
    countryCode: `+${phoneNumber.countryCallingCode}`,
    nationalNumber: phoneNumber.nationalNumber.toString(),
  };
}
