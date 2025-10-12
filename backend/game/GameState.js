import { IslandManager } from '../island/IslandManager.js';

/**
 * Manages the global game state
 */

export class GameState {
    constructor(npcManager) {
        this.npcManager = npcManager;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.mc = 0;  // MC (money/currency) state
        this.islandManager = new IslandManager();
        this.islandManager.initialize(this.mc);  // Generate initial island
    }

    /**
     * Get current game state as object for network transmission
     */
    getState() {
        return {
            npcs: this.npcManager.getNpcsAsObject(),
            mc: this.mc,
            island: this.islandManager.getIslandData(),
            frameCount: this.frameCount,
            timestamp: Date.now()
        };
    }

    /**
     * Update game state (called every frame)
     */
    update(deltaTime) {
        this.frameCount++;
        this.npcManager.update(deltaTime, this.islandManager);
    }

    /**
     * Get game statistics
     */
    getStats() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        return {
            npcCount: this.npcManager.getNpcCount(),
            frameCount: this.frameCount,
            mc: this.mc,
            uptime: `${uptime}s`
        };
    }

    /**
     * Increase MC by specified amount
     */
    increaseMc(amount = 10000) {
        this.mc += amount;
        if (this.islandManager.shouldRegenerate(this.mc)) {
            this.islandManager.regenerateIsland(this.mc);
            console.log(`🏝️  Island regenerated for MC: ${this.mc}`);
        }
        console.log(`💰 MC increased by ${amount}. New MC: ${this.mc}`);
    }

    /**
     * Decrease MC by specified amount
     */
    decreaseMc(amount = 10000) {
        this.mc -= amount;
        if (this.islandManager.shouldRegenerate(this.mc)) {
            this.islandManager.regenerateIsland(this.mc);
            console.log(`🏝️  Island regenerated for MC: ${this.mc}`);
        }
        console.log(`💸 MC decreased by ${amount}. New MC: ${this.mc}`);
    }

    /**
     * Reset MC to zero
     */
    resetMc() {
        this.mc = 0;
        if (this.islandManager.shouldRegenerate(this.mc)) {
            this.islandManager.regenerateIsland(this.mc);
            console.log(`🏝️  Island regenerated for MC: ${this.mc}`);
        }
        console.log(`🔄 MC reset to 0`);
    }

    /**
     * Set MC to specific value
     */
    setMc(value) {
        this.mc = value;
        if (this.islandManager.shouldRegenerate(this.mc)) {
            this.islandManager.regenerateIsland(this.mc);
            console.log(`🏝️  Island regenerated for MC: ${this.mc}`);
        }
        console.log(`💰 MC set to ${value}`);
    }
}
