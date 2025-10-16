/**
 * Ocean Rocks Grid - Prerendered static ocean background with rocks
 * Generated once at server start for maximum performance
 */

import { OCEAN_ROCK_VARIANTS, WALK_CONFIG } from './islandConfig.js';

export class OceanRocksGrid {
    constructor(gridSize = 80) {
        this.gridSize = gridSize;
        this.oceanRocks = [];
        this.generate();
    }

    /**
     * Generate ocean rocks once
     * Only stores positions where rocks exist (sparse array optimization)
     */
    generate() {
        const rockChance = WALK_CONFIG.OCEAN_ROCK_CHANCE;
        const variantKeys = Object.keys(OCEAN_ROCK_VARIANTS);
        const variantWeights = Object.values(OCEAN_ROCK_VARIANTS);

        // Build cumulative weights for weighted random selection
        const cumulativeWeights = [];
        let sum = 0;
        for (const weight of variantWeights) {
            sum += weight;
            cumulativeWeights.push(sum);
        }

        // Generate rocks at random positions
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (Math.random() < rockChance) {
                    // Weighted random variant selection
                    const random = Math.random() * sum;
                    let variant = variantKeys[variantKeys.length - 1];

                    for (let i = 0; i < cumulativeWeights.length; i++) {
                        if (random < cumulativeWeights[i]) {
                            variant = variantKeys[i];
                            break;
                        }
                    }

                    this.oceanRocks.push({
                        x,
                        y,
                        variant
                    });
                }
            }
        }

        console.log(`🌊 Prerendered ${this.oceanRocks.length} ocean rocks on ${this.gridSize}x${this.gridSize} grid`);
    }

    /**
     * Get ocean rocks data for network transmission
     * Returns array of rock positions with variants
     */
    getOceanRocks() {
        return this.oceanRocks.map(rock => ({
            x: rock.x,
            y: rock.y,
            tileType: 'ocean_rocks',
            variant: `${rock.variant}.png`
        }));
    }

    /**
     * Check if there's a rock at given grid position
     */
    hasRockAt(x, y) {
        return this.oceanRocks.some(rock => rock.x === x && rock.y === y);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            gridSize: this.gridSize,
            rockCount: this.oceanRocks.length,
            density: (this.oceanRocks.length / (this.gridSize * this.gridSize) * 100).toFixed(2) + '%'
        };
    }
}
