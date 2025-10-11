/**
 * Game configuration settings
 */

export const gameConfig = {
    // Game loop settings
    TARGET_FPS: 60,
    FRAME_TIME: 1000 / 60,  // ~16.67ms per frame

    // Network settings
    BROADCAST_FPS: 30,  // Send updates to clients 30 times per second
    BROADCAST_INTERVAL: 1000 / 30,  // ~33ms per broadcast

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
    }
};
