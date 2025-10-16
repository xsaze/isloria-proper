/**
 * NPC physics and collision handling
 */

import {
    checkNPCCollisions,
    calculateSeparationForce,
    calculateMultiSeparationForce,
    calculateBounceDirection
} from '../utils/collisionUtils.js';
import { clamp } from '../utils/mathUtils.js';
import { gameConfig } from '../config/gameConfig.js';

export class NpcPhysics {
    constructor(npcAI) {
        this.npcAI = npcAI;
        this.stuckCounters = new Map();  // Track stuck frames per NPC
        this.lastCollisionTimes = new Map();  // Track last collision time per NPC
    }

    /**
     * Update physics for a single NPC
     * @param {string} npcId - NPC identifier
     * @param {Object} npc - NPC data object
     * @param {Map} allNpcs - Map of all NPCs (for collision detection)
     * @param {number} deltaTime - Time since last frame
     * @param {IslandManager} islandManager - Island manager for walkability checks
     */
    update(npcId, npc, allNpcs, deltaTime, islandManager) {
        // Calculate new position
        const newX = npc.x + npc.vx * deltaTime;
        const newY = npc.y + npc.vy * deltaTime;
        const newPos = { x: newX, y: newY };

        // Check walkability (if islandManager is available)
        let isWalkable = true;
        if (islandManager) {
            isWalkable = islandManager.isPositionWalkable(newX, newY);
        }

        // Check for collisions with other NPCs
        const collisions = checkNPCCollisions(newPos, npcId, allNpcs, npc.radius, true);

        // Get walkable boundaries (or use fallback)
        let boundaries = gameConfig.boundaries;
        if (islandManager) {
            const walkableBounds = islandManager.getWalkableBoundaries();
            if (walkableBounds) {
                boundaries = walkableBounds;
            }
        }

        // Apply boundaries
        let clampedX = clamp(newX, boundaries.minX, boundaries.maxX);
        let clampedY = clamp(newY, boundaries.minY, boundaries.maxY);

        // Handle walkability constraint
        if (!isWalkable) {
            // Position is not walkable, treat it like hitting a boundary
            this.handleWalkabilityBounce(npc);
        } else if (collisions) {
            // Handle collisions with other NPCs
            this.handleCollisions(npcId, npc, collisions, clampedX, clampedY, boundaries);
        } else {
            // No collisions, normal movement
            this.handleNoCollision(npcId, npc, newX, newY, clampedX, clampedY);
        }
    }

    /**
     * Handle NPC collisions
     */
    handleCollisions(npcId, npc, collisions, clampedX, clampedY, boundaries) {
        const currentTime = Date.now();

        // Increment stuck counter
        const stuckCount = (this.stuckCounters.get(npcId) || 0) + 1;
        this.stuckCounters.set(npcId, stuckCount);
        this.lastCollisionTimes.set(npcId, currentTime);

        // Calculate separation force
        const currentPos = { x: npc.x, y: npc.y };
        const separationForce = collisions.length === 1
            ? calculateSeparationForce(currentPos, collisions[0].npc, npc.radius, collisions[0].npc.radius)
            : calculateMultiSeparationForce(currentPos, collisions, npc.radius);

        // Apply separation force
        let separatedX = npc.x + separationForce.x;
        let separatedY = npc.y + separationForce.y;

        // Clamp to boundaries
        separatedX = clamp(separatedX, boundaries.minX, boundaries.maxX);
        separatedY = clamp(separatedY, boundaries.minY, boundaries.maxY);

        // Check if stuck for too long
        if (stuckCount > gameConfig.ai.STUCK_THRESHOLD) {
            const escapeBoost = gameConfig.ai.ESCAPE_BOOST;
            separatedX += separationForce.x > 0 ? escapeBoost : -escapeBoost;
            separatedY += separationForce.y > 0 ? escapeBoost : -escapeBoost;

            // Clamp again
            separatedX = clamp(separatedX, boundaries.minX, boundaries.maxX);
            separatedY = clamp(separatedY, boundaries.minY, boundaries.maxY);

            // Emergency escape
            if (stuckCount > gameConfig.ai.STUCK_ESCAPE_THRESHOLD) {
                this.stuckCounters.set(npcId, 0);
                // Boost velocity
                const multiplier = gameConfig.ai.ESCAPE_SPEED_MULTIPLIER;
                const speed = npc.speed * multiplier;

                // Pick random direction
                const directions = ['NE', 'NW', 'SE', 'SW'];
                const randomDir = directions[Math.floor(Math.random() * directions.length)];
                const dirIndex = { 'NE': 0, 'NW': 1, 'SE': 2, 'SW': 3 }[randomDir];

                switch (dirIndex) {
                    case 0: npc.vx = speed; npc.vy = -speed; break;
                    case 1: npc.vx = -speed; npc.vy = -speed; break;
                    case 2: npc.vx = speed; npc.vy = speed; break;
                    case 3: npc.vx = -speed; npc.vy = speed; break;
                }

                npc.direction = this.npcAI.getDirectionFromVelocity(npc.vx, npc.vy);
            }
        }

        // Calculate bounce direction
        const primaryCollision = collisions[0];
        const currentVel = { x: npc.vx, y: npc.vy };
        const bouncedVelocity = calculateBounceDirection(currentPos, primaryCollision.npc, currentVel);

        // Apply bounced velocity
        npc.vx = bouncedVelocity.x;
        npc.vy = bouncedVelocity.y;

        // Update direction based on new velocity
        const newDirection = this.npcAI.getDirectionFromVelocity(npc.vx, npc.vy);
        if (newDirection) {
            npc.direction = newDirection;
        }

        // Update position to separated position
        npc.x = separatedX;
        npc.y = separatedY;
    }

    /**
     * Handle case when NPC tries to walk on non-walkable terrain
     */
    handleWalkabilityBounce(npc) {
        // Pick new random direction
        const directions = ['NE', 'NW', 'SE', 'SW'];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const dirIndex = { 'NE': 0, 'NW': 1, 'SE': 2, 'SW': 3 }[randomDir];

        npc.direction = randomDir;

        switch (dirIndex) {
            case 0: npc.vx = npc.speed; npc.vy = -npc.speed; break;
            case 1: npc.vx = -npc.speed; npc.vy = -npc.speed; break;
            case 2: npc.vx = npc.speed; npc.vy = npc.speed; break;
            case 3: npc.vx = -npc.speed; npc.vy = npc.speed; break;
        }

        // Don't update position (stay at current position)
    }

    /**
     * Handle case when NPC has no collisions
     */
    handleNoCollision(npcId, npc, newX, newY, clampedX, clampedY) {
        const currentTime = Date.now();
        const lastCollisionTime = this.lastCollisionTimes.get(npcId) || 0;

        // Reset stuck counter if no collision for a while
        if (currentTime - lastCollisionTime > gameConfig.physics.COLLISION_RESET_TIME) {
            this.stuckCounters.set(npcId, 0);
        }

        // Check if hit boundary
        if (clampedX !== newX || clampedY !== newY) {
            // Pick new random direction
            const directions = ['NE', 'NW', 'SE', 'SW'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const dirIndex = { 'NE': 0, 'NW': 1, 'SE': 2, 'SW': 3 }[randomDir];

            npc.direction = randomDir;

            switch (dirIndex) {
                case 0: npc.vx = npc.speed; npc.vy = -npc.speed; break;
                case 1: npc.vx = -npc.speed; npc.vy = -npc.speed; break;
                case 2: npc.vx = npc.speed; npc.vy = npc.speed; break;
                case 3: npc.vx = -npc.speed; npc.vy = npc.speed; break;
            }
        }

        // Update position
        npc.x = clampedX;
        npc.y = clampedY;
    }
}
