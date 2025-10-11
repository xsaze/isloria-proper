import { useRef, useCallback } from 'react';
import {
  Application,
  extend
} from '@pixi/react'
import {
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
} from 'pixi.js'
import { Npc } from "./Npc";
import { getCollisionRadius } from '../helpers/collisionUtils';


extend({
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
})

export const GameCanvas = ({ frames, gameState }) => {
  console.log("GameCanvas rendering with frames:", frames);
  console.log("GameCanvas gameState:", gameState);

  // Shared NPC position tracking for collision detection
  // Map structure: { npcId: { x, y, radius } }
  const npcPositionsRef = useRef(new Map());

  // Callback for NPCs to update their positions
  const updateNPCPosition = useCallback((npcId, position, radius) => {
    npcPositionsRef.current.set(npcId, {
      x: position.x,
      y: position.y,
      radius: radius
    });
  }, []);

  if (!frames) {
    return <div>Loading frames...</div>;
  }

  // Extract NPCs array from gameState, or use empty array as fallback
  const npcs = gameState?.npcs ? Object.entries(gameState.npcs) : [];

  return (
    <Application resizeTo={window}>
      <container>
        {npcs.map(([npcId, npcData]) => {
          const collisionRadius = getCollisionRadius(npcData.npcType || 'stag', 2);

          return (
            <Npc
              key={npcId}
              npcId={npcId}
              frames={frames}
              npcType={npcData.npcType || 'stag'}
              initialState={npcData.animation || 'idle'}
              initialX={npcData.x}
              initialY={npcData.y}
              speed={npcData.speed || 1.5}
              enableAI={true}
              collisionRadius={collisionRadius}
              npcPositions={npcPositionsRef.current}
              onPositionUpdate={updateNPCPosition}
            />
          );
        })}
      </container>
    </Application>
  )
}