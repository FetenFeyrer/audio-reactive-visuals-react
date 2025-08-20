import { useFrame } from "@react-three/fiber";
import React from "react";
function avg(arr, start = 0, end = arr?.length ?? 0) {
    if (!arr || arr.length === 0) return 0;
    const s = Math.max(0, start);
    const e = Math.min(arr.length, end);
    let sum = 0;
    for (let i = s; i < e; i++) sum += arr[i];
    return (e - s) ? sum / (e - s) : 0;
}


function AmpCalculator({ getFreqData, setAmp, ready }) {
  useFrame(() => {
    if (!ready) {
      setAmp(0);
      return;
    }
    
    const data = getFreqData?.();
    if (!data) {
      setAmp(0);
      return;
    }
    
    const bass = avg(data, 2, Math.min(48, data.length)) / 255;
    const overall = avg(data) / 255;
    const currentAmp = 0.6 * bass + 0.4 * overall;
    setAmp(currentAmp);
  });

  return null; // This component doesn't render anything
}
export default AmpCalculator;