export function formatCompactK(value: number | string, threshold: number = 1000): string {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
        return `${value}`;
    }
    if (numericValue > threshold) {
        return `${(numericValue / 1000).toFixed(1)}K`;
    }
    return `${value}`;
}
