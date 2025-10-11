/**
 * Manages the global game state
 */

export class GameState {
    constructor(npcManager) {
        this.npcManager = npcManager;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.mc = 0;  // MC (money/currency) state
    }

    /**
     * Get current game state as object for network transmission
     */
    getState() {
        return {
            npcs: this.npcManager.getNpcsAsObject(),
            mc: this.mc,
            frameCount: this.frameCount,
            timestamp: Date.now()
        };
    }

    /**
     * Update game state (called every frame)
     */
    update(deltaTime) {
        this.frameCount++;
        this.npcManager.update(deltaTime);
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
        console.log(`💰 MC increased by ${amount}. New MC: ${this.mc}`);
    }

    /**
     * Decrease MC by specified amount
     */
    decreaseMc(amount = 10000) {
        this.mc -= amount;
        console.log(`💸 MC decreased by ${amount}. New MC: ${this.mc}`);
    }

    /**
     * Reset MC to zero
     */
    resetMc() {
        this.mc = 0;
        console.log(`🔄 MC reset to 0`);
    }

    /**
     * Set MC to specific value
     */
    setMc(value) {
        this.mc = value;
        console.log(`💰 MC set to ${value}`);
    }
}
