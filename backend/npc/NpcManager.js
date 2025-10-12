/**
 * Manages all NPCs in the game
 */

import { NpcAI } from './NpcAI.js';
import { NpcPhysics } from './NpcPhysics.js';
import { initialNPCs } from './NpcData.js';
import { COLLISION_RADII, DEFAULT_SCALE } from '../utils/constants.js';

export class NpcManager {
    constructor() {
        this.npcs = new Map();
        this.npcAI = new NpcAI();
        this.npcPhysics = new NpcPhysics(this.npcAI);
    }

    /**
     * Initialize NPCs from initial data
     */
    initialize() {
        for (const [npcId, npcData] of Object.entries(initialNPCs)) {
            // Calculate collision radius based on type
            const baseRadius = COLLISION_RADII[npcData.npcType] || COLLISION_RADII.stag;
            npcData.radius = baseRadius * DEFAULT_SCALE;

            // Initialize AI (set initial velocity)
            this.npcAI.initialize(npcData);

            // Add to NPCs map
            this.npcs.set(npcId, npcData);
        }

        console.log(`✅ Initialized ${this.npcs.size} NPCs`);
    }

    /**
     * Update all NPCs (called every frame)
     * @param {number} deltaTime - Time since last frame (in frames, typically 1.0 at 60 FPS)
     * @param {IslandManager} islandManager - Island manager for walkability checks
     */
    update(deltaTime, islandManager) {
        const currentTime = Date.now();

        // Update AI for all NPCs
        for (const [npcId, npc] of this.npcs.entries()) {
            this.npcAI.update(npcId, npc, currentTime);
        }

        // Update physics for all NPCs (handles collisions and walkability)
        for (const [npcId, npc] of this.npcs.entries()) {
            this.npcPhysics.update(npcId, npc, this.npcs, deltaTime, islandManager);
        }
    }

    /**
     * Get all NPCs as a plain object (for network transmission)
     */
    getNpcsAsObject() {
        const npcsObj = {};
        for (const [npcId, npc] of this.npcs.entries()) {
            npcsObj[npcId] = {
                x: Math.round(npc.x * 10) / 10,  // Round to 1 decimal place
                y: Math.round(npc.y * 10) / 10,
                vx: Math.round(npc.vx * 10) / 10,
                vy: Math.round(npc.vy * 10) / 10,
                state: npc.state,
                direction: npc.direction,
                npcType: npc.npcType,
                speed: npc.speed
            };
        }
        return npcsObj;
    }

    /**
     * Add a new NPC
     */
    addNpc(npcId, npcData) {
        // Calculate collision radius
        const baseRadius = COLLISION_RADII[npcData.npcType] || COLLISION_RADII.stag;
        npcData.radius = baseRadius * DEFAULT_SCALE;

        // Initialize AI
        this.npcAI.initialize(npcData);

        // Add to map
        this.npcs.set(npcId, npcData);
    }

    /**
     * Remove an NPC
     */
    removeNpc(npcId) {
        this.npcs.delete(npcId);
    }

    /**
     * Get NPC count
     */
    getNpcCount() {
        return this.npcs.size;
    }
}
