import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ---------- helpers ---------- */
const avg = (arr, a = 0, b = arr.length) => {
  let s = 0, n = Math.max(0, b - a);
  for (let i = a; i < b; i++) s += arr[i] || 0;
  return n ? s / n : 0;
};

const lerp = (a, b, t) => a + (b - a) * t;

export default function GlitchShards({ getFreqData, amp, shardsCount = 25 }) {
  const groupRef = useRef();
  
  const shardsData = useMemo(() => {
    return Array.from({ length: shardsCount }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 6,
      z: -2 + Math.random() * -1,
      width: 0.3 + Math.random() * 0.8,
      height: 0.2 + Math.random() * 0.6,
      rotation: Math.random() * Math.PI * 2,
      flickerSpeed: 0.5 + Math.random() * 2,
      baseOpacity: 0.1 + Math.random() * 0.3,
      glitchPhase: Math.random() * Math.PI * 2,
    }));
  }, [shardsCount]);

  const timeRef = useRef(0);
  const bassRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const data = getFreqData?.();
    if (!data) return;

    timeRef.current += delta;
    const treble = avg(data, Math.floor(data.length * 0.7), data.length) / 255;
    const bass = avg(data, 2, Math.min(48, data.length)) / 255;
    bassRef.current = lerp(bassRef.current, bass, 0.15);

    // Trigger glitch bursts based on treble + bass intensity
    const glitchIntensity = (treble * 0.7 + bassRef.current * 0.3);
    const shouldGlitch = glitchIntensity > 0.4 || (Math.random() < 0.02 + glitchIntensity * 0.1);

    groupRef.current.children.forEach((mesh, i) => {
      const shard = shardsData[i];
      if (!mesh || !mesh.material) return;

      // Base flicker pattern
      const flickerValue = Math.sin(timeRef.current * shard.flickerSpeed + shard.glitchPhase);
      let opacity = shard.baseOpacity * (0.3 + 0.7 * Math.abs(flickerValue));

      // Intense glitch bursts
      if (shouldGlitch) {
        const burstPhase = Math.sin(timeRef.current * 15 + i * 0.5);
        opacity *= 1 + burstPhase * 3 * glitchIntensity;
        
        // Random position jitter during glitch
        const jitterX = (Math.random() - 0.5) * 0.2 * glitchIntensity;
        const jitterY = (Math.random() - 0.5) * 0.2 * glitchIntensity;
        mesh.position.set(shard.x + jitterX, shard.y + jitterY, shard.z);
        
        // Random scale variation
        const scaleJitter = 1 + (Math.random() - 0.5) * 0.5 * glitchIntensity;
        mesh.scale.set(scaleJitter, scaleJitter, 1);
      } else {
        // Return to base position
        mesh.position.set(shard.x, shard.y, shard.z);
        mesh.scale.set(1, 1, 1);
      }

      // Opacity with audio reactivity
      opacity = Math.max(0, Math.min(1, opacity * (0.5 + amp * 2)));
      mesh.material.opacity = opacity;

      // Subtle rotation
      mesh.rotation.z = shard.rotation + timeRef.current * 0.1 + bassRef.current * 0.5;
    });
  });

  // Only show when there's some audio activity
  if (amp < 0.3) return null;

  return (
    <group ref={groupRef}>
      {shardsData.map((shard) => (
        <mesh
          key={shard.id}
          position={[shard.x, shard.y, shard.z]}
          rotation={[0, 0, shard.rotation]}
        >
          <planeGeometry args={[shard.width, shard.height]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={shard.baseOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}