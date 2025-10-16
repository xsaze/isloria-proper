/**
 * Shared constants for the game
 */

// Direction mapping: NE=0, NW=1, SE=2, SW=3
export const DIRECTIONS = ['NE', 'NW', 'SE', 'SW'];

// Direction name to index mapping
export const DIRECTION_INDICES = {
    'NE': 0,
    'NW': 1,
    'SE': 2,
    'SW': 3
};

// Available animation states per NPC type
export const NPC_STATES = {
    stag: ['idle', 'walk', 'run'],
    boar: ['idle', 'run'],
    player: ['idle', 'walk'],
    wolf: ['idle', 'walk']  // Must match SPRITE_SHEETS configuration
};

// Collision radii for different NPC types (base size, will be multiplied by scale)
export const COLLISION_RADII = {
    stag: 16,   // 32px sprite / 2
    boar: 18,   // 41px sprite / 2
    player: 24, // 48px sprite / 2
    wolf: 16    // Adjust based on wolf sprite
};

// Default scale for sprites
export const DEFAULT_SCALE = 2;
