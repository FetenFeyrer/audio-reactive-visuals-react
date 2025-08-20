import { useCallback, useEffect, useRef, useState } from "react";

/* ---------- helpers ---------- */
const avg = (arr, a = 0, b = arr.length) => {
  let s = 0, n = Math.max(0, b - a);
  for (let i = a; i < b; i++) s += arr[i] || 0;
  return n ? s / n : 0;
};

export { avg };

export default function useAnalyser({ fftSize, smoothing }) {
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
    } catch (error) {
      setError(error.message);
    }
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
    try { 
      srcRef.current?.disconnect(); 
    } catch {
      // Failed to disconnect audio source
    }
    try { 
      analyserRef.current?.disconnect(); 
    } catch {
      // Failed to disconnect audio analyser
    }
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (ctxRef.current) {
      try { 
        await ctxRef.current.close(); 
      } catch {
        // Failed to close audio context
      }
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

  const getFreqData = useCallback(() => {
    if (!analyserRef.current) return null;
    const len = analyserRef.current.frequencyBinCount;
    const buf = new Uint8Array(len);
    analyserRef.current.getByteFrequencyData(buf);
    return buf;
  }, []);

  return {
    ready, start, stop, error, devices, deviceId, setDeviceId, getFreqData
  };
}