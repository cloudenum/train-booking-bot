export class Passenger {
  /**
   *
   * @param {string} title
   * @param {string} fullName
   * @param {string} email
   * @param {string} nationalID
   * @param {{
   *  countryCode: string,
   *  nationalNumber: string
   * }} phoneNumber
   */
  constructor(title, fullName, email, nationalID, phoneNumber) {
    this.Title = title;
    this.FullName = fullName;
    this.Email = email;
    this.NationalID = nationalID;
    this.PhoneNumber = phoneNumber;
  }
}
