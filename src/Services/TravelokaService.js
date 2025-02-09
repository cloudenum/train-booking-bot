import got, { Options as GotOptions } from "got";
import * as Cookie from "cookie";
import { DateTime } from "luxon";
import open from "open";
import travelokaConfig from "../Config/Traveloka.js";
import { generateRandomString } from "../Utils/String.js";
import { delay } from "../Utils/Misc.js";

/**
 * Get cookies from response headers
 *
 * @param {import("got").Response} res
 * @returns
 */
const getCookiesFromResponse = (res) => {
  const rawCookies = res.headers["set-cookie"];

  let result = {};
  if (rawCookies) {
    result = rawCookies.reduce((acc, cookieStr) => {
      return { ...acc, ...Cookie.parse(cookieStr) };
    }, {});

    const keysToRemove = ["Domain", "Path", "Expires", "Secure", "SameSite"];
    for (const key of keysToRemove) {
      delete result[key];
    }
  }

  return result;
};

const buildCookieHeader = (cookies) => {
  return Object.entries(cookies)
    .map(([key, val]) => `${key}=${val}`)
    .join("; ");
};

const getInitialCookies = async () => {
  const url = `${travelokaConfig.baseApiUrl}/user/context/web`;
  const body = {
    clientInterface: "desktop",
    data: {
      client: "MOBILE_WEB",
      info: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      },
      query: {},
    },
    context: {},
    fields: [],
  };

  const options = {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      connection: "keep-alive",
      origin: "https://www.traveloka.com",
      pragma: "no-cache",
      referer: "https://www.traveloka.com/en-id",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "content-type": "application/json",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "x-domain": "user",
      "x-route-prefix": "en-id",
    },
    json: body,
    responseType: "json",
    throwHttpErrors: false,
  };

  try {
    const res = await got(url, options);
    return getCookiesFromResponse(res);
  } catch (error) {
    console.error(error);
    return null;
  }
};

let cookiesObj = {
  "tv-repeat-visit": true,
  tv_user: '{"authorizationLevel":100,"id":null}',
  countryCode: "ID",
  ...(await getInitialCookies()),
};

/**
 * Refresh cookies object with new cookies from response
 *
 * @param {import("got").Response} res
 */
const refreshCookies = (res) => {
  const newCookies = getCookiesFromResponse(res);

  cookiesObj = {
    ...cookiesObj,
    ...newCookies,
  };

  defaultHeaders.Cookie = buildCookieHeader(cookiesObj);
};

const defaultHeaders = {
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.traveloka.com",
  Cookie: buildCookieHeader(cookiesObj),
  Referer: "https://www.traveloka.com/en-id",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  "sec-ch-ua":
    '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "x-route-prefix": "en-id",
};

/**
 * Perform HTTP request
 *
 * @param {string} method
 * @param {string} url
 * @param {GotOptions} options
 * @returns {Promise<import("got").Response>}
 */
const doRequest = async (method, url, options) => {
  const optionParams = {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    responseType: "json",
  };

  try {
    const response = await got(url, optionParams);
    return response;
  } catch (error) {
    console.error(error.message);
    return error.response;
  }
};

export const TravelokaService = {
  /**
   * Get available trains from origin to destination
   *
   * @param {string} originCode
   * @param {string} destinationCode
   * @param {DateTime} departureDate
   * @param {number} numOfAdult
   * @param {number} numOfInfant
   * @returns {Promise<Array>} List of available trains
   */
  async GetTrains(
    originCode,
    destinationCode,
    departureDate,
    numOfAdult = 1,
    numOfInfant = 0,
  ) {
    if (!originCode || !destinationCode || !departureDate) {
      throw new Error("Missing required parameters for GetTrains");
    }

    const url = `${travelokaConfig.baseApiUrl}/train/search/inventoryv2`;
    const payload = {
      fields: [],
      data: {
        departureDate: {
          day: departureDate.day,
          month: departureDate.month,
          year: departureDate.year,
        },
        returnDate: null,
        destination: destinationCode,
        origin: originCode,
        numOfAdult: numOfAdult,
        numOfInfant: numOfInfant,
        providerType: "KAI",
        currency: "IDR",
        trackingMap: { utmId: null, utmEntryTimeMillis: 0 },
      },
      clientInterface: "desktop",
    };

    const response = await doRequest("POST", url, {
      headers: {
        "x-domain": "train",
        Referer: `${travelokaConfig.baseUrl}/kereta-api/search?st=${originCode}.${destinationCode}&dt=${departureDate.toFormat("dd-LL-yyyy")}.null&ps=1.0&pd=KAI`,
      },
      json: payload,
    });

    if (!response || !response.ok) {
      return [];
    }

    refreshCookies(response);

    const resJson = response.body;
    return resJson?.data?.departTrainInventories || [];
  },

  /**
   * Pre-booking train ticket
   *
   * @param {object} selectedTrain
   * @param {DateTime} departureDate
   * @param {object} trackingSpec
   * @returns {Promise<object>} Pre-booking data
   */
  async PreBooking(selectedTrain, departureDate, trackingSpec) {
    const url = `${travelokaConfig.baseApiUrl}/trip/booking/bookingPage`;

    const selectedPrice = selectedTrain.fare.currencyValue.amount;

    const payload = {
      fields: [],
      data: {
        selectedProductSpec: {
          trainBookingSpec: {
            departDetails: {
              trainInventorySummary: selectedTrain,
              departureDateString: departureDate.toFormat("EEE, dd LLL yyyy"),
            },
            numOfAdult: 1,
            numOfInfant: 0,
            trackingMap: {
              searchId: trackingSpec.searchId,
              utmId: null,
              utmEntryTimeMillis: 0,
            },
            feSearchFormSpec: {
              departureDate: departureDate.toFormat("EEEE, dd LLLL yyyy"),
              returnDate: "",
            },
          },
          productType: "TRAIN",
        },
        addOnProductSpecs: [],
        trackingSpec: trackingSpec,
        selectedPrice: {
          selectedPrice: {
            currency: "IDR",
            amount: selectedPrice,
            nullOrEmpty: false,
          },
        },
        currency: "IDR",
        viewDescriptionContext: {
          isUsingStyledVD: true,
        },
      },
      clientInterface: "desktop",
    };

    const response = await doRequest("POST", url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "x-domain": "trip",
      },
      json: payload,
    });

    console.info(`API response: ${response.url} ${response.statusCode}`);

    if (response && response.ok) {
      refreshCookies(response);

      const resJson = response.body;
      if (resJson?.data) {
        return resJson.data;
      }
    }

    throw new Error("Failed to pre-booking");
  },

  /**
   * Create booking for selected train
   *
   * @param {Passenger} passenger
   * @param {object} selectedTrain
   * @param {DateTime} departureDate
   * @param {object} trackingSpec
   * @returns {Promise<object>} Booking data
   */
  async CreateBooking(passenger, selectedTrain, departureDate, trackingSpec) {
    const url = `${travelokaConfig.baseApiUrl}/trip/booking/createBooking`;

    const fee = 7500;
    const selectedPrice = Number(selectedTrain.fare.currencyValue.amount) + fee;

    const payload = {
      fields: [],
      data: {
        addOnProductSpecs: [],
        bookingContact: {
          formData: {
            travelerForm: {
              title: "",
              "name.full": passenger.FullName,
              "name.regexName": "DEFAULT",
              phoneNumber: {
                countryCode: passenger.PhoneNumber.countryCode,
                phoneNumber: passenger.PhoneNumber.nationalNumber,
              },
              emailAddress: passenger.Email,
              "travelerID.type": "PASSPORT",
              "travelerID.number": "",
              "travelerID.expirationDate": "",
            },
          },
        },
        createBookingTravelerSpecs: {
          adultFormData: [
            {
              travelerForm: {
                title: passenger.Title,
                "name.full": passenger.FullName,
                "name.regexName": "DEFAULT",
                "travelerID.type": "KTP",
                "travelerID.number": passenger.NationalID,
              },
            },
          ],
          childFormData: [],
          infantFormData: [],
        },
        createBookingProductSpecificAddOns: [],
        createBookingSimpleAddOns: [],
        createBookingCrossSellAddOns: [],
        selectedPrice: {
          selectedPrice: {
            currency: "IDR",
            amount: selectedPrice,
            nullOrEmpty: false,
          },
        },
        selectedProductSpec: {
          trainBookingSpec: {
            departDetails: {
              trainInventorySummary: selectedTrain,
              departureDateString: departureDate.toFormat("EEE, dd LLL yyyy"),
            },
            numOfAdult: 1,
            numOfInfant: 0,
            trackingMap: {
              searchId: trackingSpec.searchId,
              utmId: null,
              utmEntryTimeMillis: 0,
            },
            feSearchFormSpec: {
              departureDate: departureDate.toFormat("EEEE, dd LLLL yyyy"),
              returnDate: "",
            },
          },
          productType: "TRAIN",
        },
        promptItemContext: null,
        currency: "IDR",
        trackingSpec: trackingSpec,
        deviceData: {
          audio_hash_id: 0,
          available_screen_resolution: "[0,0]",
          color_depth: 0,
          cookies_enabled: false,
          empty_eval_length: 0,
          error_ff: false,
          fonts: "[]",
          hardware_concurrency: 0,
          has_autocomplete: false,
          has_autofill: false,
          indexed_db: false,
          is_chrome: false,
          languages: "[]",
          latitude: null,
          local_storage: false,
          longitude: null,
          mobile_platform: null,
          open_database: false,
          platform: "",
          plugins: "[]",
          plugin_support: false,
          product_sub: "",
          screen_resolution: "0x0",
          session_storage: true,
          timezone: "UTC",
          timezone_offset: 0,
          touch_support: "null",
          user_agent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
          vendor: "",
        },
      },
      clientInterface: "desktop",
    };

    const response = await doRequest("POST", url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "x-domain": "trip",
      },
      json: payload,
    });

    console.info(`API response: ${response.url} ${response.statusCode}`);

    if (response && response.ok) {
      refreshCookies(response);

      const resJson = response.body;
      if (resJson?.data) {
        return resJson.data;
      }
    }

    throw new Error("Failed to create booking");
  },

  /**
   * Open payment page in browser
   *
   * @param {string} invoiceId
   * @param {string} auth
   * @param {string} payAuth
   * @returns {Promise<void>}
   */
  async openPaymentPageInBrowser(invoiceId, auth, payAuth) {
    let url = `${travelokaConfig.baseUrl}/payment/selection`;
    const queryParams = new URLSearchParams({
      invoiceId,
      auth,
      payAuth,
    });

    url = `${url}?${queryParams.toString()}`;
    await open(url);

    console.info(`If the browser does not open, please open this link below`);
    console.info(url);
  },

  /**
   *
   * @param {Passenger} passenger
   * @param {{
   *  origin: string,
   *  destination: string,
   *  departureDate: string,
   *  trainNames: string[],
   *  minPrice: number,
   *  maxPrice: number,
   *  departTimes: string[],
   *  onlyDirect: boolean,
   *  sortBy: string
   * }} options
   * @returns {Promise<number>}
   */
  async AutoBookTicket(
    passenger,
    options = {
      origin,
      destination,
      departureDate,
      trainNames,
      minPrice,
      maxPrice,
      departTimes,
      onlyDirect,
      sortBy,
    },
  ) {
    let exitCode = 0;

    if (options.minPrice && typeof options.minPrice !== "number") {
      options.minPrice = Number(options.minPrice);
    }

    if (options.maxPrice && typeof options.maxPrice !== "number") {
      options.maxPrice = Number(options.maxPrice);
    }

    console.log(options);

    const departureDate = DateTime.fromISO(options.departureDate);

    console.log(
      `Fetching trains from ${options.origin} to ${options.destination} on ${departureDate.toLocaleString(DateTime.DATETIME_MED)} ...`,
    );

    let trains = await this.GetTrains(
      options.origin,
      options.destination,
      departureDate,
    );

    console.log(`Processing ${trains.length} trains`);

    trains = trains.filter(
      (train) => train.availability.toLowerCase() === "available",
    );

    if (options.trainNames && options.trainNames.length > 0) {
      console.log(
        `Filtering trains by names: ${options.trainNames.join(", ")}`,
      );
      trains = trains.filter((train) => {
        const trainName = train.trainBrandLabel
          .replace(/\s*\(\d+\)$/, "")
          .toLowerCase();

        return options.trainNames.some((name) =>
          trainName.includes(name.toLowerCase()),
        );
      });
    }

    if (options.onlyDirect) {
      console.log("Filtering direct trains only");
      trains = trains.filter((train) => Number(train.numTransits) === 0);
    }

    if (options.minPrice || options.maxPrice) {
      console.log(
        `Filtering by price: ${options.minPrice} - ${options.maxPrice}`,
      );
      trains = trains.filter(
        (train) =>
          (!options.minPrice ||
            train.fare.currencyValue.amount >= options.minPrice) &&
          (!options.maxPrice ||
            train.fare.currencyValue.amount <= options.maxPrice),
      );
    }

    if (options.departTimes && options.departTimes.length > 0) {
      console.log(
        `Filtering by depart times: ${options.departTimes.join(", ")}`,
      );
      let tempTrains = [];
      for (const departTime of options.departTimes) {
        let minDepartTime;
        let maxDepartTime;

        switch (departTime?.toLowerCase()) {
          case "morning":
            minDepartTime = {
              hour: 6,
              minute: 0,
            };
            maxDepartTime = {
              hour: 11,
              minute: 59,
            };
            break;
          case "afternoon":
            minDepartTime = {
              hour: 12,
              minute: 0,
            };
            maxDepartTime = {
              hour: 17,
              minute: 59,
            };
            break;
          case "evening":
            minDepartTime = {
              hour: 18,
              minute: 0,
            };
            maxDepartTime = {
              hour: 23,
              minute: 59,
            };
            break;
          case "night":
            minDepartTime = {
              hour: 0,
              minute: 0,
            };
            maxDepartTime = {
              hour: 5,
              minute: 59,
            };
            break;
          default:
            minDepartTime = null;
            maxDepartTime = null;
            break;
        }

        if (minDepartTime && maxDepartTime) {
          const temp = trains.filter((train) => {
            const hm = train.departureTime.hourMinute;
            return (
              hm.hour >= minDepartTime.hour &&
              hm.minute >= minDepartTime.minute &&
              hm.hour <= maxDepartTime.hour &&
              hm.minute <= maxDepartTime.minute
            );
          });

          tempTrains = tempTrains.concat(temp);
        }
      }

      trains = tempTrains ? tempTrains : trains;
    }

    switch (options.sortBy?.toLowerCase()) {
      case "price":
        trains = trains.sort(
          (a, b) => a.fare.currencyValue.amount - b.fare.currencyValue.amount,
        );
        break;
      case "earliest_depart_time":
        trains = trains.sort((a, b) => {
          const aDepartTime = Number(
            `${a.departureTime.hourMinute.hour}${String(a.departureTime.hourMinute.minute).padStart(2, "0")}`,
          );
          const bDepartTime = Number(
            `${b.departureTime.hourMinute.hour}${String(b.departureTime.hourMinute.minute).padStart(2, "0")}`,
          );

          return aDepartTime - bDepartTime;
        });
        break;
      case "latest_depart_time":
        trains = trains.sort((a, b) => {
          const aDepartTime = Number(
            `${a.departureTime.hourMinute.hour}${String(a.departureTime.hourMinute.minute).padStart(2, "0")}`,
          );
          const bDepartTime = Number(
            `${b.departureTime.hourMinute.hour}${String(b.departureTime.hourMinute.minute).padStart(2, "0")}`,
          );

          return bDepartTime - aDepartTime;
        });
        break;
      default:
        break;
    }

    console.log(`Found ${trains.length} available trains`);

    let success = false;
    for (const train of trains) {
      await delay(1000);

      let hourMinute = train.departureTime.hourMinute;
      const departHour = String(hourMinute.hour).padStart(2, "0");
      const departMinute = String(hourMinute.minute).padStart(2, "0");

      hourMinute = train.arrivalTime.hourMinute;
      const arrivalHour = String(hourMinute.hour).padStart(2, "0");
      const arrivalMinute = String(hourMinute.minute).padStart(2, "0");

      const departTime = `${departHour}:${departMinute}`;
      const arrivalTime = `${arrivalHour}:${arrivalMinute}`;

      console.log(
        `[${departTime} - ${arrivalTime}] [${train.ticketLabel}] ${train.trainBrandLabel} - Price: ${train.fare.currencyValue.amount}`,
      );

      try {
        let trackingSpec = {
          contexts: {},
          searchId: generateRandomString(9),
          marketingContexts: {
            ga_id: null,
            fbp: null,
          },
          marketingContextCapsule: {
            amplitude_session_id: null,
            ga_session_id: null,
            ga_client_id: null,
            amplitude_device_id: null,
            fb_browser_id_fbp: null,
            referrer_url: null,
            page_full_url: null,
            client_user_agent: null,
          },
        };

        const preBooking = await this.PreBooking(
          train,
          departureDate,
          trackingSpec,
        );

        if (!preBooking || !preBooking.trackingSpec) {
          throw new Error("No pre-booking data returned");
        }

        trackingSpec = preBooking.trackingSpec;

        await delay(500);

        console.log(
          `Creating booking for train ${train.trainBrandLabel} ${train.ticketLabel} ...`,
        );

        const booking = await this.CreateBooking(
          passenger,
          train,
          departureDate,
          trackingSpec,
        );

        if (!booking) {
          throw new Error("No booking data returned");
        }

        trackingSpec = booking.trackingSpec;

        if (!booking.invoiceId || !booking.auth || !booking.payAuth) {
          throw new Error("Failed to get booking details");
        }

        await delay(500);

        console.log(
          `Opening payment page for invoice ${booking.invoiceId} ...`,
        );

        await this.openPaymentPageInBrowser(
          booking.invoiceId,
          booking.auth,
          booking.payAuth,
        );

        success = true;
        break;
      } catch (error) {
        console.error(error.message);
        console.log(
          `Failed to book train ${train.trainBrandLabel} ${train.ticketLabel}`,
        );
      }
    }

    if (!success) {
      exitCode = 1;
    }

    console.log("Done");

    return exitCode;
  },
};

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
