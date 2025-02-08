/**
 * Generate a random string of a given length
 *
 * @param {number} length
 * @returns
 */
export function generateRandomString(length) {
  if (!length) {
    length = 8;
  }

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
