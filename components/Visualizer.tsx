import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ParticleMode } from '../types';

interface VisualizerProps {
  mode: ParticleMode;
  imageFile: File | null;
}

const PARTICLE_COUNT = 15000;
const ANIMATION_SPEED = 0.08;

const Particles: React.FC<{ mode: ParticleMode; imageFile: File | null }> = ({ mode, imageFile }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Store target positions
  const targets = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  // Store current positions for manual lerping (Three.js buffer attributes)
  const currentPositions = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  
  // Geometries
  const treePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Cone/Spiral Shape
      const y = Math.random() * 20 - 10; // Height -10 to 10
      const radius = (10 - y) * 0.4 * Math.random(); // Tapered radius
      const angle = i * 0.1 + y * 2; // Spiral effect
      
      arr[i3] = Math.cos(angle) * radius;
      arr[i3 + 1] = y;
      arr[i3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  const explodePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Sphere explosion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 15 + Math.random() * 25; // Large spread
      
      arr[i3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const [imagePositions, setImagePositions] = useState<Float32Array | null>(null);

  // Initialize current positions to tree
  useEffect(() => {
    currentPositions.current.set(treePositions);
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [treePositions]);

  // Process uploaded image
  useEffect(() => {
    if (!imageFile) return;

    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale down for performance
      const size = 200; 
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const data = ctx.getImageData(0, 0, size, size).data;
      const validPixels: {x: number, y: number}[] = [];

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const alpha = data[idx + 3];
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          // Only take visible pixels
          if (alpha > 128 && brightness > 30) {
            validPixels.push({
              x: (x / size) * 14 - 7, // Map to -7 to 7 world units
              y: -((y / size) * 14 - 7) // Flip Y
            });
          }
        }
      }

      const newPos = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        if (validPixels.length > 0) {
          // If we have more particles than pixels, reuse pixels randomly
          const pixel = validPixels[i % validPixels.length];
          newPos[i3] = pixel.x;
          newPos[i3 + 1] = pixel.y;
          newPos[i3 + 2] = (Math.random() - 0.5) * 1; // Slight depth
        } else {
          // Fallback if image is empty
          newPos[i3] = (Math.random() - 0.5) * 10;
          newPos[i3 + 1] = (Math.random() - 0.5) * 10;
          newPos[i3 + 2] = (Math.random() - 0.5) * 10;
        }
      }
      setImagePositions(newPos);
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Set Targets based on Mode
  useEffect(() => {
    let sourceArr = treePositions;
    if (mode === ParticleMode.EXPLODE) sourceArr = explodePositions;
    else if (mode === ParticleMode.IMAGE && imagePositions) sourceArr = imagePositions;
    else if (mode === ParticleMode.IMAGE && !imagePositions) sourceArr = treePositions; // Fallback
    else if (mode === ParticleMode.TREE) sourceArr = treePositions;

    targets.current.set(sourceArr);
  }, [mode, imagePositions, treePositions, explodePositions]);

  // Animation Loop
  useFrame(() => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const target = targets.current;

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      // Lerp logic: current + (target - current) * speed
      positions[i] += (target[i] - positions[i]) * ANIMATION_SPEED;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Slight rotation of the whole system for dynamism
    pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={currentPositions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={mode === ParticleMode.IMAGE ? "#ffaa00" : (mode === ParticleMode.EXPLODE ? "#ffffff" : "#D4AF37")}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
};

const Visualizer: React.FC<VisualizerProps> = (props) => {
  return (
    <div className="w-full h-screen bg-[#020402]">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={10} 
          maxDistance={50}
          autoRotate={false}
        />
        <ambientLight intensity={0.5} />
        <Particles {...props} />
        <EffectComposer disableNormalPass>
           <Bloom 
             luminanceThreshold={0.2} 
             mipmapBlur 
             intensity={1.5} 
             radius={0.6}
           />
           <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Visualizer;