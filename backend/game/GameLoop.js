/**
 * Main game loop - runs at 60 FPS
 */

import { gameConfig } from '../config/gameConfig.js';

export class GameLoop {
    constructor(gameState, networkManager) {
        this.gameState = gameState;
        this.networkManager = networkManager;
        this.intervalId = null;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) {
            console.warn('⚠️ GameLoop already running');
            return;
        }

        console.log(`🎮 Starting game loop at ${gameConfig.TARGET_FPS} FPS...`);
        this.isRunning = true;
        this.lastFrameTime = Date.now();

        // Run game loop at target FPS
        this.intervalId = setInterval(() => {
            this.tick();
        }, gameConfig.FRAME_TIME);

        console.log('✅ GameLoop started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
        console.log('🛑 GameLoop stopped');
    }

    /**
     * Single game loop tick
     */
    tick() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastFrameTime) / gameConfig.FRAME_TIME;
        this.lastFrameTime = currentTime;

        // Update game state
        this.gameState.update(deltaTime);

        // Broadcast to clients (throttled internally)
        this.networkManager.broadcastState(currentTime);

        // Track FPS
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.logStats();
        }
    }

    /**
     * Log game stats periodically
     */
    logStats() {
        const stats = this.gameState.getStats();
        const clientCount = this.networkManager.getClientCount();
        console.log(`📊 Stats: ${stats.uptime} | NPCs: ${stats.npcCount} | Clients: ${clientCount} | Frame: ${stats.frameCount}`);
    }

    /**
     * Check if game loop is running
     */
    running() {
        return this.isRunning;
    }
}
