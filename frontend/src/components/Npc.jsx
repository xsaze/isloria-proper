import {
    useEffect,
    useRef,
    useState,
    useCallback
} from 'react';
import { useTick, extend } from '@pixi/react';
import {
  AnimatedSprite
} from 'pixi.js'
import { SPRITE_SHEETS } from '../helpers/SPRITE_SHEETS';
import {
    checkNPCCollisions,
    calculateBounceDirection,
    calculateSeparationForce,
    calculateMultiSeparationForce
} from '../helpers/collisionUtils';

extend({ AnimatedSprite });

// Direction mapping: NE=0, NW=1, SE=2, SW=3
const DIRECTIONS = ['NE', 'NW', 'SE', 'SW'];

// Helper function to get available states for an NPC type
const getAvailableStates = (npcType, frames) => {
    if (!frames || !frames[npcType]) {
        return ['idle']; // fallback
    }
    return Object.keys(frames[npcType]);
};

export function Npc({
    frames,
    npcId,
    npcType = 'stag',
    initialState = 'idle',
    initialX = 400,
    initialY = 300,
    speed = 1,
    enableAI = true,
    boundaries,
    collisionRadius = 32,
    npcPositions,
    onPositionUpdate
}) {
    const spriteRef = useRef(null);
    const positionRef = useRef({ x: initialX, y: initialY });
    const velocityRef = useRef({ x: 0, y: 0 });
    const lastDirectionChange = useRef(Date.now());
    const stuckCounterRef = useRef(0);  // Track consecutive collision frames
    const lastCollisionTimeRef = useRef(0);  // Track last collision time

    // Calculate boundaries if not provided
    const actualBoundaries = boundaries || {
        minX: 50,
        maxX: (typeof window !== 'undefined' ? window.innerWidth : 800) - 50,
        minY: 50,
        maxY: (typeof window !== 'undefined' ? window.innerHeight : 600) - 50
    };

    // State management (for React rendering)
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [direction, setDirection] = useState(0);
    const [currentState, setCurrentState] = useState(initialState);
    const [currentFrames, setCurrentFrames] = useState([]);

    const directionChangeInterval = 2000;

    // Get the correct animation frames based on current direction and state
    const getFramesForDirection = useCallback((dir) => {
        if (!frames) {
            console.error(`[${npcType}] No frames provided`);
            return [];
        }

        if (!frames[npcType]) {
            console.error(`[${npcType}] NPC type not found in frames. Available:`, Object.keys(frames));
            return [];
        }

        if (!frames[npcType][currentState]) {
            console.warn(`[${npcType}] State "${currentState}" not found. Available:`, Object.keys(frames[npcType]));

            // Fallback to idle if available, otherwise first available state
            const availableStates = Object.keys(frames[npcType]);
            const fallbackState = availableStates.includes('idle') ? 'idle' : availableStates[0];

            if (fallbackState && frames[npcType][fallbackState]) {
                console.log(`[${npcType}] Falling back to "${fallbackState}" state`);
                setCurrentState(fallbackState);
                return [];
            }

            return [];
        }

        const stateData = frames[npcType][currentState];
        const spriteConfig = SPRITE_SHEETS[npcType]?.[currentState];

        if (!spriteConfig) {
            console.error(`[${npcType}] Missing sprite config for ${currentState}`);
            return [];
        }

        const cols = spriteConfig.cols;
        const directions = spriteConfig.directions;

        // Find which row corresponds to current direction
        let rowIndex = directions.indexOf(DIRECTIONS[dir]);
        if (rowIndex === -1) {
            rowIndex = 0;
        }

        // Calculate frame range for this direction
        const startFrame = rowIndex * cols;
        const endFrame = startFrame + cols;

        const selectedFrames = stateData.frames.slice(startFrame, endFrame);

        return selectedFrames;
    }, [frames, npcType, currentState]);

    // Update frames when direction changes
    useEffect(() => {
        const directionFrames = getFramesForDirection(direction);
        setCurrentFrames(directionFrames);
    }, [direction, getFramesForDirection]);

    // Play animation when sprite ref and frames are ready
    useEffect(() => {
        const sprite = spriteRef.current;
        if (sprite && currentFrames.length > 0) {
            sprite.textures = currentFrames;
            sprite.play();
        }
    }, [currentFrames]);

    // AI Movement Logic - Change direction and state every 2 seconds
    useEffect(() => {
        if (!enableAI) return;

        // Get available states for this NPC type
        const availableStates = getAvailableStates(npcType, frames);
        console.log(`[${npcType}] Available states:`, availableStates);

        // Filter out only movement states (not idle) for AI behavior
        const movementStates = availableStates.filter(s => s !== 'idle');

        // Initialize with a random direction and state immediately
        const initDirection = Math.floor(Math.random() * 4);
        setDirection(initDirection);

        // Randomly choose a state from available states (prefer movement over idle 70/30)
        let initState;
        if (movementStates.length > 0 && Math.random() > 0.3) {
            initState = movementStates[Math.floor(Math.random() * movementStates.length)];
        } else {
            initState = 'idle';
        }
        setCurrentState(initState);

        let vx = 0, vy = 0;
        if (initState !== 'idle') {
            switch (initDirection) {
                case 0: vx = speed; vy = -speed; break;
                case 1: vx = -speed; vy = -speed; break;
                case 2: vx = speed; vy = speed; break;
                case 3: vx = -speed; vy = speed; break;
            }
        }
        velocityRef.current = { x: vx, y: vy };

        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastDirectionChange.current >= directionChangeInterval) {
                // Pick a random direction (0-3)
                const newDirection = Math.floor(Math.random() * 4);
                setDirection(newDirection);

                // Randomly choose a state from available states (70% movement, 30% idle)
                let newState;
                if (movementStates.length > 0 && Math.random() > 0.3) {
                    newState = movementStates[Math.floor(Math.random() * movementStates.length)];
                } else {
                    newState = 'idle';
                }
                setCurrentState(newState);

                // Calculate velocity based on direction and state
                let vx = 0, vy = 0;
                if (newState !== 'idle') {
                    switch (newDirection) {
                        case 0: vx = speed; vy = -speed; break;
                        case 1: vx = -speed; vy = -speed; break;
                        case 2: vx = speed; vy = speed; break;
                        case 3: vx = -speed; vy = speed; break;
                    }
                }

                velocityRef.current = { x: vx, y: vy };
                lastDirectionChange.current = now;
            }
        }, 100);

        return () => clearInterval(interval);
    }, [enableAI, speed, directionChangeInterval, npcType, frames]);

    // Update position each frame - memoized callback
    const updatePosition = useCallback((ticker) => {
        if (!enableAI) return;

        const delta = ticker.deltaTime || 1;
        const currentPos = positionRef.current;
        const currentVel = velocityRef.current;

        const newX = currentPos.x + currentVel.x * delta;
        const newY = currentPos.y + currentVel.y * delta;
        const newPos = { x: newX, y: newY };

        // Check for ALL NPC collisions if collision detection is enabled
        let collisions = null;
        if (npcPositions && npcId && collisionRadius) {
            // Check for multiple collisions
            collisions = checkNPCCollisions(newPos, npcId, npcPositions, collisionRadius, true);
        }

        // Apply boundaries
        let clampedX = Math.max(actualBoundaries.minX, Math.min(actualBoundaries.maxX, newX));
        let clampedY = Math.max(actualBoundaries.minY, Math.min(actualBoundaries.maxY, newY));

        // Handle collision with NPCs
        if (collisions) {
            // Increment stuck counter
            stuckCounterRef.current++;
            lastCollisionTimeRef.current = Date.now();

            // Calculate separation force to push apart
            const separationForce = collisions.length === 1
                ? calculateSeparationForce(currentPos, collisions[0].position, collisionRadius, collisions[0].position.radius)
                : calculateMultiSeparationForce(currentPos, collisions, collisionRadius);

            // Apply separation force FIRST (push apart)
            let separatedX = currentPos.x + separationForce.x;
            let separatedY = currentPos.y + separationForce.y;

            // Make sure separation doesn't push out of bounds
            separatedX = Math.max(actualBoundaries.minX, Math.min(actualBoundaries.maxX, separatedX));
            separatedY = Math.max(actualBoundaries.minY, Math.min(actualBoundaries.maxY, separatedY));

            // Check if stuck for too long (10+ frames = ~0.16 seconds at 60fps)
            if (stuckCounterRef.current > 10) {
                // Escape behavior: add extra push force
                const escapeBoost = 5;
                separatedX += separationForce.x > 0 ? escapeBoost : -escapeBoost;
                separatedY += separationForce.y > 0 ? escapeBoost : -escapeBoost;

                // Clamp again after escape boost
                separatedX = Math.max(actualBoundaries.minX, Math.min(actualBoundaries.maxX, separatedX));
                separatedY = Math.max(actualBoundaries.minY, Math.min(actualBoundaries.maxY, separatedY));

                // Reset stuck counter after escape attempt
                if (stuckCounterRef.current > 20) {
                    stuckCounterRef.current = 0;
                    // Pick a random direction to try moving
                    const randomDir = Math.floor(Math.random() * 4);
                    let vx = 0, vy = 0;
                    switch (randomDir) {
                        case 0: vx = speed * 1.5; vy = -speed * 1.5; break;
                        case 1: vx = -speed * 1.5; vy = -speed * 1.5; break;
                        case 2: vx = speed * 1.5; vy = speed * 1.5; break;
                        case 3: vx = -speed * 1.5; vy = speed * 1.5; break;
                    }
                    velocityRef.current = { x: vx, y: vy };
                    const newDirection = getDirectionFromVelocity(velocityRef.current);
                    if (newDirection !== null) {
                        setDirection(newDirection);
                    }
                }
            }

            // THEN calculate bounce direction
            const primaryCollision = collisions[0];
            const bouncedVelocity = calculateBounceDirection(
                currentPos,
                primaryCollision.position,
                currentVel
            );

            velocityRef.current = bouncedVelocity;

            // Use separated position
            clampedX = separatedX;
            clampedY = separatedY;

            // Update direction based on new velocity
            const newDirection = getDirectionFromVelocity(bouncedVelocity);
            if (newDirection !== null) {
                setDirection(newDirection);
            }
        }
        // No collision - reset stuck counter
        else {
            // Reset stuck counter if no collision for a while
            if (Date.now() - lastCollisionTimeRef.current > 500) {
                stuckCounterRef.current = 0;
            }

            // If we hit a boundary, pick a new random direction
            if (clampedX !== newX || clampedY !== newY) {
                const newDirection = Math.floor(Math.random() * 4);
                setDirection(newDirection);

                let vx = 0, vy = 0;
                switch (newDirection) {
                    case 0: vx = speed; vy = -speed; break;
                    case 1: vx = -speed; vy = -speed; break;
                    case 2: vx = speed; vy = speed; break;
                    case 3: vx = -speed; vy = speed; break;
                }
                velocityRef.current = { x: vx, y: vy };
            }
        }

        const finalPos = { x: clampedX, y: clampedY };
        positionRef.current = finalPos;
        setPosition(finalPos);

        // Report position to parent for collision tracking
        if (onPositionUpdate && npcId && collisionRadius) {
            onPositionUpdate(npcId, finalPos, collisionRadius);
        }
    }, [enableAI, speed, actualBoundaries.minX, actualBoundaries.maxX, actualBoundaries.minY, actualBoundaries.maxY, npcPositions, npcId, collisionRadius, onPositionUpdate]);

    // Helper function to determine direction from velocity
    const getDirectionFromVelocity = (velocity) => {
        if (velocity.x === 0 && velocity.y === 0) return null;

        // NE=0, NW=1, SE=2, SW=3
        if (velocity.x > 0 && velocity.y < 0) return 0; // NE
        if (velocity.x < 0 && velocity.y < 0) return 1; // NW
        if (velocity.x > 0 && velocity.y > 0) return 2; // SE
        if (velocity.x < 0 && velocity.y > 0) return 3; // SW

        // Fallback based on dominant axis
        if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
            return velocity.x > 0 ? 0 : 1; // NE or NW
        } else {
            return velocity.y > 0 ? 2 : 3; // SE or SW
        }
    };

    useTick(updatePosition);

    if (currentFrames.length === 0) {
        return null;
    }

    return (
        <animatedSprite
            ref={spriteRef}
            textures={currentFrames}
            autoUpdate={true}
            loop={true}
            animationSpeed={0.15}
            x={position.x}
            y={position.y}
            anchor={0.5}
            scale={2}
        />
    );
}
