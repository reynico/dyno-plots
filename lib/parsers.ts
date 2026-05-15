// Browser-side parsers for the three dyno file formats the original
// Python tool supported: generic CSV, Horacio Resio (.ine) and MWD (.ad3).
// Each parser returns a normalized list of { rpm, hp, tq } samples.

export interface Sample {
  rpm: number;
  hp: number;
  tq: number;
}

export interface DynoRun {
  name: string; // filename without extension, used in the legend
  samples: Sample[];
}

const num = (v: string | undefined): number => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/** Generic CSV with an rpm/hp/tq header (column order independent). */
function parseCsv(text: string): Sample[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const rpmIdx = header.indexOf("rpm");
  const hpIdx = header.indexOf("hp");
  const tqIdx = header.indexOf("tq");

  const samples: Sample[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep);
    const rpm = num(cells[rpmIdx]);
    const hp = num(cells[hpIdx]);
    const tq = tqIdx >= 0 ? num(cells[tqIdx]) : (hp * 716) / rpm;
    if (Number.isFinite(rpm) && Number.isFinite(hp)) samples.push({ rpm, hp, tq });
  }
  return samples;
}

/**
 * Horacio Resio (.ine): whitespace-delimited, ISO-8859-1 text with a ~24 line
 * header. Wheel torque is estimated from power via the original 716 constant,
 * and the sweep is reversed so rpm runs ascending.
 */
function parseHoracioResio(text: string): Sample[] {
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex(
    (l) => l.includes("RPM_VEH") && l.includes("POT_RUEDA"),
  );
  if (headerIdx < 0) return [];

  const cols = lines[headerIdx].trim().split(/\s+/);
  const rpmIdx = cols.indexOf("RPM_VEH");
  const hpIdx = cols.indexOf("POT_RUEDA");

  const samples: Sample[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    const f = line.split(/\s+/);
    const rpm = num(f[rpmIdx]);
    const hp = num(f[hpIdx]);
    // Skips the "Kgm Cv" units line and any footer text.
    if (!Number.isFinite(rpm) || !Number.isFinite(hp) || rpm === 0) continue;
    samples.push({ rpm, hp, tq: (hp * 716) / rpm });
  }
  return samples.reverse();
}

/**
 * MWD (.ad3): ISO-8859-1 XML. Each CanalVirtual holds a Nombre and a
 * comma-separated Muestra series; we pull engine rpm, corrected torque
 * and corrected power.
 */
function parseMwd(text: string): Sample[] {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  let rpm: number[] = [];
  let tq: number[] = [];
  let hp: number[] = [];

  doc.querySelectorAll("CanalVirtual").forEach((canal) => {
    const nombre = canal.querySelector("Nombre")?.textContent?.trim() ?? "";
    const muestra = canal.querySelector("Muestra")?.textContent ?? "";
    const values = muestra
      .split(",")
      .map((v) => num(v))
      .filter((v) => Number.isFinite(v));
    const key = nombre.toLowerCase();
    if (key === "rpm motor" || key === "rpm motor filtrada") rpm = values;
    else if (nombre === "Torque Corr") tq = values;
    else if (nombre === "Potencia Corr") hp = values;
  });

  const n = Math.min(rpm.length, tq.length, hp.length);
  const samples: Sample[] = [];
  for (let i = 0; i < n; i++) samples.push({ rpm: rpm[i], hp: hp[i], tq: tq[i] });
  return samples;
}

export function parseDynoFile(filename: string, text: string): DynoRun {
  const lower = filename.toLowerCase();
  let samples: Sample[] = [];
  if (lower.endsWith(".csv")) samples = parseCsv(text);
  else if (lower.endsWith(".ine")) samples = parseHoracioResio(text);
  else if (lower.endsWith(".ad3")) samples = parseMwd(text);
  else throw new Error(`Unsupported file type: ${filename}`);

  return { name: filename.replace(/\.[^.]+$/, ""), samples };
}

/** CSV is UTF-8; the .ine/.ad3 formats are ISO-8859-1. */
export async function readDynoFile(file: File): Promise<DynoRun> {
  const buf = await file.arrayBuffer();
  const enc = file.name.toLowerCase().endsWith(".csv") ? "utf-8" : "iso-8859-1";
  const text = new TextDecoder(enc).decode(buf);
  return parseDynoFile(file.name, text);
}
