import { DateTime } from "luxon";
import { parsePhoneNumber } from "./PhoneNumber.js";

/**
 * Departure date should be valid and in the future or today
 *
 * @param {string} departureDate
 * @returns {boolean}
 */
export function validateDepartureDate(departureDate) {
  try {
    const departure = DateTime.fromISO(departureDate).set({
      hour: 0,
      minute: 0,
      second: 0,
    });

    return departure >= DateTime.now().set({ hour: 0, minute: 0, second: 0 });
  } catch {
    return false;
  }
}

/**
 * Validate name title to be one of MR, MRS, MS
 *
 * @param {string} title
 * @returns {boolean}
 */
export function validateNameTitle(title) {
  const nameTitles = ["MR", "MRS", "MS"];
  return nameTitles.includes(title);
}

/**
 * Validate full name to be non-empty
 *
 * @param {string} fullName
 * @returns {boolean}
 */
export function validateFullName(fullName) {
  return fullName.trim().length > 0;
}

/**
 * Validate email address format
 *
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return emailRegex.test(email);
}

/**
 * Validate phone number
 *
 * @param {string} phoneNumber
 * @returns {boolean}
 */
export function validatePhoneNumber(phoneNumber) {
  try {
    parsePhoneNumber(phoneNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate national ID number
 *
 * @param {string} nationalId
 * @returns {boolean}
 */
export function validateNationalId(nationalId) {
  const nationalIdRegex = /^[0-9]{16}$/;
  return nationalIdRegex.test(nationalId);
}
