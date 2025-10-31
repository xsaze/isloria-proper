# Viewport Centering and Panning Issues - Complete Fix

## Issues Summary

1. **Can't pan left on Desktop** - Clamp plugin prevents leftward panning
2. **Island not centered on Desktop/Mobile** - Clamp overrides moveCenter()
3. **Panning bugged on Mobile** - Constant underflow re-centering

## Root Cause Analysis

### The Core Problem

There's a fundamental mismatch between world bounds and island bounds:

- **World bounds**: (0, 0) to (6120, 3560) - large rectangular space based on gridSize * tileSize
- **Island bounds**: (~400, ~200) to (~800, ~1400) - small cluster of actual tiles within that space
- **Clamp plugin**: Assumes content fills entire world, so it clamps to world edges and centers the world, NOT the island

### Why Each Issue Occurs

#### Issue 1: Can't Pan Left
- Clamp plugin prevents panning to world x < 0
- Island starts at x ≈ 400 (backendOriginX)
- When you try to pan left, clamp stops you at x = 0
- Result: Can't see the left side of the island

#### Issue 2: Island Not Centered
- `moveCenter(centerX, centerY)` is called correctly
- Clamp plugin's `update()` runs every frame
- When `underflow: 'center'` is active, clamp recalculates:
  ```javascript
  viewport.x = (screenWidth - screenWorldWidth) / 2
  ```
- This centers the WORLD (0,0 to worldWidth,worldHeight), not the island
- Result: Island appears off-center because world origin ≠ island center

#### Issue 3: Mobile Panning Bugged
- Mobile screen: ~390px width
- World width: 6120px
- At zoom 1.0: screenWorldWidth (6120) > screenWidth (390) = ALWAYS underflow
- Clamp with `underflow: 'center'` continuously re-centers the world
- User drags, but clamp immediately snaps back to center
- Result: Panning feels "bugged" with constant jumping

### Technical Details from pixi-viewport Source

**Clamp Plugin Behavior** (from pixi_viewport.js lines 643-720):

```javascript
// When world < screen (underflow condition):
if (this.parent.screenWorldWidth < this.parent.screenWidth) {
  switch (this.underflowX) {
    case 0: // 'center'
      this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
      break;
  }
}

// Boundary clamping:
if (this.parent.left < 0) {
  this.parent.x = 0;  // ← Prevents panning left of world x=0
}
```

**Key Insight**: The clamp plugin doesn't know about your island - it only knows about the world bounds (0, 0) to (worldWidth, worldHeight).

## Solution: Remove Clamp Plugin

### Why This Is The Best Solution

Since we have:
- Ocean background filling all space (-5000, -5000) to (5000, 5000)
- No gameplay need to restrict panning to specific boundaries
- `clampZoom` already limiting zoom levels (0.5x to 2.0x)

**We should allow free panning everywhere** and rely only on zoom clamping.

### Benefits

**Desktop**:
- ✅ Can pan left/right/up/down freely (no clamp restrictions)
- ✅ Island centers correctly via `moveCenter()` (no clamp override)
- ✅ No camera reset (no clamp re-centering)

**Mobile**:
- ✅ Island centers correctly (no underflow re-centering)
- ✅ Panning works smoothly (no clamp interference)
- ✅ Can explore the entire world

**Trade-off**:
- Users can pan to empty ocean areas
- This is acceptable because:
  - Ocean background extends far beyond island
  - Users can always zoom/pan back to find island
  - Typical behavior for open-world games

## Implementation Steps

### Step 1: Remove Clamp Plugin from CustomViewport.js

**File**: `frontend/src/helpers/CustomViewport.js`

**Current code** (lines 21-49):
```javascript
// Configure default plugins for camera controls
this.drag({
  mouseButtons: 'left',
  wheel: false,
  pressDrag: true
})
.wheel({
  percent: 0.1,
  smooth: 5,
  trackpadPinch: true,
  center: null
})
.pinch({
  noDrag: false,
  percent: 1.0
})
.clamp({                    // ← REMOVE THIS
  direction: 'all',
  underflow: 'center'
})
.decelerate({
  friction: 0.9,
  bounce: 0.5,
  minSpeed: 0.01
})
.clampZoom({
  minScale: 0.5,
  maxScale: 2.0
});
```

**New code**:
```javascript
// Configure default plugins for camera controls
this.drag({
  mouseButtons: 'left',
  wheel: false,
  pressDrag: true
})
.wheel({
  percent: 0.1,
  smooth: 5,
  trackpadPinch: true,
  center: null
})
.pinch({
  noDrag: false,
  percent: 1.0
})
// .clamp() removed - allows free panning in all directions
.decelerate({
  friction: 0.9,
  bounce: 0.5,
  minSpeed: 0.01
})
.clampZoom({
  minScale: 0.5,
  maxScale: 2.0
});
```

### Step 2: Verify Centering Logic (Already Correct)

**File**: `frontend/src/components/GameCanvas.jsx`

The current centering implementation is correct:

```javascript
// Center viewport on island when ready (only once at initialization)
useEffect(() => {
  // Only center once, when app first becomes ready
  if (!isAppReady || !viewportRef.current || worldBounds.centerX === undefined || hasInitializedViewport.current) {
    return;
  }

  // Small delay to ensure viewport plugins are fully initialized
  const timer = setTimeout(() => {
    if (viewportRef.current) {
      // Force viewport to sync with current window dimensions (fixes mobile centering)
      viewportRef.current.resize(window.innerWidth, window.innerHeight);

      // Center viewport on the island
      viewportRef.current.moveCenter(worldBounds.centerX, worldBounds.centerY);
      viewportRef.current.setZoom(1.0, false);

      hasInitializedViewport.current = true; // Mark as initialized
    }
  }, 50);

  return () => clearTimeout(timer);
}, [isAppReady, worldBounds.centerX, worldBounds.centerY]);
```

**What makes this correct**:
- `hasInitializedViewport` ref prevents re-centering on updates
- 50ms delay allows plugins to initialize
- `resize()` ensures accurate dimensions before centering
- Only depends on `centerX` and `centerY`, not entire `worldBounds` object

### Step 3: Test

After making the change, test:

**Desktop**:
1. Island should be centered at page load
2. Can pan in all directions (left, right, up, down)
3. No camera reset when panning
4. Zoom in/out should work smoothly
5. Panning should have momentum (decelerate plugin)

**Mobile**:
1. Island should be centered at page load
2. Touch drag should pan smoothly
3. No jumping/snapping back to center
4. Pinch to zoom should work
5. Can explore entire ocean area

## Alternative Solution (If You Need Boundaries)

If you absolutely need to restrict panning to the island area, use this more complex approach:

### Adjust World Bounds to Match Island Bounds

**Concept**: Make world bounds exactly match island bounds so that centering the world = centering the island.

**Changes in GameCanvas.jsx**:

```javascript
const worldBounds = useMemo(() => {
  if (!islandData || !islandData.tiles || islandData.tiles.length === 0) {
    return {
      worldWidth: 2000,
      worldHeight: 2000,
      centerX: 1000,
      centerY: 1000,
      offsetX: 0,
      offsetY: 0
    };
  }

  const TILE_WIDTH = 64;
  const TILE_HEIGHT = 32;
  const PADDING = 500;
  const backendOriginX = 400;
  const backendOriginY = 200;

  // Calculate the actual bounding box of rendered tiles
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const gridToWorld = (gridX, gridY) => ({
    x: ((gridX - gridY) * (TILE_WIDTH / 2)) + backendOriginX,
    y: ((gridX + gridY) * (TILE_HEIGHT / 2)) + backendOriginY
  });

  // Find bounds of actual tiles
  islandData.tiles.forEach(tile => {
    const worldPos = gridToWorld(tile.x, tile.y);
    minX = Math.min(minX, worldPos.x);
    maxX = Math.max(maxX, worldPos.x);
    minY = Math.min(minY, worldPos.y);
    maxY = Math.max(maxY, worldPos.y);
  });

  // NEW: World bounds match island bounds
  const islandWidth = (maxX - minX) + PADDING * 2;
  const islandHeight = (maxY - minY) + PADDING * 2;

  // NEW: Calculate offset to shift island to world center
  const worldOffsetX = -minX + PADDING;
  const worldOffsetY = -minY + PADDING;

  // NEW: Center is at the middle of the new world space
  const centerX = islandWidth / 2;
  const centerY = islandHeight / 2;

  return {
    worldWidth: islandWidth,
    worldHeight: islandHeight,
    centerX,
    centerY,
    offsetX: worldOffsetX,  // NEW: Pass to IslandRenderer
    offsetY: worldOffsetY   // NEW: Pass to IslandRenderer
  };
}, [islandData]);
```

**Apply offset in IslandRenderer**:

```javascript
<IslandRenderer
  islandData={islandData}
  viewportRef={viewportRef}
  x={worldBounds.offsetX}  // NEW: Offset island position
  y={worldBounds.offsetY}  // NEW: Offset island position
/>
```

**Update OceanBackground**:

```javascript
<OceanBackground
  x={-worldBounds.offsetX}  // NEW: Counter-offset ocean
  y={-worldBounds.offsetY}  // NEW: Counter-offset ocean
/>
```

**Update NPC positions**:

```javascript
{npcs.map(([npcId, npcData]) => {
  const npcYAdjustment = -24;
  return (
    <Npc
      key={npcId}
      frames={frames}
      npcType={npcData.npcType || 'stag'}
      x={npcData.x + worldBounds.offsetX}  // NEW: Offset NPC
      y={npcData.y + npcYAdjustment + worldBounds.offsetY}  // NEW: Offset NPC
      state={npcData.state || 'idle'}
      direction={npcData.direction || 'NE'}
    />
  );
})}
```

**Keep clamp plugin in CustomViewport.js**:
```javascript
.clamp({
  direction: 'all',
  underflow: 'center'
})
```

### Why Alternative Is More Complex

**Pros**:
- Restricts panning to island area only
- Prevents users from getting lost in empty ocean

**Cons**:
- More code changes required (4 files)
- Must update all positioned elements (Island, Ocean, NPCs)
- More complex coordinate system management
- Potential for bugs if any element doesn't get offset applied

## Recommendation

**Use the simple solution** (remove clamp plugin):
- Only 1 line of code to change
- Fixes all 3 issues immediately
- No risk of introducing new bugs
- Standard behavior for open-world games
- Easy to understand and maintain

**Use the alternative** only if:
- Game design requires strict boundaries
- Users must never see empty ocean
- You have time to test all coordinate transformations thoroughly

## Component Hierarchy Reference

For understanding the structure:

```
Application (PixiJS app, resizeTo: window)
└─ pixiViewport (CustomViewport - extends pipi-viewport)
   └─ container (sortableChildren: true)
      ├─ OceanBackground (graphics at -5000, -5000, size: 10000×10000)
      ├─ IslandRenderer (container at x=0, y=0)
      │  └─ container (sortableChildren: true)
      │     ├─ IsometricTile sprites (at absolute world coords)
      │     └─ IslandDecoration sprites (at absolute world coords)
      └─ Npc components (AnimatedSprite at absolute world coords)
```

**Key Points**:
- All elements use the same world coordinate system
- Viewport transforms world coords → screen coords
- No relative positioning - everything is absolute
- Origin for tiles: (400, 200) = grid (0, 0)

## Coordinate System Summary

### World Coordinates
- Origin: (0, 0) at top-left of world space
- Tiles use backendOrigin (400, 200) as grid (0, 0)
- Units: Pixels

### Screen Coordinates
- Origin: (0, 0) at top-left of browser window
- Units: Pixels

### Viewport Position
- `viewport.x` and `viewport.y` determine world → screen transform
- Formula: `screenX = worldX * scale + viewport.x`

### Transform Example
To center world position (400, 600) on screen (1920×1080):
```javascript
viewport.x = -400 * 1.0 + (1920 / 2) = 560
viewport.y = -600 * 1.0 + (1080 / 2) = -60
```

## Testing Checklist

After implementing the fix:

### Desktop
- [ ] Island appears centered on page load
- [ ] Can pan left smoothly
- [ ] Can pan right smoothly
- [ ] Can pan up smoothly
- [ ] Can pan down smoothly
- [ ] No camera reset while panning
- [ ] Zoom in works (scroll wheel)
- [ ] Zoom out works (scroll wheel)
- [ ] Zoom limited to 0.5x - 2.0x
- [ ] Panning has momentum/deceleration

### Mobile
- [ ] Island appears centered on page load
- [ ] Can drag/pan smoothly in all directions
- [ ] No jumping or snapping back to center
- [ ] Pinch to zoom in works
- [ ] Pinch to zoom out works
- [ ] Zoom limited to 0.5x - 2.0x
- [ ] Touch drag has momentum/deceleration

### Edge Cases
- [ ] Window resize doesn't break centering
- [ ] Switching between portrait/landscape works
- [ ] Multiple touches work correctly
- [ ] Very small islands center properly
- [ ] Very large islands allow full panning
