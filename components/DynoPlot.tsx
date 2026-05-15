"use client";

import { useEffect, useRef } from "react";
import type { Data, Layout } from "plotly.js-dist-min";
import type { DynoRun } from "@/lib/parsers";

const GRAPH_BG = "#F5F5F5";

const config = {
  responsive: true,
  toImageButtonOptions: {
    width: 1000,
    height: 600,
    format: "png" as const,
    filename: "dyno",
  },
};

export default function DynoPlot({ runs }: { runs: DynoRun[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let disposed = false;
    (async () => {
      // Imported lazily so Plotly never touches the server build.
      const Plotly = (await import("plotly.js-dist-min")).default;
      if (disposed || !ref.current) return;

      const data: Data[] = [];
      for (const run of runs) {
        const x = run.samples.map((s) => s.rpm);
        data.push({
          x,
          y: run.samples.map((s) => s.hp),
          name: `whp ${run.name}`,
          mode: "lines+markers",
          type: "scatter",
          marker: { size: 4 },
          hovertemplate: "%{y:.1f}<extra>whp " + run.name + "</extra>",
        });
        data.push({
          x,
          y: run.samples.map((s) => s.tq),
          name: `tq ${run.name}`,
          mode: "lines+markers",
          type: "scatter",
          marker: { size: 4 },
          hovertemplate: "%{y:.1f}<extra>tq " + run.name + "</extra>",
        });
      }

      const layout: Partial<Layout> = {
        plot_bgcolor: GRAPH_BG,
        paper_bgcolor: GRAPH_BG,
        margin: { t: 30, r: 20, b: 40, l: 50 },
        hovermode: "x",
        xaxis: {
          title: { text: "rpm" },
          showspikes: true,
          spikemode: "across",
          spikesnap: "data",
          spikethickness: 1,
          spikedash: "solid",
          spikecolor: "#888888",
        },
        yaxis: { nticks: 30, rangemode: "tozero" },
        legend: { orientation: "h" },
      };

      await Plotly.react(ref.current, data, layout, config);
    })();

    return () => {
      disposed = true;
    };
  }, [runs]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
