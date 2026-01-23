window.ChronoJoust = () => {
  const { useState, useEffect, useRef, useMemo } = React;
  const canvasRef = useRef(null);
  const splashCanvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [energy, setEnergy] = useState(0);
  const [health, setHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(100);
  const [restartTrigger, setRestartTrigger] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedStartLevel, setSelectedStartLevel] = useState(1);

  // LEVEL CONFIGURATIONS
  // NOTE: Each level is completely independent - changes to Level 1 won't affect Level 2
  // Platforms, enemies, and orbs are deep-copied when loaded, so you can safely edit each level
  const LEVEL_CONFIGS = {
    1: {
      name: "The Void",
      theme: {
        background: '#0a0a1a',
        platformColors: {
          glow: '#00ffff',
          gradientTop: '#2a4a6a',
          gradientMid: '#1a3a5a',
          gradientBottom: '#0a1a2a',
          veinColor: '#00ffff'
        },
        orbColor: { glow: '#ff8800', core: '#ffaa00' }
      },
      platforms: [
        // Ground level platforms (y=700)
        { x: 0, y: 700, width: 400, height: 20 }, 
        { x: 500, y: 700, width: 300, height: 20 }, 
        { x: 900, y: 700, width: 400, height: 20 }, 
        { x: 1400, y: 700, width: 500, height: 20 }, 
        { x: 2000, y: 700, width: 600, height: 20 },
        
        // Low-mid platforms (y=600)
        { x: 200, y: 600, width: 150, height: 15, hasPhaseShift: true }, 
        { x: 700, y: 600, width: 180, height: 15 }, 
        { x: 1300, y: 600, width: 200, height: 15 },
        { x: 1700, y: 600, width: 160, height: 15, hasPhaseShift: true },
        { x: 2100, y: 600, width: 200, height: 15 },
        
        // Mid-level platforms (y=500)
        { x: 600, y: 500, width: 140, height: 15, hasPhaseShift: true }, 
        { x: 1200, y: 500, width: 150, height: 15 },
        { x: 1850, y: 500, width: 150, height: 15 },
        { x: 2250, y: 500, width: 140, height: 15, hasPhaseShift: true },
        
        // High platforms (y=400)
        { x: 450, y: 400, width: 120, height: 15 },
        { x: 900, y: 400, width: 130, height: 15, hasPhaseShift: true },
        { x: 1400, y: 400, width: 140, height: 15 },
        { x: 2000, y: 400, width: 120, height: 15 },
        
        // Extra stepping stones for flow
        { x: 1000, y: 550, width: 100, height: 15, hasPhaseShift: true },
        { x: 1600, y: 550, width: 80, height: 15 },
        
        // Top layer platforms (y=300)
        { x: 300, y: 300, width: 130, height: 15, hasPhaseShift: true },
        { x: 750, y: 300, width: 140, height: 15 },
        { x: 1150, y: 300, width: 120, height: 15 },
        { x: 1550, y: 300, width: 130, height: 15, hasPhaseShift: true },
        { x: 1950, y: 300, width: 140, height: 15 },
        { x: 2350, y: 300, width: 120, height: 15 }
      ],
      energyOrbs: [
        { x: 250, y: 550, collected: false, pulse: 0 }, 
        { x: 1250, y: 450, collected: false, pulse: 0 }, 
        { x: 500, y: 350, collected: false, pulse: 0 },
        { x: 1450, y: 350, collected: false, pulse: 0 },
        { x: 350, y: 250, collected: false, pulse: 0 },
        { x: 1200, y: 250, collected: false, pulse: 0 },
        { x: 2000, y: 250, collected: false, pulse: 0 }
      ],
      enemies: [
        // One enemy per platform - ground level (y=700)
        { type: 'drifter', x: 650, y: 645, baseY: 645, width: 25, height: 25, direction: -1, speed: 0.9, patrolStart: 550, patrolEnd: 750, alive: true },
        { type: 'drifter', x: 1100, y: 645, baseY: 645, width: 25, height: 25, direction: 1, speed: 1.1, patrolStart: 950, patrolEnd: 1250, alive: true },
        { type: 'drifter', x: 1650, y: 645, baseY: 645, width: 25, height: 25, direction: -1, speed: 1.0, patrolStart: 1450, patrolEnd: 1850, alive: true },
        { type: 'drifter', x: 2300, y: 645, baseY: 645, width: 25, height: 25, direction: 1, speed: 0.95, patrolStart: 2050, patrolEnd: 2550, alive: true },
        
        // One enemy per platform - mid level (y=600)
        { type: 'drifter', x: 750, y: 545, baseY: 545, width: 25, height: 25, direction: 1, speed: 0.85, patrolStart: 720, patrolEnd: 860, alive: true },
        { type: 'echo', x: 1350, y: 450, width: 28, height: 28, direction: 1, speed: 0.7, patrolStart: 1320, patrolEnd: 1480, alive: true, phaseTimer: 0, phaseState: 'visible', verticalOffset: 0 },
        { type: 'drifter', x: 1750, y: 545, baseY: 545, width: 25, height: 25, direction: -1, speed: 0.9, patrolStart: 1720, patrolEnd: 1840, alive: true },
        
        // One enemy per platform - high level (y=500)
        { type: 'drifter', x: 650, y: 445, baseY: 445, width: 25, height: 25, direction: -1, speed: 0.8, patrolStart: 620, patrolEnd: 720, alive: true },
        { type: 'echo', x: 1900, y: 350, width: 28, height: 28, direction: -1, speed: 0.8, patrolStart: 1870, patrolEnd: 1980, alive: true, phaseTimer: 0, phaseState: 'visible', verticalOffset: 0 },
        
        // One enemy per platform - top level (y=400)
        { type: 'echo', x: 950, y: 350, width: 28, height: 28, direction: -1, speed: 0.75, patrolStart: 920, patrolEnd: 1010, alive: true, phaseTimer: 0, phaseState: 'visible', verticalOffset: 0 }
      ],
      portal: { x: 2500, y: 600, width: 60, height: 80 },
      boss: {
        name: 'Glaima',
        type: 'bat',
        health: 100,
        attackInterval: 120,
        projectileCount: 6,
        teleportInterval: 100
      }
    },
    
    2: {
      name: "Crimson Wastes",
      theme: {
        background: '#1a0505', // Dark red background
        platformColors: {
          glow: '#ff4400',      // Orange-red glow
          gradientTop: '#6a2a2a',    // Red-brown gradient
          gradientMid: '#5a1a1a',
          gradientBottom: '#2a0a0a',
          veinColor: '#ff6600'  // Bright orange veins
        },
        orbColor: { glow: '#ff8800', core: '#ffaa00' }
      },
      platforms: [
        // INDEPENDENT from Level 1 - Different layout than Level 1
        // Ground level platforms (y=700) - Different gaps and widths
        { x: 0, y: 700, width: 450, height: 20 }, 
        { x: 550, y: 700, width: 250, height: 20 }, 
        { x: 950, y: 700, width: 350, height: 20 }, 
        { x: 1450, y: 700, width: 450, height: 20 }, 
        { x: 2050, y: 700, width: 550, height: 20 },
        
        // Low-mid platforms (y=600)
        { x: 250, y: 600, width: 140, height: 15, hasPhaseShift: true }, 
        { x: 650, y: 600, width: 190, height: 15 }, 
        { x: 1250, y: 600, width: 180, height: 15 },
        { x: 1650, y: 600, width: 170, height: 15, hasPhaseShift: true },
        { x: 2150, y: 600, width: 180, height: 15 },
        
        // Mid-level platforms (y=500)
        { x: 550, y: 500, width: 150, height: 15, hasPhaseShift: true }, 
        { x: 1150, y: 500, width: 160, height: 15 },
        { x: 1800, y: 500, width: 140, height: 15 },
        { x: 2200, y: 500, width: 150, height: 15, hasPhaseShift: true },
        
        // High platforms (y=400)
        { x: 400, y: 400, width: 130, height: 15 },
        { x: 850, y: 400, width: 140, height: 15, hasPhaseShift: true },
        { x: 1350, y: 400, width: 130, height: 15 },
        { x: 1950, y: 400, width: 130, height: 15 },
        
        // Extra stepping stones for flow
        { x: 950, y: 550, width: 110, height: 15, hasPhaseShift: true },
        { x: 1550, y: 550, width: 90, height: 15 },
        
        // Top layer platforms (y=300)
        { x: 250, y: 300, width: 140, height: 15, hasPhaseShift: true },
        { x: 700, y: 300, width: 130, height: 15 },
        { x: 1100, y: 300, width: 130, height: 15 },
        { x: 1500, y: 300, width: 140, height: 15, hasPhaseShift: true },
        { x: 1900, y: 300, width: 130, height: 15 },
        { x: 2300, y: 300, width: 130, height: 15 }
      ],
      energyOrbs: [
        { x: 950, y: 650 },
        { x: 450, y: 550 },
        { x: 2400, y: 450 },
        { x: 1050, y: 350 },
        { x: 350, y: 250 },
        { x: 2000, y: 250 }
      ],
      enemies: [
        // Level 2 enemies - One enemy per platform maximum, spread across level
        
        // LAVA DROPPERS - 8 total, distributed across different platforms
        // Early section droppers
        { type: 'dropper', x: 300, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 0, meltProgress: 0 },      // Platform y=600, x=250-390
        { type: 'dropper', x: 450, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 40, meltProgress: 0, health: 2 },     // Platform y=400, x=400-530
        
        // Mid section droppers
        { type: 'dropper', x: 900, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 80, meltProgress: 0, health: 2 },     // Platform y=400, x=850-990
        { type: 'dropper', x: 1000, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 120, meltProgress: 0 },   // Platform y=550, x=950-1060
        { type: 'dropper', x: 1320, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 160, meltProgress: 0 },   // Platform y=600, x=1250-1430
        
        // Late section droppers
        { type: 'dropper', x: 1420, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 200, meltProgress: 0 },   // Platform y=400, x=1350-1480
        { type: 'dropper', x: 2000, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 240, meltProgress: 0 },   // Platform y=400, x=1950-2080
        { type: 'dropper', x: 2400, y: 0, width: 30, height: 35, velocityY: 0, falling: true, landed: false, alive: true, pulse: 0, despawnTimer: 0, spawnDelay: 280, meltProgress: 0 },   // Platform y=300, x=2300-2430
        
        // FLAME GOLEMS - 4 total, patrolling different platforms (none overlap with droppers)
        { type: 'golem', x: 700, y: 460, width: 35, height: 140, facingDirection: 1, turnTimer: 0, alive: true, speed: 0.6, patrolStart: 670, patrolEnd: 820 },      // Platform y=600, x=650-840
        { type: 'golem', x: 1230, y: 360, width: 35, height: 140, facingDirection: -1, turnTimer: 0, alive: true, speed: 0.65, patrolStart: 1170, patrolEnd: 1290 }, // Platform y=500, x=1150-1310
        { type: 'golem', x: 1600, y: 410, width: 35, height: 140, facingDirection: 1, turnTimer: 0, alive: true, speed: 0.55, patrolStart: 1570, patrolEnd: 1620 },  // Platform y=550, x=1550-1640 (stepping stone)
        { type: 'golem', x: 2250, y: 360, width: 35, height: 140, facingDirection: -1, turnTimer: 0, alive: true, speed: 0.6, patrolStart: 2220, patrolEnd: 2330 }   // Platform y=500, x=2200-2350
      ],
      portal: { x: 2500, y: 600, width: 60, height: 80 },
      boss: {
        name: 'The Guardian',
        type: 'eye',
        health: 150,
        attackInterval: 100,
        projectileCount: 4,  // 4 seeking projectiles
        teleportInterval: 80,
        // Demon Eye: Large orange/red eye with multiple writhing tentacles and smaller eyes
        // Attack: 4 seeking projectiles that gently home in on player
      }
    },
    
    3: {
      name: "Crystal Caverns",
      theme: {
        background: '#0a0520',
        platformColors: {
          glow: '#8800ff',
          gradientTop: '#4a2a6a',
          gradientMid: '#3a1a5a',
          gradientBottom: '#1a0a2a',
          veinColor: '#aa00ff'
        },
        orbColor: { glow: '#ff8800', core: '#ffaa00' }
      },
      platforms: [
        // INDEPENDENT from Levels 1 & 2 - Crystal Caverns layout
        // Solid floor - no gaps (y=700)
        { x: 0, y: 700, width: 2600, height: 20 },
        
        // Solid ceiling platform (y=0) - raised to allow jumping from y=200 platforms
        { x: 0, y: 0, width: 2600, height: 20 },
        
        // Low-mid platforms (y=600)
        { x: 150, y: 600, width: 160, height: 15, hasPhaseShift: true }, 
        { x: 550, y: 600, width: 200, height: 15 }, 
        { x: 1100, y: 600, width: 170, height: 15 },
        { x: 1550, y: 600, width: 180, height: 15, hasPhaseShift: true },
        { x: 2000, y: 600, width: 190, height: 15 },
        
        // Mid-level platforms (y=500)
        { x: 400, y: 500, width: 150, height: 15, hasPhaseShift: true }, 
        { x: 850, y: 500, width: 170, height: 15 },
        { x: 1400, y: 500, width: 160, height: 15 },
        { x: 1900, y: 500, width: 150, height: 15, hasPhaseShift: true },
        
        // Mid-high platforms (y=400)
        { x: 200, y: 400, width: 140, height: 15 },
        { x: 650, y: 400, width: 150, height: 15, hasPhaseShift: true },
        { x: 1050, y: 400, width: 130, height: 15 },
        { x: 1650, y: 400, width: 140, height: 15 },
        { x: 2150, y: 400, width: 130, height: 15, hasPhaseShift: true },
        
        // High platforms (y=300)
        { x: 350, y: 300, width: 120, height: 15, hasPhaseShift: true },
        { x: 800, y: 300, width: 130, height: 15 },
        { x: 1200, y: 300, width: 140, height: 15 },
        { x: 1750, y: 300, width: 120, height: 15, hasPhaseShift: true },
        { x: 2250, y: 300, width: 130, height: 15 },
        
        // Stepping stones (y=550)
        { x: 750, y: 550, width: 100, height: 15, hasPhaseShift: true },
        { x: 1700, y: 550, width: 90, height: 15 },
        
        // Upper platforms near ceiling (y=200)
        { x: 500, y: 200, width: 130, height: 15, hasPhaseShift: true },
        { x: 950, y: 200, width: 140, height: 15 },
        { x: 1450, y: 200, width: 120, height: 15 },
        { x: 2000, y: 200, width: 130, height: 15, hasPhaseShift: true }
      ],
      energyOrbs: [
        // Placeholder positions for Level 3
        { x: 600, y: 650 },
        { x: 1300, y: 650 },
        { x: 450, y: 550 },
        { x: 1950, y: 550 },
        { x: 750, y: 450 },
        { x: 1800, y: 450 },
        { x: 400, y: 350 },
        { x: 1100, y: 350 },
        { x: 2200, y: 350 },
        { x: 850, y: 250 },
        { x: 1750, y: 250 }
      ],
      enemies: [
        // Void Slugs - ground enemies with inchworm motion (spread across level)
        // Ground level (y=700): 3 slugs distributed early/mid/late
        { type: 'slug', x: 500, y: 675, baseY: 675, width: 50, height: 18, direction: 1, speed: 2.4, alive: true, inchwormPhase: 0, segments: 4, extended: false },
        { type: 'slug', x: 1250, y: 675, baseY: 675, width: 50, height: 18, direction: -1, speed: 2.4, alive: true, inchwormPhase: 60, segments: 4, extended: false },
        { type: 'slug', x: 2300, y: 675, baseY: 675, width: 50, height: 18, direction: 1, speed: 2.4, alive: true, inchwormPhase: 120, segments: 4, extended: false },
        
        // Higher platform slugs (hovering above platforms, hittable from same level only)
        // 7 elevated slugs distributed across level width (1 per row)
        // Row y=600 (slug y=575) - early section
        { type: 'slug', x: 650, y: 575, baseY: 575, width: 50, height: 18, direction: 1, speed: 2.4, alive: true, inchwormPhase: 20, segments: 4, extended: false },
        
        // Row y=550 (slug y=525) - late section
        { type: 'slug', x: 1745, y: 525, baseY: 525, width: 50, height: 18, direction: -1, speed: 2.4, alive: true, inchwormPhase: 40, segments: 4, extended: false },
        
        // Row y=500 (slug y=475) - mid section
        { type: 'slug', x: 935, y: 475, baseY: 475, width: 50, height: 18, direction: 1, speed: 2.4, alive: true, inchwormPhase: 60, segments: 4, extended: false },
        
        // Row y=400 (slug y=375) - late section
        { type: 'slug', x: 1720, y: 375, baseY: 375, width: 50, height: 18, direction: -1, speed: 2.4, alive: true, inchwormPhase: 80, segments: 4, extended: false },
        
        // Row y=300 (slug y=275) - mid section
        { type: 'slug', x: 1270, y: 275, baseY: 275, width: 50, height: 18, direction: 1, speed: 2.4, alive: true, inchwormPhase: 100, segments: 4, extended: false },
        
        // Row y=200 (slug y=175) - early section
        { type: 'slug', x: 565, y: 175, baseY: 175, width: 50, height: 18, direction: -1, speed: 2.4, alive: true, inchwormPhase: 120, segments: 4, extended: false },
        
        // Row y=200 (slug y=175) - late section
        { type: 'slug', x: 2065, y: 175, baseY: 175, width: 50, height: 18, direction: 1, speed: 2.4, alive: true, inchwormPhase: 140, segments: 4, extended: false },
        
        // Crystal Spiders - hanging from ceiling (health: 40 = 4 hits, staggered attack timing)
        { type: 'spider', x: 600, width: 40, height: 35, threadLength: 100, baseThreadLength: 100, bobOffset: 0, rotation: 0, attackTimer: 0, projectiles: [], alive: true, health: 40 },
        { type: 'spider', x: 1200, width: 40, height: 35, threadLength: 120, baseThreadLength: 120, bobOffset: 0, rotation: 0, attackTimer: 80, projectiles: [], alive: true, health: 40 },
        { type: 'spider', x: 1600, width: 40, height: 35, threadLength: 105, baseThreadLength: 105, bobOffset: 0, rotation: 0, attackTimer: 160, projectiles: [], alive: true, health: 40 },
        { type: 'spider', x: 2000, width: 40, height: 35, threadLength: 110, baseThreadLength: 110, bobOffset: 0, rotation: 0, attackTimer: 240, projectiles: [], alive: true, health: 40 }
      ],
      portal: { x: 2500, y: 600, width: 60, height: 80 },
      boss: {
        name: 'Arachnis',
        type: 'spider',
        health: 200,
        attackInterval: 90,
        projectileCount: 0, // Spawns minions instead
        teleportInterval: 70,
        // TODO: Crawls on ceiling/walls, spawns smaller spiders
      }
    },
    
    4: {
      name: "Frozen Tundra",
      theme: {
        background: '#0a0f1a',
        platformColors: {
          glow: '#aaffff',
          gradientTop: '#5a6a7a',
          gradientMid: '#4a5a6a',
          gradientBottom: '#2a3a4a',
          veinColor: '#00ddff'
        },
        orbColor: { glow: '#ff8800', core: '#ffaa00' }
      },
      platforms: [
        // INDEPENDENT from Levels 1, 2, & 3 - Frozen Tundra layout
        // Solid floor - no gaps (y=700)
        { x: 0, y: 700, width: 2600, height: 20 },
        
        // Solid ceiling platform (y=0) - raised to allow jumping from y=200 platforms
        { x: 0, y: 0, width: 2600, height: 20 },
        
        // Low-mid platforms (y=600)
        { x: 100, y: 600, width: 170, height: 15, hasPhaseShift: true }, 
        { x: 600, y: 600, width: 190, height: 15 }, 
        { x: 1150, y: 600, width: 180, height: 15 },
        { x: 1600, y: 600, width: 170, height: 15, hasPhaseShift: true },
        { x: 2050, y: 600, width: 200, height: 15 },
        
        // Mid-level platforms (y=500)
        { x: 350, y: 500, width: 160, height: 15, hasPhaseShift: true }, 
        { x: 800, y: 500, width: 180, height: 15 },
        { x: 1350, y: 500, width: 170, height: 15 },
        { x: 1850, y: 500, width: 160, height: 15, hasPhaseShift: true },
        
        // Mid-high platforms (y=400)
        { x: 250, y: 400, width: 130, height: 15 },
        { x: 700, y: 400, width: 140, height: 15, hasPhaseShift: true },
        { x: 1100, y: 400, width: 150, height: 15 },
        { x: 1600, y: 400, width: 130, height: 15 },
        { x: 2100, y: 400, width: 140, height: 15, hasPhaseShift: true },
        
        // High platforms (y=300)
        { x: 400, y: 300, width: 130, height: 15, hasPhaseShift: true },
        { x: 850, y: 300, width: 120, height: 15 },
        { x: 1250, y: 300, width: 130, height: 15 },
        { x: 1700, y: 300, width: 140, height: 15, hasPhaseShift: true },
        { x: 2200, y: 300, width: 120, height: 15 },
        
        // Stepping stones (y=550)
        { x: 800, y: 550, width: 90, height: 15, hasPhaseShift: true },
        { x: 1750, y: 550, width: 100, height: 15 },
        
        // Upper platforms near ceiling (y=200)
        { x: 550, y: 200, width: 140, height: 15, hasPhaseShift: true },
        { x: 1000, y: 200, width: 130, height: 15 },
        { x: 1500, y: 200, width: 120, height: 15 },
        { x: 1950, y: 200, width: 140, height: 15, hasPhaseShift: true }
      ],
      energyOrbs: [
        // Placeholder positions for Level 4
        { x: 700, y: 650 },
        { x: 1400, y: 650 },
        { x: 500, y: 550 },
        { x: 2000, y: 550 },
        { x: 800, y: 450 },
        { x: 1750, y: 450 },
        { x: 450, y: 350 },
        { x: 1150, y: 350 },
        { x: 2150, y: 350 },
        { x: 900, y: 250 },
        { x: 1700, y: 250 }
      ],
      enemies: [
        // Shadow Wraiths - Geometric Shard type
        // Ground level wraiths
        { type: 'wraith', x: 350, y: 645, baseY: 645, width: 40, height: 40, direction: -1, speed: 0.8, patrolStart: 250, patrolEnd: 500, alive: true, pulse: 0, shardRotation: 0, health: 2 },
        { type: 'wraith', x: 950, y: 645, baseY: 645, width: 40, height: 40, direction: 1, speed: 0.85, patrolStart: 850, patrolEnd: 1100, alive: true, pulse: 0, shardRotation: 0, health: 2 },
        { type: 'wraith', x: 1850, y: 645, baseY: 645, width: 40, height: 40, direction: -1, speed: 0.8, patrolStart: 1750, patrolEnd: 2000, alive: true, pulse: 0, shardRotation: 0, health: 2 },
        
        // Mid-air wraiths
        { type: 'wraith', x: 650, y: 450, baseY: 450, width: 40, height: 40, direction: 1, speed: 0.7, patrolStart: 620, patrolEnd: 780, alive: true, pulse: 0, shardRotation: 0, verticalOffset: 0, health: 2 },
        { type: 'wraith', x: 1250, y: 350, baseY: 350, width: 40, height: 40, direction: -1, speed: 0.75, patrolStart: 1120, patrolEnd: 1360, alive: true, pulse: 0, shardRotation: 0, verticalOffset: 0, health: 2 },
        { type: 'wraith', x: 2050, y: 450, baseY: 450, width: 40, height: 40, direction: 1, speed: 0.7, patrolStart: 1970, patrolEnd: 2180, alive: true, pulse: 0, shardRotation: 0, verticalOffset: 0, health: 2 },
        
        // Hooded Figures - stationary, appear/disappear
        { type: 'hooded', x: 150, y: 550, width: 32, height: 50, phaseTimer: 0, phaseState: 'visible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 0, health: 2 },
        { type: 'hooded', x: 450, y: 350, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 40, health: 2 },
        { type: 'hooded', x: 875, y: 450, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 80, health: 2 },
        { type: 'hooded', x: 1175, y: 350, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 120, health: 2 },
        { type: 'hooded', x: 1375, y: 450, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 160, health: 2 },
        { type: 'hooded', x: 1675, y: 350, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 200, health: 2 },
        { type: 'hooded', x: 1775, y: 250, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 240, health: 2 },
        { type: 'hooded', x: 2250, y: 250, width: 32, height: 50, phaseTimer: 0, phaseState: 'invisible', visibleDuration: 180, invisibleDuration: 120, spawnDelay: 280, health: 2 }
      ],
      portal: { x: 2500, y: 600, width: 60, height: 80 },
      boss: {
        name: 'Frostbane',
        type: 'demon',
        health: 250,
        attackInterval: 80,
        projectileCount: 16, // 4 arms × 4 projectiles each
        teleportInterval: 60,
        // Demon Lord: Massive 4-armed demon, hitbox is chest orb only
      }
    }
  };

  const restartGame = () => {
    setGameState('playing');
    setEnergy(0);
    setHealth(100);
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    setBossHealth(levelConfig.boss.health);
    setRestartTrigger(prev => prev + 1);
  };

  const startGame = () => {
    setCurrentLevel(selectedStartLevel);
    setEnergy(0);
    setHealth(100);
    const levelConfig = LEVEL_CONFIGS[selectedStartLevel];
    setBossHealth(levelConfig.boss.health);
    setGameState('playing');
    setRestartTrigger(prev => prev + 1);
  };

  // Handle space key on menu screen
  useEffect(() => {
    const handleMenuKey = (e) => {
      if (gameState === 'menu' && e.key === ' ') {
        e.preventDefault();
        startGame();
      }
    };
    
    window.addEventListener('keydown', handleMenuKey);
    return () => window.removeEventListener('keydown', handleMenuKey);
  }, [gameState, selectedStartLevel]);

  const loadNextLevel = () => {
    const nextLevel = currentLevel + 1;
    if (nextLevel <= 4) {
      setCurrentLevel(nextLevel);
      setEnergy(0);
      setHealth(100);
      const levelConfig = LEVEL_CONFIGS[nextLevel];
      setBossHealth(levelConfig.boss.health);
      setGameState('playing');
      setRestartTrigger(prev => prev + 1);
    } else {
      // All levels complete - show final victory
      setGameState('gameComplete');
    }
  };

  // Animate splash screen character
  useEffect(() => {
    if (gameState !== 'menu' || !splashCanvasRef.current) return;
    
    const canvas = splashCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const scale = 6;
    const baseX = 75;
    const baseY = 60;
    
    const drawCharacter = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const x = baseX;
      const y = baseY;
      
      // DESIGN F: HYBRID CYBER-KNIGHT
      const coreColor = '#00ffff';
      
      // Legs
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 10*scale, y + 39*scale, 4*scale, 21*scale);
      ctx.fillRect(x + 16*scale, y + 39*scale, 4*scale, 21*scale);
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x + 11*scale, y + 48*scale, 2*scale, 8*scale);
      ctx.fillRect(x + 17*scale, y + 48*scale, 2*scale, 8*scale);
      ctx.globalAlpha = 1;
      
      // Body
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(x + 8*scale, y + 14*scale, 14*scale, 25*scale);
      
      // Chest energy core
      ctx.fillStyle = coreColor;
      ctx.fillRect(x + 13*scale, y + 19*scale, 4*scale, 16*scale);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x + 12*scale, y + 20*scale, 6*scale, 14*scale);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x + 15*scale, y + 27*scale, 3*scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Side panels
      ctx.fillStyle = '#1a3050';
      ctx.fillRect(x + 9*scale, y + 20*scale, 3*scale, 15*scale);
      ctx.fillRect(x + 18*scale, y + 20*scale, 3*scale, 15*scale);
      
      // Shoulders
      ctx.beginPath();
      ctx.moveTo(x + 7*scale, y + 17*scale);
      ctx.lineTo(x + 5*scale, y + 19*scale);
      ctx.lineTo(x + 6*scale, y + 28*scale);
      ctx.lineTo(x + 8*scale, y + 28*scale);
      ctx.closePath();
      ctx.fillStyle = '#1a4060';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 23*scale, y + 17*scale);
      ctx.lineTo(x + 25*scale, y + 19*scale);
      ctx.lineTo(x + 24*scale, y + 28*scale);
      ctx.lineTo(x + 22*scale, y + 28*scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x + 5*scale, y + 19*scale, 2*scale, 6*scale);
      ctx.fillRect(x + 23*scale, y + 19*scale, 2*scale, 6*scale);
      ctx.globalAlpha = 1;
      
      // Arms
      ctx.fillStyle = '#0a2a3a';
      ctx.fillRect(x + 5*scale, y + 26*scale, 3*scale, 14*scale);
      ctx.fillRect(x + 22*scale, y + 26*scale, 3*scale, 14*scale);
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x + 6*scale, y + 28*scale, 1*scale, 10*scale);
      ctx.fillRect(x + 23*scale, y + 28*scale, 1*scale, 10*scale);
      ctx.globalAlpha = 1;
      
      // Helmet
      ctx.shadowBlur = 20 * scale;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(x + 10*scale, y + 2*scale, 10*scale, 16*scale);
      ctx.fillStyle = '#1a3050';
      ctx.beginPath();
      ctx.moveTo(x + 10*scale, y + 2*scale);
      ctx.lineTo(x + 12*scale, y);
      ctx.lineTo(x + 18*scale, y);
      ctx.lineTo(x + 20*scale, y + 2*scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x + 14*scale, y, 2*scale, 3*scale);
      ctx.globalAlpha = 1;
      
      // Visor
      ctx.shadowBlur = 15 * scale;
      ctx.shadowColor = coreColor;
      ctx.fillStyle = coreColor;
      ctx.fillRect(x + 11*scale, y + 8*scale, 8*scale, 5*scale);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x + 10*scale, y + 7*scale, 10*scale, 7*scale);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 12*scale, y + 9*scale, 6*scale, 2*scale);
      
      // Energy Spear (facing RIGHT)
      ctx.shadowBlur = 10 * scale;
      ctx.shadowColor = coreColor;
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(x + 27*scale, y + 27*scale, 2*scale, 21*scale);
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.moveTo(x + 28*scale, y + 24*scale);
      ctx.lineTo(x + 25*scale, y + 27*scale);
      ctx.lineTo(x + 31*scale, y + 27*scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 27*scale, y + 25*scale, 2*scale, 4*scale);
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(x + 28*scale, y + 41*scale, 1.5*scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    };
    
    let animationFrameId;
    const animate = () => {
      drawCharacter();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get current level configuration
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    
    // Store energy in a way that persists across renders
    let currentEnergy = 0;
    const updateEnergy = (value) => {
      currentEnergy = value;
      setEnergy(value);
    };
    
    // Generate stars for parallax background
    const generateStars = (count, speedFactor, sizeRange) => {
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * 3000,
          y: Math.random() * 800,
          size: Math.random() * sizeRange[1] + sizeRange[0],
          brightness: Math.random() * 0.5 + 0.5,
          speedFactor
        });
      }
      return stars;
    };

    const game = {
      player: { x: 100, y: 620, width: 30, height: 60, velocityY: 0, velocityX: 0, isJumping: false, isAttacking: false, attackTimer: 0, health: 100, invulnerableTimer: 0, facingDirection: 1, speedBoostTimer: 0, frozenTimer: 0, freezeCooldown: 0 },
      companion: { active: false, timer: 0, x: 100, y: 620, projectiles: [], fireTimer: 0 },
      keys: {},
      starLayers: [
        generateStars(100, 0.1, [0.5, 1]),    // Far layer - slow, small stars
        generateStars(75, 0.3, [1, 1.5]),     // Mid layer - medium stars
        generateStars(50, 0.5, [1.5, 2])      // Near layer - faster, larger stars
      ],
      platforms: levelConfig.platforms,
      energyOrbs: levelConfig.energyOrbs.map(orb => ({ ...orb, collected: false, pulse: 0 })),
      energyDrops: [],
      enemies: levelConfig.enemies.map(enemy => ({ ...enemy, alive: true })),
      portal: { ...levelConfig.portal, pulse: 0, active: true },
      boss: { 
        active: false, defeated: false, x: 640, y: 200, width: 80, height: 100, 
        health: levelConfig.boss.health, 
        attackTimer: 0, moveTimer: 0, projectiles: [], invulnerableTimer: 0, pulse: 0, 
        teleportState: 'idle', teleportTimer: 0, targetX: 640, targetY: 200,
        type: levelConfig.boss.type,
        burstActive: false, burstCount: 0, burstTimer: 0
      },
      camera: { x: 0 }, levelWidth: 2600, gravity: 0.6, jumpPower: -13, moveSpeed: 5, platformPhaseTimer: 0
    };

    const checkCollision = (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;

    const handleKeyDown = (e) => {
      game.keys[e.key] = true;
      // Disable jump and attack when frozen
      if ((e.key === ' ' || e.key === 'ArrowUp') && !game.player.isJumping && game.player.frozenTimer === 0) {
        game.player.velocityY = game.jumpPower;
        game.player.isJumping = true;
      }
      if ((e.key === 'f' || e.key === 'F') && game.player.frozenTimer === 0) {
        game.player.isAttacking = true;
        game.player.attackTimer = 15;
      }
      if (e.key === 'h' || e.key === 'H') {
        if (currentEnergy >= 2 && game.player.health < 100) {
          updateEnergy(currentEnergy - 2);
          game.player.health = Math.min(100, game.player.health + 25);
          setHealth(game.player.health);
        }
      }
      if (e.key === 's' || e.key === 'S') {
        if (currentEnergy >= 2 && game.player.speedBoostTimer === 0) {
          updateEnergy(currentEnergy - 2);
          game.player.speedBoostTimer = 600;
        }
      }
      if (e.key === 'c' || e.key === 'C') {
        if (currentEnergy >= 5 && !game.companion.active) {
          updateEnergy(currentEnergy - 5);
          game.companion.active = true;
          game.companion.timer = 600;
          game.companion.x = game.player.x;
          game.companion.y = game.player.y;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', (e) => game.keys[e.key] = false);

    // Helper function for drawing hexagons
    const drawHexagon = (ctx, x, y, size) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Create cached platform textures for performance
    const platformCache = new Map();
    const createPlatformTexture = (width, height, colors) => {
      const cacheKey = `${width}x${height}-${colors.gradientTop}`;
      if (platformCache.has(cacheKey)) {
        return platformCache.get(cacheKey);
      }

      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext('2d');

      // Draw gradient
      const gradient = offCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, colors.gradientTop);
      gradient.addColorStop(0.5, colors.gradientMid);
      gradient.addColorStop(1, colors.gradientBottom);
      offCtx.fillStyle = gradient;
      offCtx.fillRect(0, 0, width, height);

      // Draw hexagonal pattern
      offCtx.fillStyle = 'rgba(0, 200, 255, 0.15)';
      const hexSize = 6;
      const hexSpacing = hexSize * 1.8;
      for (let hx = 0; hx < width; hx += hexSpacing) {
        for (let hy = 5; hy < height; hy += hexSpacing * 0.87) {
          const offsetX = (Math.floor((hy) / (hexSpacing * 0.87)) % 2) * (hexSpacing / 2);
          drawHexagon(offCtx, hx + offsetX, hy, hexSize);
        }
      }

      platformCache.set(cacheKey, offCanvas);
      return offCanvas;
    };

    // Create cached spider body (100x100 canvas centered at 50,50)
    const createSpiderCache = () => {
      const spiderCanvas = document.createElement('canvas');
      spiderCanvas.width = 100;
      spiderCanvas.height = 100;
      const sCtx = spiderCanvas.getContext('2d');
      
      // Center at 50,50
      sCtx.translate(50, 50);
      
      // Legs - crystalline spikes
      sCtx.strokeStyle = '#8800ff';
      sCtx.lineWidth = 3;
      sCtx.shadowBlur = 8;
      sCtx.shadowColor = '#aa00ff';
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const length = 35;
        
        sCtx.beginPath();
        sCtx.moveTo(0, 0);
        sCtx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        sCtx.stroke();
        
        // Leg tips
        sCtx.fillStyle = '#aa55ff';
        sCtx.beginPath();
        sCtx.arc(Math.cos(angle) * length, Math.sin(angle) * length, 3, 0, Math.PI * 2);
        sCtx.fill();
      }
      
      // Main body - faceted gem
      sCtx.shadowBlur = 30;
      sCtx.shadowColor = '#aa00ff';
      
      // Draw facets
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const nextAngle = ((i + 1) / 6) * Math.PI * 2;
        
        const brightness = 0.9;
        sCtx.fillStyle = `rgba(${Math.floor(170 * brightness)}, 0, ${Math.floor(255 * brightness)}, 0.9)`;
        
        sCtx.beginPath();
        sCtx.moveTo(0, 0);
        sCtx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 17);
        sCtx.lineTo(Math.cos(nextAngle) * 20, Math.sin(nextAngle) * 17);
        sCtx.closePath();
        sCtx.fill();
        
        sCtx.strokeStyle = '#ff00ff';
        sCtx.lineWidth = 1;
        sCtx.stroke();
      }
      
      // Center gem
      sCtx.fillStyle = '#ff00ff';
      sCtx.shadowBlur = 20;
      sCtx.beginPath();
      sCtx.arc(0, 0, 8, 0, Math.PI * 2);
      sCtx.fill();
      
      // Multiple glowing eyes
      sCtx.fillStyle = '#ffaaff';
      sCtx.shadowBlur = 15;
      sCtx.shadowColor = '#ff00ff';
      for (let i = 0; i < 5; i++) {
        const eyeAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const eyeDist = 12;
        sCtx.beginPath();
        sCtx.arc(Math.cos(eyeAngle) * eyeDist, Math.sin(eyeAngle) * eyeDist, 2.5, 0, Math.PI * 2);
        sCtx.fill();
      }
      
      sCtx.shadowBlur = 0;
      
      return spiderCanvas;
    };
    
    const spiderBodyCache = createSpiderCache();
    
    // Create cached slug rendering for different extension states
    const createSlugCache = (extensionFactor) => {
      const slugCanvas = document.createElement('canvas');
      slugCanvas.width = 60;
      slugCanvas.height = 30;
      const sCtx = slugCanvas.getContext('2d');
      
      const segments = 4;
      const baseSegmentSize = 8.75;
      const segmentSpacing = baseSegmentSize + (extensionFactor * 3.75);
      
      sCtx.translate(10, 15); // Center vertically
      
      // Draw segments back to front
      for (let i = segments - 1; i >= 0; i--) {
        const segX = i * segmentSpacing;
        const segY = 0;
        
        // Energy ring (static - no pulse for cache)
        const ringSize = 9;
        sCtx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        sCtx.lineWidth = 2;
        sCtx.shadowBlur = 12;
        sCtx.shadowColor = '#00ffff';
        sCtx.beginPath();
        sCtx.arc(segX, segY, ringSize, 0, Math.PI * 2);
        sCtx.stroke();
        
        // Body membrane
        sCtx.fillStyle = 'rgba(30, 30, 60, 0.7)';
        sCtx.shadowBlur = 8;
        sCtx.beginPath();
        sCtx.arc(segX, segY, 7, 0, Math.PI * 2);
        sCtx.fill();
        
        // Core
        sCtx.fillStyle = 'rgba(0, 100, 150, 0.8)';
        sCtx.shadowBlur = 10;
        sCtx.beginPath();
        sCtx.arc(segX, segY, 4, 0, Math.PI * 2);
        sCtx.fill();
      }
      
      // Head tendrils
      const headX = 0;
      sCtx.strokeStyle = '#00ffff';
      sCtx.lineWidth = 1;
      sCtx.shadowBlur = 8;
      sCtx.beginPath();
      sCtx.moveTo(headX, -4);
      sCtx.lineTo(headX - 5, -8);
      sCtx.stroke();
      sCtx.beginPath();
      sCtx.moveTo(headX, 4);
      sCtx.lineTo(headX - 5, 8);
      sCtx.stroke();
      
      return slugCanvas;
    };
    
    // Pre-cache 4 extension states: compressed, 1/3, 2/3, extended
    const slugCaches = [
      createSlugCache(0),
      createSlugCache(0.33),
      createSlugCache(0.67),
      createSlugCache(1.0)
    ];

    let animationFrameId;

    const gameLoop = () => {
      const player = game.player;
      const comp = game.companion;

      // Player movement - disabled when frozen
      if (player.frozenTimer > 0) {
        player.velocityX *= 0.9; // Slow down but don't stop instantly
        player.frozenTimer--;
        // Start cooldown when freeze expires
        if (player.frozenTimer === 0) {
          player.freezeCooldown = 60; // 1 second immunity
        }
      } else {
        const spd = player.speedBoostTimer > 0 ? game.moveSpeed * 2 : game.moveSpeed;
        if (game.keys['ArrowLeft'] || game.keys['a']) { player.velocityX = -spd; player.facingDirection = -1; }
        else if (game.keys['ArrowRight'] || game.keys['d']) { player.velocityX = spd; player.facingDirection = 1; }
        else player.velocityX *= 0.8;
      }

      player.x += player.velocityX;
      player.velocityY += game.gravity;
      player.y += player.velocityY;

      // Level boundaries - always enforce
      if (game.boss.active) {
        // Boss battle: confined to screen
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > 1280) player.x = 1280 - player.width;
      } else {
        // Normal level: left edge at 0, right edge at portal
        if (player.x < 0) player.x = 0;
        const rightBoundary = game.portal.x + game.portal.width;
        if (player.x + player.width > rightBoundary) player.x = rightBoundary - player.width;
      }

      if (player.y > 900) { player.y = -50; player.velocityY = 0; }
      game.camera.x = Math.max(0, Math.min(player.x - 640, game.levelWidth - 1280));

      const plats = game.boss.active ? 
        [
          // Solid ceiling (Level 4 style)
          { x: 0, y: 0, width: 1280, height: 20 },
          
          // Solid ground - no gaps
          { x: 0, y: 700, width: 1280, height: 20 },
          
          // Layer 1 - Low platforms (y=600) - all fading
          { x: 100, y: 600, width: 180, height: 15, hasPhaseShift: true },
          { x: 400, y: 600, width: 200, height: 15, hasPhaseShift: true },
          { x: 750, y: 600, width: 200, height: 15, hasPhaseShift: true },
          { x: 1000, y: 600, width: 180, height: 15, hasPhaseShift: true },
          
          // Layer 2 - Mid-low platforms (y=500) - all fading
          { x: 200, y: 500, width: 160, height: 15, hasPhaseShift: true },
          { x: 550, y: 500, width: 180, height: 15, hasPhaseShift: true },
          { x: 850, y: 500, width: 180, height: 15, hasPhaseShift: true },
          
          // Layer 3 - Mid-high platforms (y=400) - all fading
          { x: 150, y: 400, width: 140, height: 15, hasPhaseShift: true },
          { x: 450, y: 400, width: 150, height: 15, hasPhaseShift: true },
          { x: 680, y: 400, width: 150, height: 15, hasPhaseShift: true },
          { x: 950, y: 400, width: 140, height: 15, hasPhaseShift: true },
          
          // Layer 4 - High platforms (y=300) - all fading
          { x: 300, y: 300, width: 120, height: 15, hasPhaseShift: true },
          { x: 560, y: 300, width: 140, height: 15, hasPhaseShift: true },
          { x: 840, y: 300, width: 120, height: 15, hasPhaseShift: true }
        ] : game.platforms;
        
      plats.forEach(p => {
        if (checkCollision(player, p) && player.velocityY > 0 && player.y + 60 - player.velocityY <= p.y) {
          player.y = p.y - 60;
          player.velocityY = 0;
          player.isJumping = false;
        }
      });
      
      // Ceiling collision - only block ceiling platform (y=0), not mid-level platforms
      plats.forEach(p => {
        if (p.y < 50 && checkCollision(player, p) && player.velocityY < 0 && player.y + player.velocityY <= p.y + p.height) {
          player.y = p.y + p.height;
          player.velocityY = 0;
        }
      });
      
      // Golem solid collision - prevent player from walking through
      game.enemies.forEach(e => {
        if (e.alive && e.type === 'golem') {
          if (checkCollision(player, e)) {
            // Push player out based on collision side
            const playerCenterX = player.x + player.width / 2;
            const golemCenterX = e.x + e.width / 2;
            
            if (playerCenterX < golemCenterX) {
              // Player on left side, push left
              player.x = e.x - player.width;
            } else {
              // Player on right side, push right
              player.x = e.x + e.width;
            }
            player.velocityX = 0;
          }
        }
      });

      let col = 0;
      game.energyOrbs.forEach(orb => {
        if (!orb.collected) {
          orb.pulse += 0.1;
          if (checkCollision(player, { x: orb.x - 8, y: orb.y - 8, width: 16, height: 16 })) {
            orb.collected = true;
            col++;
          }
        }
      });

      game.enemies.forEach(e => {
        if (e.alive) {
          if (e.type === 'drifter') {
            e.x += e.direction * e.speed;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.direction *= -1;
            e.y = e.baseY + Math.sin(Date.now() * 0.003 + e.x) * 2;
          } else if (e.type === 'slug') {
            // Void Slug with inchworm motion - skip during boss battle
            if (game.boss.active) {
              // Don't update slugs during boss battle (they're not rendered anyway)
              return;
            }
            
            e.inchwormPhase += 1;
            
            // Inchworm cycle: 0-60 = extend, 60-80 = pause, 80-140 = compress, 140-160 = pause
            const cycle = e.inchwormPhase % 160;
            
            // Calculate extension factor (0 to 1)
            let extensionFactor = 0;
            if (cycle < 60) {
              // Extending
              extensionFactor = cycle / 60;
              e.extended = true;
            } else if (cycle < 80) {
              // Extended pause
              extensionFactor = 1;
              e.extended = true;
            } else if (cycle < 140) {
              // Compressing
              extensionFactor = 1 - ((cycle - 80) / 60);
              e.extended = false;
            } else {
              // Compressed pause
              extensionFactor = 0;
              e.extended = false;
            }
            
            // Move only when extended
            if (e.extended) {
              // Track player slowly
              const dx = player.x - e.x;
              if (Math.abs(dx) > 50) {
                e.direction = dx > 0 ? 1 : -1;
              }
              
              // Find the platform slug is on (using main level platforms)
              // Slugs hover 25px above their platforms
              let onPlatform = null;
              game.platforms.forEach(p => {
                // Check if slug is positioned above this platform (5-50 pixels above)
                if (e.y >= p.y - 50 && e.y <= p.y - 5) {
                  // Check if slug is horizontally on this platform
                  if (e.x >= p.x - 30 && e.x <= p.x + p.width + 30) {
                    onPlatform = p;
                  }
                }
              });
              
              // Move with platform boundary constraints
              const newX = e.x + e.direction * e.speed * 0.5;
              
              if (onPlatform) {
                // Keep slug within platform boundaries (with 10px margin)
                if (newX >= onPlatform.x + 10 && newX <= onPlatform.x + onPlatform.width - 10) {
                  e.x = newX;
                } else {
                  // Hit platform edge - reverse direction
                  e.direction *= -1;
                }
              } else {
                // No platform detected, allow free movement (failsafe)
                e.x = newX;
              }
            }
            
            // Store extension for rendering
            e.extensionFactor = extensionFactor;
            e.y = e.baseY;
          } else if (e.type === 'dropper') {
            // Dropper falls from ceiling and sticks to first platform
            if (e.spawnDelay > 0) {
              // Wait before starting to fall
              e.spawnDelay--;
            } else if (e.falling && !e.landed) {
              e.velocityY += 0.4; // Gravity
              e.y += e.velocityY;
              e.pulse += 0.15; // Pulsing glow effect
              
              // Check collision with platforms
              game.platforms.forEach(p => {
                if (e.velocityY > 0 && 
                    e.x + e.width > p.x && 
                    e.x < p.x + p.width && 
                    e.y + e.height >= p.y && 
                    e.y + e.height - e.velocityY < p.y) {
                  // Landed on platform
                  e.y = p.y - e.height;
                  e.velocityY = 0;
                  e.falling = false;
                  e.landed = true;
                  e.despawnTimer = 0; // Start despawn countdown
                }
              });
            } else if (e.landed) {
              // Pulsing animation when landed
              e.pulse += 0.08;
              
              // Despawn countdown - 220 frames active + 20 frames melt = 240 total
              e.despawnTimer++;
              if (e.despawnTimer > 240) {
                // Reset to ceiling for respawn
                e.y = 0;
                e.velocityY = 0;
                e.falling = true;
                e.landed = false;
                e.despawnTimer = 0;
                e.pulse = 0;
                e.meltProgress = 0;
              } else if (e.despawnTimer > 220) {
                // Start melting animation (last 20 frames)
                e.meltProgress = (e.despawnTimer - 220) / 20; // 0 to 1
              }
            }
          } else if (e.type === 'golem') {
            // Golem patrols platform and turns periodically
            e.x += e.facingDirection * e.speed;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) {
              e.facingDirection *= -1;
            }
            
            // Periodic turning (visual only - doesn't affect patrol direction)
            e.turnTimer++;
            if (e.turnTimer > 180) { // Turn every 3 seconds
              e.turnTimer = 0;
            }
          } else if (e.type === 'echo') {
            e.x += e.direction * e.speed;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.direction *= -1;
            e.verticalOffset = Math.sin(Date.now() * 0.002 + e.x * 0.1) * 40;
            e.phaseTimer++;
            if (e.phaseState === 'visible' && e.phaseTimer > 120) { e.phaseState = 'fading'; e.phaseTimer = 0; }
            else if (e.phaseState === 'fading' && e.phaseTimer > 30) { e.phaseState = 'invisible'; e.phaseTimer = 0; }
            else if (e.phaseState === 'invisible' && e.phaseTimer > 30) { e.phaseState = 'appearing'; e.phaseTimer = 0; }
            else if (e.phaseState === 'appearing' && e.phaseTimer > 30) { e.phaseState = 'visible'; e.phaseTimer = 0; }
          } else if (e.type === 'wraith') {
            // Shadow Wraith - geometric shard type
            e.x += e.direction * e.speed;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.direction *= -1;
            
            // Vertical offset if specified (floating enemies)
            if (e.verticalOffset !== undefined) {
              e.verticalOffset = Math.sin(Date.now() * 0.002 + e.x * 0.1) * 30;
            } else {
              e.y = e.baseY + Math.sin(Date.now() * 0.003 + e.x) * 2;
            }
            
            // Pulsing core and rotating shards
            e.pulse += 0.02;
            e.shardRotation += 0.02;
          } else if (e.type === 'hooded') {
            // Hooded Figure - stationary, appears and disappears
            if (e.spawnDelay > 0) {
              e.spawnDelay--;
            } else {
              e.phaseTimer++;
              if (e.phaseState === 'appearing' && e.phaseTimer > 30) {
                e.phaseState = 'visible';
                e.phaseTimer = 0;
              } else if (e.phaseState === 'visible' && e.phaseTimer > e.visibleDuration) {
                e.phaseState = 'fading';
                e.phaseTimer = 0;
              } else if (e.phaseState === 'fading' && e.phaseTimer > 30) {
                e.phaseState = 'invisible';
                e.phaseTimer = 0;
              } else if (e.phaseState === 'invisible' && e.phaseTimer > e.invisibleDuration) {
                e.phaseState = 'appearing';
                e.phaseTimer = 0;
              }
            }
          } else if (e.type === 'spider') {
            // Spider hangs from ceiling and rotates slowly
            e.rotation += 0.0005;
            e.bobOffset = Math.sin(Date.now() * 0.001) * 10;
            
            // Lower thread when player is nearby (within 400 pixels horizontally)
            const playerDist = Math.abs(e.x - player.x);
            if (playerDist < 400) {
              // Lower up to 200 pixels additional thread based on proximity
              const lowerAmount = (400 - playerDist) / 2; // 0 to 200 pixels
              e.threadLength = e.baseThreadLength + lowerAmount;
            } else {
              // Retract to base length when player is far
              e.threadLength += (e.baseThreadLength - e.threadLength) * 0.05;
            }
            
            // Spider y position is ceiling (20) + threadLength + bobOffset
            e.y = 20 + e.threadLength + e.bobOffset;
            
            // Fire projectile every 4 seconds
            e.attackTimer++;
            if (e.attackTimer > 240) {
              e.attackTimer = 0;
              // Launch homing projectile toward player
              const dx = (player.x + player.width / 2) - e.x;
              const dy = (player.y + player.height / 2) - e.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              e.projectiles.push({
                x: e.x,
                y: e.y,
                vx: (dx / dist) * 2,
                vy: (dy / dist) * 2,
                lifetime: 300, // 5 seconds at 60fps
                active: true,
                seekSpeed: 0.04 // Homing factor
              });
            }
            
            // Update projectiles
            e.projectiles.forEach(p => {
              if (p.active) {
                p.lifetime--;
                if (p.lifetime <= 0) {
                  p.active = false;
                  return;
                }
                
                // Homing behavior
                const dx = (player.x + player.width / 2) - p.x;
                const dy = (player.y + player.height / 2) - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                  const targetVx = (dx / dist) * 2.5;
                  const targetVy = (dy / dist) * 2.5;
                  p.vx += (targetVx - p.vx) * p.seekSpeed;
                  p.vy += (targetVy - p.vy) * p.seekSpeed;
                }
                
                p.x += p.vx;
                p.y += p.vy;
                
                // Check collision with player
                if (checkCollision(player, { x: p.x - 6, y: p.y - 6, width: 12, height: 12 })) {
                  p.active = false;
                  // Only freeze and damage if cooldown has expired AND player is not already frozen
                  if (player.freezeCooldown === 0 && player.frozenTimer === 0) {
                    player.frozenTimer = 180; // 3 seconds freeze
                    player.health = Math.max(0, player.health - 20);
                    setHealth(player.health);
                  }
                }
              }
            });
          }

          // Collision detection - skip droppers that are spawning or falling
          if (e.type === 'dropper' && (e.spawnDelay > 0 || e.falling)) return;
          if (e.type === 'hooded' && (e.spawnDelay > 0 || e.phaseState === 'invisible')) return;
          
          const eHit = e.type === 'echo' ? { x: e.x, y: e.y + e.verticalOffset, width: e.width, height: e.height } : 
                       e.type === 'wraith' && e.verticalOffset !== undefined ? { x: e.x - e.width/2, y: e.y + e.verticalOffset - e.height/2, width: e.width, height: e.height } :
                       e.type === 'wraith' ? { x: e.x - e.width/2, y: e.y - e.height/2, width: e.width, height: e.height } :
                       e.type === 'spider' ? { x: e.x - e.width/2, y: e.y - e.height/2, width: e.width, height: e.height } : 
                       e.type === 'slug' ? { x: e.x, y: e.y - 9, width: 35 + (e.extensionFactor || 0) * 15, height: 18 } : e;
          if ((e.type === 'drifter' || e.type === 'dropper' || e.type === 'golem' || e.type === 'spider' || e.type === 'slug' || e.type === 'wraith' || e.type === 'hooded' || e.phaseState !== 'invisible') && checkCollision(player, eHit) && player.invulnerableTimer === 0) {
            const damage = (e.type === 'wraith' || e.type === 'hooded' || e.type === 'golem') ? 20 : 10;
            player.health = Math.max(0, player.health - damage);
            player.invulnerableTimer = 90;
            setHealth(player.health);
          }

          if ((e.type === 'drifter' || e.type === 'dropper' || e.type === 'golem' || e.type === 'spider' || e.type === 'slug' || e.type === 'wraith' || e.type === 'hooded' || e.phaseState !== 'invisible') && player.isAttacking && player.attackTimer > 10) {
            const spear = { 
              x: player.facingDirection === 1 ? player.x + 33 : player.x - 40, 
              y: player.y + 18, 
              width: 40, 
              height: 10 
            };
            if (checkCollision(spear, eHit)) {
              // Golem special logic - only vulnerable from behind
              if (e.type === 'golem') {
                // Player attacking from right (player.facingDirection = 1) and golem facing right (e.facingDirection = 1) = back attack
                // Player attacking from left (player.facingDirection = -1) and golem facing left (e.facingDirection = -1) = back attack
                const attackingFromBehind = player.facingDirection === e.facingDirection;
                
                if (attackingFromBehind) {
                  e.alive = false;
                  const ejectDirection = (e.x + 17) > (player.x + 15) ? 1 : -1;
                  game.energyDrops.push({
                    x: e.x + 17, y: e.y + 70, // Drop from center of tall golem
                    velocityY: -3, velocityX: ejectDirection * 1.5, collected: false, pulse: 0, gravity: 0.2, value: 4, collectionDelay: 10
                  });
                }
                // If not from behind, no damage (golem is invulnerable from front)
              } else if (e.type === 'spider' || e.type === 'dropper' || e.type === 'wraith' || e.type === 'hooded') {
                // Multi-hit enemies - reduce health instead of instant death
                e.health -= 10;
                if (e.health <= 0) {
                  e.alive = false;
                  const dropY = e.type === 'wraith' && e.verticalOffset !== undefined ? e.y + e.verticalOffset : e.y;
                  const dropValue = e.type === 'spider' ? 5 : 
                                   e.type === 'dropper' ? 2 :
                                   e.type === 'wraith' ? 3 :
                                   e.type === 'hooded' ? 3 : 2;
                  const ejectDirection = (e.x + 12) > (player.x + 15) ? 1 : -1;
                  game.energyDrops.push({
                    x: e.x + 12, y: dropY + 12,
                    velocityY: -3, velocityX: ejectDirection * 1.5, collected: false, pulse: 0, gravity: 0.2, value: dropValue, collectionDelay: 10
                  });
                }
              } else {
                // Single-hit enemies die normally (drifter, echo, slug)
                e.alive = false;
                const dropY = e.type === 'echo' ? e.y + e.verticalOffset : e.y;
                const dropValue = e.type === 'echo' ? 3 : 2;
                const ejectDirection = (e.x + 12) > (player.x + 15) ? 1 : -1;
                game.energyDrops.push({
                  x: e.x + 12, y: dropY + 12,
                  velocityY: -3, velocityX: ejectDirection * 1.5, collected: false, pulse: 0, gravity: 0.2, value: dropValue, collectionDelay: 10
                });
              }
            }
          }
        }
      });

      if (!game.boss.active) {
        game.energyDrops.forEach(d => {
          if (!d.collected) {
            d.velocityY += d.gravity;
            d.y += d.velocityY;
            d.x += d.velocityX;
            d.pulse += 0.15;
            
            // Decrement collection delay
            if (d.collectionDelay > 0) d.collectionDelay--;
            
            // Respawn from ceiling if falls through floor
            if (d.y > 900) {
              d.y = -20;
              d.velocityY = 0;
            }
            
            if (d.collectionDelay === 0 && checkCollision(player, { x: d.x - 8, y: d.y - 8, width: 16, height: 16 })) {
              d.collected = true;
              col += d.value;
            }
            game.platforms.forEach(p => {
              if (d.velocityY > 0 && checkCollision({ x: d.x - 8, y: d.y - 8, width: 16, height: 16 }, p)) {
                d.velocityY = -2;
              }
            });
          }
        });
      }

      if (col > 0) updateEnergy(currentEnergy + col);

      if (player.attackTimer > 0) player.attackTimer--;
      else player.isAttacking = false;
      if (player.invulnerableTimer > 0) player.invulnerableTimer--;
      if (player.speedBoostTimer > 0) player.speedBoostTimer--;
      if (player.freezeCooldown > 0) player.freezeCooldown--;
      
      game.platformPhaseTimer += 0.05;

      if (!game.boss.active) {
        game.portal.pulse += 0.1;
        if (checkCollision(player, game.portal)) {
          game.boss.active = true;
          setGameState('boss');
          player.x = 300;
          player.y = 620;
          player.velocityY = 0;
          player.velocityX = 0;
        }
      }

      if (comp.active) {
        comp.timer--;
        if (comp.timer <= 0) comp.active = false;

        const tx = player.x + (player.facingDirection === 1 ? 50 : -50);
        const ty = player.y - 30;
        comp.x += (tx - comp.x) * 0.1;
        comp.y += (ty - comp.y) * 0.1;

        comp.fireTimer++;
        if (comp.fireTimer > 30) {
          comp.fireTimer = 0;
          if (game.boss.active && !game.boss.defeated) {
            const dx = game.boss.x + 40 - comp.x;
            const dy = game.boss.y + 50 - comp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            comp.projectiles.push({ x: comp.x, y: comp.y, vx: (dx / dist) * 8, vy: (dy / dist) * 8, active: true });
          } else {
            game.enemies.forEach(e => {
              if (e.alive) {
                const ey = e.type === 'echo' ? e.y + e.verticalOffset : 
                           e.type === 'wraith' && e.verticalOffset !== undefined ? e.y + e.verticalOffset :
                           e.type === 'spider' ? e.y : e.y;
                const dx = e.x - comp.x;
                const dy = ey - comp.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 300) {
                  comp.projectiles.push({ x: comp.x, y: comp.y, vx: (dx / dist) * 8, vy: (dy / dist) * 8, active: true, targetEnemy: e });
                }
              }
            });
          }
        }

        comp.projectiles.forEach(p => {
          if (p.active) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < game.camera.x - 50 || p.x > game.camera.x + 1330 || p.y < -50 || p.y > 900) p.active = false;

            if (!game.boss.active) {
              game.enemies.forEach(e => {
                if (e.alive) {
                  // Skip spawning/falling droppers, golems (immune), and invisible hooded
                  if ((e.type === 'dropper' && (e.spawnDelay > 0 || e.falling)) || e.type === 'golem') return;
                  if (e.type === 'hooded' && (e.spawnDelay > 0 || e.phaseState === 'invisible')) return;
                  
                  const ey = e.type === 'echo' ? e.y + e.verticalOffset : 
                             e.type === 'wraith' && e.verticalOffset !== undefined ? e.y + e.verticalOffset :
                             e.type === 'spider' ? e.y : e.y;
                  const eHitbox = e.type === 'spider' ? { x: e.x - e.width/2, y: e.y - e.height/2, width: e.width, height: e.height } : 
                                  e.type === 'wraith' ? { x: e.x - e.width/2, y: ey - e.height/2, width: e.width, height: e.height } :
                                  e.type === 'slug' ? { x: e.x, y: e.y - 9, width: 35 + (e.extensionFactor || 0) * 15, height: 18 } :
                                  { x: e.x, y: ey, width: e.width, height: e.height };
                  
                  if (checkCollision({ x: p.x - 4, y: p.y - 4, width: 8, height: 8 }, eHitbox)) {
                    p.active = false;
                    
                    if (e.type === 'spider' || e.type === 'dropper' || e.type === 'wraith' || e.type === 'hooded') {
                      // Multi-hit enemies - reduce health
                      e.health -= 5;
                      if (e.health <= 0) {
                        e.alive = false;
                        const dropY = e.type === 'wraith' && e.verticalOffset !== undefined ? e.y + e.verticalOffset : ey;
                        const dropValue = e.type === 'spider' ? 5 : 
                                         e.type === 'dropper' ? 2 :
                                         e.type === 'wraith' ? 3 :
                                         e.type === 'hooded' ? 3 : 2;
                        const ejectDirection = (e.x + 12) > (player.x + 15) ? 1 : -1;
                        game.energyDrops.push({
                          x: e.x + 12, y: dropY + 12, velocityY: -3, velocityX: ejectDirection * 1.5,
                          collected: false, pulse: 0, gravity: 0.2, value: dropValue, collectionDelay: 10
                        });
                      }
                    } else {
                      // Single-hit enemies die normally (drifter, echo, slug)
                      e.alive = false;
                      const dropValue = e.type === 'echo' ? 3 : 2;
                      const ejectDirection = (e.x + 12) > (player.x + 15) ? 1 : -1;
                      game.energyDrops.push({
                        x: e.x + 12, y: ey + 12, velocityY: -3, velocityX: ejectDirection * 1.5,
                        collected: false, pulse: 0, gravity: 0.2, value: dropValue, collectionDelay: 10
                      });
                    }
                  }
                }
              });
            } else if (!game.boss.defeated) {
              // For demon boss (Level 4), hitbox is chest orb only (scaled to 2x)
              const bossHitbox = game.boss.type === 'demon' 
                ? { x: game.boss.x, y: game.boss.y + 88, width: 80, height: 80 } // Chest orb (bigger)
                : game.boss; // Full body for other bosses
              
              if (checkCollision({ x: p.x - 4, y: p.y - 4, width: 8, height: 8 }, bossHitbox)) {
                p.active = false;
                if (game.boss.invulnerableTimer === 0) {
                  game.boss.health -= 5;
                  game.boss.invulnerableTimer = 10;
                  setBossHealth(game.boss.health);
                  if (game.boss.health <= 0) {
                    game.boss.defeated = true;
                    if (currentLevel >= 4) {
                      setGameState('won'); // Final boss defeated
                    } else {
                      setGameState('levelComplete'); // Level complete, more to go
                    }
                  }
                }
              }
            }
          }
        });
      }

      if (game.boss.active && !game.boss.defeated) {
        game.boss.attackTimer++;
        game.boss.moveTimer++;
        game.boss.pulse += 0.1;

        // Handle boss movement
        if (game.boss.type === 'demon') {
          // Demon boss: Smooth drift side to side (slower)
          if (!game.boss.driftVelocity) {
            game.boss.driftVelocity = 0.7;
            game.boss.driftDirection = 1;
          }
          
          game.boss.x += game.boss.driftVelocity * game.boss.driftDirection;
          
          // Reverse direction at boundaries
          if (game.boss.x < 100 || game.boss.x > 1100) {
            game.boss.driftDirection *= -1;
          }
          
          // Gentle vertical float - centered on screen
          game.boss.y = 300 + Math.sin(game.boss.pulse * 0.5) * 40;
        } else {
          // Other bosses: Teleport sequence
          if (game.boss.teleportState === 'idle' && game.boss.moveTimer > 100) {
            game.boss.moveTimer = 0;
            game.boss.teleportState = 'out';
            game.boss.teleportTimer = 0;
            game.boss.targetX = Math.random() * 1000 + 140;
            game.boss.targetY = Math.random() * 200 + 150;
          }

          if (game.boss.teleportState === 'out') {
            game.boss.teleportTimer++;
            if (game.boss.teleportTimer >= 15) {
              // Midpoint - actually move position
              game.boss.x = game.boss.targetX;
              game.boss.y = game.boss.targetY;
              game.boss.teleportState = 'in';
              game.boss.teleportTimer = 0;
            }
          } else if (game.boss.teleportState === 'in') {
            game.boss.teleportTimer++;
            if (game.boss.teleportTimer >= 15) {
              game.boss.teleportState = 'idle';
              game.boss.teleportTimer = 0;
            }
          }
        }

        if (game.boss.attackTimer > 120) {
          game.boss.attackTimer = 0;
          
          if (game.boss.type === 'bat') {
            // Bat: 6 radial projectiles
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              game.boss.projectiles.push({
                x: game.boss.x + 40, 
                y: game.boss.y + 50, 
                vx: Math.cos(angle) * 3, 
                vy: Math.sin(angle) * 3, 
                active: true, 
                r: 8,
                seekSpeed: 0,  // No seeking for bat
                lifetime: 300  // 5 seconds at 60fps
              });
            }
          } else if (game.boss.type === 'eye') {
            // Demon Eye: Initialize burst attack
            if (!game.boss.burstActive) {
              game.boss.burstActive = true;
              game.boss.burstCount = 0;
              game.boss.burstTimer = 0;
            }
          } else if (game.boss.type === 'demon') {
            // Demon Lord (Level 4): Each of 4 arms fires 3 projectiles (12 total)
            // Arms in wide X formation
            const armPositions = [
              { x: game.boss.x - 150, y: game.boss.y - 120 },  // Upper left (very wide and high)
              { x: game.boss.x + 150, y: game.boss.y - 120 },  // Upper right (very wide and high)
              { x: game.boss.x - 135, y: game.boss.y + 135 },  // Lower left (very wide and low)
              { x: game.boss.x + 135, y: game.boss.y + 135 }   // Lower right (very wide and low)
            ];
            
            armPositions.forEach(arm => {
              // Each arm fires 3 projectiles in a spread pattern
              for (let i = 0; i < 3; i++) {
                // Calculate angle toward player with spread
                const dx = player.x + player.width / 2 - arm.x;
                const dy = player.y + player.height / 2 - arm.y;
                const baseAngle = Math.atan2(dy, dx);
                const spreadAngle = baseAngle + (i - 1) * 0.35; // Spread of ~0.7 radians total
                const speed = 3;
                
                game.boss.projectiles.push({
                  x: arm.x,
                  y: arm.y,
                  vx: Math.cos(spreadAngle) * speed,
                  vy: Math.sin(spreadAngle) * speed,
                  active: true,
                  r: 8,
                  seekSpeed: 0,
                  lifetime: 300  // 5 seconds at 60fps
                });
              }
            });
          }
        }
        
        // Demon Eye burst attack - fire 4 projectiles in quick succession
        if (game.boss.type === 'eye' && game.boss.burstActive) {
          game.boss.burstTimer++;
          if (game.boss.burstTimer >= 8 && game.boss.burstCount < 4) {
            // Fire one projectile
            const angle = Math.random() * Math.PI * 2; // Random direction for variety
            const speed = 2.5;
            game.boss.projectiles.push({
              x: game.boss.x + 40, 
              y: game.boss.y + 50, 
              vx: Math.cos(angle) * speed, 
              vy: Math.sin(angle) * speed, 
              active: true, 
              r: 8,
              seekSpeed: 0.03,  // Gentle homing factor
              lifetime: 300  // 5 seconds at 60fps (same as spider projectiles)
            });
            game.boss.burstCount++;
            game.boss.burstTimer = 0;
          }
          
          if (game.boss.burstCount >= 4) {
            game.boss.burstActive = false;
          }
        }

        game.boss.projectiles.forEach(p => {
          if (p.active) {
            // Decrement lifetime for projectiles that have it
            if (p.lifetime !== undefined) {
              p.lifetime--;
              if (p.lifetime <= 0) {
                p.active = false;
                return;
              }
            }
            
            // Apply homing behavior only if projectile has seekSpeed
            if (p.seekSpeed > 0) {
              const dx = player.x + player.width / 2 - p.x;
              const dy = player.y + player.height / 2 - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                // Calculate direction to player
                const targetVx = (dx / dist) * 2.5;
                const targetVy = (dy / dist) * 2.5;
                
                // Gradually adjust velocity toward target (gentle seeking)
                p.vx += (targetVx - p.vx) * p.seekSpeed;
                p.vy += (targetVy - p.vy) * p.seekSpeed;
              }
            }
            
            p.x += p.vx;
            p.y += p.vy;

            if (checkCollision(player, { x: p.x - p.r, y: p.y - p.r, width: p.r * 2, height: p.r * 2 }) && player.invulnerableTimer === 0) {
              player.health = Math.max(0, player.health - 10);
              player.invulnerableTimer = 90;
              setHealth(player.health);
              p.active = false;
            }
          }
        });

        if (player.isAttacking && player.attackTimer > 10) {
          const spear = { 
            x: player.facingDirection === 1 ? player.x + 33 : player.x - 40, 
            y: player.y + 18, 
            width: 40, 
            height: 10 
          };
          
          // For demon boss (Level 4), hitbox is chest orb only (scaled to 2x)
          const bossHitbox = game.boss.type === 'demon' 
            ? { x: game.boss.x, y: game.boss.y + 88, width: 80, height: 80 } // Chest orb (bigger)
            : game.boss; // Full body for other bosses
          
          if (checkCollision(spear, bossHitbox) && game.boss.invulnerableTimer === 0) {
            game.boss.health -= 10;
            game.boss.invulnerableTimer = 30;
            setBossHealth(game.boss.health);
            if (game.boss.health <= 0) {
              game.boss.defeated = true;
              if (currentLevel >= 4) {
                setGameState('won'); // Final boss defeated
              } else {
                setGameState('levelComplete'); // Level complete, more to go
              }
            }
          }
        }

        if (game.boss.invulnerableTimer > 0) game.boss.invulnerableTimer--;
      }

      if (player.health <= 0) setGameState('lost');

      ctx.fillStyle = levelConfig.theme.background;
      ctx.fillRect(0, 0, 1280, 800);

      // Draw parallax stars (optimized)
      if (!game.boss.active) {
        // Normal parallax in main level
        game.starLayers.forEach((layer, layerIndex) => {
          ctx.fillStyle = '#ffffff';
          layer.forEach(star => {
            const parallaxX = star.x - (game.camera.x * star.speedFactor);
            const wrappedX = ((parallaxX % 3000) + 3000) % 3000;
            
            if (wrappedX >= -50 && wrappedX <= 1330) {
              ctx.globalAlpha = star.brightness;
              ctx.beginPath();
              ctx.arc(wrappedX, star.y, star.size, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1;
        });
      } else {
        // Stationary stars in boss battle
        game.starLayers.forEach((layer) => {
          ctx.fillStyle = '#ffffff';
          layer.forEach(star => {
            if (star.x >= 0 && star.x <= 1280) {
              ctx.globalAlpha = star.brightness * 0.7;
              ctx.beginPath();
              ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1;
        });
      }

      if (!game.boss.active) {
        ctx.save();
        ctx.translate(-game.camera.x, 0);

        // Calculate shared animation values once per frame
        const veinPhase = game.platformPhaseTimer * 2;
        const phaseShiftValue = Math.sin(game.platformPhaseTimer);
        const themeColors = levelConfig.theme.platformColors;

        game.platforms.forEach(p => {
          // Skip platforms completely outside viewport (vertical culling)
          if (p.y + p.height < -50 || p.y > 850) return;
          
          // Calculate phase shift alpha if applicable
          let platformAlpha = 1;
          if (p.hasPhaseShift) {
            platformAlpha = 0.525 + (Math.sin(game.platformPhaseTimer + p.x * 0.01)) * 0.475;
          }
          
          ctx.globalAlpha = platformAlpha;
          
          // Level 4: Frozen Tundra - solid dark gray platforms with minimal glow
          if (currentLevel === 4) {
            // Very subtle outer glow (darker)
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(50, 60, 70, 0.2)';
            ctx.fillStyle = '#0f0f14';
            ctx.fillRect(p.x - 1, p.y - 1, p.width + 2, p.height + 2);
            
            // Solid dark platform (very close to background)
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#0d0d12';
            ctx.fillRect(p.x, p.y, p.width, p.height);
            
            ctx.shadowBlur = 0;
          } else {
            // Other levels: Tech aesthetic with hexagons and energy veins
            const isLargePlatform = p.width > 800;
            
            // Top glow line
            ctx.shadowBlur = 15;
            ctx.shadowColor = themeColors.glow;
            ctx.fillStyle = themeColors.glow;
            ctx.fillRect(p.x, p.y, p.width, 3);
            
            if (isLargePlatform) {
              // Simple rendering for large platforms - just gradient, no hexagons or veins
              ctx.shadowBlur = 0;
              const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
              gradient.addColorStop(0, themeColors.gradientTop);
              gradient.addColorStop(0.5, themeColors.gradientMid);
              gradient.addColorStop(1, themeColors.gradientBottom);
              ctx.fillStyle = gradient;
              ctx.fillRect(p.x, p.y + 3, p.width, p.height - 3);
            } else {
              // Draw cached platform texture (gradient + hexagons)
              ctx.shadowBlur = 0;
              const cachedTexture = createPlatformTexture(p.width, p.height - 3, themeColors);
              ctx.drawImage(cachedTexture, p.x, p.y + 3);
              
              // Draw animated energy veins on top
              const veinBaseColor = themeColors.veinColor;
              // Convert hex to rgba for opacity
              const veinR = parseInt(veinBaseColor.slice(1,3), 16);
              const veinG = parseInt(veinBaseColor.slice(3,5), 16);
              const veinB = parseInt(veinBaseColor.slice(5,7), 16);
              ctx.strokeStyle = `rgba(${veinR}, ${veinG}, ${veinB}, ${0.4 + Math.sin(veinPhase + p.x * 0.1) * 0.2})`;
              ctx.lineWidth = 1.5;
              ctx.shadowBlur = 8;
              ctx.shadowColor = themeColors.veinColor;
              
              // Main vein along the platform
              ctx.beginPath();
              ctx.moveTo(p.x, p.y + p.height / 2);
              for (let vx = p.x; vx <= p.x + p.width; vx += 15) {
                const veinOffset = Math.sin(vx * 0.2 + game.platformPhaseTimer) * 3;
                ctx.lineTo(vx, p.y + p.height / 2 + veinOffset);
              }
              ctx.stroke();
              
              // Branch veins (reduced for performance)
              for (let bx = p.x + 20; bx < p.x + p.width; bx += 60) {
                ctx.beginPath();
                ctx.moveTo(bx, p.y + p.height / 2);
                ctx.lineTo(bx + 5, p.y + 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bx, p.y + p.height / 2);
                ctx.lineTo(bx - 5, p.y + p.height - 2);
                ctx.stroke();
              }
            }
            
            ctx.shadowBlur = 0;
          }
          
          ctx.globalAlpha = 1;
        });

        game.energyOrbs.forEach(orb => {
          if (!orb.collected) {
            const pulseFactor = Math.sin(orb.pulse) * 0.5 + 0.5;
            const glowSize = 20 + pulseFactor * 15;
            const orbSize = 8;
            
            // Outer glow (orange)
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = '#ff8800';
            ctx.fillStyle = `rgba(255, 136, 0, ${0.3 + pulseFactor * 0.3})`;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orbSize + 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core (yellow)
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orbSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        ctx.shadowBlur = 0;

        const portalPulse = Math.sin(game.portal.pulse) * 0.5 + 0.5;
        const portalGlow = 50 + portalPulse * 30;
        
        // Outer glow layers
        ctx.shadowBlur = portalGlow;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = `rgba(255, 0, 255, ${0.2 + portalPulse * 0.3})`;
        ctx.fillRect(game.portal.x - 10, game.portal.y - 10, game.portal.width + 20, game.portal.height + 20);
        
        // Main portal body with gradient
        ctx.shadowBlur = 0;
        const gradient = ctx.createLinearGradient(game.portal.x, game.portal.y, game.portal.x, game.portal.y + game.portal.height);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#8800ff');
        gradient.addColorStop(1, '#660099');
        ctx.fillStyle = gradient;
        ctx.fillRect(game.portal.x, game.portal.y, game.portal.width, game.portal.height);
        
        // Inner bright center
        ctx.shadowBlur = 30;
        ctx.fillStyle = `rgba(255, 100, 255, ${0.5 + portalPulse * 0.5})`;
        ctx.fillRect(game.portal.x + 15, game.portal.y + 20, game.portal.width - 30, game.portal.height - 40);
        
        ctx.shadowBlur = 0;

        game.energyDrops.forEach(d => {
          if (!d.collected) {
            const pulseFactor = Math.sin(d.pulse) * 0.5 + 0.5;
            const glowSize = 20 + pulseFactor * 15;
            
            // Outer glow (orange)
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = '#ff8800';
            ctx.fillStyle = `rgba(255, 136, 0, ${0.3 + pulseFactor * 0.3})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core (yellow)
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        ctx.shadowBlur = 0;
        
        // BATCHED ENEMY RENDERING - group by type to minimize shadowBlur changes
        
        // Render all drifters (shadow blur once)
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0066';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'drifter') {
            ctx.fillStyle = '#aa0044';
            ctx.fillRect(e.x, e.y, 25, 25);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(e.x + 6, e.y + 8, 4, 4);
            ctx.fillRect(e.x + 15, e.y + 8, 4, 4);
          }
        });
        
        // Render all slugs (no shadow needed - cached with shadow)
        ctx.shadowBlur = 0;
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'slug') {
            const extensionFactor = e.extensionFactor || 0;
            let cacheIndex;
            if (extensionFactor < 0.165) cacheIndex = 0;
            else if (extensionFactor < 0.5) cacheIndex = 1;
            else if (extensionFactor < 0.835) cacheIndex = 2;
            else cacheIndex = 3;
            
            const cachedSlug = slugCaches[cacheIndex];
            ctx.save();
            ctx.translate(e.x, e.y);
            if (e.direction === -1) ctx.scale(-1, 1);
            ctx.drawImage(cachedSlug, -10, -15);
            ctx.restore();
          }
        });
        
        // Render all droppers (shadow blur once)
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffff00';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'dropper' && e.spawnDelay === 0) {
            const pulseFactor = Math.sin(e.pulse) * 0.3 + 0.7;
            const meltProgress = e.meltProgress || 0;
            const currentHeight = 35 * (1 - meltProgress);
            const meltOffset = 35 - currentHeight;
            
            const dropGrad = ctx.createRadialGradient(e.x + 15, e.y + meltOffset + 10, 0, e.x + 15, e.y + meltOffset + 10, 25);
            dropGrad.addColorStop(0, '#ffffff');
            dropGrad.addColorStop(0.4, '#ffffaa');
            dropGrad.addColorStop(0.7, '#ffff44');
            dropGrad.addColorStop(1, '#ffaa00');
            ctx.fillStyle = dropGrad;
            
            ctx.beginPath();
            const topRadius = 15 * (1 - meltProgress * 0.5);
            if (currentHeight > 15) {
              ctx.arc(e.x + 15, e.y + meltOffset + 15, topRadius, Math.PI, 0, false);
            }
            ctx.lineTo(e.x + 30, e.y + 35);
            ctx.lineTo(e.x, e.y + 35);
            ctx.closePath();
            ctx.fill();
            
            if (meltProgress < 0.8) {
              ctx.shadowBlur = 15;
              ctx.fillStyle = `rgba(255, 255, 255, ${pulseFactor * (1 - meltProgress)})`;
              ctx.beginPath();
              ctx.arc(e.x + 15, e.y + meltOffset + 18, 8 * (1 - meltProgress), 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 30;
            }
          }
        });
        
        // Render all golems (shadow blur once)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#664422';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'golem') {
            // Main body (tall pillar)
            ctx.fillStyle = '#886644';
            ctx.fillRect(e.x, e.y, 35, 140);
            
            // Rock texture details
            ctx.fillStyle = '#664422';
            ctx.fillRect(e.x + 5, e.y + 10, 8, 12);
            ctx.fillRect(e.x + 22, e.y + 8, 6, 15);
            ctx.fillRect(e.x + 8, e.y + 35, 10, 10);
            ctx.fillRect(e.x + 20, e.y + 40, 8, 12);
            ctx.fillRect(e.x + 6, e.y + 65, 12, 14);
            ctx.fillRect(e.x + 22, e.y + 70, 7, 10);
            ctx.fillRect(e.x + 10, e.y + 95, 9, 11);
            ctx.fillRect(e.x + 24, e.y + 100, 6, 8);
            ctx.fillRect(e.x + 8, e.y + 120, 11, 10);
            ctx.fillRect(e.x + 20, e.y + 125, 8, 8);
            
            // Highlight sections
            ctx.fillStyle = '#aa8866';
            ctx.fillRect(e.x + 15, e.y + 20, 12, 15);
            ctx.fillRect(e.x + 10, e.y + 55, 15, 12);
            ctx.fillRect(e.x + 18, e.y + 85, 10, 14);
            ctx.fillRect(e.x + 12, e.y + 110, 14, 12);
            
            // Eyes
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff6600';
            ctx.fillStyle = '#ff4400';
            if (e.facingDirection === 1) {
              ctx.beginPath();
              ctx.arc(e.x + 28, e.y + 35, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(e.x + 28, e.y + 50, 4, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(e.x + 7, e.y + 35, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(e.x + 7, e.y + 50, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
        
        // Render all echo enemies (shadow blur once)
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#8800ff';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'echo') {
            const ey = e.y + e.verticalOffset;
            let alpha = e.phaseState === 'fading' ? 1 - (e.phaseTimer / 30) : e.phaseState === 'invisible' ? 0 : e.phaseState === 'appearing' ? e.phaseTimer / 30 : 1;
            if (alpha > 0) {
              ctx.globalAlpha = alpha;
              
              // Triangle body
              ctx.fillStyle = '#5500aa';
              ctx.beginPath();
              ctx.moveTo(e.x + 14, ey);
              ctx.lineTo(e.x, ey + 28);
              ctx.lineTo(e.x + 28, ey + 28);
              ctx.closePath();
              ctx.fill();
              
              // Single eye
              ctx.shadowBlur = 10;
              ctx.fillStyle = '#ff00ff';
              ctx.beginPath();
              ctx.arc(e.x + 14, ey + 16, 5, 0, Math.PI * 2);
              ctx.fill();
              
              // Eye pupil
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(e.x + 14, ey + 16, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 20;
              
              ctx.globalAlpha = 1;
            }
          }
        });
        
        // Render all wraiths (shadow blur once)
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ddff';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'wraith') {
            const ey = e.verticalOffset !== undefined ? e.y + e.verticalOffset : e.y;
            const time = e.pulse || 0;
            const pulseScale = Math.sin(time * 2) * 0.1 + 1;
            
            // Main hexagonal body
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#0a0a1a';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
              const radius = 20 * pulseScale;
              const px = e.x + Math.cos(angle) * radius;
              const py = ey + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            // Orbiting shards
            ctx.shadowBlur = 8;
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2 + e.shardRotation;
              const dist = 30 + Math.sin(time * 3 + i) * 5;
              const shardX = e.x + Math.cos(angle) * dist;
              const shardY = ey + Math.sin(angle) * dist;
              
              ctx.save();
              ctx.translate(shardX, shardY);
              ctx.rotate(angle + e.shardRotation * 2);
              
              ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
              ctx.beginPath();
              ctx.moveTo(0, -6);
              ctx.lineTo(3, 0);
              ctx.lineTo(0, 6);
              ctx.lineTo(-3, 0);
              ctx.closePath();
              ctx.fill();
              
              ctx.restore();
            }
            
            // Inner dark core
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(e.x, ey, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.7;
            
            // Glowing eyes
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ddff';
            ctx.fillRect(e.x - 8, ey - 5, 4, 6);
            ctx.fillRect(e.x + 4, ey - 5, 4, 6);
            
            ctx.globalAlpha = 1;
          }
        });
        
        // Render all hooded figures
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ffffff';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'hooded' && e.spawnDelay === 0) {
            let alpha = 1;
            if (e.phaseState === 'appearing') alpha = e.phaseTimer / 30;
            else if (e.phaseState === 'fading') alpha = 1 - (e.phaseTimer / 30);
            else if (e.phaseState === 'invisible') alpha = 0;
            
            if (alpha > 0) {
              ctx.globalAlpha = alpha * 0.75;
              const time = Date.now() * 0.003;
              
              // Cloak
              ctx.fillStyle = '#7a7a8e';
              ctx.beginPath();
              ctx.moveTo(e.x - 15, e.y - 20);
              for (let i = 0; i <= 10; i++) {
                const cloakX = e.x - 15 + i * 3;
                const cloakY = e.y + 15 + Math.sin(time * 3 + i * 0.5) * 4;
                ctx.lineTo(cloakX, cloakY);
              }
              ctx.lineTo(e.x + 15, e.y - 20);
              ctx.closePath();
              ctx.fill();
              
              // Hood
              ctx.fillStyle = '#a0a0a5';
              ctx.beginPath();
              ctx.arc(e.x, e.y - 15, 16, Math.PI, 0);
              ctx.lineTo(e.x + 16, e.y + 5);
              ctx.lineTo(e.x - 16, e.y + 5);
              ctx.closePath();
              ctx.fill();
              
              // Face
              ctx.fillStyle = '#2a2a2a';
              ctx.globalAlpha = alpha * 0.9;
              ctx.beginPath();
              ctx.ellipse(e.x, e.y - 8, 12, 14, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = alpha * 0.75;
              
              // Eyes
              ctx.shadowBlur = 20;
              ctx.shadowColor = '#ffffff';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(e.x - 8, e.y - 10);
              ctx.lineTo(e.x - 4, e.y - 12);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(e.x + 4, e.y - 12);
              ctx.lineTo(e.x + 8, e.y - 10);
              ctx.stroke();
              
              ctx.globalAlpha = 1;
            }
          }
        });
        
        // Render all spiders (shadow blur once)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#aa00ff';
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'spider') {
            // Thread
            ctx.strokeStyle = 'rgba(170, 0, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x, 20);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();
            
            // Cached spider body
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.rotation);
            ctx.drawImage(spiderBodyCache, -50, -50);
            ctx.restore();
            
            // Projectiles
            ctx.shadowBlur = 15;
            e.projectiles.forEach(p => {
              if (p.active) {
                const fadeAlpha = p.lifetime <= 12 ? p.lifetime / 12 : 1;
                ctx.globalAlpha = fadeAlpha;
                ctx.fillStyle = '#aa00ff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
              }
            });
            ctx.shadowBlur = 10;
          }
        });
        
        ctx.shadowBlur = 0;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ctx.globalAlpha = 0.5;
        
        // Frozen effect - ice overlay
        if (player.frozenTimer > 0) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#aaffff';
          ctx.strokeStyle = '#88ddff';
          ctx.lineWidth = 3;
          ctx.strokeRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
          
          // Ice crystals
          ctx.fillStyle = 'rgba(170, 220, 255, 0.4)';
          for (let i = 0; i < 4; i++) {
            const cx = player.x + Math.random() * player.width;
            const cy = player.y + Math.random() * player.height;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 3);
            ctx.lineTo(cx + 2, cy);
            ctx.lineTo(cx, cy + 3);
            ctx.lineTo(cx - 2, cy);
            ctx.closePath();
            ctx.fill();
          }
        }
        
        // Freeze immunity indicator
        if (player.freezeCooldown > 0) {
          const cooldownAlpha = player.freezeCooldown / 60; // Fade out over 1 second
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00ffff';
          ctx.strokeStyle = `rgba(0, 255, 255, ${cooldownAlpha * 0.6})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(player.x - 3, player.y - 3, player.width + 6, player.height + 6);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        }
        
        // DESIGN F: HYBRID CYBER-KNIGHT
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ctx.globalAlpha = 0.5;
        
        // Legs
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(player.x + 10, player.y + 39, 4, 21);
        ctx.fillRect(player.x + 16, player.y + 39, 4, 21);
        const legColor = player.speedBoostTimer > 0 ? '#ffff00' : '#00ffff';
        ctx.fillStyle = legColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.3 : 0.6;
        ctx.fillRect(player.x + 11, player.y + 48, 2, 8);
        ctx.fillRect(player.x + 17, player.y + 48, 2, 8);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Body
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(player.x + 8, player.y + 14, 14, 25);
        
        // Chest energy core
        const coreColor = player.speedBoostTimer > 0 ? '#ffff00' : '#00ffff';
        ctx.fillStyle = coreColor;
        ctx.fillRect(player.x + 13, player.y + 19, 4, 16);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.2 : 0.4;
        ctx.fillRect(player.x + 12, player.y + 20, 6, 14);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.4 : 0.8;
        ctx.beginPath();
        ctx.arc(player.x + 15, player.y + 27, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Side panels
        ctx.fillStyle = '#1a3050';
        ctx.fillRect(player.x + 9, player.y + 20, 3, 15);
        ctx.fillRect(player.x + 18, player.y + 20, 3, 15);
        
        // Shoulders
        ctx.beginPath();
        ctx.moveTo(player.x + 7, player.y + 17);
        ctx.lineTo(player.x + 5, player.y + 19);
        ctx.lineTo(player.x + 6, player.y + 28);
        ctx.lineTo(player.x + 8, player.y + 28);
        ctx.closePath();
        ctx.fillStyle = '#1a4060';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(player.x + 23, player.y + 17);
        ctx.lineTo(player.x + 25, player.y + 19);
        ctx.lineTo(player.x + 24, player.y + 28);
        ctx.lineTo(player.x + 22, player.y + 28);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.4 : 0.8;
        ctx.fillRect(player.x + 5, player.y + 19, 2, 6);
        ctx.fillRect(player.x + 23, player.y + 19, 2, 6);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Arms
        ctx.fillStyle = '#0a2a3a';
        ctx.fillRect(player.x + 5, player.y + 26, 3, 14);
        ctx.fillRect(player.x + 22, player.y + 26, 3, 14);
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.25 : 0.5;
        ctx.fillRect(player.x + 6, player.y + 28, 1, 10);
        ctx.fillRect(player.x + 23, player.y + 28, 1, 10);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Helmet
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(player.x + 10, player.y + 2, 10, 16);
        ctx.fillStyle = '#1a3050';
        ctx.beginPath();
        ctx.moveTo(player.x + 10, player.y + 2);
        ctx.lineTo(player.x + 12, player.y);
        ctx.lineTo(player.x + 18, player.y);
        ctx.lineTo(player.x + 20, player.y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.35 : 0.7;
        ctx.fillRect(player.x + 14, player.y, 2, 3);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Visor
        ctx.shadowBlur = 15;
        ctx.shadowColor = coreColor;
        ctx.fillStyle = coreColor;
        ctx.fillRect(player.x + 11, player.y + 8, 8, 5);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.2 : 0.4;
        ctx.fillRect(player.x + 10, player.y + 7, 10, 7);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x + 12, player.y + 9, 6, 2);
        
        // Energy Spear (directional indicator) - hidden when attacking
        if (!player.isAttacking) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = coreColor;
          if (player.facingDirection === 1) {
            // Spear on RIGHT
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x + 27, player.y + 27, 2, 21);
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x + 28, player.y + 24);
            ctx.lineTo(player.x + 25, player.y + 27);
            ctx.lineTo(player.x + 31, player.y + 27);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(player.x + 27, player.y + 25, 2, 4);
            ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(player.x + 28, player.y + 41, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Spear on LEFT
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x + 1, player.y + 27, 2, 21);
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x + 2, player.y + 24);
            ctx.lineTo(player.x - 1, player.y + 27);
            ctx.lineTo(player.x + 5, player.y + 27);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(player.x + 1, player.y + 25, 2, 4);
            ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(player.x + 2, player.y + 41, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.globalAlpha = 1;
        
        if (player.isAttacking) {
          // Stabbing motion - extended arm thrust
          const thrustProgress = player.attackTimer / 15; // 1 to 0
          const thrustExtend = (1 - thrustProgress) * 12; // 0 to 12 pixels extension
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = coreColor;
          
          if (player.facingDirection === 1) {
            // Extended arm
            ctx.fillStyle = '#0a2a3a';
            ctx.fillRect(player.x + 22 + thrustExtend, player.y + 24, 8, 4);
            
            // Spear thrust
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x + 30 + thrustExtend, player.y + 24, 8, 3);
            
            // Spear tip
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x + 38 + thrustExtend, player.y + 25.5);
            ctx.lineTo(player.x + 33 + thrustExtend, player.y + 24);
            ctx.lineTo(player.x + 33 + thrustExtend, player.y + 27);
            ctx.closePath();
            ctx.fill();
            
            // Impact flash at tip
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = thrustProgress * 0.8;
            ctx.beginPath();
            ctx.arc(player.x + 38 + thrustExtend, player.y + 25.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            // Extended arm
            ctx.fillStyle = '#0a2a3a';
            ctx.fillRect(player.x - thrustExtend, player.y + 24, 8, 4);
            
            // Spear thrust
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x - 8 - thrustExtend, player.y + 24, 8, 3);
            
            // Spear tip
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x - 8 - thrustExtend, player.y + 25.5);
            ctx.lineTo(player.x - 3 - thrustExtend, player.y + 24);
            ctx.lineTo(player.x - 3 - thrustExtend, player.y + 27);
            ctx.closePath();
            ctx.fill();
            
            // Impact flash at tip
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = thrustProgress * 0.8;
            ctx.beginPath();
            ctx.arc(player.x - 8 - thrustExtend, player.y + 25.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        
        if (comp.active) {
          comp.projectiles.forEach(p => {
            if (p.active) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#00ff00';
              ctx.fillStyle = '#00ff00';
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00ff00';
          ctx.fillStyle = '#00ff00';
          ctx.beginPath();
          ctx.arc(comp.x, comp.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        // Calculate shared animation values once per frame
        const veinPhase = game.platformPhaseTimer * 2;
        const themeColors = levelConfig.theme.platformColors;
        
        // Render demon boss BEHIND platforms (Level 4 only)
        if (!game.boss.defeated && game.boss.type === 'demon') {
          const boss = game.boss;
          const bossPulse = Math.sin(boss.pulse) * 0.5 + 0.5;
          const isInvulnerable = boss.invulnerableTimer > 0 && Math.floor(boss.invulnerableTimer / 5) % 2 === 0;
          
          if (!isInvulnerable) {
            // DEMON LORD BOSS (Level 4) - Rendered behind platforms
            const centerX = boss.x + 40;
            const centerY = boss.y + 50;
            
            // Purple atmospheric aura
            for (let r = 450; r > 0; r -= 60) {
              const alpha = (450 - r) / 450 * 0.15;
              ctx.fillStyle = `rgba(150, 50, 200, ${alpha})`;
              ctx.beginPath();
              ctx.arc(centerX, centerY + 45, r, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Main body
            const bodyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 135);
            bodyGrad.addColorStop(0, '#2a1a3a');
            bodyGrad.addColorStop(0.7, '#1a0a2a');
            bodyGrad.addColorStop(1, '#0f0520');
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(centerX - 122, centerY - 22, 245, 200);
            
            // Armor plates, thorns, chest core, spikes, arms, head, horns, eyes, mouth...
            // (Full rendering code - same as original but duplicated here for background)
            
            // Organic armor plates
            ctx.strokeStyle = '#3a2050';
            ctx.lineWidth = 5;
            for (let i = 0; i < 5; i++) {
              ctx.beginPath();
              ctx.moveTo(centerX - 100 + i*18, centerY + i*33);
              ctx.quadraticCurveTo(centerX, centerY + 22 + i*33, centerX + 100 - i*18, centerY + i*33);
              ctx.stroke();
            }
            
            // Spine thorns
            for (let i = 0; i < 6; i++) {
              const thornY = centerY + i*27;
              const thornSize = 40 - i*2;
              ctx.fillStyle = '#2a1a3a';
              ctx.beginPath();
              ctx.moveTo(centerX, thornY);
              ctx.lineTo(centerX - 10, thornY - thornSize);
              ctx.lineTo(centerX + 10, thornY - thornSize);
              ctx.closePath();
              ctx.fill();
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#aa44ff';
              ctx.fillStyle = '#6633aa';
              ctx.beginPath();
              ctx.moveTo(centerX - 4, thornY - thornSize + 8);
              ctx.lineTo(centerX - 8, thornY - thornSize);
              ctx.lineTo(centerX, thornY - thornSize + 4);
              ctx.closePath();
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            
            // Chest core
            ctx.shadowBlur = 60;
            ctx.shadowColor = '#ff44ff';
            for (let r = 67; r > 0; r -= 10) {
              const alpha = (67 - r) / 67 * 0.4;
              ctx.fillStyle = `rgba(255, 100, 255, ${alpha})`;
              ctx.beginPath();
              ctx.arc(centerX, centerY + 78, r, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#aa44ff';
            ctx.beginPath();
            ctx.arc(centerX, centerY + 78, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff88ff';
            ctx.beginPath();
            ctx.arc(centerX, centerY + 78, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffccff';
            ctx.beginPath();
            ctx.arc(centerX, centerY + 78, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Shoulder spikes
            for (let i = 0; i < 9; i++) {
              const spikeX = centerX - 112 + i*28;
              const spikeHeight = 50 + Math.sin(i * 0.7) * 13;
              const curve = (i - 4) * 8;
              ctx.fillStyle = '#1a0a2a';
              ctx.beginPath();
              ctx.moveTo(spikeX, centerY);
              ctx.quadraticCurveTo(spikeX + curve - 13, centerY - spikeHeight/2, spikeX + curve - 18, centerY - spikeHeight);
              ctx.lineTo(spikeX + curve + 18, centerY - spikeHeight + 9);
              ctx.closePath();
              ctx.fill();
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#aa44ff';
              ctx.fillStyle = '#6633aa';
              ctx.beginPath();
              ctx.moveTo(spikeX + curve - 13, centerY - spikeHeight + 9);
              ctx.lineTo(spikeX + curve - 18, centerY - spikeHeight);
              ctx.lineTo(spikeX + curve - 6, centerY - spikeHeight + 4);
              ctx.closePath();
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            
            // Arms with fire orbs
            ctx.save();
            ctx.translate(centerX - 195, centerY - 60);
            ctx.rotate(-0.6);
            const armGrad1 = ctx.createLinearGradient(0, 0, 0, 135);
            armGrad1.addColorStop(0, '#1a0a2a');
            armGrad1.addColorStop(0.5, '#2a1535');
            armGrad1.addColorStop(1, '#1a0a2a');
            ctx.fillStyle = armGrad1;
            ctx.fillRect(0, 0, 57, 135);
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#ff4400';
            for (let r = 40; r > 0; r -= 6) {
              const alpha = (40 - r) / 40 * 0.5;
              ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
              ctx.beginPath();
              ctx.arc(28, 145, r, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(28, 145, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc66';
            ctx.beginPath();
            ctx.arc(28, 145, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            
            ctx.save();
            ctx.translate(centerX + 195, centerY - 60);
            ctx.rotate(0.6);
            const armGrad2 = ctx.createLinearGradient(0, 0, 0, 135);
            armGrad2.addColorStop(0, '#1a0a2a');
            armGrad2.addColorStop(0.5, '#2a1535');
            armGrad2.addColorStop(1, '#1a0a2a');
            ctx.fillStyle = armGrad2;
            ctx.fillRect(-57, 0, 57, 135);
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#ff4400';
            for (let r = 40; r > 0; r -= 6) {
              const alpha = (40 - r) / 40 * 0.5;
              ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
              ctx.beginPath();
              ctx.arc(-28, 145, r, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(-28, 145, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc66';
            ctx.beginPath();
            ctx.arc(-28, 145, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            
            ctx.save();
            ctx.translate(centerX - 172, centerY + 75);
            ctx.rotate(-0.5);
            const armGrad3 = ctx.createLinearGradient(0, 0, 0, 127);
            armGrad3.addColorStop(0, '#2a1535');
            armGrad3.addColorStop(1, '#1a0a2a');
            ctx.fillStyle = armGrad3;
            ctx.fillRect(0, 0, 50, 127);
            ctx.restore();
            
            ctx.save();
            ctx.translate(centerX + 172, centerY + 75);
            ctx.rotate(0.5);
            const armGrad4 = ctx.createLinearGradient(0, 0, 0, 127);
            armGrad4.addColorStop(0, '#2a1535');
            armGrad4.addColorStop(1, '#1a0a2a');
            ctx.fillStyle = armGrad4;
            ctx.fillRect(-50, 0, 50, 127);
            ctx.restore();
            
            // Head
            const headGrad = ctx.createRadialGradient(centerX, centerY - 78, 0, centerX, centerY - 78, 112);
            headGrad.addColorStop(0, '#2a1a3a');
            headGrad.addColorStop(0.7, '#1a0a2a');
            headGrad.addColorStop(1, '#0f0520');
            ctx.fillStyle = headGrad;
            ctx.fillRect(centerX - 67, centerY - 105, 135, 97);
            
            // Face scars
            ctx.strokeStyle = '#3a2050';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - 45, centerY - 90);
            ctx.lineTo(centerX - 30, centerY - 60);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + 45, centerY - 82);
            ctx.lineTo(centerX + 33, centerY - 52);
            ctx.stroke();
            
            // Horns
            for (let i = 0; i < 6; i++) {
              const hornX = centerX - 75 + i*30;
              const hornHeight = 52 + Math.abs(2.5 - i) * 22;
              const curvature = (i - 2.5) * 18;
              ctx.fillStyle = '#1a0a2a';
              ctx.beginPath();
              ctx.moveTo(hornX, centerY - 105);
              ctx.quadraticCurveTo(hornX + curvature - 12, centerY - 105 - hornHeight/2, hornX + curvature - 15, centerY - 105 - hornHeight);
              ctx.lineTo(hornX + curvature + 15, centerY - 105 - hornHeight + 7);
              ctx.closePath();
              ctx.fill();
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#aa44ff';
              ctx.fillStyle = '#6633aa';
              ctx.beginPath();
              ctx.moveTo(hornX + curvature - 10, centerY - 105 - hornHeight + 6);
              ctx.lineTo(hornX + curvature - 15, centerY - 105 - hornHeight);
              ctx.lineTo(hornX + curvature - 6, centerY - 105 - hornHeight + 3);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = '#aa55dd';
              ctx.beginPath();
              ctx.moveTo(hornX + curvature - 10, centerY - 105 - hornHeight + 7);
              ctx.lineTo(hornX + curvature - 13, centerY - 105 - hornHeight + 1);
              ctx.lineTo(hornX + curvature - 7, centerY - 105 - hornHeight + 4);
              ctx.closePath();
              ctx.fill();
              ctx.shadowBlur = 0;
            }
            
            // Eyes
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#ff44ff';
            ctx.fillStyle = '#aa44ff';
            ctx.fillRect(centerX - 42, centerY - 67, 27, 16);
            ctx.fillStyle = '#dd66ff';
            ctx.fillRect(centerX - 39, centerY - 64, 21, 10);
            ctx.fillStyle = '#ff88ff';
            ctx.fillRect(centerX - 36, centerY - 63, 15, 7);
            ctx.fillStyle = '#ffccff';
            ctx.fillRect(centerX - 33, centerY - 61, 9, 4);
            ctx.fillStyle = '#aa44ff';
            ctx.fillRect(centerX + 15, centerY - 67, 27, 16);
            ctx.fillStyle = '#dd66ff';
            ctx.fillRect(centerX + 18, centerY - 64, 21, 10);
            ctx.fillStyle = '#ff88ff';
            ctx.fillRect(centerX + 21, centerY - 63, 15, 7);
            ctx.fillStyle = '#ffccff';
            ctx.fillRect(centerX + 24, centerY - 61, 9, 4);
            ctx.shadowBlur = 0;
            
            // Mouth
            ctx.fillStyle = '#0f0520';
            ctx.beginPath();
            ctx.moveTo(centerX - 33, centerY - 30);
            ctx.lineTo(centerX, centerY - 18);
            ctx.lineTo(centerX + 33, centerY - 30);
            ctx.lineTo(centerX + 27, centerY - 24);
            ctx.lineTo(centerX, centerY - 12);
            ctx.lineTo(centerX - 27, centerY - 24);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#aa88cc';
            for (let i = 0; i < 6; i++) {
              const toothX = centerX - 27 + i*11;
              ctx.beginPath();
              ctx.moveTo(toothX, centerY - 24);
              ctx.lineTo(toothX - 3, centerY - 15);
              ctx.lineTo(toothX + 3, centerY - 15);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        plats.forEach(p => {
          // Skip platforms completely outside viewport (vertical culling)
          if (p.y + p.height < -50 || p.y > 850) return;
          
          // Calculate phase shift alpha if applicable
          let platformAlpha = 1;
          if (p.hasPhaseShift) {
            platformAlpha = 0.525 + (Math.sin(game.platformPhaseTimer + p.x * 0.01)) * 0.475;
          }
          
          ctx.globalAlpha = platformAlpha;
          
          // Level 4: Frozen Tundra - solid dark gray platforms with minimal glow
          if (currentLevel === 4) {
            // Very subtle outer glow (darker)
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(50, 60, 70, 0.2)';
            ctx.fillStyle = '#0f0f14';
            ctx.fillRect(p.x - 1, p.y - 1, p.width + 2, p.height + 2);
            
            // Solid dark platform (very close to background)
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#0d0d12';
            ctx.fillRect(p.x, p.y, p.width, p.height);
            
            ctx.shadowBlur = 0;
          } else {
            // Other levels: Tech aesthetic
            const isLargePlatform = p.width > 800;
            
            // Top glow line
            ctx.shadowBlur = 10;
            ctx.shadowColor = themeColors.glow;
            ctx.fillStyle = themeColors.glow;
            ctx.fillRect(p.x, p.y, p.width, 3);
            
            if (isLargePlatform) {
              // Simple rendering for large platforms
              ctx.shadowBlur = 0;
              const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
              gradient.addColorStop(0, themeColors.gradientTop);
              gradient.addColorStop(0.5, themeColors.gradientMid);
              gradient.addColorStop(1, themeColors.gradientBottom);
              ctx.fillStyle = gradient;
              ctx.fillRect(p.x, p.y + 3, p.width, p.height - 3);
            } else {
              // Draw cached platform texture (gradient + hexagons)
              ctx.shadowBlur = 0;
              const cachedTexture = createPlatformTexture(p.width, p.height - 3, themeColors);
              ctx.drawImage(cachedTexture, p.x, p.y + 3);
              
              // Simplified energy veins (less detail for performance)
              const veinR = parseInt(themeColors.veinColor.slice(1,3), 16);
              const veinG = parseInt(themeColors.veinColor.slice(3,5), 16);
              const veinB = parseInt(themeColors.veinColor.slice(5,7), 16);
              ctx.strokeStyle = `rgba(${veinR}, ${veinG}, ${veinB}, ${0.4 + Math.sin(veinPhase + p.x * 0.1) * 0.2})`;
              ctx.lineWidth = 1.5;
              ctx.shadowBlur = 5;
              ctx.shadowColor = themeColors.veinColor;
              
              // Main vein only (no branches)
              ctx.beginPath();
              ctx.moveTo(p.x, p.y + p.height / 2);
              for (let vx = p.x; vx <= p.x + p.width; vx += 20) {
                const veinOffset = Math.sin(vx * 0.2 + game.platformPhaseTimer) * 2;
                ctx.lineTo(vx, p.y + p.height / 2 + veinOffset);
              }
              ctx.stroke();
            }
          }
          
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });
        
        if (!game.boss.defeated) {
          // Projectile colors depend on boss type
          const boss = game.boss;
          let projectileColor, projectileGlow;
          if (boss.type === 'eye') {
            projectileColor = '#ff6600';  // Orange for demon eye
            projectileGlow = '#ff8800';
          } else if (boss.type === 'spider') {
            projectileColor = '#aa00ff';  // Purple for spider
            projectileGlow = '#ff00ff';
          } else if (boss.type === 'demon') {
            projectileColor = '#ff6600';  // Fire orange for demon lord
            projectileGlow = '#ff8800';
          } else {
            projectileColor = '#ff1493';  // Pink for bat
            projectileGlow = '#ff69b4';
          }
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = projectileGlow;
          ctx.fillStyle = projectileColor;
          game.boss.projectiles.forEach(p => {
            if (p.active) {
              // Fade out during last 12 frames if projectile has lifetime
              let fadeAlpha = 1;
              if (p.lifetime !== undefined && p.lifetime <= 12) {
                fadeAlpha = p.lifetime / 12;
              }
              ctx.globalAlpha = fadeAlpha;
              
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.globalAlpha = 1;
            }
          });
          ctx.shadowBlur = 0;
          
          const bossPulse = Math.sin(boss.pulse) * 0.5 + 0.5;
          const isInvulnerable = boss.invulnerableTimer > 0 && Math.floor(boss.invulnerableTimer / 5) % 2 === 0;
          
          // Calculate teleport transformation (only for teleporting bosses)
          let teleportAlpha = 1;
          let teleportScale = 1;
          if (boss.type !== 'demon') {
            if (boss.teleportState === 'out') {
              // Fade out and shrink: 1 -> 0 over 15 frames
              const progress = boss.teleportTimer / 15;
              teleportAlpha = 1 - progress;
              teleportScale = 1 - progress;
            } else if (boss.teleportState === 'in') {
              // Fade in and grow: 0 -> 1 over 15 frames
              const progress = boss.teleportTimer / 15;
              teleportAlpha = progress;
              teleportScale = progress;
            }
          }
          
          if (!isInvulnerable && teleportAlpha > 0) {
            // Save context and apply transformations
            ctx.save();
            ctx.globalAlpha = teleportAlpha;
            
            // Only apply scale transformation for teleporting bosses
            if (boss.type !== 'demon') {
              ctx.translate(boss.x + 40, boss.y + 50); // Center point of boss
              ctx.scale(teleportScale, teleportScale);
              ctx.translate(-(boss.x + 40), -(boss.y + 50)); // Translate back
            }
            
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#666666';
            
            // Boss-type-specific rendering
            if (boss.type === 'bat') {
              // BAT BOSS (Level 1)
              // Bat body (rectangular with slight taper)
              ctx.fillStyle = '#888888';
              ctx.fillRect(boss.x + 25, boss.y + 30, 30, 45);
              
              // Left wing with jagged/torn edges
              ctx.fillStyle = '#666666';
              ctx.beginPath();
              ctx.moveTo(boss.x + 25, boss.y + 35);
              ctx.lineTo(boss.x + 15, boss.y + 30);
              ctx.lineTo(boss.x + 10, boss.y + 35);
              ctx.lineTo(boss.x + 5, boss.y + 32);
              ctx.lineTo(boss.x, boss.y + 40);
              ctx.lineTo(boss.x + 3, boss.y + 48);
              ctx.lineTo(boss.x + 8, boss.y + 52);
              ctx.lineTo(boss.x + 5, boss.y + 58);
              ctx.lineTo(boss.x + 10, boss.y + 62);
              ctx.lineTo(boss.x + 8, boss.y + 68);
              ctx.lineTo(boss.x + 15, boss.y + 70);
              ctx.lineTo(boss.x + 20, boss.y + 65);
              ctx.lineTo(boss.x + 25, boss.y + 60);
              ctx.closePath();
              ctx.fill();
              
              // Right wing with jagged/torn edges
              ctx.beginPath();
              ctx.moveTo(boss.x + 55, boss.y + 35);
              ctx.lineTo(boss.x + 65, boss.y + 30);
              ctx.lineTo(boss.x + 70, boss.y + 35);
              ctx.lineTo(boss.x + 75, boss.y + 32);
              ctx.lineTo(boss.x + 80, boss.y + 40);
              ctx.lineTo(boss.x + 77, boss.y + 48);
              ctx.lineTo(boss.x + 72, boss.y + 52);
              ctx.lineTo(boss.x + 75, boss.y + 58);
              ctx.lineTo(boss.x + 70, boss.y + 62);
              ctx.lineTo(boss.x + 72, boss.y + 68);
              ctx.lineTo(boss.x + 65, boss.y + 70);
              ctx.lineTo(boss.x + 60, boss.y + 65);
              ctx.lineTo(boss.x + 55, boss.y + 60);
              ctx.closePath();
              ctx.fill();
              
              // Bat head
              ctx.fillStyle = '#888888';
              ctx.fillRect(boss.x + 30, boss.y + 15, 20, 18);
              
              // Left ear
              ctx.fillStyle = '#666666';
              ctx.beginPath();
              ctx.moveTo(boss.x + 32, boss.y + 15);
              ctx.lineTo(boss.x + 28, boss.y + 8);
              ctx.lineTo(boss.x + 30, boss.y + 5);
              ctx.lineTo(boss.x + 35, boss.y + 12);
              ctx.closePath();
              ctx.fill();
              
              // Right ear
              ctx.beginPath();
              ctx.moveTo(boss.x + 48, boss.y + 15);
              ctx.lineTo(boss.x + 52, boss.y + 8);
              ctx.lineTo(boss.x + 50, boss.y + 5);
              ctx.lineTo(boss.x + 45, boss.y + 12);
              ctx.closePath();
              ctx.fill();
              
              // Eyes with pulsing glow
              ctx.shadowBlur = 8 + bossPulse * 4;
              ctx.shadowColor = '#ff69b4';
              ctx.fillStyle = '#ff1493';
              ctx.beginPath();
              ctx.arc(boss.x + 35, boss.y + 22, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(boss.x + 45, boss.y + 22, 3, 0, Math.PI * 2);
              ctx.fill();
              
              // Battle scars
              ctx.strokeStyle = '#555555';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(boss.x + 28, boss.y + 40);
              ctx.lineTo(boss.x + 35, boss.y + 48);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(boss.x + 48, boss.y + 45);
              ctx.lineTo(boss.x + 52, boss.y + 55);
              ctx.stroke();
              
            } else if (boss.type === 'eye') {
              // DEMON EYE BOSS (Level 2) - Eldritch horror with orange/red fire theme
              const eyeCenterX = boss.x + 40;
              const eyeCenterY = boss.y + 50;
              const time = Date.now() * 0.002;
              
              // Draw writhing tentacles (10 tentacles of varying lengths)
              for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 / 10) * i + time * 0.5;
                const sway = Math.sin(time * 3 + i * 0.5) * 20;
                const length = 60 + (i % 3) * 25;
                const thickness = 8 - (i % 3) * 2;
                
                // Tentacle color gradient (dark red to orange)
                const tentacleGrad = ctx.createLinearGradient(
                  eyeCenterX, eyeCenterY,
                  eyeCenterX + Math.cos(angle) * length, eyeCenterY + Math.sin(angle) * length
                );
                tentacleGrad.addColorStop(0, '#660000');
                tentacleGrad.addColorStop(0.5, '#883300');
                tentacleGrad.addColorStop(1, '#aa4400');
                
                ctx.strokeStyle = tentacleGrad;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(eyeCenterX, eyeCenterY);
                ctx.quadraticCurveTo(
                  eyeCenterX + Math.cos(angle) * length * 0.5 + sway,
                  eyeCenterY + Math.sin(angle) * length * 0.5,
                  eyeCenterX + Math.cos(angle) * length,
                  eyeCenterY + Math.sin(angle) * length
                );
                ctx.stroke();
                
                // Small eyes on some tentacles
                if (i % 2 === 0) {
                  const smallEyeX = eyeCenterX + Math.cos(angle) * length;
                  const smallEyeY = eyeCenterY + Math.sin(angle) * length;
                  
                  // Small eye white
                  ctx.fillStyle = '#ffddcc';
                  ctx.beginPath();
                  ctx.arc(smallEyeX, smallEyeY, 5, 0, Math.PI * 2);
                  ctx.fill();
                  
                  // Small eye iris
                  ctx.fillStyle = '#ff6600';
                  ctx.beginPath();
                  ctx.arc(smallEyeX, smallEyeY, 3, 0, Math.PI * 2);
                  ctx.fill();
                  
                  // Small eye pupil
                  ctx.fillStyle = '#000000';
                  ctx.beginPath();
                  ctx.arc(smallEyeX, smallEyeY, 1.5, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              
              // Main eye sclera (white part)
              ctx.shadowBlur = 30;
              ctx.shadowColor = '#ff6600';
              ctx.fillStyle = '#ffffee';
              ctx.beginPath();
              ctx.arc(eyeCenterX, eyeCenterY, 45, 0, Math.PI * 2);
              ctx.fill();
              
              // Iris with spiral pattern (rotating)
              ctx.save();
              ctx.translate(eyeCenterX, eyeCenterY);
              ctx.rotate(time * 2);
              
              const irisGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
              irisGrad.addColorStop(0, '#ffaa00');
              irisGrad.addColorStop(0.3, '#ff6600');
              irisGrad.addColorStop(0.6, '#cc3300');
              irisGrad.addColorStop(1, '#880000');
              
              // Draw spiral iris segments
              for (let i = 0; i < 5; i++) {
                const segmentAngle = (Math.PI * 2 / 5) * i;
                ctx.fillStyle = irisGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 35, segmentAngle, segmentAngle + Math.PI / 3);
                ctx.lineTo(0, 0);
                ctx.fill();
              }
              
              ctx.restore();
              
              // Pupil with fire glow
              ctx.shadowBlur = 40 + bossPulse * 15;
              ctx.shadowColor = '#ff6600';
              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(eyeCenterX, eyeCenterY, 12, 0, Math.PI * 2);
              ctx.fill();
              
              // Inner fire glow in pupil
              ctx.shadowBlur = 25;
              ctx.shadowColor = '#ffaa00';
              ctx.fillStyle = '#ff6600';
              ctx.beginPath();
              ctx.arc(eyeCenterX, eyeCenterY, 8 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
              ctx.fill();
              
              // Veins radiating from pupil
              ctx.strokeStyle = 'rgba(204, 51, 0, 0.6)';
              ctx.lineWidth = 2;
              for (let i = 0; i < 8; i++) {
                const veinAngle = (Math.PI * 2 / 8) * i;
                ctx.beginPath();
                ctx.moveTo(eyeCenterX, eyeCenterY);
                ctx.lineTo(
                  eyeCenterX + Math.cos(veinAngle) * 42,
                  eyeCenterY + Math.sin(veinAngle) * 42
                );
                ctx.stroke();
              }
            } else if (boss.type === 'spider') {
              // ARACHNIS SPIDER BOSS (Level 3) - Crystal Caverns giant spider
              const spiderCenterX = boss.x + 40;
              const spiderCenterY = boss.y + 50;
              const time = Date.now() * 0.002;
              
              // Draw 8 legs
              for (let i = 0; i < 8; i++) {
                const legAngle = (Math.PI * 2 / 8) * i + Math.PI / 8;
                const legSway = Math.sin(time * 2 + i * 0.5) * 0.2;
                const legLength1 = 35;
                const legLength2 = 30;
                
                // Leg segment 1 (from body)
                const joint1X = spiderCenterX + Math.cos(legAngle + legSway) * legLength1;
                const joint1Y = spiderCenterY + Math.sin(legAngle + legSway) * legLength1;
                
                // Leg segment 2 (from joint to ground)
                const bendAngle = legAngle + legSway + Math.PI / 2.5;
                const footX = joint1X + Math.cos(bendAngle) * legLength2;
                const footY = joint1Y + Math.sin(bendAngle) * legLength2;
                
                // Draw leg
                ctx.strokeStyle = '#6600aa';
                ctx.lineWidth = 5;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#aa00ff';
                ctx.beginPath();
                ctx.moveTo(spiderCenterX, spiderCenterY);
                ctx.lineTo(joint1X, joint1Y);
                ctx.lineTo(footX, footY);
                ctx.stroke();
                
                // Joint crystal
                ctx.fillStyle = '#aa00ff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(joint1X, joint1Y, 4, 0, Math.PI * 2);
                ctx.fill();
              }
              
              // Main body - abdomen
              ctx.shadowBlur = 25;
              ctx.shadowColor = '#aa00ff';
              const abdomGradient = ctx.createRadialGradient(
                spiderCenterX, spiderCenterY + 15, 0,
                spiderCenterX, spiderCenterY + 15, 35
              );
              abdomGradient.addColorStop(0, '#8800ff');
              abdomGradient.addColorStop(0.5, '#6600aa');
              abdomGradient.addColorStop(1, '#440066');
              ctx.fillStyle = abdomGradient;
              ctx.beginPath();
              ctx.ellipse(spiderCenterX, spiderCenterY + 15, 35, 30, 0, 0, Math.PI * 2);
              ctx.fill();
              
              // Crystal spikes on abdomen
              ctx.fillStyle = '#aa00ff';
              ctx.shadowBlur = 15;
              for (let i = 0; i < 6; i++) {
                const spikeAngle = (Math.PI * 2 / 6) * i;
                const spikeBaseX = spiderCenterX + Math.cos(spikeAngle) * 25;
                const spikeBaseY = spiderCenterY + 15 + Math.sin(spikeAngle) * 20;
                const spikeTipX = spiderCenterX + Math.cos(spikeAngle) * 38;
                const spikeTipY = spiderCenterY + 15 + Math.sin(spikeAngle) * 28;
                
                ctx.beginPath();
                ctx.moveTo(spikeBaseX - 3, spikeBaseY);
                ctx.lineTo(spikeTipX, spikeTipY);
                ctx.lineTo(spikeBaseX + 3, spikeBaseY);
                ctx.closePath();
                ctx.fill();
              }
              
              // Cephalothorax (head/thorax)
              ctx.shadowBlur = 20;
              ctx.fillStyle = '#6600aa';
              ctx.beginPath();
              ctx.ellipse(spiderCenterX, spiderCenterY - 15, 28, 22, 0, 0, Math.PI * 2);
              ctx.fill();
              
              // Multiple eyes (8 eyes arranged)
              const eyePositions = [
                // Front row (4 eyes)
                { x: -8, y: -22, size: 5 },
                { x: -2, y: -24, size: 6 },
                { x: 2, y: -24, size: 6 },
                { x: 8, y: -22, size: 5 },
                // Back row (4 eyes)
                { x: -12, y: -18, size: 4 },
                { x: -4, y: -16, size: 4 },
                { x: 4, y: -16, size: 4 },
                { x: 12, y: -18, size: 4 }
              ];
              
              eyePositions.forEach(eye => {
                // Eye whites
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(spiderCenterX + eye.x, spiderCenterY + eye.y, eye.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Purple glowing pupils
                ctx.fillStyle = '#aa00ff';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#aa00ff';
                ctx.beginPath();
                ctx.arc(spiderCenterX + eye.x, spiderCenterY + eye.y, eye.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
              });
              
              // Mandibles/fangs
              ctx.fillStyle = '#440066';
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#aa00ff';
              ctx.beginPath();
              ctx.moveTo(spiderCenterX - 8, spiderCenterY - 5);
              ctx.lineTo(spiderCenterX - 12, spiderCenterY + 5);
              ctx.lineTo(spiderCenterX - 6, spiderCenterY + 8);
              ctx.closePath();
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(spiderCenterX + 8, spiderCenterY - 5);
              ctx.lineTo(spiderCenterX + 12, spiderCenterY + 5);
              ctx.lineTo(spiderCenterX + 6, spiderCenterY + 8);
              ctx.closePath();
              ctx.fill();
              
              // Pulsing energy core (shows it's powerful)
              const corePulse = Math.sin(bossPulse * 3) * 0.5 + 0.5;
              ctx.shadowBlur = 20 + corePulse * 15;
              ctx.shadowColor = '#ffffff';
              ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + corePulse * 0.4})`;
              ctx.beginPath();
              ctx.arc(spiderCenterX, spiderCenterY, 8 + corePulse * 4, 0, Math.PI * 2);
              ctx.fill();
            } else if (boss.type === 'demon') {
              // DEMON LORD BOSS (Level 4) - Already rendered BEHIND platforms above
              // Skip rendering here to avoid double-rendering
            }
            
            ctx.shadowBlur = 0;
            
            // Restore context
            ctx.restore();
          }
        }
        
        // Render enemies during boss battle (spiders only - no slugs)
        game.enemies.forEach(e => {
          if (e.alive && e.type === 'spider') {
            // Crystal Spider rendering
            const spiderX = e.x;
            const spiderY = e.y;
            
            // Draw thread
            ctx.strokeStyle = 'rgba(170, 0, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#aa00ff';
            ctx.beginPath();
            ctx.moveTo(spiderX, 20);
            ctx.lineTo(spiderX, spiderY);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Draw cached spider body
            ctx.save();
            ctx.translate(spiderX, spiderY);
            ctx.rotate(e.rotation);
            ctx.drawImage(spiderBodyCache, -50, -50);
            ctx.restore();
            
            // Draw projectiles
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#aa00ff';
            e.projectiles.forEach(p => {
              if (p.active) {
                // Fade out during last 12 frames (0.2 seconds at 60fps)
                const fadeAlpha = p.lifetime <= 12 ? p.lifetime / 12 : 1;
                ctx.globalAlpha = fadeAlpha;
                
                ctx.fillStyle = '#aa00ff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.globalAlpha = 1;
              }
            });
            
            ctx.shadowBlur = 0;
          }
        });
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ctx.globalAlpha = 0.5;
        
        // Frozen effect - ice overlay
        if (player.frozenTimer > 0) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#aaffff';
          ctx.strokeStyle = '#88ddff';
          ctx.lineWidth = 3;
          ctx.strokeRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
          
          // Ice crystals
          ctx.fillStyle = 'rgba(170, 220, 255, 0.4)';
          for (let i = 0; i < 4; i++) {
            const cx = player.x + Math.random() * player.width;
            const cy = player.y + Math.random() * player.height;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 3);
            ctx.lineTo(cx + 2, cy);
            ctx.lineTo(cx, cy + 3);
            ctx.lineTo(cx - 2, cy);
            ctx.closePath();
            ctx.fill();
          }
        }
        
        // Freeze immunity indicator
        if (player.freezeCooldown > 0) {
          const cooldownAlpha = player.freezeCooldown / 60; // Fade out over 1 second
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00ffff';
          ctx.strokeStyle = `rgba(0, 255, 255, ${cooldownAlpha * 0.6})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(player.x - 3, player.y - 3, player.width + 6, player.height + 6);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        }
        
        // DESIGN F: HYBRID CYBER-KNIGHT
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ctx.globalAlpha = 0.5;
        
        // Legs
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(player.x + 10, player.y + 39, 4, 21);
        ctx.fillRect(player.x + 16, player.y + 39, 4, 21);
        const legColor = player.speedBoostTimer > 0 ? '#ffff00' : '#00ffff';
        ctx.fillStyle = legColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.3 : 0.6;
        ctx.fillRect(player.x + 11, player.y + 48, 2, 8);
        ctx.fillRect(player.x + 17, player.y + 48, 2, 8);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Body
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(player.x + 8, player.y + 14, 14, 25);
        
        // Chest energy core
        const coreColor = player.speedBoostTimer > 0 ? '#ffff00' : '#00ffff';
        ctx.fillStyle = coreColor;
        ctx.fillRect(player.x + 13, player.y + 19, 4, 16);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.2 : 0.4;
        ctx.fillRect(player.x + 12, player.y + 20, 6, 14);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.4 : 0.8;
        ctx.beginPath();
        ctx.arc(player.x + 15, player.y + 27, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Side panels
        ctx.fillStyle = '#1a3050';
        ctx.fillRect(player.x + 9, player.y + 20, 3, 15);
        ctx.fillRect(player.x + 18, player.y + 20, 3, 15);
        
        // Shoulders
        ctx.beginPath();
        ctx.moveTo(player.x + 7, player.y + 17);
        ctx.lineTo(player.x + 5, player.y + 19);
        ctx.lineTo(player.x + 6, player.y + 28);
        ctx.lineTo(player.x + 8, player.y + 28);
        ctx.closePath();
        ctx.fillStyle = '#1a4060';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(player.x + 23, player.y + 17);
        ctx.lineTo(player.x + 25, player.y + 19);
        ctx.lineTo(player.x + 24, player.y + 28);
        ctx.lineTo(player.x + 22, player.y + 28);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.4 : 0.8;
        ctx.fillRect(player.x + 5, player.y + 19, 2, 6);
        ctx.fillRect(player.x + 23, player.y + 19, 2, 6);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Arms
        ctx.fillStyle = '#0a2a3a';
        ctx.fillRect(player.x + 5, player.y + 26, 3, 14);
        ctx.fillRect(player.x + 22, player.y + 26, 3, 14);
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.25 : 0.5;
        ctx.fillRect(player.x + 6, player.y + 28, 1, 10);
        ctx.fillRect(player.x + 23, player.y + 28, 1, 10);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Helmet
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(player.x + 10, player.y + 2, 10, 16);
        ctx.fillStyle = '#1a3050';
        ctx.beginPath();
        ctx.moveTo(player.x + 10, player.y + 2);
        ctx.lineTo(player.x + 12, player.y);
        ctx.lineTo(player.x + 18, player.y);
        ctx.lineTo(player.x + 20, player.y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.35 : 0.7;
        ctx.fillRect(player.x + 14, player.y, 2, 3);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        
        // Visor
        ctx.shadowBlur = 15;
        ctx.shadowColor = coreColor;
        ctx.fillStyle = coreColor;
        ctx.fillRect(player.x + 11, player.y + 8, 8, 5);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.2 : 0.4;
        ctx.fillRect(player.x + 10, player.y + 7, 10, 7);
        ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x + 12, player.y + 9, 6, 2);
        
        // Energy Spear (directional indicator) - hidden when attacking
        if (!player.isAttacking) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = coreColor;
          if (player.facingDirection === 1) {
          // Spear on RIGHT
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x + 27, player.y + 27, 2, 21);
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x + 28, player.y + 24);
            ctx.lineTo(player.x + 25, player.y + 27);
            ctx.lineTo(player.x + 31, player.y + 27);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(player.x + 27, player.y + 25, 2, 4);
            ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(player.x + 28, player.y + 41, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
          // Spear on LEFT
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x + 1, player.y + 27, 2, 21);
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x + 2, player.y + 24);
            ctx.lineTo(player.x - 1, player.y + 27);
            ctx.lineTo(player.x + 5, player.y + 27);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(player.x + 1, player.y + 25, 2, 4);
            ctx.globalAlpha = (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) ? 0.5 : 1;
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(player.x + 2, player.y + 41, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
          
        ctx.globalAlpha = 1;
        
        if (player.isAttacking) {
          // Stabbing motion - extended arm thrust
          const thrustProgress = player.attackTimer / 15; // 1 to 0
          const thrustExtend = (1 - thrustProgress) * 12; // 0 to 12 pixels extension
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = coreColor;
          
          if (player.facingDirection === 1) {
            // Extended arm
            ctx.fillStyle = '#0a2a3a';
            ctx.fillRect(player.x + 22 + thrustExtend, player.y + 24, 8, 4);
            
            // Spear thrust
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x + 30 + thrustExtend, player.y + 24, 8, 3);
            
            // Spear tip
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x + 38 + thrustExtend, player.y + 25.5);
            ctx.lineTo(player.x + 33 + thrustExtend, player.y + 24);
            ctx.lineTo(player.x + 33 + thrustExtend, player.y + 27);
            ctx.closePath();
            ctx.fill();
            
            // Impact flash at tip
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = thrustProgress * 0.8;
            ctx.beginPath();
            ctx.arc(player.x + 38 + thrustExtend, player.y + 25.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            // Extended arm
            ctx.fillStyle = '#0a2a3a';
            ctx.fillRect(player.x - thrustExtend, player.y + 24, 8, 4);
            
            // Spear thrust
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(player.x - 8 - thrustExtend, player.y + 24, 8, 3);
            
            // Spear tip
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(player.x - 8 - thrustExtend, player.y + 25.5);
            ctx.lineTo(player.x - 3 - thrustExtend, player.y + 24);
            ctx.lineTo(player.x - 3 - thrustExtend, player.y + 27);
            ctx.closePath();
            ctx.fill();
            
            // Impact flash at tip
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = thrustProgress * 0.8;
            ctx.beginPath();
            ctx.arc(player.x - 8 - thrustExtend, player.y + 25.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        
        if (comp.active) {
          comp.projectiles.forEach(p => {
            if (p.active) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#00ff00';
              ctx.fillStyle = '#00ff00';
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00ff00';
          ctx.fillStyle = '#00ff00';
          ctx.beginPath();
          ctx.arc(comp.x, comp.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Only continue game loop if game is still playing or in boss mode
      if (player.health > 0 && !game.boss.defeated) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', () => {});
    };
  }, [restartTrigger]);

  // Memoize starfield to prevent regenerating on every render
  const starfield = useMemo(() => {
    return [...Array(100)].map((_, i) => ({
      size: 1 + Math.floor(i / 33),
      top: (i * 7 + 13) % 100,
      left: (i * 11 + 17) % 100,
      duration: 2 + (i % 4),
      delay: (i % 3) * 0.7,
      opacity: 0.3 + (i % 5) * 0.15
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      
      {/* Splash/Menu Screen */}
      {gameState === 'menu' && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          {/* Starfield background - full screen */}
          <div className="fixed inset-0 overflow-hidden">
            {starfield.map((star, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: star.size + 'px',
                  height: star.size + 'px',
                  top: star.top + '%',
                  left: star.left + '%',
                  opacity: star.opacity,
                  animation: `twinkle ${star.duration}s infinite ${star.delay}s`
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10">
            {/* Main menu content */}
            <div className="relative bg-gray-900 border-4 border-cyan-400 rounded-lg p-12 text-center max-w-3xl" style={{boxShadow: '0 0 60px #00ffff'}}>
              {/* Title */}
              <h1 className="text-7xl font-bold text-cyan-400 mb-8" style={{textShadow: '0 0 40px #00ffff, 0 0 80px #00ffff'}}>
                CHRONO JOUST
              </h1>
              
              {/* Mission Text */}
              <div className="text-purple-300 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
                <p className="mb-4">You are the last Chrono Knight, guardian of the timeline.</p>
                <p>Battle through collapsing realms and defeat the ancient corrupted guardians to prevent reality's end.</p>
              </div>
              
              {/* Large In-Game Character Display */}
              <div className="mb-8 flex justify-center">
                <div className="relative" style={{width: '420px', height: '360px'}}>
                  {/* Glow effect behind sprite */}
                  <div className="absolute inset-0 bg-cyan-400 opacity-20 blur-2xl"></div>
                  
                  {/* Animated character canvas */}
                  <canvas 
                    ref={splashCanvasRef}
                    width={420}
                    height={360}
                    className="relative z-10"
                    style={{imageRendering: 'pixelated'}}
                  />
                </div>
              </div>
              
              {/* Level Select - DEV ONLY */}
              <div className="mb-8">
                <p className="text-yellow-400 text-sm mb-3">[DEV MODE - Level Select]</p>
                <div className="flex gap-4 justify-center">
                  {[1, 2, 3, 4].map(level => (
                    <button
                      key={level}
                      onClick={() => setSelectedStartLevel(level)}
                      className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                        selectedStartLevel === level
                          ? 'bg-cyan-500 text-gray-900 scale-110'
                          : 'bg-gray-700 text-cyan-400 hover:bg-gray-600'
                      }`}
                      style={selectedStartLevel === level ? {boxShadow: '0 0 20px #00ffff'} : {}}
                    >
                      LEVEL {level}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Start Button */}
              <button
                onClick={startGame}
                className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-4 px-12 rounded-lg text-2xl transition-all transform hover:scale-105"
                style={{boxShadow: '0 0 30px #00ffff'}}
              >
                START GAME
              </button>
              
              {/* Space to start hint */}
              <p className="text-cyan-400 text-sm mt-6 animate-pulse">
                Press SPACE to begin
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2" style={{textShadow: '0 0 20px #00ffff'}}>CHRONO-JOUST</h1>
        <p className="text-purple-400 text-sm">REACH THE END OF THE VOID</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-6 text-cyan-400">
          <div>ENERGY: <span className="text-2xl font-bold">{energy}</span></div>
          <div>HEALTH: <div className="w-32 h-4 bg-gray-700 rounded-full border border-cyan-500 overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full" style={{width: `${health}%`}} />
          </div></div>
          {gameState === 'boss' && (
            <div>BOSS: <div className="w-32 h-4 bg-gray-700 rounded-full border border-red-500 overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{width: `${Math.max(0, Math.min(100, (bossHealth / LEVEL_CONFIGS[currentLevel].boss.health) * 100))}%`}} />
            </div></div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} width={1280} height={800} className="border-2 border-cyan-500 rounded-lg shadow-2xl" />
      <div className="mt-4 text-cyan-400 text-sm text-center max-w-2xl">
        <div className="bg-gray-800 p-3 rounded">
          <p className="mb-2"><strong>CONTROLS:</strong></p>
          <p>Arrow Keys / A,D: Move | Space/Up: Jump | F: Attack</p>
          <p>H: Heal (2 energy) | S: Speed Boost (2 energy) | C: Companion (5 energy)</p>
        </div>
      </div>

      {/* Victory Splash Screen */}
      {gameState === 'won' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-4 border-cyan-400 rounded-lg p-8 text-center max-w-md" style={{boxShadow: '0 0 40px #00ffff'}}>
            <h2 className="text-6xl font-bold text-cyan-400 mb-4" style={{textShadow: '0 0 30px #00ffff'}}>
              VICTORY!
            </h2>
            <p className="text-purple-400 text-2xl mb-6">
              You have conquered all realms
            </p>
            <div className="text-yellow-400 text-xl mb-8">
              <p>Final Energy: {energy}</p>
              <p>Health Remaining: {health}%</p>
            </div>
            <button 
              onClick={restartGame}
              className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-3 px-8 rounded-lg text-xl transition-colors"
              style={{boxShadow: '0 0 20px #00ffff'}}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Level Complete Screen */}
      {gameState === 'levelComplete' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-4 border-yellow-400 rounded-lg p-8 text-center max-w-md" style={{boxShadow: '0 0 40px #ffaa00'}}>
            <h2 className="text-6xl font-bold text-yellow-400 mb-4" style={{textShadow: '0 0 30px #ffaa00'}}>
              VICTORY!
            </h2>
            <p className="text-cyan-400 text-2xl mb-6">
              You have defeated {LEVEL_CONFIGS[currentLevel].boss.name} and escaped {LEVEL_CONFIGS[currentLevel].name}
            </p>
            <div className="text-purple-400 text-xl mb-8">
              <p>Energy Collected: {energy}</p>
              <p>Health Remaining: {health}%</p>
            </div>
            <button 
              onClick={loadNextLevel}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-8 rounded-lg text-xl transition-colors"
              style={{boxShadow: '0 0 20px #ffaa00'}}
            >
              Continue to the next realm?
            </button>
          </div>
        </div>
      )}

      {/* Defeat Splash Screen */}
      {gameState === 'lost' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-8 text-center max-w-md" style={{boxShadow: '0 0 40px #ff0000'}}>
            <h2 className="text-6xl font-bold text-red-500 mb-4" style={{textShadow: '0 0 30px #ff0000'}}>
              DEFEATED
            </h2>
            <p className="text-purple-400 text-2xl mb-6">
              The void has claimed you
            </p>
            <div className="text-cyan-400 text-xl mb-8">
              <p>Energy Collected: {energy}</p>
            </div>
            <button 
              onClick={restartGame}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
              style={{boxShadow: '0 0 20px #ff0000'}}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

// Component is now available globally for browser use
