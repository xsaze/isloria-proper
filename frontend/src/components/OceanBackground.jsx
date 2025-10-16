/**
 * OceanBackground - Simple colored background for ocean
 * Uses a solid color rectangle instead of tiles for maximum performance
 */

import { memo } from 'react';

/**
 * Deep water color - matches the deep_water tile color
 * Sampled from deep_water tile texture
 */
const OCEAN_COLOR = 0x2b5266; // Dark blue-green ocean color

/**
 * OceanBackground Component
 * Renders a simple colored rectangle as ocean background
 */
export const OceanBackground = memo(function OceanBackground() {
    // Create a large rectangle to cover entire screen
    const drawOcean = (g) => {
        g.clear();
        g.beginFill(OCEAN_COLOR);
        // Make it very large to cover any screen size
        g.drawRect(-5000, -5000, 10000, 10000);
        g.endFill();
    };

    return (
        <graphics
            draw={drawOcean}
            zIndex={-1000}  // Render far behind everything
        />
    );
});

export default OceanBackground;
