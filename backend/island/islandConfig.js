/**
 * Island generation configuration
 */

// MC value thresholds for island sizes
export const MC_SIZE_THRESHOLDS = [
    { maxMC: 10000, gridSize: 5 },     // 0-10k: 5x5 (25 tiles)
    { maxMC: 20000, gridSize: 7 },     // 10k-20k: 7x7 (49 tiles)
    { maxMC: 30000, gridSize: 9 },     // 20k-30k: 9x9 (81 tiles)
    { maxMC: 50000, gridSize: 11 },    // 30k-50k: 11x11 (121 tiles)
    { maxMC: Infinity, gridSize: 13 }  // 50k+: 13x13 (169 tiles) MAX
];

// Tile selection weights for land tiles
// 7:1:1:1 ratio - grass_dark is the primary grass tile
export const GRASS_VARIANTS = {
    'grass_dark': 0.70,          // 70% - Main grass tile
    'grass_full_mid': 0.10,      // 10%
    'grass_full_low': 0.10,      // 10%
    'grass_full_high': 0.10      // 10%
};

export const DIRT_VARIANTS = {
    'distorted_dirt_1': 0.10,
    'distorted_dirt_2': 0.10,
    'distorted_dirt_3': 0.10,
    'distorted_dirt_4': 0.10,
    'distorted_dirt_5': 0.10,
    'distorted_dirt_6': 0.10,
    'distorted_dirt_7': 0.10,
    'dirt_1': 0.15,
    'dirt_2': 0.15,
    'soil_1': 0.02,
    'soil_2': 0.02,
    'soil_3': 0.02,
    'soil_4': 0.02,
    'soil_5': 0.02
};

export const DEEP_WATER_VARIANTS = {
    'deep_water_1': 0.50,
    'deep_water_2': 0.30,
    'deep_water_3': 0.20
};

export const OCEAN_ROCK_VARIANTS = {
    'water_rock_1': 0.01,
    'water_rock_2': 0.01,
    'water_rock_3': 0.01,
    'water_rock_4': 0.01,
    'water_rock_5': 0.01,
    'water_rock_7': 0.01
};

// Shallow water transition tiles (based on direction)
export const SHALLOW_WATER_EDGES = {
    'NE': 'trans_shallow_grass_edge_NE',
    'NW': 'trans_shallow_grass_edge_NW',
    'SE': 'trans_shallow_grass_edge_SE',
    'SW': 'trans_shallow_grass_edge_SW'
};

export const SHALLOW_WATER_CORNERS = {
    'N': 'trans_shallow_grass_corner_N',
    'E': 'trans_shallow_grass_corner_E',
    'S': 'trans_shallow_grass_corner_S',
    'W': 'trans_shallow_grass_corner_W'
};

// Decoration variants and their collision properties
export const DECORATION_TYPES = {
    // Flowers - NO collision (NPCs walk through)
    flowers: {
        collision: false,
        variants: ['flower_1', 'flower_2', 'flower_3', 'flower_4', 'flower_5', 'flower_6', 'flower_7'],
        weight: 0.15  // 15% chance per land tile
    },
    // Rocks - collision (NPCs avoid) - REDUCED
    rocks: {
        collision: true,
        variants: ['rock_1', 'rock_2', 'rock_3', 'rock_4', 'rock_5', 'rock_6'],
        weight: 0.03  // 3% chance per land tile (reduced from 8%)
    },
    // Logs - collision (NPCs avoid) - REDUCED
    logs: {
        collision: true,
        variants: ['log_1', 'log_2', 'log_3', 'log_4', 'log_5'],
        weight: 0.02  // 2% chance per land tile (reduced from 5%)
    },
    // Dirt rocks - collision (NPCs avoid) - REDUCED
    dirt_rocks: {
        collision: true,
        variants: ['dirt_rock_1', 'dirt_rock_2', 'dirt_rock_3', 'dirt_rock_4', 'dirt_rock_5', 'dirt_rock_6'],
        weight: 0.02  // 2% chance per land tile (reduced from 6%)
    }
};

// Random walk configuration
export const WALK_CONFIG = {
    CARDINAL_WEIGHT: 0.70,  // 70% chance to move N/S/E/W
    DIAGONAL_WEIGHT: 0.30,  // 30% chance to move diagonally
    OCEAN_ROCK_CHANCE: 0.02 // 2% chance for deep water to become ocean rock (reduced by 80%)
};

// ============================================================================
// BIOME SYSTEM - Noise-based terrain generation
// ============================================================================

/**
 * Biome definitions - Each biome defines its terrain and decoration characteristics
 * Biomes are assigned based on 2D simplex noise values at each tile position
 */
export const BIOMES = {
    // GRASSLAND - Open fields with flowers, gentle terrain
    grassland: {
        name: 'Grassland',
        // Tile type probabilities
        terrain: {
            grass: 0.95,  // 95% grass tiles
            dirt: 0.05    // 5% dirt tiles (for variety)
        },
        // Grass variant distribution - 7:1:1:1 ratio
        grassVariants: {
            'grass_dark': 0.70,          // 70% - Main grass tile
            'grass_full_mid': 0.10,      // 10%
            'grass_full_low': 0.10,      // 10%
            'grass_full_high': 0.10      // 10%
        },
        // Dirt variant distribution (same as global)
        dirtVariants: DIRT_VARIANTS,
        // Decoration weights (high flowers, low obstacles) - REDUCED collision items
        decorations: {
            flowers: 0.25,      // 25% flowers (very high!)
            rocks: 0.01,        // 1% rocks (reduced)
            logs: 0.01,         // 1% logs (reduced)
            dirt_rocks: 0.01    // 1% dirt rocks (reduced)
        }
    },

    // ROCKY - Harsh terrain with boulders and rocks
    rocky: {
        name: 'Rocky',
        // Tile type probabilities
        terrain: {
            grass: 0.30,  // 30% grass
            dirt: 0.70    // 70% dirt (rocky terrain)
        },
        // Grass variant distribution - 7:1:1:1 ratio
        grassVariants: {
            'grass_dark': 0.70,          // 70% - Main grass tile
            'grass_full_mid': 0.10,      // 10%
            'grass_full_low': 0.10,      // 10%
            'grass_full_high': 0.10      // 10%
        },
        // Dirt variant distribution (more soil/distorted)
        dirtVariants: {
            'distorted_dirt_1': 0.12,
            'distorted_dirt_2': 0.12,
            'distorted_dirt_3': 0.12,
            'distorted_dirt_4': 0.12,
            'distorted_dirt_5': 0.12,
            'distorted_dirt_6': 0.10,
            'distorted_dirt_7': 0.10,
            'dirt_1': 0.08,
            'dirt_2': 0.08,
            'soil_1': 0.01,
            'soil_2': 0.01,
            'soil_3': 0.01,
            'soil_4': 0.005,
            'soil_5': 0.005
        },
        // Decoration weights (high rocks, medium logs) - REDUCED
        decorations: {
            flowers: 0.05,      // 5% flowers (low)
            rocks: 0.06,        // 6% rocks (reduced from 18%)
            logs: 0.03,         // 3% logs (reduced from 10%)
            dirt_rocks: 0.05    // 5% dirt rocks (reduced from 15%)
        }
    },

    // FOREST - Dense vegetation with logs and plants
    forest: {
        name: 'Forest',
        // Tile type probabilities
        terrain: {
            grass: 0.85,  // 85% grass (dense vegetation)
            dirt: 0.15    // 15% dirt (forest floor)
        },
        // Grass variant distribution - 7:1:1:1 ratio
        grassVariants: {
            'grass_dark': 0.70,          // 70% - Main grass tile
            'grass_full_mid': 0.10,      // 10%
            'grass_full_low': 0.10,      // 10%
            'grass_full_high': 0.10      // 10%
        },
        // Dirt variant distribution (more natural dirt/soil)
        dirtVariants: {
            'dirt_1': 0.25,
            'dirt_2': 0.25,
            'distorted_dirt_1': 0.08,
            'distorted_dirt_2': 0.08,
            'distorted_dirt_3': 0.08,
            'distorted_dirt_4': 0.08,
            'distorted_dirt_5': 0.08,
            'distorted_dirt_6': 0.05,
            'distorted_dirt_7': 0.05,
            'soil_1': 0.00,
            'soil_2': 0.00,
            'soil_3': 0.00,
            'soil_4': 0.00,
            'soil_5': 0.00
        },
        // Decoration weights (high logs, medium flowers) - REDUCED
        decorations: {
            flowers: 0.12,      // 12% flowers
            rocks: 0.02,        // 2% rocks (reduced from 6%)
            logs: 0.06,         // 6% logs (reduced from 20%)
            dirt_rocks: 0.03    // 3% dirt rocks (reduced from 8%)
        }
    }
};

/**
 * Biome noise configuration
 * Controls how biomes are distributed across the island
 */
export const BIOME_CONFIG = {
    // Noise scale - Lower = larger biome regions, Higher = smaller regions
    // 0.1 = ~10 tile regions, 0.05 = ~20 tile regions
    NOISE_SCALE: 0.08,  // Medium-sized biome regions

    // Noise thresholds for biome assignment
    // Noise returns values from -1 to 1
    THRESHOLDS: {
        grassland: -0.35,   // < -0.35 = Grassland
        rocky: 0.35         // > 0.35 = Rocky, else Forest (middle range)
    }
};

// Isometric tile dimensions (in pixels) - MUST match frontend IslandRenderer TILE_CONFIG
// Frontend uses TILE_WIDTH: 64, TILE_HEIGHT: 32 for isometric spacing
// Tiles are rendered with scale=2, but these values are the PRE-SCALE isometric dimensions
export const TILE_DIMENSIONS = {
    WIDTH: 64,    // Isometric tile width (used in projection formula)
    HEIGHT: 32    // Isometric tile height (used in projection formula)
};
