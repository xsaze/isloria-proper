/**
 * TileLoader - Preloads and manages all isometric tile assets
 * Provides efficient caching and batch loading for island rendering
 */

import { Assets } from 'pixi.js';

/**
 * Tile asset configuration matching backend islandConfig.js
 */
const TILE_CONFIG = {
    grass: {
        basePath: '/assets/tiles/grass',
        variants: [
            'grass_full_high.png',
            'grass_full_mid.png',
            'grass_full_low.png',
            'grass_dark.png',
            'plants_1.png',
            'plants_2.png',
            'plants_3.png',
            'plants_4.png',
            'plants_5.png',
            'plants_6.png',
            'plants_7.png',
            'plants_8.png',
            'plants_9.png',
            'plants_10.png'
        ]
    },
    dirt: {
        basePath: '/assets/tiles/dirt',
        variants: [
            'dirt_1.png',
            'dirt_2.png',
            'distorted_dirt_1.png',
            'distorted_dirt_2.png',
            'distorted_dirt_3.png',
            'distorted_dirt_4.png',
            'distorted_dirt_5.png',
            'distorted_dirt_6.png',
            'distorted_dirt_7.png',
            'soil_1.png',
            'soil_2.png',
            'soil_3.png',
            'soil_4.png',
            'soil_5.png'
        ]
    },
    deep_water: {
        basePath: '/assets/tiles/deep_water',
        variants: [
            'deep_water_1.png',
            'deep_water_2.png',
            'deep_water_3.png'
        ]
    },
    shallow_water: {
        basePath: '/assets/tiles/shallow_water',
        variants: [
            'shallow_water_full.png',
            'trans_shallow_grass_edge_NE.png',
            'trans_shallow_grass_edge_NW.png',
            'trans_shallow_grass_edge_SE.png',
            'trans_shallow_grass_edge_SW.png',
            'trans_shallow_grass_corner_N.png',
            'trans_shallow_grass_corner_E.png',
            'trans_shallow_grass_corner_S.png',
            'trans_shallow_grass_corner_W.png'
        ]
    },
    ocean_rocks: {
        basePath: '/assets/tiles/ocean_rocks',
        variants: [
            'water_rock_1.png',
            'water_rock_2.png',
            'water_rock_3.png',
            'water_rock_4.png',
            'water_rock_5.png',
            'water_rock_7.png'
        ]
    },
    decorations: {
        flowers: {
            basePath: '/assets/tiles/decorations',
            variants: [
                'flower_1.png',
                'flower_2.png',
                'flower_3.png',
                'flower_4.png',
                'flower_5.png',
                'flower_6.png',
                'flower_7.png'
            ]
        },
        rocks: {
            basePath: '/assets/tiles/decorations',
            variants: [
                'rock_1.png',
                'rock_2.png',
                'rock_3.png',
                'rock_4.png',
                'rock_5.png',
                'rock_6.png'
            ]
        },
        logs: {
            basePath: '/assets/tiles/decorations',
            variants: [
                'log_1.png',
                'log_2.png',
                'log_3.png',
                'log_4.png',
                'log_5.png'
            ]
        },
        dirt_rocks: {
            basePath: '/assets/tiles/decorations',
            variants: [
                'dirt_rock_1.png',
                'dirt_rock_2.png',
                'dirt_rock_3.png',
                'dirt_rock_4.png',
                'dirt_rock_5.png',
                'dirt_rock_6.png'
            ]
        }
    }
};

/**
 * TileLoader class - Singleton for managing tile assets
 */
export class TileLoader {
    constructor() {
        this.loaded = false;
        this.loading = false;
        this.textures = {
            grass: {},
            dirt: {},
            deep_water: {},
            shallow_water: {},
            ocean_rocks: {},
            decorations: {
                flowers: {},
                rocks: {},
                logs: {},
                dirt_rocks: {}
            }
        };
    }

    /**
     * Load all tile assets
     * @returns {Promise<void>}
     */
    async load() {
        if (this.loaded) {
            console.log('✅ Tiles already loaded');
            return;
        }

        if (this.loading) {
            console.log('⏳ Tiles already loading, waiting...');
            // Wait for loading to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.loading = true;
        console.log('🎨 Loading tile assets...');

        try {
            // Build asset manifest for batch loading
            const manifest = this._buildManifest();

            // Load all assets in parallel with aliases
            await Assets.load(manifest.map(item => ({ alias: item.alias, src: item.src })));

            // Store textures in organized structure
            for (const item of manifest) {
                this._storeTexture(item);
            }

            this.loaded = true;
            console.log(`✅ Loaded ${manifest.length} tile textures`);
        } catch (error) {
            console.error('❌ Failed to load tiles:', error);
            throw error;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Build asset manifest for preloading
     * @private
     */
    _buildManifest() {
        const manifest = [];

        // Load terrain tiles
        for (const [tileType, config] of Object.entries(TILE_CONFIG)) {
            if (tileType === 'decorations') continue;

            for (const variant of config.variants) {
                manifest.push({
                    alias: `${tileType}_${variant}`,
                    src: `${config.basePath}/${variant}`,
                    type: tileType,
                    variant
                });
            }
        }

        // Load decorations
        for (const [decorationType, config] of Object.entries(TILE_CONFIG.decorations)) {
            for (const variant of config.variants) {
                manifest.push({
                    alias: `decoration_${decorationType}_${variant}`,
                    src: `${config.basePath}/${variant}`,
                    type: 'decorations',
                    decorationType,
                    variant
                });
            }
        }

        return manifest;
    }

    /**
     * Store loaded texture in organized structure
     * @private
     */
    _storeTexture(item) {
        const texture = Assets.get(item.alias);

        if (item.type === 'decorations') {
            this.textures.decorations[item.decorationType][item.variant] = texture;
        } else {
            this.textures[item.type][item.variant] = texture;
        }
    }

    /**
     * Get texture for a specific tile
     * @param {string} tileType - Type of tile (grass, dirt, etc.)
     * @param {string} variant - Variant filename
     * @returns {Texture|null}
     */
    getTexture(tileType, variant) {
        if (!this.loaded) {
            return null;
        }

        return this.textures[tileType]?.[variant] || null;
    }

    /**
     * Get decoration texture
     * @param {string} decorationType - Type of decoration (flowers, rocks, logs, dirt_rocks)
     * @param {string} variant - Variant filename
     * @returns {Texture|null}
     */
    getDecorationTexture(decorationType, variant) {
        if (!this.loaded) {
            console.warn('⚠️ Tiles not loaded yet');
            return null;
        }

        return this.textures.decorations[decorationType]?.[variant] || null;
    }

    /**
     * Get all available variants for a tile type
     * @param {string} tileType - Type of tile
     * @returns {string[]}
     */
    getVariants(tileType) {
        if (tileType === 'decorations') {
            return Object.keys(TILE_CONFIG.decorations);
        }
        return TILE_CONFIG[tileType]?.variants || [];
    }

    /**
     * Get all available variants for a decoration type
     * @param {string} decorationType - Type of decoration
     * @returns {string[]}
     */
    getDecorationVariants(decorationType) {
        return TILE_CONFIG.decorations[decorationType]?.variants || [];
    }

    /**
     * Check if tiles are loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded;
    }
}

// Export singleton instance
export const tileLoader = new TileLoader();
