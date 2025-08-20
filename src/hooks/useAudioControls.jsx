import { useControls } from "leva";

export function useAudioControls() {
  return useControls("Audio", {
    fftSize: { value: 1024, options: [256, 512, 1024, 2048, 4096] },
    smoothing: { value: 0.7, min: 0, max: 0.99, step: 0.01 },
  });
}