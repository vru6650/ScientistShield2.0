/**
 * Clamp pagination inputs to safe defaults to avoid unbounded queries.
 *
 * @param {object} query - Incoming query params, typically req.query.
 * @param {object} [options] - Optional overrides.
 * @param {number} [options.defaultStartIndex=0] - Fallback when startIndex is missing or invalid.
 * @param {number} [options.defaultLimit=10] - Fallback when limit is missing or invalid.
 * @param {number} [options.maxLimit=50] - Hard upper bound for returned documents.
 * @returns {{startIndex: number, limit: number}}
 */
export function normalizePagination(query = {}, options = {}) {
    const {
        defaultStartIndex = 0,
        defaultLimit = 10,
        maxLimit = 50,
    } = options;

    const parse = (value, fallback) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    };

    const rawStart = parse(query.startIndex, defaultStartIndex);
    const rawLimit = parse(query.limit, defaultLimit);

    const startIndex = Math.max(rawStart, 0);
    const limit = Math.min(Math.max(rawLimit, 1), maxLimit);

    return { startIndex, limit };
}
