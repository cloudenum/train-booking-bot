import got from "got";
import { DateTime } from "luxon";
import { config as tiketDotComConfig } from "../Config/TiketDotCom.js";
import { buildCookieHeader, getCookiesFromResponse } from "../Utils/Cookies.js";

let defaultHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  DNT: 1,
  "Sec-GPC": 1,
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": 1,
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "cross-site",
  Priority: "u=4",
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
  TE: "trailers",
  Origin: "https://www.tiket.com",
  Referer: "https://www.tiket.com/",
};

const initialRequest = async () => {
  const url = `${tiketDotComConfig.baseUrl}`;

  /**
   * @type {import("got").Options}
   */
  const options = {
    method: "GET",
    headers: defaultHeaders,
    throwHttpErrors: true,
    responseType: "text",
    http2: true,
    decompress: true,
  };

  try {
    return await got(url, options);
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

/**
 * Refresh cookies object with new cookies from response
 *
 * @param {import("got").Response} res
 */
const refreshCookies = (res) => {
  const newCookies = getCookiesFromResponse(res);

  for (const newCookie of newCookies) {
    const index = cookies.findIndex((cookie) => cookie.Key === newCookie.Key);
    if (index >= 0) {
      cookies[index] = newCookie;
    } else {
      cookies.push(newCookie);
    }
  }

  defaultHeaders.Cookie = buildCookieHeader(cookies);
};

let cookies = [];

refreshCookies(await initialRequest());

/**
 * Perform HTTP request
 *
 * @param {string} method
 * @param {string} url
 * @param {GotOptions} options
 * @returns {Promise<import("got").Response>}
 */
const doRequest = async (method, url, options) => {
  if (!options) {
    options = {};
  }

  const optionParams = {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    responseType: "json",
    throwHttpErrors: false,
  };

  const response = await got(url, optionParams);
  return response;
};

export class TiketDotComService {
  /**
   *
   * @param {string} origin
   * @param {string} destination
   * @param {DateTime} depratureDate
   * @param {number} numOfAdults
   * @param {number} numOfInfants
   */
  static async getTrains(
    origin,
    destination,
    depratureDate,
    numOfAdults = 1,
    numOfInfants = 0,
  ) {
    const url = `${tiketDotComConfig.baseApiUrl}/tix-train-search-v2/v5/train/journeys`;
    const queryParams = new URLSearchParams({
      orig: origin,
      otype: "STATION",
      dest: destination,
      dtype: "STATION",
      ttype: "ONE_WAY",
      ddate: depratureDate.toFormat("yyyyLLdd"),
      rdate: "",
      acount: numOfAdults,
      icount: numOfInfants,
    });

    try {
      const response = await doRequest(
        "GET",
        `${url}?${queryParams.toString()}`,
      );

      refreshCookies(response);

      if (response?.ok) {
        const resJson = response.body;
        if (resJson?.code?.toLowerCase() === "success") {
          return resJson.data?.departJourneys?.journeys || [];
        }
      }
    } catch (error) {
      console.error(error.message);
    }

    return [];
  }

  static async AutoBookTicket(
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
    console.debug(options);

    let trains = await this.getTrains(
      options.origin,
      options.destination,
      options.departureDate,
    );

    console.info(`Processing ${trains.length} trains`);

    if (options.randomPick && trains.length > 1) {
      trains = [trains[Math.floor(Math.random() * trains.length)]];
    } else if (options.pickFirst && trains.length > 1) {
      trains = [trains[0]];
    }

    console.debug(trains);
  }
}
