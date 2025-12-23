export enum ParticleMode {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE',
  IMAGE = 'IMAGE',
}

export interface VisionState {
  isLoaded: boolean;
  gesture: string;
  isPinching: boolean;
  error: string | null;
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
}