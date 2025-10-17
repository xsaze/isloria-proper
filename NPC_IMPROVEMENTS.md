# NPC System Improvements

## Overview
Implemented two major fixes for NPC behavior issues using first-principle analysis.

---

## Problem 1: NPCs Getting Stuck

### Issue Description
- NPCs would get stuck on non-walkable tiles (water, edges)
- NPCs kept **attempting to move** (velocity ≠ 0, direction changing) but position remained static
- Existing collision-based stuck detection didn't catch this case

### Root Cause Analysis
The existing stuck detection relied on:
- Collision counters (only triggers when colliding with other NPCs)
- Idle state detection (stuck NPCs aren't idle - they're actively trying to move!)

**The real problem:** NPC position doesn't change despite movement attempts.

### Solution: Position-Based Stuck Detection

**Algorithm:**
```javascript
// Track position history over time
positionHistory.set(npcId, { x, y, timestamp });

// Every 5 seconds, check distance traveled
const distanceMoved = Math.sqrt(dx² + dy²);

if (distanceMoved < 5 pixels) {
    // NPC is stuck! Respawn at island center
    respawn(npc, islandCenter);
}
```

**Implementation:**
- [NpcPhysics.js](backend/npc/NpcPhysics.js) - Lines 24-36, 253-312
- Tracks actual position over 5-second intervals
- Threshold: 5 pixels movement required
- Action: Respawn to island center (within 3 tiles of center)

**Benefits:**
- ✅ Simple and elegant
- ✅ Catches all stuck scenarios (collision, edge cases, water tiles)
- ✅ Low overhead (only checks every 5 seconds)
- ✅ Self-correcting (NPCs automatically recover)

---

## Problem 2: NPCs Walking on Water

### Issue Description
- NPCs visually appear to walk on water tiles
- Backend thinks NPC is on walkable land
- Mismatch between visual position and walkability check

### Root Cause Analysis

**Visual Investigation:**
1. **Sprite anchor point:** `anchor={0.5}` (center of sprite)
2. **Sprite sizes (scaled 2x):**
   - Stag: 64x82 pixels (32x41 base)
   - Boar: 82x64 pixels (41x32 base)
   - Player: 96x96 pixels (48x48 base)
   - Wolf: 128x128 pixels (64x64 base)

3. **The problem:**
   - Backend checks walkability at NPC center: `(x, y)`
   - But NPC feet are **20-40 pixels below** center!
   - In isometric view, feet extend beyond tile boundary

**Example:**
```
NPC Center: (400, 300) ← Backend checks this (walkable land)
NPC Feet:   (400, 320) ← Visual position (on water!)
```

### Solution: Foot-Position Walkability Check

**Foot Offset Calculation:**
```javascript
FOOT_OFFSETS = {
    stag: 20,   // 32x41 sprite → 64x82 visual → feet ~20px below center
    boar: 16,   // 41x32 sprite → 82x64 visual → feet ~16px below center
    player: 24, // 48x48 sprite → 96x96 visual → feet ~24px below center
    wolf: 32    // 64x64 sprite → 128x128 visual → feet ~32px below center
};
```

**Modified walkability check:**
```javascript
// OLD: Check NPC center
isWalkable(npc.x, npc.y)

// NEW: Check NPC feet
const footOffset = FOOT_OFFSETS[npc.npcType] || 20;
isWalkable(npc.x, npc.y + footOffset)
```

**Implementation:**
- [NpcPhysics.js](backend/npc/NpcPhysics.js) - Lines 29-36, 75-80
- Per-NPC-type foot offsets
- Checks walkability at foot position instead of center

**Benefits:**
- ✅ Accurate collision detection (feet position matters, not center)
- ✅ Prevents NPCs from visually walking on water
- ✅ Works with isometric diamond-shaped tiles
- ✅ Per-NPC-type accuracy (different sprite sizes)

---

## Debug Tool: Walkable Grid Visualization

### Purpose
Visualize exactly which tiles the backend considers walkable to debug NPC behavior.

### Implementation
- **Component:** [WalkableGridDebug.jsx](frontend/src/components/WalkableGridDebug.jsx)
- **Toggle:** "Debug Grid" button in MC Control Panel
- **Visual:** Semi-transparent green overlay on walkable tiles

### Features
- Shows walkable grid as 50% opacity green diamonds
- Matches backend isometric coordinate system
- Toggle on/off with button
- Helps verify walkable grid accuracy vs visual tiles

### Usage
1. Click "Debug Grid" button in top-right panel
2. Green overlay shows all walkable tiles
3. Verify NPCs stay within green area
4. If NPCs walk outside green area → walkability check issue
5. If green area doesn't match island → grid generation issue

---

## Files Modified

### Backend (1 file):
- `backend/npc/NpcPhysics.js`
  - Added position history tracking (lines 24-27)
  - Added foot offset constants (lines 29-36)
  - Added `checkAndHandleStuck()` method (lines 253-312)
  - Modified walkability check to use foot position (lines 75-80)

### Frontend (2 files):
- `frontend/src/components/WalkableGridDebug.jsx` (NEW)
  - Debug visualization component
  - Renders walkable grid as green overlay

- `frontend/src/components/GameCanvas.jsx`
  - Import WalkableGridDebug component
  - Add `showWalkableGrid` state
  - Add "Debug Grid" toggle button
  - Render debug overlay when enabled

---

## Testing Guide

### Test 1: Stuck Detection
1. Start server and frontend
2. Increase MC to spawn NPCs
3. Wait for NPCs to potentially get stuck
4. After 5 seconds of being stuck, NPCs should respawn at center
5. Check console logs for: `🚨 NPC stuck! Moved only X.Xpx...`

### Test 2: Walkability Check
1. Click "Debug Grid" button
2. Observe green overlay on walkable tiles
3. Watch NPCs movement - should stay within green area
4. If NPCs walk on water:
   - Check if water tiles are marked green (grid issue)
   - Check if NPCs walk outside green (foot offset issue)

### Test 3: Different NPC Types
1. Increase MC to spawn all NPC types (stag, wolf, player, boar)
2. Each should respect walkability based on their foot offset
3. Larger NPCs (wolf) have bigger foot offset (32px)
4. Smaller NPCs (boar) have smaller foot offset (16px)

---

## Configuration

### Stuck Detection Settings
```javascript
// In NpcPhysics.js
STUCK_CHECK_INTERVAL: 5000  // Check every 5 seconds
STUCK_DISTANCE_THRESHOLD: 5  // Less than 5 pixels = stuck
```

### Foot Offset Tuning
```javascript
// In NpcPhysics.js - adjust if NPCs still walk on water
FOOT_OFFSETS: {
    stag: 20,   // Increase if stag walks on water
    boar: 16,   // Increase if boar walks on water
    player: 24, // Increase if player walks on water
    wolf: 32    // Increase if wolf walks on water
}
```

---

## Performance Impact

### Stuck Detection
- **Overhead:** Negligible
- **Frequency:** Once per 5 seconds per NPC
- **Complexity:** O(1) per check
- **Memory:** 24 bytes per NPC (x, y, timestamp)

### Foot-Position Check
- **Overhead:** None (just adds offset to existing check)
- **Complexity:** Same as before (O(1))
- **Performance:** No measurable impact

---

## Expected Behavior

### Before Fixes:
- ❌ NPCs get stuck on water tiles forever
- ❌ NPCs visually walk on water
- ❌ No way to debug walkability issues

### After Fixes:
- ✅ Stuck NPCs auto-respawn after 5 seconds
- ✅ NPCs respect walkability at foot position
- ✅ Debug grid shows exact walkable area
- ✅ Self-correcting system

---

## Next Steps (If Issues Persist)

### If NPCs Still Walk on Water:
1. Enable "Debug Grid"
2. Check if water tiles are green (shouldn't be)
3. If water IS green → Backend walkable grid issue
4. If water NOT green → Increase foot offset for that NPC type

### If Stuck Detection Too Aggressive:
- Increase `STUCK_CHECK_INTERVAL` (e.g., 10000ms = 10 seconds)
- Increase `STUCK_DISTANCE_THRESHOLD` (e.g., 10 pixels)

### If Debug Grid Doesn't Match Island:
- Check `WalkableGrid.updateFromIsland()` in backend
- Verify islandData.tiles have correct walkable flags
- Check coordinate system matches between backend/frontend
