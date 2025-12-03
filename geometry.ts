import * as THREE from 'three';
import { ParticleShape } from '../types';

export const generateGeometry = (shape: ParticleShape, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (shape) {
      case ParticleShape.HEART: {
        // Parametric heart
        const t = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.3); // distribute internally
        const scale = 0.5;
        x = scale * 16 * Math.pow(Math.sin(t), 3) * r;
        y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;
        z = (Math.random() - 0.5) * 5 * r;
        break;
      }
      case ParticleShape.FLOWER: {
        // 3D Rose/Flower
        const u = Math.random() * Math.PI * 2; // angle
        const v = Math.random() * Math.PI; // elevation
        const k = 4; // petals
        const r = Math.sin(k * u) * Math.sin(v) * 5; 
        
        // Add some volume
        const spread = (Math.random() - 0.5);
        x = (r + spread) * Math.sin(u) * Math.sin(v);
        y = (r + spread) * Math.cos(v); // height
        z = (r + spread) * Math.cos(u) * Math.sin(v);
        break;
      }
      case ParticleShape.SATURN: {
        if (i < count * 0.3) {
           // Planet
           const r = 3 * Math.cbrt(Math.random());
           const theta = Math.random() * Math.PI * 2;
           const phi = Math.acos(2 * Math.random() - 1);
           x = r * Math.sin(phi) * Math.cos(theta);
           y = r * Math.sin(phi) * Math.sin(theta);
           z = r * Math.cos(phi);
        } else {
           // Rings
           const angle = Math.random() * Math.PI * 2;
           const dist = 4.5 + Math.random() * 4;
           x = dist * Math.cos(angle);
           z = dist * Math.sin(angle);
           y = (Math.random() - 0.5) * 0.2; // Thin disk
           
           // Tilt
           const tilt = Math.PI / 6;
           const yNew = y * Math.cos(tilt) - z * Math.sin(tilt);
           const zNew = y * Math.sin(tilt) + z * Math.cos(tilt);
           y = yNew;
           z = zNew;
        }
        break;
      }
      case ParticleShape.BUDDHA: {
        // Approximate meditating figure with primitives
        const r = Math.random();
        
        // Head
        if (r < 0.15) {
            const rad = 1.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            x = rad * Math.sin(phi) * Math.cos(theta);
            y = rad * Math.sin(phi) * Math.sin(theta) + 3; // Shift up
            z = rad * Math.cos(phi);
        } 
        // Torso
        else if (r < 0.55) {
            const radX = 2.0; 
            const radY = 2.5;
            const theta = Math.random() * Math.PI * 2;
            const h = Math.random() * 2 - 1; // -1 to 1
            const w = Math.sqrt(1 - h*h);
            
            x = w * radX * Math.cos(theta);
            y = h * radY;
            z = w * radX * Math.sin(theta);
        }
        // Legs/Base
        else {
             const t = Math.random() * Math.PI * 2;
             const rad = 3.5 * Math.sqrt(Math.random());
             x = rad * Math.cos(t);
             z = rad * Math.sin(t);
             y = -2.5 + (Math.random() * 1.5); // Base height
        }
        break;
      }
      case ParticleShape.FIREWORKS: {
         // Sphere burst, but will be animated in shader/update loop more aggressively
         const r = 8 * Math.cbrt(Math.random());
         const theta = Math.random() * Math.PI * 2;
         const phi = Math.acos(2 * Math.random() - 1);
         x = r * Math.sin(phi) * Math.cos(theta);
         y = r * Math.sin(phi) * Math.sin(theta);
         z = r * Math.cos(phi);
         break;
      }
      default:
        x = (Math.random() - 0.5) * 10;
        y = (Math.random() - 0.5) * 10;
        z = (Math.random() - 0.5) * 10;
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }
  return positions;
};
