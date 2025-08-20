import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Glitch, Noise } from "@react-three/postprocessing";
import { GlitchMode } from "postprocessing";
const avg = (arr, a = 0, b = arr.length) => {
  let s = 0, n = Math.max(0, b - a);
  for (let i = a; i < b; i++) s += arr[i] || 0;
  return n ? s / n : 0;
};

const lerp = (a, b, t) => a + (b - a) * t;

export default function ReactiveEffects({ getFreqData }) {
  const bassRef = useRef(0);
  
  useFrame(() => {
    const data = getFreqData?.();
    if (!data) return;
    
    const bass = avg(data, 2, Math.min(48, data.length)) / 255;
    bassRef.current = lerp(bassRef.current, bass, 0.1);
  });

  return (
    <EffectComposer>
      <Bloom 
        intensity={0.5 + bassRef.current * 2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
      />
      <Noise 
        opacity={0.02 + bassRef.current * 0.1}
      />
      <Glitch
        delay={[1.5, 3.5]}
        duration={[0.6, 1.0]}
        strength={[0.3, 1.0]}
        mode={GlitchMode.SPORADIC}
        active={bassRef.current > 0.7}
        ratio={0.85}
      />
    </EffectComposer>
  );
}