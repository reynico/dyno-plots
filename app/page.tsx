"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { readDynoFile, binSamplesPer100, type DynoRun } from "@/lib/parsers";

// Plotly is client-only — keep it out of the static prerender.
const DynoPlot = dynamic(() => import("@/components/DynoPlot"), { ssr: false });

export default function Home() {
  const [runs, setRuns] = useState<DynoRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      const parsed = await Promise.all(
        Array.from(files).map((f) => readDynoFile(f)),
      );
      setRuns(parsed);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "There was an error processing a file.",
      );
    }
  }, []);

  return (
    <main className="page">
      <div
        className={`dropzone${dragging ? " dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          loadFiles(e.dataTransfer.files);
        }}
      >
        Drag and Drop or <a>Select Files</a>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.ine,.ad3"
          style={{ display: "none" }}
          onChange={(e) => loadFiles(e.target.files)}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="plot">{runs.length > 0 && <DynoPlot runs={runs} />}</div>

      {runs.length > 0 && (
        <div className="tables">
          {runs.map((run) => (
            <div key={run.name}>
              <h5>{run.name}</h5>
              <table>
                <thead>
                  <tr>
                    <th>rpm</th>
                    <th>whp</th>
                    <th>tq</th>
                  </tr>
                </thead>
                <tbody>
                  {binSamplesPer100(run.samples).map((s) => (
                    <tr key={s.rpm}>
                      <td>{s.rpm}</td>
                      <td>{s.hp}</td>
                      <td>{s.tq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
