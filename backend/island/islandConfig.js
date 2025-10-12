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
export const GRASS_VARIANTS = {
    'grass_full_mid': 0.40,
    'grass_full_low': 0.30,
    'grass_full_high': 0.20,
    'plants_1': 0.02,
    'plants_2': 0.02,
    'plants_3': 0.01,
    'plants_4': 0.01,
    'plants_5': 0.01,
    'plants_6': 0.01,
    'plants_7': 0.01,
    'plants_8': 0.005,
    'plants_9': 0.005,
    'plants_10': 0.005
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
    'water_rock_1': 0.20,
    'water_rock_2': 0.20,
    'water_rock_3': 0.20,
    'water_rock_4': 0.20,
    'water_rock_5': 0.10,
    'water_rock_7': 0.10
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
    // Rocks - collision (NPCs avoid)
    rocks: {
        collision: true,
        variants: ['rock_1', 'rock_2', 'rock_3', 'rock_4', 'rock_5', 'rock_6'],
        weight: 0.08  // 8% chance per land tile
    },
    // Logs - collision (NPCs avoid)
    logs: {
        collision: true,
        variants: ['log_1', 'log_2', 'log_3', 'log_4', 'log_5'],
        weight: 0.05  // 5% chance per land tile
    },
    // Dirt rocks - collision (NPCs avoid)
    dirt_rocks: {
        collision: true,
        variants: ['dirt_rock_1', 'dirt_rock_2', 'dirt_rock_3', 'dirt_rock_4', 'dirt_rock_5', 'dirt_rock_6'],
        weight: 0.06  // 6% chance per land tile
    }
};

// Random walk configuration
export const WALK_CONFIG = {
    CARDINAL_WEIGHT: 0.70,  // 70% chance to move N/S/E/W
    DIAGONAL_WEIGHT: 0.30,  // 30% chance to move diagonally
    OCEAN_ROCK_CHANCE: 0.10 // 10% chance for deep water to become ocean rock
};

// Isometric tile dimensions (in pixels) - adjust based on actual tile size
export const TILE_DIMENSIONS = {
    WIDTH: 64,   // Full tile width
    HEIGHT: 32   // Full tile height (half width for isometric)
};
