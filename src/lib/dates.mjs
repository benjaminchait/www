// Date formatting helpers, ported from the Eleventy filters.
// All dates render in Pacific Time (America/Los_Angeles).

import { DateTime } from "luxon";

const ZONE = "America/Los_Angeles";

// "1 January 2024"
export function dateFormat(date) {
  return DateTime.fromJSDate(new Date(date), { zone: ZONE }).toFormat("d MMMM yyyy");
}

// "Mon, 01 Jan 2024 12:00:00 -0700" (RSS / RFC 822)
export function dateRfc822(date) {
  return DateTime.fromJSDate(new Date(date), { zone: ZONE }).toFormat("ccc, dd MMM yyyy HH:mm:ss ZZZ");
}

// "2024.01.01"
export function dateDotFormat(date) {
  return DateTime.fromJSDate(new Date(date), { zone: ZONE }).toFormat("yyyy.MM.dd");
}

// "16 March 2026 14:30" (build timestamp for the colophon)
export function dateNow() {
  return DateTime.now().setZone(ZONE).toFormat("d MMMM yyyy HH:mm");
}
