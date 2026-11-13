/**
 * Safe formatting utilities to prevent runtime TypeErrors from unexpected backend payloads.
 */

export const formatRating = (rating: any, fallback = '4.8'): string => {
    if (rating === null || rating === undefined || rating === '') return fallback;
    const num = Number(rating);
    if (isNaN(num) || num <= 0) return fallback;
    return num.toFixed(1);
};

export const formatCoordinates = (val: any, decimals = 4): string => {
    if (val === null || val === undefined || val === '') return '0.0000';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toFixed(decimals);
};

export const safeDateString = (dateVal: any, fallback = 'N/A'): string => {
    if (!dateVal) return fallback;
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return fallback;
        return d.toLocaleDateString();
    } catch (_) {
        return fallback;
    }
};
