import { useEffect, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import bgTexUrl from "/assets/bg.png";

const lerp = (a, b, t) => a + (b - a) * t;

export default function ReactiveBG({ amp }) {
  const tex = useLoader(THREE.TextureLoader, bgTexUrl);
  const meshRef = useRef();

  useEffect(() => {
    if (tex) {
      if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      tex.encoding = THREE.sRGBEncoding;
    }
  }, [tex]);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = 1 + amp * 0.5;
    const current = meshRef.current.scale.x;
    const s = lerp(current, target, 0.12);
    meshRef.current.scale.setScalar(s);
    meshRef.current.material.opacity = 0.9;
  });

  if (amp <= 0.2) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, -1.2]}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial map={tex} transparent color='#fff'/>
    </mesh>
  );
}