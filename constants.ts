import { ParticleShape } from './types';

export const PARTICLE_COUNT = 12000;
export const SHAPES = Object.values(ParticleShape);

export const COLORS = [
  '#ffffff', // White
  '#ff0055', // Neon Red
  '#00ccff', // Cyan
  '#ccff00', // Lime
  '#aa00ff', // Purple
  '#ffaa00', // Orange
];

export const SYSTEM_INSTRUCTION = `
You are a vision-based controller for an interactive art installation.
Your goal is to analyze the video stream for the user's hand gestures and update the visual parameters.

Controls:
1. "Expansion": Estimate the horizontal distance between the user's two hands relative to their body width.
   - 0.0 = Hands touching or crossed.
   - 1.0 = Arms fully spread wide.
2. "Tension": Estimate how "tight" or "energetic" the hands look.
   - 0.0 = Open palms, relaxed fingers.
   - 1.0 = Tight fists or rapid shaking movement.

If no hands are visible, output defaults (Expansion: 0.5, Tension: 0.1).

Call the function "updateInteraction" with these values as frequently as possible (e.g., every time you process a frame).
Do not generate spoken audio responses. Just call the tool.
`;
