/**
 * NPC AI behavior logic
 */

import { DIRECTIONS, NPC_STATES, DIRECTION_INDICES } from '../utils/constants.js';
import { randomElement } from '../utils/mathUtils.js';
import { gameConfig } from '../config/gameConfig.js';

export class NpcAI {
    constructor() {
        this.lastDirectionChange = new Map();  // Track last direction change per NPC
    }

    /**
     * Update AI for a single NPC
     * @returns {boolean} true if NPC state changed
     */
    update(npcId, npc, currentTime) {
        // Check if it's time to change direction/state
        const lastChange = this.lastDirectionChange.get(npcId) || 0;
        const timeSinceChange = currentTime - lastChange;

        if (timeSinceChange >= gameConfig.ai.DIRECTION_CHANGE_INTERVAL) {
            this.changeDirectionAndState(npc);
            this.lastDirectionChange.set(npcId, currentTime);
            return true;  // State changed
        }

        return false;  // No change
    }

    /**
     * Change direction and state for an NPC
     */
    changeDirectionAndState(npc) {
        // Get available states for this NPC type
        const availableStates = NPC_STATES[npc.npcType] || ['idle'];

        // Filter out idle to get movement states
        const movementStates = availableStates.filter(s => s !== 'idle');

        // Pick random direction
        const newDirection = randomElement(DIRECTIONS);
        npc.direction = newDirection;

        // Pick random state (70% movement, 30% idle)
        let newState;
        if (movementStates.length > 0 && Math.random() > gameConfig.ai.IDLE_PROBABILITY) {
            newState = randomElement(movementStates);
        } else {
            newState = 'idle';
        }
        npc.state = newState;

        // Calculate velocity based on direction and state
        if (newState === 'idle') {
            npc.vx = 0;
            npc.vy = 0;
        } else {
            const dirIndex = DIRECTION_INDICES[newDirection];
            switch (dirIndex) {
                case 0: // NE
                    npc.vx = npc.speed;
                    npc.vy = -npc.speed;
                    break;
                case 1: // NW
                    npc.vx = -npc.speed;
                    npc.vy = -npc.speed;
                    break;
                case 2: // SE
                    npc.vx = npc.speed;
                    npc.vy = npc.speed;
                    break;
                case 3: // SW
                    npc.vx = -npc.speed;
                    npc.vy = npc.speed;
                    break;
            }
        }
    }

    /**
     * Get direction from velocity (for collision response)
     */
    getDirectionFromVelocity(vx, vy) {
        if (vx === 0 && vy === 0) return null;

        // NE=0, NW=1, SE=2, SW=3
        if (vx > 0 && vy < 0) return 'NE';
        if (vx < 0 && vy < 0) return 'NW';
        if (vx > 0 && vy > 0) return 'SE';
        if (vx < 0 && vy > 0) return 'SW';

        // Fallback based on dominant axis
        if (Math.abs(vx) > Math.abs(vy)) {
            return vx > 0 ? 'NE' : 'NW';
        } else {
            return vy > 0 ? 'SE' : 'SW';
        }
    }

    /**
     * Initialize AI for an NPC (set initial velocity)
     */
    initialize(npc) {
        this.changeDirectionAndState(npc);
    }
}
