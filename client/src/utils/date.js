const DEFAULT_RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
});

const TIME_DIVISIONS = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Infinity, unit: 'year' },
];

const toTimestamp = (value) => {
    if (value instanceof Date) {
        return value.getTime();
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
};

export const formatRelativeTimeFromNow = (value, fallback = 'Recently') => {
    const timestamp = toTimestamp(value);
    if (timestamp == null) {
        return fallback;
    }

    let duration = (timestamp - Date.now()) / 1000;
    let divisionIndex = 0;

    while (divisionIndex < TIME_DIVISIONS.length) {
        const division = TIME_DIVISIONS[divisionIndex];
        if (Math.abs(duration) < division.amount) {
            break;
        }
        duration /= division.amount;
        divisionIndex += 1;
    }

    const { unit } = TIME_DIVISIONS[Math.min(divisionIndex, TIME_DIVISIONS.length - 1)];
    return DEFAULT_RELATIVE_TIME_FORMATTER.format(Math.round(duration), unit);
};

export const isWithinPastHours = (value, thresholdHours = 48) => {
    const timestamp = toTimestamp(value);
    if (timestamp == null) {
        return false;
    }
    const diffMs = Date.now() - timestamp;
    if (!Number.isFinite(diffMs) || diffMs < 0) {
        return false;
    }
    return diffMs <= thresholdHours * 60 * 60 * 1000;
};
