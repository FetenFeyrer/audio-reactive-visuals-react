import { useState } from "react";
import useAnalyser from "../hooks/useAnalyser";
import { useAudioControls } from "../hooks/useAudioControls";
import AudioControls from "./AudioControls";
import Scene3D from "./Scene3D";

export default function AudioVisR3F() {
  const { fftSize, smoothing } = useAudioControls();
  const [amp, setAmp] = useState(0);

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
      <AudioControls
        ready={ready}
        start={start}
        stop={stop}
        error={error}
        devices={devices}
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        amp={amp}
      />
      
      <Scene3D
        ready={ready}
        getFreqData={getFreqData}
        amp={amp}
        setAmp={setAmp}
      />
    </div>
  );
}