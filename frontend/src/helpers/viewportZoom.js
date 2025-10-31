/**
 * Calculate the default zoom level based on market cap and device type
 * @param {number} mc - Current market cap value
 * @param {boolean} isMobile - Whether the device is mobile
 * @returns {number} - The default zoom scale (lower = more zoomed out)
 */
export const getDefaultZoom = (mc, isMobile) => {
  if (isMobile) {
    // Mobile zoom levels
    if (mc >= 300000) return 0.15;
    if (mc >= 220000) return 0.3;
    if (mc >= 144000) return 0.4;
    if (mc >= 88000) return 0.5;
    if (mc >= 64000) return 0.6;
    if (mc >= 48000) return 0.7;
    if (mc >= 32000) return 0.8;
    if (mc >= 16000) return 0.9;
    return 1.0; // Default for MC < 16000
  } else {
    // Desktop zoom levels
    if (mc >= 300000) return 0.6;
    if (mc >= 140000) return 0.7;
    if (mc >= 80000) return 0.85;
    return 1.0; // Default for MC < 80000
  }
};
