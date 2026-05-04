
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ElementData, FloatingElectron, OrbitalDefinition, OrbitalType, Difficulty, CollectibleItem, CollectibleType } from '../types';
import { ORBITAL_ORDER, SPEEDS, GAME_BALANCE, VISUAL_TUNING, QUANTUM_TUNING, ORBITAL_COLORS, MOBILE_TUNING } from '../constants';
import { getNextOrbitalForElectron } from '../utils/chemistry';
import { OrbitalRenderer } from './OrbitalVisuals';
import { AudioController } from '../utils/audio';

interface GameCanvasProps {
  currentElement: ElementData;
  electronCount: number;
  onElectronCaptured: (isBonus: boolean) => void;
  onMistake: () => void; 
  setHoveredOrbitalName: (name: string | null) => void;
  difficulty: Difficulty;
  isLevelComplete: boolean;
  lives: number;
  timeLeft: number;
  onTimeBonus: () => void;
  onLifeBonus: () => void; 
}

// Helper for smooth interpolation
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// Get valid polar bounds based on orbital type
const getOrbitalBounds = (orbital: OrbitalDefinition, scale: number, coreRadius: number) => {
    const minDist = coreRadius * 1.5; // Absolute minimum distance from center
    
    // Orbital Thickness buffer from constants
    const thickness = 80 * scale * QUANTUM_TUNING.orbital_thickness_factor;

    if (orbital.type === OrbitalType.S) {
        const baseRadius = orbital.n === 1 ? 80 : (80 + (orbital.n - 1) * 80);
        const centerR = baseRadius * scale;
        const rMin = Math.max(minDist, centerR - thickness / 2);
        const rMax = centerR + thickness / 2;
        return { rMin, rMax, isLobed: false };
    } else {
        // Lobes
        let lengthBase = 220;
        if (orbital.type === OrbitalType.P) {
             lengthBase = 220 + (orbital.n - 2) * 60 * VISUAL_TUNING.pOrbitalSeparationFactor;
        }
        else if (orbital.type === OrbitalType.D) lengthBase = 180 + (orbital.n - 3) * 40;
        else lengthBase = 200 + (orbital.n - 4) * 40;
        
        const L = lengthBase * scale;
        const rMin = Math.max(minDist, L * 0.3);
        const rMax = L * 0.9;
        return { rMin, rMax, isLobed: true, lengthBase, orbitalType: orbital.type };
    }
};

// Helper to get visual radius for hit detection
const getVisualRadius = (orbital: OrbitalDefinition) => {
    if (orbital.type === OrbitalType.S) {
        return orbital.n === 1 ? 80 : (80 + (orbital.n - 1) * 80);
    } else if (orbital.type === OrbitalType.P) {
        // Approximate "center" of P lobes for hit detection
        const length = 220 + (orbital.n - 2) * 60 * VISUAL_TUNING.pOrbitalSeparationFactor;
        return length * 0.7; 
    } else if (orbital.type === OrbitalType.D) {
        const length = 180 + (orbital.n - 3) * 60;
        return length * 0.7;
    } else {
        const length = 200 + (orbital.n - 4) * 60;
        return length * 0.7;
    }
    return 0;
};

// --- QUANTUM PHYSICS ENGINE V4.0 (Random Waypoints) ---
const QuantumElectron: React.FC<{ 
  orbital: OrbitalDefinition; 
  scale: number; 
  coreRadius: number; 
  index: number; 
  allPositionsRef: React.MutableRefObject<Map<number, {x: number, y: number}>>;
}> = React.memo(({ orbital, scale, coreRadius, index, allPositionsRef }) => {
  const electronRef = useRef<SVGCircleElement>(null);
  const debugGroupRef = useRef<SVGGElement>(null);
  
  // Physics State
  const state = useRef({
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    vx: 0, vy: 0,
    nextDecisionTime: 0,
  });

  // Initialize bounds
  const bounds = useMemo(() => getOrbitalBounds(orbital, scale, coreRadius), [orbital, scale, coreRadius]);

  // Helper to pick a completely random valid point in the orbital
  const pickRandomTarget = useCallback(() => {
      let r = bounds.rMin + Math.random() * (bounds.rMax - bounds.rMin);
      let a = 0;

      if (bounds.isLobed) {
           let lobeCount = orbital.type === OrbitalType.P ? 2 : (orbital.type === OrbitalType.D ? 4 : 6);
           let offset = orbital.type === OrbitalType.D ? Math.PI/4 : (orbital.type === OrbitalType.F ? Math.PI/6 : 0);
           const sector = Math.PI * 2 / lobeCount;
           
           // Pick a random lobe
           const lobeIdx = Math.floor(Math.random() * lobeCount);
           const lobeCenter = (lobeIdx * sector) + offset;
           
           // Random deviation within lobe sector (approx +/- 25 degrees)
           const deviation = (Math.random() - 0.5) * 0.9; 
           a = lobeCenter + deviation;
      } else {
           // S Orbital: Any angle
           a = Math.random() * Math.PI * 2;
      }
      return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }, [bounds, orbital.type]);

  // Initialize position
  useEffect(() => {
      const start = pickRandomTarget();
      state.current.x = start.x;
      state.current.y = start.y;
      const target = pickRandomTarget();
      state.current.targetX = target.x;
      state.current.targetY = target.y;
  }, [pickRandomTarget]);

  // MAIN PHYSICS LOOP
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (time: number) => {
      const s = state.current;

      // 1. DECISION MAKING (Change Target)
      if (time > s.nextDecisionTime) {
          const t = pickRandomTarget();
          s.targetX = t.x;
          s.targetY = t.y;
          // Schedule next change (irregular interval to break rhythm)
          s.nextDecisionTime = time + (Math.random() * 200 + 100); 
      }

      // 2. REPULSION (Steering)
      let repX = 0;
      let repY = 0;
      const minSep = (bounds.rMax - bounds.rMin) * QUANTUM_TUNING.min_separation_factor;
      
      allPositionsRef.current.forEach((pos, otherIdx) => {
          if (otherIdx !== index) {
              const dx = s.x - pos.x;
              const dy = s.y - pos.y;
              const distSq = dx*dx + dy*dy;
              if (distSq < minSep * minSep && distSq > 0.1) {
                  const dist = Math.sqrt(distSq);
                  const force = (minSep - dist) / minSep; 
                  repX += (dx / dist) * force * 8; 
                  repY += (dy / dist) * force * 8;
              }
          }
      });

      // 3. MOVEMENT (Lerp towards target + Repulsion)
      // High speed lerp factor clamped to avoid glitches
      const lerpFactor = Math.min(0.9, 0.08 * QUANTUM_TUNING.vel_multiplier); 
      
      // Move towards target
      s.x = lerp(s.x, s.targetX, lerpFactor);
      s.y = lerp(s.y, s.targetY, lerpFactor);

      // Add Repulsion force
      s.x += repX;
      s.y += repY;

      // 4. BROWNIAN JITTER (Micro-movements for chaos)
      const jitterAmt = 2.0; 
      s.x += (Math.random() - 0.5) * jitterAmt;
      s.y += (Math.random() - 0.5) * jitterAmt;

      // 5. CONSTRAINT SOLVER (Strict Bounds)
      let currentR = Math.sqrt(s.x * s.x + s.y * s.y);
      let currentA = Math.atan2(s.y, s.x);

      // Clamp Radius
      if (currentR < bounds.rMin) currentR = bounds.rMin;
      if (currentR > bounds.rMax) currentR = bounds.rMax;

      // Clamp Angle if Lobed
      if (bounds.isLobed) {
             let lobeCount = orbital.type === OrbitalType.P ? 2 : (orbital.type === OrbitalType.D ? 4 : 6);
             let offset = orbital.type === OrbitalType.D ? Math.PI/4 : (orbital.type === OrbitalType.F ? Math.PI/6 : 0);
             const sector = Math.PI * 2 / lobeCount;
             
             let normA = currentA - offset;
             while (normA < 0) normA += Math.PI*2;
             
             const lobeIdx = Math.round(normA / sector);
             const lobeCenter = (lobeIdx * sector) + offset;
             
             const maxDev = 0.6; 
             let diff = currentA - lobeCenter;
             while (diff > Math.PI) diff -= Math.PI*2;
             while (diff < -Math.PI) diff += Math.PI*2;

             if (Math.abs(diff) > maxDev) {
                 currentA = lobeCenter + (diff > 0 ? maxDev : -maxDev);
             }
      }

      // Convert back to Cartesian
      s.x = Math.cos(currentA) * currentR;
      s.y = Math.sin(currentA) * currentR;

      // 6. UPDATE REF
      allPositionsRef.current.set(index, { x: s.x, y: s.y });

      // 7. RENDER
      if (electronRef.current) {
          electronRef.current.setAttribute('cx', s.x.toFixed(2));
          electronRef.current.setAttribute('cy', s.y.toFixed(2));
      }

      // 8. DEBUG RENDER
      if ((QUANTUM_TUNING.debug_show_paths || QUANTUM_TUNING.debug_show_targets) && debugGroupRef.current) {
          while (debugGroupRef.current.firstChild) {
            debugGroupRef.current.removeChild(debugGroupRef.current.firstChild);
          }
          if (QUANTUM_TUNING.debug_show_targets) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', s.x.toString());
            line.setAttribute('y1', s.y.toString());
            line.setAttribute('x2', s.targetX.toString());
            line.setAttribute('y2', s.targetY.toString());
            line.setAttribute('stroke', '#00ff00');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('opacity', '0.5');
            debugGroupRef.current.appendChild(line);
          }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [bounds, orbital.type, index, allPositionsRef, pickRandomTarget]);

  return (
    <g>
      <circle 
        ref={electronRef}
        r={4 * scale} 
        fill="white"
        style={{ filter: 'drop-shadow(0 0 4px white)' }}
      />
      {(QUANTUM_TUNING.debug_show_paths || QUANTUM_TUNING.debug_show_targets) && <g ref={debugGroupRef} />}
    </g>
  );
});


export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentElement,
  electronCount,
  onElectronCaptured,
  onMistake,
  setHoveredOrbitalName,
  difficulty,
  isLevelComplete,
  lives,
  timeLeft,
  onTimeBonus,
  onLifeBonus
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [floatingElectrons, setFloatingElectrons] = useState<FloatingElectron[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleItem[]>([]);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [hoveredOrbitalId, setHoveredOrbitalId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ x: number, y: number, text: string, success: boolean } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [atomScale, setAtomScale] = useState(1);
  
  // TOUCH INPUT REFS (For smooth drag)
  const dragInputPos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Shared State for Repulsion Logic
  const electronPositionsRef = useRef<Map<number, {x: number, y: number}>>(new Map());

  // Start Audio loop when collectibles exist
  useEffect(() => {
    if (collectibles.length > 0) {
        AudioController.startUfoLoop();
    } else {
        AudioController.stopUfoLoop();
    }
    return () => AudioController.stopUfoLoop();
  }, [collectibles.length]);

  // Clear positions on level reset
  useEffect(() => {
      if (electronCount === 0) {
          electronPositionsRef.current.clear();
      }
  }, [electronCount]);
  
  // State refs for access inside timeouts without closure staleness
  const timeLeftRef = useRef(timeLeft);
  const livesRef = useRef(lives);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // RESPONSIVE RESIZE & FULLSCREEN LOGIC
  const calculateAtomScale = useCallback(() => {
    if (!svgRef.current) return;
    const { clientWidth, clientHeight } = svgRef.current;
    const w = clientWidth;
    const h = clientHeight;
    setDimensions({ w, h });

    // Determine the largest possible orbital for the current electron count
    const balance = GAME_BALANCE[difficulty];
    
    let maxVisibleN = 1;
    const nextOrbitalIndex = ORBITAL_ORDER.findIndex(orb => electronCount < orb.startElectronIndex + orb.capacity);
    if (isLevelComplete) {
        const maxUsed = ORBITAL_ORDER.filter(orb => orb.startElectronIndex < electronCount);
        if (maxUsed.length > 0) maxVisibleN = maxUsed[maxUsed.length - 1].n;
    } else {
        const visibleLimitIndex = nextOrbitalIndex === -1 ? ORBITAL_ORDER.length - 1 : Math.min(ORBITAL_ORDER.length - 1, nextOrbitalIndex + 2);
        maxVisibleN = ORBITAL_ORDER[visibleLimitIndex].n;
    }

    const separationFactor = VISUAL_TUNING.pOrbitalSeparationFactor;
    const maxOrbitalExtent = 250 + (maxVisibleN - 1) * 80 * separationFactor; 
    
    const availableW = w * (1 - balance.atomPaddingFactor);
    const availableH = h * (1 - balance.atomPaddingFactor) - balance.uiSafeZoneMargin;
    const minDim = Math.min(availableW, availableH);
    
    let s = (minDim / 2) / maxOrbitalExtent;
    s = Math.max(balance.minAtomScale, Math.min(balance.maxAtomScale, s));
    setAtomScale(s);

  }, [difficulty, electronCount, isLevelComplete]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
        setTimeout(calculateAtomScale, 80);
    });
    if (svgRef.current) resizeObserver.observe(svgRef.current);
    window.addEventListener('resize', calculateAtomScale);
    calculateAtomScale();
    return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', calculateAtomScale);
    };
  }, [calculateAtomScale]);

  useEffect(() => {
      calculateAtomScale();
  }, [calculateAtomScale]);

  // Helper to get visible orbitals list
  const visibleOrbitals = useMemo(() => {
      if (isLevelComplete) {
          return ORBITAL_ORDER.filter(orb => orb.startElectronIndex < electronCount).filter(orb => {
              const electronsInThisOrbital = electronCount - orb.startElectronIndex;
              return electronsInThisOrbital > 0;
          });
      }
      const nextOrbitalIndex = ORBITAL_ORDER.findIndex(orb => electronCount < orb.startElectronIndex + orb.capacity);
      const limit = nextOrbitalIndex === -1 ? ORBITAL_ORDER.length : Math.min(ORBITAL_ORDER.length, nextOrbitalIndex + 3);
      return ORBITAL_ORDER.slice(0, limit);
  }, [electronCount, isLevelComplete]);

  // GEOMETRIC DETECTION: Finds which orbital is under the pointer based on distance
  const getHoveredOrbitalId = useCallback((clientX: number, clientY: number) => {
      if (!svgRef.current) return null;
      const svgRect = svgRef.current.getBoundingClientRect();
      
      // 1. Calculate Coordinates Relative to Atom Center
      const atomCenterX = svgRect.left + dimensions.w / 2;
      const atomCenterY = svgRect.top + dimensions.h / 2 - 20; // Matches render transform Y
      
      const dx = clientX - atomCenterX;
      const dy = clientY - atomCenterY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const distInScale = dist / atomScale; // Convert screen px to atomic units

      // 2. Find Closest Orbital by Visual Radius
      let closestOrbital: string | null = null;
      let minDiff = Infinity;

      for (const orb of visibleOrbitals) {
          const visR = getVisualRadius(orb);
          const diff = Math.abs(distInScale - visR);
          
          // If distance is reasonably close to the orbital band (threshold e.g. 60 units)
          if (diff < 60 && diff < minDiff) {
              minDiff = diff;
              closestOrbital = orb.name;
          }
      }

      return closestOrbital;

  }, [dimensions, atomScale, visibleOrbitals]);


  useEffect(() => {
    if (isLevelComplete) {
        setFloatingElectrons([]);
        setCollectibles([]);
    }
  }, [isLevelComplete]);

  // Spawn Logic Electrons
  useEffect(() => {
    if (isLevelComplete) return;

    const spawnInterval = setInterval(() => {
      setFloatingElectrons(prev => {
        if (prev.length >= 25) return prev; 
        
        const needed = getNextOrbitalForElectron(electronCount);
        const neededTypeCount = needed ? prev.filter(e => e.type === needed.type).length : 999;
        let type = OrbitalType.S;
        
        if (needed && neededTypeCount < 5) {
            type = needed.type;
        } else {
            const types = [OrbitalType.S, OrbitalType.P, OrbitalType.D, OrbitalType.F];
            type = types[Math.floor(Math.random() * types.length)];
        }

        const isBonus = Math.random() < 0.10;

        return [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * dimensions.w,
            y: Math.random() * dimensions.h,
            vx: (Math.random() - 0.5) * SPEEDS[difficulty] * (isBonus ? 1.5 : 1),
            vy: (Math.random() - 0.5) * SPEEDS[difficulty] * (isBonus ? 1.5 : 1),
            type,
            isBonus
          }
        ];
      });
    }, 300);

    return () => clearInterval(spawnInterval);
  }, [dimensions, electronCount, difficulty, isLevelComplete]);

  // Collectible Spawner Logic
  useEffect(() => {
    if (isLevelComplete) return;
    const balance = GAME_BALANCE[difficulty];
    
    let hourglassTimeout: ReturnType<typeof setTimeout>;
    let heartTimeout: ReturnType<typeof setTimeout>;

    const safeW = dimensions.w * (1 - balance.atomPaddingFactor);
    const safeH = dimensions.h - balance.uiSafeZoneMargin;
    const offsetX = (dimensions.w - safeW) / 2;
    const offsetY = (dimensions.h - balance.uiSafeZoneMargin - safeH) / 2;

    const scheduleHourglass = () => {
        const delay = Math.random() * (balance.hourglassSpawnMax - balance.hourglassSpawnMin) + balance.hourglassSpawnMin;
        hourglassTimeout = setTimeout(() => {
            if (timeLeftRef.current < balance.hourglassThreshold) {
                setCollectibles(prev => {
                     if (prev.some(c => c.type === CollectibleType.HOURGLASS)) return prev;
                     
                     // SPAWN OFF SCREEN (Left or Right)
                     const isLeft = Math.random() > 0.5;
                     const startX = isLeft ? -70 : dimensions.w + 70;
                     const startY = offsetY + Math.random() * safeH;
                     
                     // Calculate velocity to cross screen
                     const minSpeedPx = (dimensions.w * balance.hourglassSpeedMinPct) / 60;
                     const maxSpeedPx = (dimensions.w * balance.hourglassSpeedMaxPct) / 60;
                     const speed = minSpeedPx + Math.random() * (maxSpeedPx - minSpeedPx);
                     
                     const vx = isLeft ? speed : -speed;
                     const vy = (Math.random() - 0.5) * speed * 0.5; // Slight vertical drift

                     return [...prev, {
                         id: Math.random().toString(36).substr(2, 9),
                         x: startX, y: startY, vx, vy, type: CollectibleType.HOURGLASS,
                         expiresAt: Date.now() + balance.hourglassLifeTime
                     }];
                });
            }
            scheduleHourglass();
        }, delay);
    };

    const scheduleHeart = () => {
        const delay = Math.random() * (balance.heartSpawnMax - balance.heartSpawnMin) + balance.heartSpawnMin;
        heartTimeout = setTimeout(() => {
            if (livesRef.current === balance.heartThresholdLives && timeLeftRef.current < balance.heartThresholdTime) {
                if (Math.random() < balance.heartProb) {
                     setCollectibles(prev => {
                         if (prev.some(c => c.type === CollectibleType.HEART)) return prev;
                         
                         // SPAWN OFF SCREEN (Left or Right)
                         const isLeft = Math.random() > 0.5;
                         const startX = isLeft ? -70 : dimensions.w + 70;
                         const startY = offsetY + Math.random() * safeH;
                         
                         // Calculate velocity to cross screen
                         const minSpeedPx = (dimensions.w * balance.hourglassSpeedMinPct) / 60;
                         const maxSpeedPx = (dimensions.w * balance.hourglassSpeedMaxPct) / 60;
                         const speed = minSpeedPx + Math.random() * (maxSpeedPx - minSpeedPx);
                         
                         const vx = isLeft ? speed : -speed;
                         const vy = (Math.random() - 0.5) * speed * 0.5;

                         return [...prev, {
                             id: Math.random().toString(36).substr(2, 9),
                             x: startX, y: startY, vx, vy, type: CollectibleType.HEART, expiresAt: Date.now() + balance.heartLifeTime
                         }];
                     });
                }
            }
            scheduleHeart();
        }, delay);
    };

    scheduleHourglass();
    scheduleHeart();

    return () => {
        clearTimeout(hourglassTimeout);
        clearTimeout(heartTimeout);
    };
  }, [difficulty, isLevelComplete, dimensions]);


  // Physics Loop (Includes Drag Interpolation)
  useEffect(() => {
    let animationFrameId: number;
    const balance = GAME_BALANCE[difficulty];

    const animate = () => {
      const safeW = dimensions.w * (1 - balance.atomPaddingFactor);
      const safeH = dimensions.h - balance.uiSafeZoneMargin;
      const minX = (dimensions.w - safeW) / 2;
      const maxX = minX + safeW;
      const minY = (dimensions.h - balance.uiSafeZoneMargin - safeH) / 2;
      const maxY = minY + safeH;

      setCollectibles(prev => prev.filter(c => {
          if (c.type === CollectibleType.HEART) {
              if (c.x < -200 || c.x > dimensions.w + 200) return false;
              if (livesRef.current > balance.heartThresholdLives) return false;
          }
          if (c.type === CollectibleType.HOURGLASS) {
              if (c.x < -200 || c.x > dimensions.w + 200) return false;
              if (timeLeftRef.current >= balance.hourglassThreshold) return false;
          }
          return true;
      }).map(c => {
          const jitter = balance.hourglassWanderAmp;
          let nextVx = c.vx + (Math.random() - 0.5) * jitter;
          let nextVy = c.vy + (Math.random() - 0.5) * jitter;
          
          const maxSpeedPx = (dimensions.w * balance.hourglassSpeedMaxPct) / 60 * 2; 
          nextVx = Math.max(-maxSpeedPx, Math.min(maxSpeedPx, nextVx));
          
          if (c.vx > 0 && nextVx < 0) nextVx = 0.5;
          if (c.vx < 0 && nextVx > 0) nextVx = -0.5;

          let nextX = c.x + nextVx;
          let nextY = c.y + nextVy;

          if (nextY < minY - 50 || nextY > maxY + 50) nextVy = -nextVy;
          
          return { ...c, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
      }));

      setFloatingElectrons(prev => 
        prev.map(e => {
          // SMOOTH DRAG LOGIC
          if (e.id === draggingId) {
              const target = dragInputPos.current;
              
              // Lerp position
              const smoothX = lerp(e.x, target.x, MOBILE_TUNING.smoothing_factor);
              const smoothY = lerp(e.y, target.y, MOBILE_TUNING.smoothing_factor);
              
              let finalX = smoothX;
              let finalY = smoothY;

              // GEOMETRIC DETECTION in Animation Loop (For feedback)
              const geomOrbitalId = getHoveredOrbitalId(target.x + (svgRef.current?.getBoundingClientRect().left || 0), target.y + (svgRef.current?.getBoundingClientRect().top || 0));
              if (geomOrbitalId !== hoveredOrbitalId) {
                   setHoveredOrbitalId(geomOrbitalId);
                   setHoveredOrbitalName(geomOrbitalId);
              }

              // SNAP TO ORBITAL LOGIC (MOBILE ASSIST)
              if (MOBILE_TUNING.mobile_assist_enabled) {
                  const needed = getNextOrbitalForElectron(electronCount);
                  if (needed && e.type === needed.type) {
                      const targetR = getVisualRadius(needed);
                      
                      // Center of atom
                      const cx = dimensions.w / 2;
                      const cy = dimensions.h / 2 - 20;
                      const dx = smoothX - cx;
                      const dy = smoothY - cy;
                      const dist = Math.sqrt(dx*dx + dy*dy) / atomScale;
                      
                      const snapDist = Math.abs(dist - targetR);
                      
                      if (snapDist < MOBILE_TUNING.snap_radius_dp) {
                           // Magnetic pull towards the ring radius
                           const angle = Math.atan2(dy, dx);
                           const snapX = cx + Math.cos(angle) * targetR * atomScale;
                           const snapY = cy + Math.sin(angle) * targetR * atomScale;
                           
                           // Interpolate towards snap point
                           finalX = lerp(smoothX, snapX, MOBILE_TUNING.snap_strength);
                           finalY = lerp(smoothY, snapY, MOBILE_TUNING.snap_strength);
                      }
                  }
              }

              return { ...e, x: finalX, y: finalY };
          }

          // Normal Physics
          const jitter = 2;
          let newVx = e.vx + (Math.random() - 0.5) * jitter;
          let newVy = e.vy + (Math.random() - 0.5) * jitter;
          const maxSpeed = SPEEDS[difficulty] * (e.isBonus ? 1.5 : 1);
          newVx = Math.max(-maxSpeed, Math.min(maxSpeed, newVx));
          newVy = Math.max(-maxSpeed, Math.min(maxSpeed, newVy));
          let newX = e.x + newVx;
          let newY = e.y + newVy;
          if (newX <= 20 || newX >= dimensions.w - 20) { newVx = -newVx; newX = Math.max(20, Math.min(newX, dimensions.w - 20)); }
          if (newY <= 20 || newY >= dimensions.h - 20) { newVy = -newVy; newY = Math.max(20, Math.min(newY, dimensions.h - 20)); }
          return { ...e, x: newX, y: newY, vx: newVx, vy: newVy };
        })
      );
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [difficulty, draggingId, dimensions, atomScale, electronCount, hoveredOrbitalId, getHoveredOrbitalId]);

  // UPDATED POINTER HANDLERS WITH CAPTURE & HAPTIC
  const handlePointerDown = (e: React.PointerEvent, electronId: string) => {
    if (isLevelComplete) return;
    e.stopPropagation(); // Prevent triggering other elements
    e.preventDefault();  // Prevent scroll
    
    // Haptic
    if (navigator.vibrate) navigator.vibrate(15);

    // Pointer Capture
    const target = e.target as Element;
    if (target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
    }

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        dragInputPos.current = { x: e.clientX - svgRect.left, y: e.clientY - svgRect.top };
    }

    AudioController.init();
    const el = floatingElectrons.find(e => e.id === electronId);
    if(el) {
        setDraggingId(electronId);
        AudioController.playGrab();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isLevelComplete) return;
    e.preventDefault();
    
    if (draggingId) {
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        // Update Ref Only - Physics loop handles the smooth state update
        dragInputPos.current = { x: e.clientX - svgRect.left, y: e.clientY - svgRect.top };
      }
      
      // Note: Orbital detection is now handled in the animation loop using getHoveredOrbitalId
      // to support smooth geometry based detection regardless of element events.
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId || isLevelComplete) return;
    e.preventDefault();
    
    // Release Capture
    const target = e.target as Element;
    if (target.releasePointerCapture) {
        target.releasePointerCapture(e.pointerId);
    }

    const droppedElectron = floatingElectrons.find(el => el.id === draggingId);
    if (!droppedElectron) return;

    // GEOMETRIC DROP DETECTION (Reliable on Mobile)
    // Calculate where the pointer is relative to Atom Center
    const targetOrbitalId = getHoveredOrbitalId(e.clientX, e.clientY);

    if (targetOrbitalId) {
        const needed = getNextOrbitalForElectron(electronCount);
        if (needed && targetOrbitalId === needed.name && droppedElectron.type === needed.type) {
            setFeedbackMsg({ x: droppedElectron.x, y: droppedElectron.y, text: '+1', success: true });
            onElectronCaptured(!!droppedElectron.isBonus);
            AudioController.playSuccess();
            setFloatingElectrons(prev => prev.filter(el => el.id !== draggingId));
        } else {
            onMistake();
            AudioController.playMistake();
            setFeedbackMsg({ x: droppedElectron.x, y: droppedElectron.y, text: '✖', success: false });
        }
    }
    setDraggingId(null);
    setHoveredOrbitalId(null);
    setHoveredOrbitalName(null);
    setTimeout(() => setFeedbackMsg(null), 1000);
  };

  const handleCollectibleClick = (e: React.PointerEvent | React.MouseEvent, c: CollectibleItem) => {
      if (c.type === CollectibleType.HOURGLASS) {
          onTimeBonus();
          setFeedbackMsg({ x: c.x, y: c.y, text: `+${GAME_BALANCE[difficulty].timeReward}s`, success: true });
      } else {
          onLifeBonus();
          setFeedbackMsg({ x: c.x, y: c.y, text: '+1 Vida', success: true });
      }
      // Sound for collecting is success sound for now, or separate could be added
      AudioController.playSuccess(); 
      setCollectibles(prev => prev.filter(item => item.id !== c.id));
      setTimeout(() => setFeedbackMsg(null), 1500);
  };

  return (
    <div className={`w-full h-full relative overflow-hidden ${isLevelComplete ? 'victory-container' : ''} ${isLevelComplete ? 'victory-glow' : ''}`}>
      <svg 
        ref={svgRef}
        className="w-full h-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        // Ensure touch-action none is applied for mobile
        style={{ touchAction: 'none' }}
      >
        <defs>
            <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="40%" stopColor={currentElement.color} />
                <stop offset="100%" stopColor={currentElement.color} stopOpacity="1" />
            </radialGradient>
        </defs>

        <g 
            transform={`translate(${dimensions.w / 2}, ${dimensions.h / 2 - 20}) scale(${atomScale})`} 
            className="transition-transform duration-300 ease-out"
            style={isLevelComplete ? { 
                transition: 'transform 0.9s cubic-bezier(0.33, 1, 0.68, 1)', 
                // Shift UP by 25% of height to make room at bottom
                transform: `translate(${dimensions.w / 2}px, ${dimensions.h * 0.35}px) scale(${atomScale * 1.25})` 
            } : {}}
        >
            {[...visibleOrbitals].reverse().map(orb => (
                <OrbitalRenderer 
                    key={orb.name} 
                    orbital={orb} 
                    isHovered={hoveredOrbitalId === orb.name}
                    onHover={setHoveredOrbitalId} // This is now mostly visual fallback, actual logic handled in GameCanvas
                    scale={1} 
                />
            ))}

            {Array.from({ length: electronCount }).map((_, i) => {
                const orb = ORBITAL_ORDER.find(o => i >= o.startElectronIndex && i < o.startElectronIndex + o.capacity);
                if (!orb) return null;
                return <QuantumElectron key={i} index={i} orbital={orb} scale={1} coreRadius={40} allPositionsRef={electronPositionsRef} />;
            })}

            <circle 
                cx="0" cy="0" r={40} 
                fill={`url(#nucleusGrad)`}
                stroke="rgba(255,255,255,0.3)" strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 15px ${currentElement.color})` }}
            />
            <text 
                x="0" y="0" 
                dy="0.35em" 
                textAnchor="middle" 
                fill={['#ffffff', '#ffff00'].includes(currentElement.color) ? 'black' : 'white'} 
                fontSize="28" 
                fontWeight="900"
                style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            >
                {currentElement.symbol}
            </text>
        </g>

        {/* Collectibles: Rendered LAST (on top) and with filter for visibility */}
        {collectibles.map(c => {
            const balance = GAME_BALANCE[difficulty];
            const scale = c.type === CollectibleType.HOURGLASS ? balance.hourglassScale : balance.heartScale;
            return (
                <g 
                    key={c.id} 
                    transform={`translate(${c.x}, ${c.y}) scale(${scale})`}
                    className="cursor-pointer"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        handleCollectibleClick(e, c);
                    }}
                    style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }} 
                >
                    <animateTransform attributeName="transform" type="translate" from={`${c.x} ${c.y}`} to={`${c.x} ${c.y - 10}`} dur="2s" repeatCount="indefinite" additive="sum" values={`0 0; 0 -10; 0 0`} />
                    {/* Hitbox increased for collectibles */}
                    <circle r="70" fill="rgba(255,255,255,0.001)" stroke="transparent" strokeWidth="0" /> 
                    <text fontSize="30" textAnchor="middle" dy="0.35em">{c.type === CollectibleType.HOURGLASS ? '⏳' : '❤️'}</text>
                    <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" />
                </g>
            );
        })}

        {floatingElectrons.map(el => (
            <g 
                key={el.id} 
                transform={`translate(${el.x}, ${el.y})`}
                onPointerDown={(e) => handlePointerDown(e, el.id)}
                // Dynamically set pointer events to 'none' while dragging so pointer goes through to orbital
                style={{ 
                    cursor: 'grab', 
                    pointerEvents: draggingId === el.id || isLevelComplete ? 'none' : 'auto',
                    touchAction: 'none'
                }}
            >
                {/* Mobile Target Reticle - Visible only when dragging */}
                {draggingId === el.id && (
                  <g>
                    <circle r="50" fill="none" stroke="white" strokeWidth="3" opacity="0.6" strokeDasharray="8,4">
                       <animate attributeName="r" values="45;55;45" dur="1s" repeatCount="indefinite" />
                       <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
                       <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <line x1="0" y1="-60" x2="0" y2="-40" stroke="white" strokeWidth="3" />
                    <line x1="0" y1="40" x2="0" y2="60" stroke="white" strokeWidth="3" />
                    <line x1="-60" y1="0" x2="-40" y2="0" stroke="white" strokeWidth="3" />
                    <line x1="40" y1="0" x2="60" y2="0" stroke="white" strokeWidth="3" />
                  </g>
                )}
                
                {/* Electron Visual - Scaled up when dragging */}
                <g transform={draggingId === el.id ? 'scale(1.2)' : 'scale(1)'}>
                    <circle 
                        r={draggingId === el.id ? 10 : 7} 
                        fill={ORBITAL_COLORS[el.type].electron}
                        stroke="white"
                        strokeWidth={el.isBonus ? 3 : 1}
                        opacity={0.9}
                        className="transition-all"
                    />
                    
                    {/* Bonus Glow */}
                    {el.isBonus && (
                        <circle r="12" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.6">
                            <animate attributeName="r" values="10;15;10" dur="0.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0;0.8" dur="0.5s" repeatCount="indefinite" />
                        </circle>
                    )}
                </g>
                
                {/* Larger Hit Area for Touch */}
                <circle r={MOBILE_TUNING.touch_target_min_dp} fill={MOBILE_TUNING.debug_show_hitboxes ? "rgba(255,0,0,0.3)" : "transparent"} /> 
            </g>
        ))}

        {feedbackMsg && (
            <text 
                x={feedbackMsg.x} 
                y={feedbackMsg.y - 20} 
                textAnchor="middle" 
                fill={feedbackMsg.success ? '#4ade80' : '#ef4444'} 
                fontSize="24" 
                fontWeight="bold"
                className="animate-float"
                style={{ textShadow: '0 2px 4px black' }}
            >
                {feedbackMsg.text}
            </text>
        )}

      </svg>
    </div>
  );
};
