// thanks AJ - https://coolaj86.com/articles/time-ago-in-under-50-lines-of-javascript/

const MOMENT = 0;
const MOMENTS = 2;
const SECONDS = 5;
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;
// workaround for when `ms = Date.now() - 0`
const NEVER = 45 * YEAR;

const en = {
    moment: "a moment ago",
    moments: "moments ago",
    seconds: "%s seconds ago",
    minute: "a minute ago",
    minutes: "%m minutes ago",
    hour: "an hour ago",
    hours: "%h hours ago",
    day: "yesterday",
    days: "%D days ago",
    week: "last week",
    weeks: "%w weeks ago",
    month: "last month",
    months: "%M months ago",
    years: ">1 year",
    never: "never",
};
const enShort = {
    moment: "now",
    moments: "now",
    seconds: "now",
    minute: "1min",
    minutes: "%mmin",
    hour: "~1h",
    hours: "%hh",
    day: "yest",
    days: "%Dd",
    week: "1w",
    weeks: "%ww",
    month: "1mo",
    months: "%Mmo",
    years: ">1y",
    never: "never",
};
export const future = {
    en: {
        moment: "nowish",
        moments: "in moments",
        seconds: "in %s seconds",
        minute: "in a minute",
        minutes: "in %m minutes",
        hour: "in an hour",
        hours: "in %h hours",
        day: "tomorrow",
        days: "in %D days",
        week: "next week",
        weeks: "in %w weeks",
        month: "next month",
        months: "in %M months",
        years: "in >1 year",
        never: "never",
    },
};

const interval = {
    en: {
        moment: "%m milliseconds",
        moments: "moments",
        seconds: "%s seconds",
        minute: "a minute",
        minutes: "%m minutes",
        hour: "an hour",
        hours: "%h hours",
        day: "a day",
        days: "%D days",
        week: "a week",
        weeks: "%w weeks",
        month: "a month",
        months: "%M months",
        years: ">1 year",
        never: "never",
    },
};

const localeNames = {
    en,
    "en-short": enShort,
    "en-interval": interval.en,
    "en-future": future.en,
};

export function timeFuture(ms, locale = future.en) {
    return timeAgo(ms, locale);
}
export function timeInterval(ms, locale = interval.en) {
    return timeAgo(ms, locale);
}
export function timeAgo(ms, localeName = en) {
    let locale = localeName;
    if (!locale.moment) locale = localeNames[locale];
    if (!locale.moment)
        throw new Error(`unknown locale or localeName ${localeName}`);

    let ago = Math.floor(ms / 1000);
    let part = 0;

    if (ago < MOMENTS) {
        return locale.moment.replace(/%\w?/, ms);
    }
    if (ago < SECONDS) {
        return locale.moments.replace(/%\w?/, ms);
    }
    if (ago < MINUTE) {
        return locale.seconds.replace(/%\w?/, ago);
    }

    if (ago < 2 * MINUTE) {
        return locale.minute;
    }
    if (ago < 2 * HOUR) {
        while (ago >= MINUTE) {
            ago -= MINUTE;
            part += 1;
        }
        return locale.minutes.replace(/%\w?/, part);
    }

    if (ago < 2 * DAY) {
        while (ago >= HOUR) {
            ago -= HOUR;
            part += 1;
        }
        return locale.hours.replace(/%\w?/, part);
    }

    if (ago < 2 * WEEK) {
        while (ago >= DAY) {
            ago -= DAY;
            part += 1;
        }
        return locale.days.replace(/%\w?/, part);
    }

    if (ago < 2 * MONTH) {
        while (ago >= WEEK) {
            ago -= WEEK;
            part += 1;
        }
        return locale.weeks.replace(/%\w?/, part);
    }

    if (ago < 2 * YEAR) {
        // 45 years, approximately the epoch
        while (ago >= MONTH) {
            ago -= MONTH;
            part += 1;
        }
        return locale.months.replace(/%\w?/, part);
    }

    if (ago < NEVER) {
        return locale.years;
    }

    return locale.never;
}
