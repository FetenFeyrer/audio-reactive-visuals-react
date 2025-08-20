import { Leva } from "leva";

export default function AudioControls({ 
  ready, 
  start, 
  stop, 
  error, 
  devices, 
  deviceId, 
  setDeviceId, 
  amp 
}) {
  return (
    <>
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
      <div
        style={{
          position: "absolute",
          zIndex: 20,
          top: 12,
          right: 12,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 16,
        }}
      >
        amp: {amp.toFixed(3)}
      </div>
    </>
  );
}