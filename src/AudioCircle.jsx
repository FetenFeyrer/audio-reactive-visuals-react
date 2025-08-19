// AudioCircle.jsx
import { useCallback, useEffect, useRef, useState } from "react";

// Small helpers
const avg = (arr, start = 0, end = arr.length) => {
  let s = 0, n = Math.max(0, end - start);
  for (let i = start; i < end; i++) s += arr[i] || 0;
  return n ? s / n : 0;
};
const lerp = (a, b, t) => a + (b - a) * t;

export default function AudioCircle() {
  const canvasRef = useRef(null);

  // WebAudio refs
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const monitorGainRef = useRef(null);
  const rafRef = useRef(0);
  const streamRef = useRef(null);

  // UI state
  const [running, setRunning] = useState(false);
  const [monitorOn, setMonitorOn] = useState(false);
  const [fftSize, setFftSize] = useState(1024);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");

  // Enumerate input devices (after a permission grant)
  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const inputs = list.filter((d) => d.kind === "audioinput");
      setDevices(inputs);
      if (!deviceId && inputs[0]) setDeviceId(inputs[0].deviceId || "");
    } catch (e) {
      // ignore if blocked
    }
  }, [deviceId]);

  // Drawing loop
  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx2d = canvas.getContext("2d");
    const { width, height } = canvas;
    const bins = analyser.frequencyBinCount;

    const freq = new Uint8Array(bins);
    const time = new Uint8Array(bins); // same length as frequencyBinCount
    analyser.getByteFrequencyData(freq);
    analyser.getByteTimeDomainData(time);

    // Basic features
    const bass = avg(freq, 2, Math.min(32, bins)) / 255; // low-end energy
    const mid = avg(freq, 32, Math.min(128, bins)) / 255;
    const overall = avg(freq) / 255;

    // Simple smoothed gain
    loop.smoothed = lerp(loop.smoothed ?? 0, bass * 1.2 + overall * 0.5, 0.15);

    // Draw
    ctx2d.clearRect(0, 0, width, height);
    ctx2d.fillStyle = "#000";
    ctx2d.fillRect(0, 0, width, height);

    const radius = Math.max(40, Math.min(width, height) * (0.15 + loop.smoothed * 0.35));
    const cx = width / 2;
    const cy = height / 2;

    // Glow background
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
    ctx2d.fillStyle = `rgba(255,255,255,${0.08 + mid * 0.15})`;
    ctx2d.fill();

    // Main circle
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx2d.fillStyle = `rgba(255,255,255,${0.65 + overall * 0.3})`;
    ctx2d.fill();

    // Ring that jitters with bass
    ctx2d.beginPath();
    ctx2d.lineWidth = 4 + bass * 10;
    ctx2d.strokeStyle = `rgba(255,255,255,${0.4 + bass * 0.4})`;
    ctx2d.arc(cx, cy, radius + 16 + bass * 30, 0, Math.PI * 2);
    ctx2d.stroke();

    rafRef.current = requestAnimationFrame(loop);
  }, []);
  // hold mutable property on function
  loop.smoothed = 0;

  const start = useCallback(async () => {
    setError("");
    try {
      // Must be triggered by a user gesture
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Build constraints
      const constraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
          sampleRate: ctx.sampleRate, // hint
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // After permission, enumerate devices (so labels appear)
      refreshDevices();

      const src = ctx.createMediaStreamSource(stream);
      sourceRef.current = src;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.7; // feel free to tweak
      analyserRef.current = analyser;

      // Monitoring (hearing your own mic): controlled via gain
      const monitorGain = ctx.createGain();
      monitorGain.gain.value = monitorOn ? 1 : 0;
      monitorGainRef.current = monitorGain;

      // Graph:
      // mic -> analyser
      // mic -> monitorGain -> destination (optional)
      src.connect(analyser);
      src.connect(monitorGain);
      monitorGain.connect(ctx.destination);

      // Kick off drawing
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);

      setRunning(true);
    } catch (e) {
      setError(e?.message || String(e));
      await stop(); // clean if partial init
    }
  }, [deviceId, fftSize, monitorOn, loop, refreshDevices]);

  const stop = useCallback(async () => {
    cancelAnimationFrame(rafRef.current);

    try {
      monitorGainRef.current?.disconnect();
    } catch {}
    try {
      sourceRef.current?.disconnect();
    } catch {}
    try {
      analyserRef.current?.disconnect();
    } catch {}

    // Stop tracks
    if (streamRef.current) {
      for (const tr of streamRef.current.getTracks()) tr.stop();
      streamRef.current = null;
    }

    // Close context
    if (audioCtxRef.current) {
      try {
        await audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    sourceRef.current = null;
    monitorGainRef.current = null;
    setRunning(false);
  }, []);

  // Handle monitor toggle live
  useEffect(() => {
    if (monitorGainRef.current) {
      monitorGainRef.current.gain.value = monitorOn ? 1 : 0;
    }
  }, [monitorOn]);

  // Handle fftSize change live
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = fftSize;
    }
  }, [fftSize]);

  // Resize canvas to device pixels
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = c.getBoundingClientRect();
      c.width = Math.max(2, Math.floor(rect.width * dpr));
      c.height = Math.max(2, Math.floor(rect.height * dpr));
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    resize();
    return () => ro.disconnect();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 800, margin: "20px auto", padding: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={running ? stop : start}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #444", cursor: "pointer" }}
        >
          {running ? "Stop" : "Start mic"}
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={monitorOn}
            onChange={(e) => setMonitorOn(e.target.checked)}
          />
          Monitor (hear mic)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          FFT size
          <select value={fftSize} onChange={(e) => setFftSize(parseInt(e.target.value, 10))}>
            {[256, 512, 1024, 2048, 4096].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 220 }}>
          Input
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={running}
            style={{ minWidth: 220 }}
            title={running ? "Stop first to change device" : ""}
          >
            {devices.length === 0 && <option value="">(default)</option>}
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Mic ${d.deviceId.slice(0, 6)}…`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div style={{ color: "#f55", fontFamily: "monospace" }}>
          Error: {error}
        </div>
      )}

      <div
        style={{
          height: 420,
          background: "#000",
          borderRadius: 12,
          border: "1px solid #222",
          overflow: "hidden",
        }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      <p style={{ color: "#777", fontSize: 13, lineHeight: 1.35 }}>
        Tip: Chrome/iOS require a user gesture. Click <b>Start mic</b> after choosing your device.
        For stable visuals on mobile, try FFT size 512 and disable monitoring.
      </p>
    </div>
  );
}
