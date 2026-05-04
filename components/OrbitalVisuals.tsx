
import React from 'react';
import { OrbitalDefinition, OrbitalType } from '../types';
import { ORBITAL_COLORS, VISUAL_TUNING } from '../constants';

interface OrbitalVisualProps {
  orbital: OrbitalDefinition;
  isHovered: boolean;
  onHover: (name: string | null) => void;
  scale: number;
}

const Label: React.FC<{ x: number; y: number; text: string; color: string; scale: number; visible: boolean }> = ({ x, y, text, color, scale, visible }) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={Math.max(14, 32 * scale)} 
    fontWeight="bold"
    textAnchor="middle"
    alignmentBaseline="middle"
    opacity={visible ? 1 : 0.6}
    letterSpacing={VISUAL_TUNING.labelLetterSpacing}
    style={{ pointerEvents: 'none', textShadow: '0px 0px 4px rgba(0,0,0,1)', transition: 'all 0.2s' }}
  >
    {text}
  </text>
);

const Lobes: React.FC<{ count: number; length: number; width: number; color: string; isHovered: boolean; rotationOffset?: number }> = ({ count, length, width, color, isHovered, rotationOffset = 0 }) => {
    const lobes = [];
    const angleStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const angle = i * angleStep + rotationOffset;
        lobes.push(
            <g key={i} transform={`rotate(${angle})`}>
                {/* Hitbox Lobe */}
                <ellipse 
                    cx={length / 2} cy="0" rx={length / 2} ry={width * 2.5} 
                    fill="rgba(0,0,0,0.001)" stroke="transparent" strokeWidth={40}
                />
                {/* Visual Lobe */}
                <ellipse 
                    cx={length / 2} 
                    cy="0" 
                    rx={length / 2} 
                    ry={width / 2} 
                    fill={isHovered ? color.replace('0.1', '0.3') : color}
                    stroke={color.replace('0.1', '1').replace('rgba', 'rgb').replace(/[^,]+(?=\))/, '1')} 
                    strokeWidth={isHovered ? 3 : 1.5}
                    style={{ filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none', pointerEvents: 'none' }}
                />
            </g>
        );
    }
    return <>{lobes}</>;
};

const SOrbital: React.FC<OrbitalVisualProps> = ({ orbital, isHovered, onHover, scale }) => {
  const styles = ORBITAL_COLORS[OrbitalType.S];
  
  let radius = 0;
  let prevRadius = 0; // Used to calculate gap
  
  if (orbital.n === 1) {
      radius = 80 * scale; 
      prevRadius = 0;
  } else {
      radius = (80 + (orbital.n - 1) * 80) * scale; 
      prevRadius = (80 + (orbital.n - 2) * 80) * scale;
  }
  
  const hitboxRadius = orbital.n === 1 ? radius / 2 : (prevRadius + radius) / 2;
  // Add +40 * scale to stroke width to ensure it covers the gap fully towards the center
  const hitboxStroke = orbital.n === 1 ? radius : (radius - prevRadius + (40 * scale));

  // Label positioning with offset
  const labelY = -radius - (isHovered ? 30 * scale : 15 * scale) - VISUAL_TUNING.labelOffsetRadius * scale;

  return (
    <g
      data-orbital-name={orbital.name}
      onMouseEnter={() => onHover(orbital.name)}
      onMouseLeave={() => onHover(null)}
      className="transition-all duration-300"
    >
        {/* HITBOX: Ring (Stroke) for outer orbitals, Circle for 1s */}
        {/* Fill set to almost transparent to catch events, NOT none */}
        <circle 
            cx="0" cy="0" 
            r={hitboxRadius} 
            fill={orbital.n === 1 ? "rgba(0,0,0,0.001)" : "none"} 
            stroke="rgba(0,0,0,0.001)"
            strokeWidth={hitboxStroke} 
        />
        
        {/* VISUAL RING */}
        <circle
            cx="0"
            cy="0"
            r={isHovered ? radius : radius}
            fill="none"
            stroke={isHovered ? styles.fill.replace('0.1', '0.4') : 'none'}
            strokeWidth={isHovered ? (radius - prevRadius) : 0} 
            style={{ pointerEvents: 'none' }} 
        />

        {/* BORDER LINE */}
        <circle
            cx="0"
            cy="0"
            r={radius}
            fill="none"
            stroke={styles.stroke}
            strokeWidth={isHovered ? 3 : 2}
            strokeDasharray={isHovered ? "none" : (orbital.n === 1 ? "none" : "5,5")}
            style={{
                filter: isHovered ? `drop-shadow(0 0 20px ${styles.stroke})` : 'none',
                pointerEvents: 'none'
            }}
        />
        <Label 
            x={0} 
            y={labelY} 
            text={orbital.name} 
            color={styles.stroke} 
            scale={scale} 
            visible={true}
        />
    </g>
  );
};

const POrbital: React.FC<OrbitalVisualProps> = ({ orbital, isHovered, onHover, scale }) => {
  const styles = ORBITAL_COLORS[OrbitalType.P];
  
  // Apply Separation Factor
  const length = (220 + (orbital.n - 2) * 60 * VISUAL_TUNING.pOrbitalSeparationFactor) * scale; 
  const width = 50 * scale;

  // Label Positioning: Push out + Offset
  let labelX = length * 0.6 + (VISUAL_TUNING.labelOffsetRadius * scale);
  let labelY = -width;

  if (orbital.n % 2 !== 0) {
     labelY -= VISUAL_TUNING.labelCollisionMargin * scale;
  }

  return (
    <g
      data-orbital-name={orbital.name}
      onMouseEnter={() => onHover(orbital.name)}
      onMouseLeave={() => onHover(null)}
    >
      <Lobes count={2} length={length} width={width} color={styles.fill} isHovered={isHovered} />
      <Label 
            x={labelX} 
            y={labelY} 
            text={orbital.name} 
            color={styles.stroke} 
            scale={scale} 
            visible={true}
      />
    </g>
  );
};

const DOrbital: React.FC<OrbitalVisualProps> = ({ orbital, isHovered, onHover, scale }) => {
   const styles = ORBITAL_COLORS[OrbitalType.D];
   const length = (180 + (orbital.n - 3) * 60) * scale;
   const width = 45 * scale;
   
   const labelOffset = VISUAL_TUNING.labelOffsetRadius * scale;

   return (
     <g 
        data-orbital-name={orbital.name}
        onMouseEnter={() => onHover(orbital.name)}
        onMouseLeave={() => onHover(null)}
     >
        <Lobes count={4} length={length} width={width} color={styles.fill} isHovered={isHovered} rotationOffset={45} />
        <Label 
            x={0} 
            y={-length * 0.6 - labelOffset} 
            text={orbital.name} 
            color={styles.stroke} 
            scale={scale} 
            visible={true}
        />
     </g>
   )
}

const FOrbital: React.FC<OrbitalVisualProps> = ({ orbital, isHovered, onHover, scale }) => {
    const styles = ORBITAL_COLORS[OrbitalType.F];
    const length = (200 + (orbital.n - 4) * 60) * scale;
    const width = 40 * scale;
    
    const labelOffset = VISUAL_TUNING.labelOffsetRadius * scale;

    return (
      <g 
         data-orbital-name={orbital.name}
         onMouseEnter={() => onHover(orbital.name)}
         onMouseLeave={() => onHover(null)}
      >
         <Lobes count={6} length={length} width={width} color={styles.fill} isHovered={isHovered} rotationOffset={30} />
         <Label 
             x={0} 
             y={-length * 0.6 - labelOffset} 
             text={orbital.name} 
             color={styles.stroke} 
             scale={scale} 
             visible={true}
         />
      </g>
    )
 }

export const OrbitalRenderer: React.FC<OrbitalVisualProps> = (props) => {
  const { orbital } = props;
  switch (orbital.type) {
    case OrbitalType.S: return <SOrbital {...props} />;
    case OrbitalType.P: return <POrbital {...props} />;
    case OrbitalType.D: return <DOrbital {...props} />;
    case OrbitalType.F: return <FOrbital {...props} />;
    default: return null;
  }
};
