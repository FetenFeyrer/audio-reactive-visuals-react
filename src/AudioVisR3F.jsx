// AudioVisR3F.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Glitch, Noise } from "@react-three/postprocessing";import { GlitchMode } from "postprocessing";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import bgTexUrl from "./assets/bg.png";

function ReactiveBG({ getFreqData }) {
  const tex = useLoader(THREE.TextureLoader, bgTexUrl);
  const meshRef = useRef();
  useEffect(() => {
    if (tex) {
      if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    }
  }, [tex]);

  useFrame(() => {
    const data = getFreqData?.();
    if (!data || !meshRef.current) return;
    const bass = avg(data, 2, Math.min(48, data.length)) / 255;
    const overall = avg(data) / 255;
    const amp = 0.6 * bass + 0.4 * overall;
    const target = 1 + amp * 0.5; // slightly reduced pulse
    const current = meshRef.current.scale.x;
    const s = lerp(current, target, 0.12);
    meshRef.current.scale.setScalar(s);
    meshRef.current.material.opacity = 0.9; // a bit brighter
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1.2]}>
      {/* smaller base geometry (was 6x6) */}
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial map={tex} transparent />
    </mesh>
  );
}


/* ---------- helpers ---------- */
const avg = (arr, a = 0, b = arr.length) => {
  let s = 0, n = Math.max(0, b - a);
  for (let i = a; i < b; i++) s += arr[i] || 0;
  return n ? s / n : 0;
};
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- audio hook (raw Web Audio) ---------- */
function useAnalyser({ fftSize, smoothing }) {
  const [ready, setReady] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");

  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const srcRef = useRef(null);
  const streamRef = useRef(null);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const inputs = list.filter((d) => d.kind === "audioinput");
      setDevices(inputs);
      if (!deviceId && inputs[0]) setDeviceId(inputs[0].deviceId || "");
    } catch {}
  }, [deviceId]);

  const start = useCallback(async () => {
    setError("");
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;

      const constraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: ctx.sampleRate,
        },
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const src = ctx.createMediaStreamSource(stream);
      srcRef.current = src;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      analyserRef.current = analyser;

      src.connect(analyser);
      await refreshDevices();
      setReady(true);
    } catch (e) {
      setError(e?.message || String(e));
      stop();
    }
  }, [deviceId, fftSize, smoothing, refreshDevices]);

  const stop = useCallback(async () => {
    try { srcRef.current?.disconnect(); } catch {}
    try { analyserRef.current?.disconnect(); } catch {}
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (ctxRef.current) {
      try { await ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
    setReady(false);
  }, []);

  // live updates when user changes panel values
  useEffect(() => {
    if (analyserRef.current) analyserRef.current.fftSize = fftSize;
  }, [fftSize]);
  useEffect(() => {
    if (analyserRef.current) analyserRef.current.smoothingTimeConstant = smoothing;
  }, [smoothing]);

  // supply a cached Uint8Array to avoid per-frame allocs
  const getFreqData = useCallback(() => {
    const a = analyserRef.current;
    if (!a) return null;
    if (!getFreqData.cache || getFreqData.cache.length !== a.frequencyBinCount) {
      getFreqData.cache = new Uint8Array(a.frequencyBinCount);
    }
    a.getByteFrequencyData(getFreqData.cache);
    return getFreqData.cache;
  }, []);
  getFreqData.cache = null;

  return {
    ready, start, stop, error,
    devices, deviceId, setDeviceId,
    getFreqData,
  };
}

/* ---------- R3F visuals ---------- */

// 1) Spectrum bars
function Bars({ getFreqData }) {
  const group = useRef();
  const count = 64; // draw first 64 bins
  const tmp = useMemo(() => new Array(count).fill(0), [count]);

  useFrame(() => {
    const data = getFreqData?.();
    if (!data || !group.current) return;
    for (let i = 0; i < count; i++) {
      const v = (data[i] ?? 0) / 255;
      const h = 0.05 + v * 1.2;
      const m = group.current.children[i];
      if (!m) continue;
      m.scale.y = lerp(m.scale.y, h, 0.25);
      m.position.y = m.scale.y / 2;
      // color by bin index
      const hue = i / count;
      m.material.color.setHSL(hue, 0.7, clamp(0.3 + v * 0.5, 0.3, 0.85));
    }
  });

  return (
    <group ref={group} position={[-1.6, -0.9, 0]}>
      {tmp.map((_, i) => (
        <mesh key={i} position={[i * 0.05, 0, 0]}>
          <boxGeometry args={[0.045, 0.1, 0.045]} />
          <meshStandardMaterial roughness={0.35} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// 2) Instanced particle “breathes” with bass
function BassParticles({ getFreqData }) {
  const inst = useRef();
  const N = 1500;

  // reusable temp objects
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // initial positions on a (slightly noisy) shell
  const positions = useMemo(() => {
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.4 + Math.random() * 0.2;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      arr.set([x, y, z], i * 3);
    }
    return arr;
  }, []);

  const scaleRef = useRef(1);
  const hueRef = useRef(0.6);

  useFrame((_, dt) => {
    const data = getFreqData?.();
    if (!data || !inst.current) return;

    const bass = avg(data, 2, Math.min(24, data.length)) / 255;
    scaleRef.current = lerp(scaleRef.current, 1 + bass * 0.5, 0.15);
    hueRef.current = (hueRef.current + dt * (0.02 + bass * 0.2)) % 1;

    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      const x = positions[ix] * scaleRef.current;
      const y = positions[ix + 1] * scaleRef.current;
      const z = positions[ix + 2] * scaleRef.current;

      tempMatrix.makeTranslation(x, y, z);
      inst.current.setMatrixAt(i, tempMatrix);

      tempColor.setHSL(hueRef.current, 0.7, 0.5 + bass * 0.25);
      inst.current.setColorAt(i, tempColor);
    }

    inst.current.instanceMatrix.needsUpdate = true;
    if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={inst} args={[null, null, N]} position={[0, 0.1, 0]}>
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshStandardMaterial emissiveIntensity={0.3} vertexColors />
    </instancedMesh>
  );
}

// 3) Post-processing effects pulsing with bass
function ReactiveEffects({ getFreqData }) {
  const bloomRef = useRef();
  const glitchRef = useRef();

  useFrame(() => {
    const data = getFreqData?.();
    if (!data) return;
    const bass = avg(data, 2, Math.min(24, data.length)) / 255;
    const punch = Math.pow(bass, 1.5);
    if (bloomRef.current) bloomRef.current.luminanceThreshold = 0.2 - punch * 0.15;
    if (bloomRef.current) bloomRef.current.intensity = 0.6 + punch * 1.5;

    if (glitchRef.current) {
      glitchRef.current.mode = punch > 0.3 ? GlitchMode.SPORADIC : GlitchMode.DISABLED;
      glitchRef.current.duration = [0.05, 0.2];
      glitchRef.current.strength = [0.1 + punch * 0.4, 0.2 + punch * 0.6];
    }
  });

  return (
    <EffectComposer disableNormalPass>
      <Bloom ref={bloomRef} mipmapBlur intensity={0.7} />
      <Noise opacity={0.04} />
      <Glitch ref={glitchRef} delay={[1.5, 3.5]} />
    </EffectComposer>
  );
}

/* ---------- Top-level component ---------- */

export default function AudioVisR3F() {
  const { fftSize, smoothing } = useControls("Audio", {
    fftSize: { value: 1024, options: [256, 512, 1024, 2048, 4096] },
    smoothing: { value: 0.7, min: 0, max: 0.99, step: 0.01 },
  });

  const {
    ready, start, stop, error, devices, deviceId, setDeviceId, getFreqData,
  } = useAnalyser({ fftSize, smoothing });

return (
  <div
    style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      background: "#1a895fff",
      overflow: "hidden",
    }}
  >
    <Leva collapsed />
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        top: 12,
        left: 12,
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        background: "rgba(0,0,0,0.5)",
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #222",
        pointerEvents: "auto",
      }}
    >
      <button
        onClick={ready ? stop : start}
        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #444" }}
      >
        {ready ? "Stop" : "Start mic"}
      </button>
      <select
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        disabled={ready}
        style={{ padding: 6, borderRadius: 6, minWidth: 240 }}
        title={ready ? "Stop first to change device" : ""}
      >
        {devices.length === 0 && <option value="">(default)</option>}
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Mic ${d.deviceId.slice(0, 6)}…`}
          </option>
        ))}
      </select>
      {error && <span style={{ color: "#f55" }}>Error: {error}</span>}
    </div>

    <Canvas
      camera={{ position: [0, 0.8, 2.4], fov: 60 }}
      style={{ width: "100%", height: "100%", display: "block" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#ffffff"]} /> {/* bright canvas background */}
      {ready && <ReactiveBG getFreqData={getFreqData} />}

      {/* brighter lighting */}
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#ffffff", "#d0d0d0", 0.6]} />
      <directionalLight position={[3, 4, 2]} intensity={1.6} />
      <directionalLight position={[-3, 2, -2]} intensity={0.6} />

      {ready && (
        <>
          <ReactiveEffects getFreqData={getFreqData} />
        </>
      )}
      <OrbitControls enablePan={false} />
    </Canvas>
  </div>
);
}
