import { ORBITAL_ORDER } from '../constants';
import { OrbitalDefinition } from '../types';

/**
 * Returns the orbital definition that the next electron should go into.
 */
export const getNextOrbitalForElectron = (currentElectronCount: number): OrbitalDefinition | null => {
  for (const orbital of ORBITAL_ORDER) {
    if (currentElectronCount < orbital.startElectronIndex + orbital.capacity) {
      return orbital;
    }
  }
  return null;
};

/**
 * Breaks down total electrons into orbital buckets for box diagrams.
 */
export const getElectronConfiguration = (totalElectrons: number) => {
  const config: { orbital: OrbitalDefinition; count: number }[] = [];
  
  let remaining = totalElectrons;
  
  for (const orb of ORBITAL_ORDER) {
    if (remaining <= 0) break;
    
    const take = Math.min(remaining, orb.capacity);
    config.push({ orbital: orb, count: take });
    remaining -= take;
  }
  
  return config;
};

/**
 * Hund's rule helper for visualization.
 * Returns array of -1 (down), 1 (up), 0 (empty) for a subshell.
 * E.g., p-orbital with 2 electrons -> [1, 1, 0]
 * p-orbital with 4 electrons -> [1, 1, 1] then pair first -> [-1/1, 1, 1] visualized as arrows
 */
export const getHundsDistribution = (capacity: number, currentCount: number): ('up' | 'down' | 'both' | 'empty')[] => {
  const orbitalsCount = capacity / 2; // s=1, p=3, d=5
  const distribution: ('up' | 'down' | 'both' | 'empty')[] = Array(orbitalsCount).fill('empty');
  
  // Fill all up first
  for (let i = 0; i < orbitalsCount; i++) {
    if (currentCount > i) {
      distribution[i] = 'up';
    }
  }
  
  // Then pair
  for (let i = 0; i < orbitalsCount; i++) {
    if (currentCount > i + orbitalsCount) {
      distribution[i] = 'both';
    }
  }
  
  return distribution;
};
