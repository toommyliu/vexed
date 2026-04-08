import { createSignal } from "solid-js";
export default function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        padding: "1rem",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        "border-radius": "8px",
        "z-index": 100,
        "pointer-events": "auto",
        "font-family": "sans-serif",
      }}
    >
      <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
        <button
          onClick={() => setCount(count() + 1)}
          style={{
            padding: "5px 10px",
            cursor: "pointer",
            background: "#4f46e5",
            border: "none",
            color: "white",
            "border-radius": "4px",
          }}
        >
          count: {count()}
        </button>
      </div>
    </div>
  );
}
