/**
 * Collision detection utilities for NPC collision prevention
 */

/**
 * Check if two circular collision bounds overlap
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @param {number} radius1 - First collision radius
 * @param {number} radius2 - Second collision radius
 * @returns {boolean} True if circles overlap
 */
export function checkCircularCollision(pos1, pos2, radius1, radius2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distanceSquared = dx * dx + dy * dy;
    const minDistance = radius1 + radius2;
    const minDistanceSquared = minDistance * minDistance;

    return distanceSquared < minDistanceSquared;
}

/**
 * Check if a position would collide with any NPCs
 * @param {Object} newPos - New position to test {x, y}
 * @param {string} selfId - ID of the NPC being tested (to exclude self)
 * @param {Map} npcPositions - Map of all NPC positions {npcId: {x, y, radius}}
 * @param {number} selfRadius - Collision radius of the NPC being tested
 * @param {boolean} returnAll - If true, returns all collisions; if false, returns first collision
 * @returns {Object|Array|null} Collision info or array of collisions, or null if no collision
 */
export function checkNPCCollisions(newPos, selfId, npcPositions, selfRadius, returnAll = false) {
    const collisions = [];

    for (const [npcId, npcData] of npcPositions.entries()) {
        // Skip self
        if (npcId === selfId) continue;

        // Check collision
        if (checkCircularCollision(newPos, npcData, selfRadius, npcData.radius)) {
            const collisionInfo = {
                npcId,
                position: npcData
            };

            if (!returnAll) {
                return collisionInfo;
            }

            collisions.push(collisionInfo);
        }
    }

    return returnAll ? (collisions.length > 0 ? collisions : null) : null;
}

/**
 * Calculate separation force to push overlapping NPCs apart
 * @param {Object} pos1 - Position of first NPC {x, y}
 * @param {Object} pos2 - Position of second NPC {x, y}
 * @param {number} radius1 - Collision radius of first NPC
 * @param {number} radius2 - Collision radius of second NPC
 * @returns {Object} Separation offset {x, y} to apply to pos1
 */
export function calculateSeparationForce(pos1, pos2, radius1, radius2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If NPCs are exactly on top of each other, push in random direction
    if (distance === 0) {
        const angle = Math.random() * Math.PI * 2;
        const minSeparation = (radius1 + radius2) * 0.5;
        return {
            x: Math.cos(angle) * minSeparation,
            y: Math.sin(angle) * minSeparation
        };
    }

    // Calculate overlap amount
    const minDistance = radius1 + radius2;
    const overlap = minDistance - distance;

    // If no overlap, no separation needed
    if (overlap <= 0) {
        return { x: 0, y: 0 };
    }

    // Calculate separation vector (direction from pos2 to pos1)
    const normalX = dx / distance;
    const normalY = dy / distance;

    // Push apart by half the overlap (each NPC moves half the distance)
    // Add a small extra buffer (10%) to ensure clean separation
    const separationAmount = (overlap * 0.5) + 2;

    return {
        x: normalX * separationAmount,
        y: normalY * separationAmount
    };
}

/**
 * Calculate average separation force when colliding with multiple NPCs
 * @param {Object} pos - Position of NPC {x, y}
 * @param {Array} collisions - Array of collision objects with position and radius
 * @param {number} selfRadius - Collision radius of the NPC
 * @returns {Object} Average separation offset {x, y}
 */
export function calculateMultiSeparationForce(pos, collisions, selfRadius) {
    if (!collisions || collisions.length === 0) {
        return { x: 0, y: 0 };
    }

    let totalX = 0;
    let totalY = 0;

    for (const collision of collisions) {
        const separation = calculateSeparationForce(
            pos,
            collision.position,
            selfRadius,
            collision.position.radius
        );
        totalX += separation.x;
        totalY += separation.y;
    }

    // Average the separation forces
    return {
        x: totalX / collisions.length,
        y: totalY / collisions.length
    };
}

/**
 * Calculate bounce direction when colliding with another NPC
 * @param {Object} pos1 - Position of first NPC {x, y}
 * @param {Object} pos2 - Position of second NPC {x, y}
 * @param {Object} velocity - Current velocity {x, y}
 * @returns {Object} New velocity direction {x, y}
 */
export function calculateBounceDirection(pos1, pos2, velocity) {
    // Calculate collision normal (direction from pos2 to pos1)
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
        // NPCs are exactly on top of each other, pick random direction
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle) * Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y),
            y: Math.sin(angle) * Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        };
    }

    // Normalize the collision normal
    const normalX = dx / distance;
    const normalY = dy / distance;

    // Reflect velocity across the normal
    const dotProduct = velocity.x * normalX + velocity.y * normalY;
    const reflectedX = velocity.x - 2 * dotProduct * normalX;
    const reflectedY = velocity.y - 2 * dotProduct * normalY;

    return {
        x: reflectedX,
        y: reflectedY
    };
}

/**
 * Get collision radius for different NPC types based on sprite size
 * @param {string} npcType - Type of NPC (stag, boar, player)
 * @param {number} scale - Sprite scale
 * @returns {number} Collision radius in pixels
 */
export function getCollisionRadius(npcType, scale = 2) {
    const baseRadii = {
        stag: 16,      // 32px sprite / 2
        boar: 18,      // 41px sprite / 2 (slightly larger)
        player: 24     // 48px sprite / 2
    };

    return (baseRadii[npcType] || 16) * scale;
}
