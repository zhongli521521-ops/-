export enum ParticleShape {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  FIREWORKS = 'Fireworks',
}

export interface ParticleState {
  expansion: number; // 0 to 1 (hands distance)
  tension: number;   // 0 to 1 (fist scaling/jitter)
}

export interface ControlPanelProps {
  currentShape: ParticleShape;
  setShape: (s: ParticleShape) => void;
  color: string;
  setColor: (c: string) => void;
  isConnected: boolean;
  onConnect: () => void;
  particleState: ParticleState;
}
