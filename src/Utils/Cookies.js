import * as CookieLib from "cookie";

/**
 * Get cookies from response headers
 *
 * @param {import("got").Response} res
 * @returns {{
 *   Flags: {
 *       Domain: string | null;
 *       Path: string | null;
 *       Expires: string | null;
 *       MaxAge: string | null;
 *       Secure: string | null;
 *       HttpOnly: string | null;
 *       SameSite: string | null;
 *   };
 *   Key: string;
 *   Value: *;
 * }[]}
 */
export const getCookiesFromResponse = (res) => {
  const rawCookies = res.headers["set-cookie"];

  let result = [];
  if (rawCookies) {
    result = rawCookies.reduce((acc, cookieStr) => {
      const parsedCookie = CookieLib.parse(cookieStr);
      const cookie = {
        Key: null,
        Value: null,
        Flags: {
          Domain: parsedCookie.Domain || parsedCookie.domain || null,
          Path: parsedCookie.Path || parsedCookie.path || null,
          Expires: parsedCookie.Expires || parsedCookie.expires || null,
          MaxAge: parsedCookie["Max-Age"] || parsedCookie["max-age"] || null,
          Secure: parsedCookie.Secure || parsedCookie.secure || null,
          HttpOnly: parsedCookie.HttpOnly || parsedCookie.httponly || null,
          SameSite: parsedCookie.SameSite || parsedCookie.samesite || null,
        },
      };

      Object.keys(parsedCookie).forEach((key) => {
        if (
          ![
            "domain",
            "path",
            "expires",
            "max-age",
            "secure",
            "httponly",
            "samesite",
          ].includes(key.toLowerCase())
        ) {
          cookie.Key = key;
          cookie.Value = parsedCookie[key];
        }
      });

      acc.push(cookie);
      return acc;
    }, []);
  }

  return result;
};

/**
 *
 * @param {{
 *   Flags: {
 *       Domain: string | null;
 *       Path: string | null;
 *       Expires: string | null;
 *       MaxAge: string | null;
 *       Secure: string | null;
 *       HttpOnly: string | null;
 *       SameSite: string | null;
 *   };
 *   Key: string;
 *   Value: *;
 * }[]} cookies
 * @returns
 */
export const buildCookieHeader = (cookies) => {
  return cookies.map((cookie) => `${cookie.Key}=${cookie.Value}`).join("; ");
};
