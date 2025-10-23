/**
 * Biome Generator - Noise-based biome assignment for island tiles
 * Uses simplex noise to create organic biome distributions
 */

import { createNoise2D } from 'simplex-noise';
import { BIOMES, BIOME_CONFIG } from './islandConfig.js';

export class BiomeGenerator {
    /**
     * Create a new biome generator with a seed
     * @param {number} seed - Random seed for noise generation
     */
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.noise2D = createNoise2D(() => this.seededRandom());
        this.scale = BIOME_CONFIG.NOISE_SCALE;
        this.thresholds = BIOME_CONFIG.THRESHOLDS;
    }

    /**
     * Seeded random number generator (simple LCG)
     * Used to make noise deterministic based on seed
     */
    seededRandom() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    /**
     * Get biome type at a specific tile position
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @returns {string} Biome name ('grassland', 'rocky', or 'forest')
     */
    getBiomeAt(x, y) {
        // Get noise value at this position (-1 to 1)
        const noiseValue = this.noise2D(x * this.scale, y * this.scale);

        // Map noise value to biome
        if (noiseValue < this.thresholds.grassland) {
            return 'grassland';
        } else if (noiseValue > this.thresholds.rocky) {
            return 'rocky';
        } else {
            return 'forest';
        }
    }

    /**
     * Get biome configuration for a specific tile position
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @returns {object} Biome configuration object
     */
    getBiomeConfigAt(x, y) {
        const biomeName = this.getBiomeAt(x, y);
        return BIOMES[biomeName];
    }

    /**
     * Assign tile type and variant based on biome at position
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @returns {object} { type: 'grass'|'dirt', variant: string }
     */
    assignTileType(x, y) {
        const biome = this.getBiomeConfigAt(x, y);

        // Determine if grass or dirt based on biome terrain probabilities
        const isGrass = Math.random() < biome.terrain.grass;
        const type = isGrass ? 'grass' : 'dirt';

        // Select variant based on biome-specific weights
        const variants = isGrass ? biome.grassVariants : biome.dirtVariants;
        const variant = this.weightedRandom(variants);

        return { type, variant };
    }

    /**
     * Get decoration weights for a specific tile position
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     * @returns {object} Decoration weights object
     */
    getDecorationWeights(x, y) {
        const biome = this.getBiomeConfigAt(x, y);
        return biome.decorations;
    }

    /**
     * Weighted random selection
     * @param {object} weights - Object with item names as keys and weights as values
     * @returns {string} Selected item name
     */
    weightedRandom(weights) {
        const items = Object.keys(weights);
        const cumulativeWeights = [];
        let sum = 0;

        for (const item of items) {
            sum += weights[item];
            cumulativeWeights.push(sum);
        }

        const random = Math.random() * sum;
        for (let i = 0; i < cumulativeWeights.length; i++) {
            if (random < cumulativeWeights[i]) {
                return items[i];
            }
        }

        return items[items.length - 1];
    }

    /**
     * Get biome statistics for all tiles in an array
     * Useful for debugging and analytics
     * @param {Array} tiles - Array of tile objects with x,y coordinates
     * @returns {object} Statistics object with biome counts
     */
    getBiomeStats(tiles) {
        const stats = {
            grassland: 0,
            rocky: 0,
            forest: 0
        };

        for (const tile of tiles) {
            const biome = this.getBiomeAt(tile.x, tile.y);
            stats[biome]++;
        }

        return stats;
    }
}
