/**
 * NPC definitions and initial spawn data
 */

export const initialNPCs = {
    // Cluster 1: NPCs that will likely collide with each other (center area)
    stag1: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        state: 'walk',
        direction: 'NE',
        npcType: 'stag',
        speed: 1.5,
        radius: 32  // Will be calculated based on type
    },
    stag2: {
        x: 450,
        y: 300,
        vx: 0,
        vy: 0,
        state: 'walk',
        direction: 'SW',
        npcType: 'stag',
        speed: 1.2,
        radius: 32
    },
    player1: {
        x: 425,
        y: 350,
        vx: 0,
        vy: 0,
        state: 'walk',
        direction: 'NW',
        npcType: 'player',
        speed: 1.3,
        radius: 48
    },

    // Cluster 2: NPCs spread around to test independent movement
    stag3: {
        x: 200,
        y: 200,
        vx: 0,
        vy: 0,
        state: 'walk',
        direction: 'SE',
        npcType: 'stag',
        speed: 1.8,
        radius: 32
    },
    boar1: {
        x: 600,
        y: 200,
        vx: 0,
        vy: 0,
        state: 'run',
        direction: 'SW',
        npcType: 'boar',
        speed: 1.5,
        radius: 36
    },

    // Single NPC for control
    stag4: {
        x: 300,
        y: 450,
        vx: 0,
        vy: 0,
        state: 'run',
        direction: 'NE',
        npcType: 'stag',
        speed: 1.4,
        radius: 32
    }
};
