import {
    useEffect,
    useRef,
    useState,
    useCallback
} from 'react';
import { extend } from '@pixi/react';
import {
  AnimatedSprite
} from 'pixi.js'
import { SPRITE_SHEETS } from '../helpers/SPRITE_SHEETS';

extend({ AnimatedSprite });

// Direction mapping: NE=0, NW=1, SE=2, SW=3
const DIRECTIONS = ['NE', 'NW', 'SE', 'SW'];

// Map direction string to index
const DIRECTION_MAP = {
    'NE': 0,
    'NW': 1,
    'SE': 2,
    'SW': 3
};

export function Npc({
    frames,
    npcType = 'stag',
    x,
    y,
    state,
    direction
}) {
    const spriteRef = useRef(null);
    const [currentFrames, setCurrentFrames] = useState([]);

    // Get the correct animation frames based on current direction and state
    const getFramesForDirection = useCallback(() => {
        if (!frames || !frames[npcType] || !frames[npcType][state]) {
            return [];
        }

        const stateData = frames[npcType][state];
        const spriteConfig = SPRITE_SHEETS[npcType]?.[state];

        if (!spriteConfig) {
            return [];
        }

        const cols = spriteConfig.cols;
        const directions = spriteConfig.directions;

        // Get direction index from direction string
        const dirIndex = DIRECTION_MAP[direction] ?? 0;

        // Find which row corresponds to current direction
        let rowIndex = directions.indexOf(DIRECTIONS[dirIndex]);
        if (rowIndex === -1) {
            rowIndex = 0;
        }

        // Calculate frame range for this direction
        const startFrame = rowIndex * cols;
        const endFrame = startFrame + cols;

        const selectedFrames = stateData.frames.slice(startFrame, endFrame);

        return selectedFrames;
    }, [frames, npcType, state, direction]);

    // Update frames when state or direction changes
    useEffect(() => {
        const newFrames = getFramesForDirection();
        setCurrentFrames(newFrames);
    }, [getFramesForDirection]);

    // Play animation when sprite ref and frames are ready
    useEffect(() => {
        const sprite = spriteRef.current;
        if (sprite && currentFrames.length > 0) {
            sprite.textures = currentFrames;
            sprite.play();
        }
    }, [currentFrames]);

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
            x={x}
            y={y}
            anchor={0.5}
            scale={2}
        />
    );
}
