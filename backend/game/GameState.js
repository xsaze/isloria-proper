import { IslandManager } from '../island/IslandManager.js';
import { gameConfig } from '../config/gameConfig.js';

/**
 * Manages the global game state
 */

export class GameState {
    constructor(npcManager) {
        this.npcManager = npcManager;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.mc = 5000;  // MC (money/currency) initial state
        this.islandManager = new IslandManager();
        this.islandManager.initialize(this.mc);  // Generate initial island

        // Track which spawn thresholds have been triggered
        this.spawnedThresholds = new Set();
        this.nextNpcId = 1;  // Counter for generating unique NPC IDs

        // Map threshold MC values to spawned NPC IDs for despawning
        this.thresholdToNpcs = new Map();

        // Track island changes for delta updates
        this.islandChanged = false;
        this.removedNpcIds = [];  // Track removed NPCs for delta updates

        // Spawn initial NPCs based on starting MC
        this.checkAndSpawnNPCs();
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
     * Get delta state (only changes since last broadcast) - OPTIMIZED
     * Returns null if no changes, otherwise returns minimal update payload
     */
    getDeltaState() {
        const dirtyNpcs = this.npcManager.getDirtyNpcsAsObject();
        const islandDelta = this.islandChanged ? this.islandManager.getDeltaUpdate() : null;
        const hasRemovedNpcs = this.removedNpcIds.length > 0;

        // If nothing changed, return null
        if (!dirtyNpcs && !islandDelta && !hasRemovedNpcs) {
            return null;
        }

        const delta = {
            timestamp: Date.now()
        };

        if (dirtyNpcs) {
            delta.npcs = dirtyNpcs;
        }

        if (hasRemovedNpcs) {
            delta.removedNpcs = this.removedNpcIds;
        }

        if (islandDelta) {
            delta.island = islandDelta;
        }

        delta.mc = this.mc;  // Always send MC (small payload)

        return delta;
    }

    /**
     * Clear delta tracking after broadcast
     */
    clearDeltaState() {
        this.npcManager.clearDirtyFlags();
        this.islandChanged = false;
        this.removedNpcIds = [];
        if (this.islandManager.getDeltaUpdate()) {
            this.islandManager.clearDeltaUpdate();
        }
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
     * Check and spawn NPCs based on MC thresholds
     */
    checkAndSpawnNPCs() {
        const { thresholds, spawnRadius, defaultSpeed } = gameConfig.npcSpawning;

        for (const threshold of thresholds) {
            // Check if this threshold should trigger and hasn't been triggered yet
            if (this.mc >= threshold.mc && !this.spawnedThresholds.has(threshold.mc)) {
                // Mark threshold as triggered
                this.spawnedThresholds.add(threshold.mc);

                // Track NPCs spawned for this threshold
                const spawnedNpcIds = [];

                // Spawn the specified number of NPCs
                for (let i = 0; i < threshold.count; i++) {
                    const npcId = `npc_${threshold.npcType}_${this.nextNpcId++}`;
                    const position = this.islandManager.getRandomWalkablePositionNearCenter(spawnRadius);

                    const npcData = {
                        x: position.worldX,
                        y: position.worldY,
                        vx: 0,
                        vy: 0,
                        state: Math.random() < 0.5 ? 'walk' : 'run',
                        direction: ['NE', 'NW', 'SE', 'SW'][Math.floor(Math.random() * 4)],
                        npcType: threshold.npcType,
                        speed: defaultSpeed[threshold.npcType] || 1.5
                    };

                    this.npcManager.addNpc(npcId, npcData);
                    spawnedNpcIds.push(npcId);
                    console.log(`🦌 Spawned ${threshold.npcType} (${npcId}) at MC threshold ${threshold.mc}`);
                }

                // Store the mapping of threshold to spawned NPCs
                this.thresholdToNpcs.set(threshold.mc, spawnedNpcIds);
            }
        }
    }

    /**
     * Remove NPCs that shouldn't exist at current MC level
     * (when MC decreases below threshold)
     */
    removeNPCsBelowThreshold() {
        const { thresholds } = gameConfig.npcSpawning;

        // Find thresholds that are now above current MC and remove their NPCs
        for (const threshold of thresholds) {
            if (this.mc < threshold.mc && this.spawnedThresholds.has(threshold.mc)) {
                // Remove this threshold from spawned set
                this.spawnedThresholds.delete(threshold.mc);

                // Remove all NPCs that were spawned for this threshold
                const npcIds = this.thresholdToNpcs.get(threshold.mc);
                if (npcIds) {
                    for (const npcId of npcIds) {
                        this.npcManager.removeNpc(npcId);
                        this.removedNpcIds.push(npcId);  // Track for delta update
                        console.log(`💀 Despawned ${npcId} - MC dropped below threshold ${threshold.mc}`);
                    }
                    // Remove the mapping
                    this.thresholdToNpcs.delete(threshold.mc);
                }
            }
        }
    }

    /**
     * Increase MC by specified amount
     */
    increaseMc(amount = 10000) {
        this.mc += amount;
        const changed = this.islandManager.updateForMC(this.mc);
        if (changed) {
            this.islandChanged = true;
            console.log(`🏝️ Island evolved for MC: ${this.mc}`);
        }
        this.checkAndSpawnNPCs();  // Check for new spawns
        console.log(`💰 MC increased by ${amount}. New MC: ${this.mc}`);
    }

    /**
     * Decrease MC by specified amount
     */
    decreaseMc(amount = 10000) {
        this.mc -= amount;
        const changed = this.islandManager.updateForMC(this.mc);
        if (changed) {
            this.islandChanged = true;
            console.log(`🏝️ Island evolved for MC: ${this.mc}`);
        }
        this.removeNPCsBelowThreshold();  // Optional: remove NPCs below threshold
        console.log(`💸 MC decreased by ${amount}. New MC: ${this.mc}`);
    }

    /**
     * Reset MC to zero
     */
    resetMc() {
        this.mc = 0;
        const changed = this.islandManager.updateForMC(this.mc);
        if (changed) {
            this.islandChanged = true;
            console.log(`🏝️ Island evolved for MC: ${this.mc}`);
        }

        // Remove all NPCs by clearing thresholds
        this.removeNPCsBelowThreshold();

        // Reset spawned thresholds and NPC mappings
        this.spawnedThresholds.clear();
        this.thresholdToNpcs.clear();

        // Respawn NPCs for MC 0
        this.checkAndSpawnNPCs();
        console.log(`🔄 MC reset to 0`);
    }

    /**
     * Reset entire game state to initial startup state
     * - Regenerates island from scratch
     * - Removes all NPCs
     * - Resets MC to 0
     * - Clears all tracking variables
     */
    resetGameState() {
        console.log('🔄 Resetting game state to initial conditions...');

        // Reset MC to initial value (5000)
        this.mc = 5000;

        // Remove all NPCs
        const allNpcIds = Object.keys(this.npcManager.getNpcsAsObject());
        for (const npcId of allNpcIds) {
            this.npcManager.removeNpc(npcId);
        }

        // Reset spawn tracking
        this.spawnedThresholds.clear();
        this.thresholdToNpcs.clear();
        this.nextNpcId = 1;

        // Regenerate island from scratch (creates new biome seed, fresh generation)
        this.islandManager.initialize(this.mc);
        this.islandChanged = true;

        // Reset delta tracking
        this.removedNpcIds = allNpcIds;  // Mark all NPCs as removed for clients

        // Spawn initial NPCs based on starting MC (5000)
        this.checkAndSpawnNPCs();

        console.log('✅ Game state reset complete - like server just started');
    }

    /**
     * Set MC to specific value
     */
    setMc(value) {
        const oldMc = this.mc;
        this.mc = value;
        const changed = this.islandManager.updateForMC(this.mc);
        if (changed) {
            this.islandChanged = true;
            console.log(`🏝️ Island evolved for MC: ${this.mc}`);
        }

        // Check if we're going up or down
        if (value > oldMc) {
            this.checkAndSpawnNPCs();
        } else if (value < oldMc) {
            this.removeNPCsBelowThreshold();
        }

        console.log(`💰 MC set to ${value}`);
    }

    /**
     * Respawn all NPCs at random walkable positions on the island
     */
    respawnNpcsOnIsland() {
        const npcs = this.npcManager.getAllNpcs();

        for (const [, npc] of npcs) {
            const { worldX, worldY } = this.islandManager.getRandomWalkablePosition();
            npc.x = worldX;
            npc.y = worldY;
        }

        console.log(`🎯 Respawned ${npcs.size} NPCs on island`);
    }
}
