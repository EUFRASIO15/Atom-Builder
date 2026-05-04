import React from 'react';
import { getElectronConfiguration, getHundsDistribution } from '../utils/chemistry';
import { OrbitalType } from '../types';

interface BoxDiagramProps {
  electronCount: number;
}

export const BoxDiagram: React.FC<BoxDiagramProps> = ({ electronCount }) => {
  const config = getElectronConfiguration(electronCount);

  return (
    <div className="flex flex-wrap gap-4 justify-end">
      {config.map((item) => {
        const boxes = getHundsDistribution(item.orbital.capacity, item.count);
        
        return (
          <div key={item.orbital.name} className="flex flex-col items-center">
            <div className="flex gap-1">
              {boxes.map((state, idx) => (
                <div 
                  key={idx} 
                  className={`
                    w-6 h-8 border border-slate-500 bg-slate-800/50 
                    flex items-center justify-center text-xs
                    ${state !== 'empty' ? getOrbitalColorClass(item.orbital.type) : ''}
                  `}
                >
                  {state === 'up' && '↑'}
                  {state === 'down' && '↓'}
                  {state === 'both' && <span className="tracking-tighter">↑↓</span>}
                </div>
              ))}
            </div>
            <span className="text-xs font-mono text-slate-400 mt-1">{item.orbital.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const getOrbitalColorClass = (type: OrbitalType) => {
  switch (type) {
    case OrbitalType.S: return 'text-yellow-400 border-yellow-700/50';
    case OrbitalType.P: return 'text-green-400 border-green-700/50';
    case OrbitalType.D: return 'text-blue-400 border-blue-700/50';
    case OrbitalType.F: return 'text-purple-400 border-purple-700/50';
    default: return 'text-white';
  }
};
