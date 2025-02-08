/**
 * Delay for a given time in milliseconds
 *
 * @param {number} time - in milliseconds
 * @returns {Promise<any>}
 */
export function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
