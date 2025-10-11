/**
 * Math utility functions for game calculations
 */

/**
 * Calculate distance between two points (squared to avoid sqrt)
 */
export function distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * Calculate actual distance between two points
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt(distanceSquared(x1, y1, x2, y2));
}

/**
 * Normalize a vector
 */
export function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Get random element from array
 */
export function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random number between min and max
 */
export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}
