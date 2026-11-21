# Rebuild `.svg3dxz` sample packages

Packages are produced by **svg3dx-core** (not a second zip implementation):

```bash
cargo run -p svg3dx-core --example pack_svg3dxz -- --samples-dir path/to/svg3dx/samples
```

This writes:

- `draft-0.1-gltf.svg3dxz` — `main.svg3dx` from `draft-0.1-gltf.svg3dx` + `assets/bunny.glb`
- `draft-0.1-gltf-if.svg3dxz` — `main.svg3dx` from `draft-0.1-gltf-if.svg3dx` + `bunny.glb` / `bunny-lod0.glb`
