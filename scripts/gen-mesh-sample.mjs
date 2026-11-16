import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gistPath =
  process.env.BUNNY_OBJ ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/f-svg3dx/agent-tools/32cf9ca0-0dc2-4d19-8514-36a40cdc6527.txt"
  );

const raw = fs.readFileSync(gistPath, "utf8");
const verts = [];
const faces = [];
for (const line of raw.split(/\r?\n/)) {
  if (line.startsWith("v ")) {
    const p = line.trim().split(/\s+/).slice(1).map(Number);
    verts.push(p);
  } else if (line.startsWith("f ")) {
    const idx = line
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((t) => parseInt(t.split("/")[0], 10) - 1);
    for (let i = 1; i + 1 < idx.length; i++) {
      faces.push([idx[0], idx[i], idx[i + 1]]);
    }
  }
}

if (verts.length < 10) {
  console.error("Failed to parse bunny verts from", gistPath);
  process.exit(1);
}

// Bbox
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (const p of verts) {
  for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], p[k]);
    max[k] = Math.max(max[k], p[k]);
  }
}
const size = max.map((v, i) => v - min[i]);
const center = min.map((v, i) => (v + max[i]) / 2);
console.log({ verts: verts.length, tris: faces.length, min, max, size });

// Gist bunny appears Y-up-ish (ears along a vertical axis). Map Y-up → Z-up:
// (x, y, z)_yup → (x, -z, y)_zup so +Y becomes +Z.
const mapped = verts.map(([x, y, z]) => [x, -z, y]);
const mMin = [Infinity, Infinity, Infinity];
const mMax = [-Infinity, -Infinity, -Infinity];
for (const p of mapped) {
  for (let k = 0; k < 3; k++) {
    mMin[k] = Math.min(mMin[k], p[k]);
    mMax[k] = Math.max(mMax[k], p[k]);
  }
}
const mSize = mMax.map((v, i) => v - mMin[i]);
const mCenter = mMin.map((v, i) => (v + mMax[i]) / 2);
const targetH = 80; // roughly match box scale
const scale = targetH / Math.max(...mSize);

const scaled = mapped.map((p) =>
  p.map((v, i) => (v - mCenter[i]) * scale)
);

function fmt(n) {
  const t = Math.round(n * 1e4) / 1e4;
  return Object.is(t, -0) ? "0" : String(t);
}

const posStr = scaled.map((p) => p.map(fmt).join(" ")).join("\n                           ");
const idxStr = faces
  .map((t) => t.join(" "))
  .join("\n                           ");

// Unit box centered at origin, size 50 — as mesh (8 verts, 12 tris)
const s = 25;
const boxPos = [
  [-s, -s, -s],
  [s, -s, -s],
  [s, s, -s],
  [-s, s, -s],
  [-s, -s, s],
  [s, -s, s],
  [s, s, s],
  [-s, s, s],
];
const boxIdx = [
  [0, 1, 2],
  [0, 2, 3], // -Z
  [4, 6, 5],
  [4, 7, 6], // +Z
  [0, 4, 5],
  [0, 5, 1], // -Y
  [2, 6, 7],
  [2, 7, 3], // +Y
  [0, 3, 7],
  [0, 7, 4], // -X
  [1, 5, 6],
  [1, 6, 2], // +X
];
const boxPosStr = boxPos.map((p) => p.map(fmt).join(" ")).join("\n                           ");
const boxIdxStr = boxIdx.map((t) => t.join(" ")).join("\n                           ");

const out = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1"
     svg3d="true"
     viewBox="0 0 800 600"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:s3dx="urn:s3dx:draft:0.1">

  <!-- mesh 示例：两个组 — box（立方体网格）与 rabbit（低模 Stanford bunny） -->
  <defs>
    <g id="box">
      <s3dx:mesh mode="triangles" indexBase="0"
                 position="${boxPosStr}"
                 index="${boxIdxStr}"/>
    </g>

    <g id="rabbit"
       s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 120 0 0)">
      <!-- Low-poly Stanford Bunny；源：Stanford Graphics Lab（经简化） -->
      <s3dx:mesh mode="triangles" indexBase="0"
                 position="${posStr}"
                 index="${idxStr}"/>
    </g>
  </defs>

  <s3dx:model id="solid-view" mode="solid" active="true">
    <s3dx:use href="#box"/>
    <s3dx:use href="#rabbit"/>
  </s3dx:model>
</svg>
`;

const dest = path.join(__dirname, "../samples/draft-0.1-mesh.svg3dx");
fs.writeFileSync(dest, out, "utf8");
console.log("wrote", dest, "bytes", out.length);
