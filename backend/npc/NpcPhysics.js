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
import { SpatialHashGrid } from '../utils/SpatialHashGrid.js';

export class NpcPhysics {
    constructor(npcAI) {
        this.npcAI = npcAI;
        this.stuckCounters = new Map();  // Track stuck frames per NPC
        this.lastCollisionTimes = new Map();  // Track last collision time per NPC

        // OPTIMIZATION: Spatial hash grid for O(n) collision detection
        this.spatialGrid = new SpatialHashGrid(100);  // 100px cells

        // STUCK DETECTION: Track position history to detect truly stuck NPCs
        this.positionHistory = new Map();  // { npcId: { x, y, timestamp } }
        this.STUCK_CHECK_INTERVAL = 2000;  // 5 seconds
        this.STUCK_DISTANCE_THRESHOLD = 5;  // pixels - if moved less than this in 5 sec, stuck

        // NPC FOOT OFFSETS: For accurate walkability checks (check feet, not center)
        // These are scaled (2x) pixel offsets from sprite center to feet position
        this.FOOT_OFFSETS = {
            stag: 20,   // 32x41 sprite scaled 2x → 64x82 visual size
            boar: 16,   // 41x32 sprite scaled 2x → 82x64 visual size
            player: 24, // 48x48 sprite scaled 2x → 96x96 visual size
            wolf: 32    // 64x64 sprite scaled 2x → 128x128 visual size
        };

        // NPC SPRITE WIDTHS: For bottom-edge hitbox walkability checks
        // These are scaled (2x) widths - used to check left/right feet positions
        this.SPRITE_WIDTHS = {
            stag: 64,   // 32 × 2 scale
            boar: 82,   // 41 × 2 scale
            player: 96, // 48 × 2 scale
            wolf: 128   // 64 × 2 scale
        };
    }

    /**
     * Rebuild spatial hash grid before collision detection
     * Call this once per frame before updating all NPCs
     */
    rebuildSpatialGrid(allNpcs) {
        this.spatialGrid.rebuild(allNpcs);
    }

    /**
     * Update physics for a single NPC
     * @param {string} npcId - NPC identifier
     * @param {Object} npc - NPC data object
     * @param {Map} allNpcs - Map of all NPCs (for collision detection)
     * @param {number} deltaTime - Time since last frame
     * @param {IslandManager} islandManager - Island manager for walkability checks
     * @returns {boolean} true if NPC position or velocity changed
     */
    update(npcId, npc, allNpcs, deltaTime, islandManager) {
        const currentTime = Date.now();

        // STUCK DETECTION: Check if NPC has been stuck for too long
        if (this.checkAndHandleStuck(npcId, npc, currentTime, islandManager)) {
            return true; // NPC was respawned, position changed
        }

        // Store old position to detect changes
        const oldX = npc.x;
        const oldY = npc.y;
        const oldVx = npc.vx;
        const oldVy = npc.vy;

        // Calculate new position
        const newX = npc.x + npc.vx * deltaTime;
        const newY = npc.y + npc.vy * deltaTime;
        const newPos = { x: newX, y: newY };

        // BOTTOM-EDGE HITBOX WALKABILITY CHECK: Check 3 points along bottom edge (left, center, right feet)
        let isWalkable = true;
        if (islandManager) {
            const footOffset = this.FOOT_OFFSETS[npc.npcType] || 20;
            const spriteWidth = this.SPRITE_WIDTHS[npc.npcType] || 64;
            const halfWidth = spriteWidth / 2;
            const footY = newY + footOffset;

            // Check 3 points: left foot, center foot, right foot
            const leftFootWalkable = islandManager.isPositionWalkable(newX - halfWidth, footY);
            const centerFootWalkable = islandManager.isPositionWalkable(newX, footY);
            const rightFootWalkable = islandManager.isPositionWalkable(newX + halfWidth, footY);

            // ALL three points must be walkable
            isWalkable = leftFootWalkable && centerFootWalkable && rightFootWalkable;
        }

        // OPTIMIZED: Check for collisions only with nearby NPCs (spatial hashing)
        const collisions = this.checkNearbyCollisions(newPos, npcId, allNpcs, npc.radius);

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
            return true;  // Velocity changed
        } else if (collisions) {
            // Handle collisions with other NPCs
            return this.handleCollisions(npcId, npc, collisions, clampedX, clampedY, boundaries);
        } else {
            // No collisions, normal movement
            return this.handleNoCollision(npcId, npc, newX, newY, clampedX, clampedY, oldX, oldY, oldVx, oldVy);
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

        // Return true (collision always causes change)
        return true;
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
        // Velocity changed, so return true
        return true;
    }

    /**
     * Handle case when NPC has no collisions
     */
    handleNoCollision(npcId, npc, newX, newY, clampedX, clampedY, oldX, oldY, oldVx, oldVy) {
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

        // Return true if position or velocity changed
        return (oldX !== npc.x || oldY !== npc.y || oldVx !== npc.vx || oldVy !== npc.vy);
    }

    /**
     * STUCK DETECTION: Check if NPC hasn't moved for 5 seconds and respawn if stuck
     * @returns {boolean} true if NPC was respawned (position changed)
     */
    checkAndHandleStuck(npcId, npc, currentTime, islandManager) {
        // Get position history for this NPC
        const history = this.positionHistory.get(npcId);

        if (!history) {
            // First time seeing this NPC, record position
            this.positionHistory.set(npcId, {
                x: npc.x,
                y: npc.y,
                timestamp: currentTime
            });
            return false;
        }

        // Check if enough time has passed for stuck detection
        const timeSinceLastCheck = currentTime - history.timestamp;
        if (timeSinceLastCheck < this.STUCK_CHECK_INTERVAL) {
            return false; // Not enough time passed, skip check
        }

        // Calculate distance moved since last check
        const dx = npc.x - history.x;
        const dy = npc.y - history.y;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

        // If NPC hasn't moved much, it's stuck!
        if (distanceMoved < this.STUCK_DISTANCE_THRESHOLD) {
            console.log(`🚨 NPC ${npcId} stuck! Moved only ${distanceMoved.toFixed(1)}px in ${timeSinceLastCheck}ms. Respawning...`);

            // Respawn NPC at island center
            if (islandManager) {
                const centerPos = islandManager.getRandomWalkablePositionNearCenter(3);
                npc.x = centerPos.worldX;
                npc.y = centerPos.worldY;
                console.log(`✅ ${npcId} respawned at (${npc.x.toFixed(0)}, ${npc.y.toFixed(0)})`);
            }

            // Reset position history
            this.positionHistory.set(npcId, {
                x: npc.x,
                y: npc.y,
                timestamp: currentTime
            });

            return true; // NPC was respawned
        }

        // NPC is moving normally, update position history
        this.positionHistory.set(npcId, {
            x: npc.x,
            y: npc.y,
            timestamp: currentTime
        });

        return false;
    }

    /**
     * OPTIMIZED: Check collisions only with nearby NPCs using spatial hash grid
     * Replaces O(n²) global collision check with O(n) spatial check
     */
    checkNearbyCollisions(newPos, npcId, allNpcs, radius) {
        const nearbyNpcIds = this.spatialGrid.getNearby(newPos.x, newPos.y);
        const collisions = [];

        for (const otherNpcId of nearbyNpcIds) {
            // Skip self
            if (otherNpcId === npcId) continue;

            const otherNpc = allNpcs.get(otherNpcId);
            if (!otherNpc) continue;

            // Calculate distance
            const dx = newPos.x - otherNpc.x;
            const dy = newPos.y - otherNpc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if colliding (within combined radii)
            const combinedRadius = radius + (otherNpc.radius || radius);
            if (distance < combinedRadius) {
                collisions.push({
                    npc: otherNpc,
                    distance,
                    dx,
                    dy
                });
            }
        }

        return collisions.length > 0 ? collisions : null;
    }
}
