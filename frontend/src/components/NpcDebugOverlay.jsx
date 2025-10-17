/**
 * NpcDebugOverlay - Visualizes NPC anchor points and foot positions
 * Helps debug walkability issues by showing:
 * - Red dot: NPC center/anchor point (what backend uses for position)
 * - Blue dot: NPC foot position (what backend checks for walkability)
 */

import { useMemo } from 'react';

// Foot offsets from backend (must match NpcPhysics.js)
const FOOT_OFFSETS = {
    stag: 20,
    boar: 16,
    player: 24,
    wolf: 32
};

// Sprite widths from backend (must match NpcPhysics.js)
const SPRITE_WIDTHS = {
    stag: 64,
    boar: 82,
    player: 96,
    wolf: 128
};

/**
 * NpcDebugOverlay component
 */
export function NpcDebugOverlay({ npcs, centerOffsetX, centerOffsetY, visible = true }) {
    // Generate debug markers for each NPC
    const debugMarkers = useMemo(() => {
        if (!npcs || !visible) {
            return [];
        }

        const markers = [];

        for (const [npcId, npcData] of npcs) {
            const footOffset = FOOT_OFFSETS[npcData.npcType] || 20;
            const spriteWidth = SPRITE_WIDTHS[npcData.npcType] || 64;
            const halfWidth = spriteWidth / 2;
            const footY = npcData.y + centerOffsetY + footOffset;

            markers.push({
                npcId,
                npcType: npcData.npcType,
                centerX: npcData.x + centerOffsetX,
                centerY: npcData.y + centerOffsetY,
                // 3 foot positions: left, center, right
                leftFootX: npcData.x + centerOffsetX - halfWidth,
                centerFootX: npcData.x + centerOffsetX,
                rightFootX: npcData.x + centerOffsetX + halfWidth,
                footY: footY
            });
        }

        return markers;
    }, [npcs, centerOffsetX, centerOffsetY, visible]);

    if (!visible || debugMarkers.length === 0) {
        return null;
    }

    return (
        <container
            x={0}
            y={0}
            sortableChildren={false}
            interactiveChildren={false}
            zIndex={20000} // Render on top of everything
        >
            {debugMarkers.map(({ npcId, npcType, centerX, centerY, leftFootX, centerFootX, rightFootX, footY }) => (
                <container key={`npc-debug-${npcId}`}>
                    {/* Center/Anchor Point - RED DOT */}
                    <graphics
                        x={centerX}
                        y={centerY}
                        draw={(g) => {
                            g.clear();

                            // Draw red circle for center
                            g.beginFill(0xff0000, 0.8); // Red
                            g.drawCircle(0, 0, 4);
                            g.endFill();

                            // Draw outer ring
                            g.lineStyle(1, 0xff0000, 1);
                            g.drawCircle(0, 0, 6);
                        }}
                    />

                    {/* LEFT Foot Position - BLUE DOT */}
                    <graphics
                        x={leftFootX}
                        y={footY}
                        draw={(g) => {
                            g.clear();
                            g.beginFill(0x0088ff, 0.8);
                            g.drawCircle(0, 0, 4);
                            g.endFill();
                            g.lineStyle(1, 0x0088ff, 1);
                            g.drawCircle(0, 0, 6);
                        }}
                    />

                    {/* CENTER Foot Position - BLUE DOT */}
                    <graphics
                        x={centerFootX}
                        y={footY}
                        draw={(g) => {
                            g.clear();
                            g.beginFill(0x0088ff, 0.8);
                            g.drawCircle(0, 0, 4);
                            g.endFill();
                            g.lineStyle(1, 0x0088ff, 1);
                            g.drawCircle(0, 0, 6);
                        }}
                    />

                    {/* RIGHT Foot Position - BLUE DOT */}
                    <graphics
                        x={rightFootX}
                        y={footY}
                        draw={(g) => {
                            g.clear();
                            g.beginFill(0x0088ff, 0.8);
                            g.drawCircle(0, 0, 4);
                            g.endFill();
                            g.lineStyle(1, 0x0088ff, 1);
                            g.drawCircle(0, 0, 6);
                        }}
                    />

                    {/* Lines connecting center to feet */}
                    <graphics
                        x={0}
                        y={0}
                        draw={(g) => {
                            g.clear();
                            g.lineStyle(1, 0xffffff, 0.3);
                            // Left foot line
                            g.moveTo(centerX, centerY);
                            g.lineTo(leftFootX, footY);
                            // Center foot line
                            g.moveTo(centerX, centerY);
                            g.lineTo(centerFootX, footY);
                            // Right foot line
                            g.moveTo(centerX, centerY);
                            g.lineTo(rightFootX, footY);
                        }}
                    />

                    {/* Bottom edge line (connecting all 3 foot points) */}
                    <graphics
                        x={0}
                        y={0}
                        draw={(g) => {
                            g.clear();
                            g.lineStyle(2, 0x00ff00, 0.6); // Green line
                            g.moveTo(leftFootX, footY);
                            g.lineTo(rightFootX, footY);
                        }}
                    />
                </container>
            ))}
        </container>
    );
}

export default NpcDebugOverlay;
