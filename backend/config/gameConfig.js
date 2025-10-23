/**
 * Game configuration settings
 */

export const gameConfig = {
    // Game loop settings
    TARGET_FPS: 20,
    FRAME_TIME: 1000 / 20,  // ~16.67ms per frame

    // Network settings
    BROADCAST_FPS: 20,  // Send updates to clients 20 times per second
    BROADCAST_INTERVAL: 1000 / 20,  // 50ms per broadcast

    // World boundaries
    boundaries: {
        minX: 50,
        maxX: 1920 - 50,  // Assume 1920x1080 screen, adjust as needed
        minY: 50,
        maxY: 1080 - 50
    },

    // NPC AI settings
    ai: {
        DIRECTION_CHANGE_INTERVAL: 2000,  // Change direction every 2 seconds
        IDLE_PROBABILITY: 0.3,  // 30% chance to go idle
        STUCK_THRESHOLD: 10,  // Frames before escape behavior
        STUCK_ESCAPE_THRESHOLD: 20,  // Frames before emergency escape
        ESCAPE_BOOST: 5,  // Extra push when stuck
        ESCAPE_SPEED_MULTIPLIER: 1.5  // Speed boost for escape
    },

    // Physics settings
    physics: {
        SEPARATION_BUFFER: 2,  // Extra buffer for separation force
        COLLISION_RESET_TIME: 500  // Reset stuck counter after 500ms no collision
    },

    // NPC Spawning settings - spawn NPCs at certain MC thresholds
    npcSpawning: {
        // Each threshold spawns NPCs of the specified type near center
        thresholds: [
            { mc: 5000, npcType: 'player', count: 1 },
            { mc: 30000, npcType: 'stag', count: 1 },
            { mc: 50000, npcType: 'boar', count: 1 },
            { mc: 70000, npcType: 'wolf', count: 1 },
            { mc: 90000, npcType: 'stag', count: 1 },
            { mc: 100000, npcType: 'stag', count: 1 },
            { mc: 120000, npcType: 'wolf', count: 1 },
            { mc: 130000, npcType: 'boar', count: 1 },
            { mc: 140000, npcType: 'wolf', count: 1 },
            { mc: 150000, npcType: 'stag', count: 1 },
            { mc: 160000, npcType: 'boar', count: 1 }
        ],
        spawnRadius: 5,  // Spawn NPCs within 5 tiles of center
        defaultSpeed: {
            stag: 1.5,
            player: 1.3,
            boar: 1.8,
            wolf: 1.5
        }
    }
};
