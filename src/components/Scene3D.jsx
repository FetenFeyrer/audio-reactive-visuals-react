import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AmpCalculator from "./AmpCalculator";
import GlitchShards from "./GlitchShards";
import ReactiveBG from "./ReactiveBG";
import ReactiveEffects from "./ReactiveEffects";

export default function Scene3D({ ready, getFreqData, amp, setAmp }) {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 2.4], fov: 60 }}
      style={{ width: "100%", height: "100%", display: "block" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#000000"]} />
      
      <AmpCalculator getFreqData={getFreqData} setAmp={setAmp} ready={ready} />

      {ready && <ReactiveBG amp={amp} />}
      {ready && <GlitchShards getFreqData={getFreqData} amp={amp} shardsCount={30} />}

      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#ffffff", "#d0d0d0", 0.6]} />
      <directionalLight position={[3, 4, 2]} intensity={1.6} />
      <directionalLight position={[-3, 2, -2]} intensity={0.6} />

      {ready && <ReactiveEffects getFreqData={getFreqData} />}
      
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}