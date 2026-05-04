
export enum OrbitalType {
  S = 's',
  P = 'p',
  D = 'd',
  F = 'f'
}

export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  color: string; 
  mass: number; 
  discoverer: string;
  trivia: string;
}

export interface OrbitalDefinition {
  name: string; 
  type: OrbitalType;
  n: number; 
  capacity: number;
  startElectronIndex: number; 
}

export interface FloatingElectron {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: OrbitalType;
  isBonus?: boolean;
}

export enum Difficulty {
  NORMAL = 'NORMAL',
  LEGENDARY = 'LEGENDARY'
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE_ANIMATION = 'LEVEL_COMPLETE_ANIMATION',
  LEVEL_INFO = 'LEVEL_INFO',
  NAME_INPUT = 'NAME_INPUT',
  GAME_OVER = 'GAME_OVER'
}

export interface ScoreEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
}

// NEW: Collectibles
export enum CollectibleType {
  HOURGLASS = 'HOURGLASS',
  HEART = 'HEART'
}

export interface CollectibleItem {
  id: string;
  x: number;
  y: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  type: CollectibleType;
  expiresAt: number;
}
