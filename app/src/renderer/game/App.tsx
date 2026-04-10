import { createSignal, onCleanup, onMount } from "solid-js";
import { demoScriptName, demoScriptSource } from "./scripting/demoScript";

export default function App() {
  const [showDemo, setShowDemo] = createSignal(true);
  const [scriptName, setScriptName] = createSignal(demoScriptName);
  const [scriptPath, setScriptPath] = createSignal<string | undefined>(undefined);
  const [scriptSource, setScriptSource] = createSignal(demoScriptSource);
  const [status, setStatus] = createSignal("Ready");
  const [commandCount, setCommandCount] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  const [currentCommand, setCurrentCommand] =
    createSignal<RunningScriptCommand | null>(null);

  const refreshMeta = async () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    try {
      const [commands, isRunning, command] = await Promise.all([
        window.cmd.listCommands(),
        window.cmd.isRunning(),
        window.cmd.currentCommand(),
      ]);

      setCommandCount(commands.length);
      setRunning(isRunning);
      setCurrentCommand(command);
    } catch (error) {
      console.error("Failed to refresh scripting metadata", error);
    }
  };

  const loadDemo = () => {
    setScriptName(demoScriptName);
    setScriptPath(undefined);
    setScriptSource(demoScriptSource);
    setStatus("Loaded demo script");
  };

  const openScript = async () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    try {
      const payload = await window.cmd.open();
      if (!payload) {
        setStatus("Open script cancelled");
        return;
      }

      setScriptName(payload.name ?? "external-script");
      setScriptPath(payload.path);
      setScriptSource(payload.source);
      setStatus(`Loaded ${payload.name ?? payload.path ?? "script"}`);
    } catch (error) {
      console.error("Failed to open script", error);
      setStatus("Failed to open script");
    }
  };

  const runScript = () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    const source = scriptSource();
    if (source.trim() === "") {
      setStatus("Script is empty");
      return;
    }

    window.cmd.run(source, scriptName());
    setStatus(`Running ${scriptName()}`);
    void refreshMeta();
  };

  const stopScript = () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    window.cmd.stop();
    setStatus("Stop requested");
    void refreshMeta();
  };

  onMount(() => {
    void refreshMeta();

    const interval = setInterval(() => {
      void refreshMeta();
    }, 1200);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return (
    <>
      <button
        onClick={() => setShowDemo((prev) => !prev)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "8px 12px",
          background: "rgba(0, 0, 0, 0.75)",
          color: "white",
          "border-radius": "4px",
          "z-index": 101,
          "pointer-events": "auto",
          "font-family": "sans-serif",
          "font-size": "12px",
          cursor: "pointer",
        }}
      >
        {showDemo() ? "Hide Demo" : "Show Demo"}
      </button>

      {showDemo() && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "560px",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.75)",
            color: "white",
            "border-radius": "8px",
            "z-index": 100,
            "pointer-events": "auto",
            "font-family": "sans-serif",
            display: "flex",
            "flex-direction": "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ "font-weight": "bold" }}>Scripting Demo</div>
          <div style={{ "font-size": "12px", opacity: 0.85 }}>
            Commands: {commandCount()} · Running: {running() ? "yes" : "no"}
          </div>
          <div style={{ "font-size": "12px", opacity: 0.8 }}>
            Current command: {" "}
            {currentCommand()
              ? `#${currentCommand()!.index} ${currentCommand()!.name}`
              : "idle"}
          </div>
          <div style={{ "font-size": "12px", opacity: 0.75 }}>
            {scriptPath() ? `Path: ${scriptPath()}` : "Using in-memory script"}
          </div>

          <input
            value={scriptName()}
            onInput={(event) => setScriptName(event.currentTarget.value)}
            placeholder="script name"
            style={{
              padding: "6px 8px",
              border: "1px solid #555",
              "border-radius": "4px",
              background: "#111",
              color: "white",
            }}
          />

          <textarea
            value={scriptSource()}
            onInput={(event) => setScriptSource(event.currentTarget.value)}
            rows={14}
            style={{
              width: "100%",
              resize: "vertical",
              padding: "8px",
              border: "1px solid #555",
              "border-radius": "4px",
              background: "#111",
              color: "white",
              "font-family": "ui-monospace, Menlo, monospace",
              "font-size": "12px",
            }}
          />

          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
            <button onClick={loadDemo}>Load demo</button>
            <button onClick={() => void openScript()}>Open file...</button>
            <button onClick={runScript}>Run</button>
            <button onClick={stopScript}>Stop</button>
            <button onClick={() => void refreshMeta()}>Refresh</button>
          </div>

          <div style={{ "font-size": "12px", opacity: 0.85 }}>Status: {status()}</div>
          <div style={{ "font-size": "11px", opacity: 0.65 }}>
            Tip: Ctrl/Cmd+O opens a script file. Ctrl/Cmd+Shift+X stops active script.
          </div>
        </div>
      )}
    </>
  );
}
