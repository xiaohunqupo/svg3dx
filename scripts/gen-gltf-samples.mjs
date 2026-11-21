/**
 * Emit sample glTF 2.0 .glb assets for svg3dx (no deps).
 * Y-up glTF coords; svg3dx hosts apply Y→Z conversion C.
 *
 * - Procedural: quad.glb (example.svg3dx)
 * - Stanford Bunny: bunny.glb + bunny-lod0.glb from downloaded source
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "samples", "assets");
const BUNNY_SRC = path.join(assetsDir, "_bunny_src.glb");
const BUNNY_URL =
  "https://raw.githubusercontent.com/N8python/goodGodRays/master/bunny.glb";

/** Axis-aligned box centered at origin, size [sx,sy,sz] in glTF Y-up. */
function boxGeometry(sx, sy, sz) {
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const p = [
    [-hx, -hy, -hz],
    [hx, -hy, -hz],
    [hx, hy, -hz],
    [-hx, hy, -hz],
    [-hx, -hy, hz],
    [hx, -hy, hz],
    [hx, hy, hz],
    [-hx, hy, hz],
  ];
  const faces = [
    [0, 1, 2, 3],
    [5, 4, 7, 6],
    [4, 0, 3, 7],
    [1, 5, 6, 2],
    [4, 5, 1, 0],
    [3, 2, 6, 7],
  ];
  const positions = [];
  const normals = [];
  const indices = [];
  const faceNormals = [
    [0, 0, -1],
    [0, 0, 1],
    [-1, 0, 0],
    [1, 0, 0],
    [0, -1, 0],
    [0, 1, 0],
  ];
  let v = 0;
  for (let f = 0; f < faces.length; f++) {
    const [a, b, c, d] = faces[f];
    const n = faceNormals[f];
    for (const i of [a, b, c, d]) {
      positions.push(...p[i]);
      normals.push(...n);
    }
    indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
    v += 4;
  }
  return { positions, normals, indices };
}

function align4(n) {
  return (n + 3) & ~3;
}

function vec3Bounds(positions) {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}

/**
 * Write a mesh glb.
 * Avoids UINT32 indices (WebGL1 / missing OES_element_index_uint often fails):
 * when any index > 65535, emit a non-indexed triangle list instead.
 */
function writeGlb(filePath, { positions, normals, indices }, name) {
  let posArr = positions;
  let norArr = normals;
  let idxArr = indices;
  const needsU32 = idxArr.some((i) => i > 65535);
  const identity =
    idxArr.length === posArr.length / 3 &&
    idxArr.every((v, i) => v === i);

  // Prefer drawArrays over UINT32 element arrays for broad WebGL compatibility.
  let useIndices = !needsU32 && !identity;
  if (needsU32 && !identity) {
    const expPos = [];
    const expNor = [];
    for (let t = 0; t < idxArr.length; t++) {
      const src = idxArr[t] * 3;
      expPos.push(posArr[src], posArr[src + 1], posArr[src + 2]);
      expNor.push(norArr[src], norArr[src + 1], norArr[src + 2]);
    }
    posArr = expPos;
    norArr = expNor;
    useIndices = false;
  } else if (identity) {
    useIndices = false;
  }

  const pos = new Float32Array(posArr);
  const nor = new Float32Array(norArr);
  const idx = useIndices ? new Uint16Array(idxArr) : null;

  const posByteLength = pos.byteLength;
  const norByteLength = nor.byteLength;
  const idxByteLength = idx ? idx.byteLength : 0;
  const posOffset = 0;
  const norOffset = align4(posOffset + posByteLength);
  const idxOffset = align4(norOffset + norByteLength);
  const binPad = align4(idxOffset + idxByteLength);
  const bin = new ArrayBuffer(binPad);
  new Float32Array(bin, posOffset, pos.length).set(pos);
  new Float32Array(bin, norOffset, nor.length).set(nor);
  if (idx) new Uint16Array(bin, idxOffset, idx.length).set(idx);

  const bounds = vec3Bounds(posArr);
  const primitive = {
    attributes: { POSITION: 0, NORMAL: 1 },
    mode: 4,
  };
  if (useIndices) primitive.indices = 2;

  const accessors = [
    {
      bufferView: 0,
      componentType: 5126,
      count: pos.length / 3,
      type: "VEC3",
      max: bounds.max,
      min: bounds.min,
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: nor.length / 3,
      type: "VEC3",
    },
  ];
  const bufferViews = [
    { buffer: 0, byteOffset: posOffset, byteLength: posByteLength },
    { buffer: 0, byteOffset: norOffset, byteLength: norByteLength },
  ];
  if (useIndices && idx) {
    accessors.push({
      bufferView: 2,
      componentType: 5123,
      count: idx.length,
      type: "SCALAR",
    });
    bufferViews.push({
      buffer: 0,
      byteOffset: idxOffset,
      byteLength: idxByteLength,
      target: 34963,
    });
  }

  const json = {
    asset: { version: "2.0", generator: "svg3dx gen-gltf-samples" },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [{ mesh: 0, name }],
    meshes: [{ name, primitives: [primitive] }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: binPad }],
  };

  let jsonStr = JSON.stringify(json);
  while (jsonStr.length % 4 !== 0) jsonStr += " ";
  const jsonBuf = Buffer.from(jsonStr, "utf8");
  const binBuf = Buffer.from(bin);

  const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  let o = 12;
  out.writeUInt32LE(jsonBuf.length, o);
  out.writeUInt32LE(0x4e4f534a, o + 4);
  jsonBuf.copy(out, o + 8);
  o += 8 + jsonBuf.length;
  out.writeUInt32LE(binBuf.length, o);
  out.writeUInt32LE(0x004e4942, o + 4);
  binBuf.copy(out, o + 8);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, out);
  const tris = useIndices && idx ? idx.length / 3 : pos.length / 9;
  console.log(
    "wrote",
    filePath,
    `(${out.length} bytes, ${tris | 0} tris${useIndices ? "" : ", non-indexed"})`
  );
}

function readAccessorF32(buf, json, binStart, accessorIndex) {
  const acc = json.accessors[accessorIndex];
  const view = json.bufferViews[acc.bufferView];
  const offset = binStart + (view.byteOffset || 0) + (acc.byteOffset || 0);
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
  if (acc.componentType !== 5126) {
    throw new Error(`expected FLOAT accessor ${accessorIndex}`);
  }
  const count = acc.count * comps;
  return Array.from(new Float32Array(buf.buffer, buf.byteOffset + offset, count));
}

function readAccessorIndices(buf, json, binStart, accessorIndex) {
  const acc = json.accessors[accessorIndex];
  const view = json.bufferViews[acc.bufferView];
  const offset = binStart + (view.byteOffset || 0) + (acc.byteOffset || 0);
  if (acc.componentType === 5125) {
    return Array.from(
      new Uint32Array(buf.buffer, buf.byteOffset + offset, acc.count)
    );
  }
  if (acc.componentType === 5123) {
    return Array.from(
      new Uint16Array(buf.buffer, buf.byteOffset + offset, acc.count)
    );
  }
  throw new Error(`unsupported index componentType ${acc.componentType}`);
}

function parseGlbMesh(filePath) {
  const buf = fs.readFileSync(filePath);
  let o = 12;
  const jsonLen = buf.readUInt32LE(o);
  o += 8;
  const json = JSON.parse(buf.slice(o, o + jsonLen).toString("utf8"));
  o += jsonLen;
  const binLen = buf.readUInt32LE(o);
  o += 8;
  const binStart = o;
  if (binStart + binLen > buf.length) {
    throw new Error("truncated GLB BIN chunk");
  }

  const prim = json.meshes[0].primitives[0];
  const positions = readAccessorF32(buf, json, binStart, prim.attributes.POSITION);
  let normals = prim.attributes.NORMAL != null
    ? readAccessorF32(buf, json, binStart, prim.attributes.NORMAL)
    : null;
  const indices =
    prim.indices != null
      ? readAccessorIndices(buf, json, binStart, prim.indices)
      : [...Array(positions.length / 3).keys()];

  return { positions, normals, indices };
}

function computeNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    const ax = positions[i1] - positions[i0];
    const ay = positions[i1 + 1] - positions[i0 + 1];
    const az = positions[i1 + 2] - positions[i0 + 2];
    const bx = positions[i2] - positions[i0];
    const by = positions[i2 + 1] - positions[i0 + 1];
    const bz = positions[i2 + 2] - positions[i0 + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    for (const i of [i0, i1, i2]) {
      normals[i] += nx;
      normals[i + 1] += ny;
      normals[i + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const x = normals[i];
    const y = normals[i + 1];
    const z = normals[i + 2];
    const len = Math.hypot(x, y, z) || 1;
    normals[i] = x / len;
    normals[i + 1] = y / len;
    normals[i + 2] = z / len;
  }
  return Array.from(normals);
}

/** Scale so the longest AABB edge equals `targetSize`. */
function normalizeSize(positions, targetSize = 100) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    maxY = Math.max(maxY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }
  const sx = maxX - minX;
  const sy = maxY - minY;
  const sz = maxZ - minZ;
  const longest = Math.max(sx, sy, sz) || 1;
  const scale = targetSize / longest;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const out = new Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    out[i] = (positions[i] - cx) * scale;
    out[i + 1] = (positions[i + 1] - cy) * scale;
    out[i + 2] = (positions[i + 2] - cz) * scale;
  }
  return out;
}

/**
 * Grid vertex-clustering simplification → a coherent low-poly mesh
 * (not "every Nth triangle", which only leaves broken scraps).
 */
function clusterSimplify(positions, indices, gridResolution = 28) {
  const bounds = vec3Bounds(positions);
  const sx = Math.max(1e-9, bounds.max[0] - bounds.min[0]);
  const sy = Math.max(1e-9, bounds.max[1] - bounds.min[1]);
  const sz = Math.max(1e-9, bounds.max[2] - bounds.min[2]);
  const res = Math.max(4, gridResolution | 0);

  const cellKey = (x, y, z) => {
    const ix = Math.min(
      res - 1,
      Math.max(0, Math.floor(((x - bounds.min[0]) / sx) * res))
    );
    const iy = Math.min(
      res - 1,
      Math.max(0, Math.floor(((y - bounds.min[1]) / sy) * res))
    );
    const iz = Math.min(
      res - 1,
      Math.max(0, Math.floor(((z - bounds.min[2]) / sz) * res))
    );
    return ix + iy * res + iz * res * res;
  };

  /** @type {Map<number, { sx:number, sy:number, sz:number, n:number, id:number }>} */
  const cells = new Map();
  const vertToCluster = new Int32Array(positions.length / 3);

  for (let vi = 0; vi < positions.length / 3; vi++) {
    const x = positions[vi * 3];
    const y = positions[vi * 3 + 1];
    const z = positions[vi * 3 + 2];
    const key = cellKey(x, y, z);
    let cell = cells.get(key);
    if (!cell) {
      cell = { sx: 0, sy: 0, sz: 0, n: 0, id: cells.size };
      cells.set(key, cell);
    }
    cell.sx += x;
    cell.sy += y;
    cell.sz += z;
    cell.n += 1;
    vertToCluster[vi] = cell.id;
  }

  const newPos = new Array(cells.size * 3);
  for (const cell of cells.values()) {
    const i = cell.id * 3;
    newPos[i] = cell.sx / cell.n;
    newPos[i + 1] = cell.sy / cell.n;
    newPos[i + 2] = cell.sz / cell.n;
  }

  const faceSeen = new Set();
  const newIdx = [];
  for (let t = 0; t < indices.length; t += 3) {
    const a = vertToCluster[indices[t]];
    const b = vertToCluster[indices[t + 1]];
    const c = vertToCluster[indices[t + 2]];
    if (a === b || b === c || a === c) continue;
    // Canonical winding-insensitive key to drop duplicates from clustering.
    const sorted = [a, b, c].sort((u, v) => u - v);
    const key = `${sorted[0]},${sorted[1]},${sorted[2]}`;
    if (faceSeen.has(key)) continue;
    faceSeen.add(key);
    newIdx.push(a, b, c);
  }

  const normals = computeNormals(newPos, newIdx);
  return { positions: newPos, normals, indices: newIdx };
}

async function ensureBunnySource() {
  if (fs.existsSync(BUNNY_SRC) && fs.statSync(BUNNY_SRC).size > 1000) {
    console.log("using cached", BUNNY_SRC);
    return;
  }
  console.log("downloading Stanford Bunny…");
  const res = await fetch(BUNNY_URL);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  fs.writeFileSync(BUNNY_SRC, Buffer.from(ab));
  console.log("saved", BUNNY_SRC, `(${ab.byteLength} bytes)`);
}

async function writeBunnyAssets() {
  await ensureBunnySource();
  const mesh = parseGlbMesh(BUNNY_SRC);
  const positions = normalizeSize(mesh.positions, 100);
  const normals =
    mesh.normals && mesh.normals.length === positions.length
      ? mesh.normals
      : computeNormals(positions, mesh.indices);

  // Full-resolution sample (classic ~30k tris Stanford bunny).
  writeGlb(
    path.join(assetsDir, "bunny.glb"),
    { positions, normals, indices: mesh.indices },
    "StanfordBunny"
  );

  // Coherent low-poly LOD via grid clustering (keeps the bunny silhouette).
  const lod0 = clusterSimplify(positions, mesh.indices, 26);
  console.log(
    `bunny-lod0 clusters → ${lod0.positions.length / 3 | 0} verts, ${lod0.indices.length / 3 | 0} tris`
  );
  writeGlb(path.join(assetsDir, "bunny-lod0.glb"), lod0, "StanfordBunnyLOD0");
}

fs.mkdirSync(assetsDir, { recursive: true });

writeGlb(
  path.join(assetsDir, "quad.glb"),
  boxGeometry(100, 2, 100),
  "quad"
);

await writeBunnyAssets();

// Remove obsolete stand-in boxes if present.
for (const name of ["box.glb", "valve-dn50.glb", "valve-dn80.glb"]) {
  const p = path.join(assetsDir, name);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log("removed", p);
  }
}

fs.writeFileSync(
  path.join(assetsDir, "ATTRIBUTION.md"),
  `# Sample glTF attribution

## Stanford Bunny (\`bunny.glb\`, \`bunny-lod0.glb\`)

Original Stanford Bunny scan © Stanford University Computer Graphics Laboratory.
Source binary used for regeneration: <https://github.com/N8python/goodGodRays> (\`bunny.glb\`).
\`bunny-lod0.glb\` is a grid-clustered low-poly LOD for svg3dx \`s3dx:if\` demos.

Rebuild:

\`\`\`bash
node scripts/gen-gltf-samples.mjs
\`\`\`
`
);

console.log("done");
