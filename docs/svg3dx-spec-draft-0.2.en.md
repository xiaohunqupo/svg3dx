# svg3dx Format Specification (draft 0.2) · English

> Project overview and licensing: [README.md](../README.md) / [README.zh-CN.md](../README.zh-CN.md). Author: danny xu.  
> **Language**: This file is the **English edition**. Chinese edition: [svg3dx-spec-draft-0.2.md](./svg3dx-spec-draft-0.2.md).  
> **Official nouns**: Attribute, type, and built-in material display names are listed in [svg3dx-vocab-draft-0.2.md](./svg3dx-vocab-draft-0.2.md). Files always store English identifiers; localized official names are the normative display nouns.

## 0. Document status

- This specification is draft **0.2** (trial track). Features are tried in this draft and may be rewritten or removed. The version plan is the [roadmap](./roadmap.en.md). Namespace URI `urn:s3dx:draft:0.2` is provisional until a formal release.
- Draft **0.1** (`urn:s3dx:draft:0.1`) is the **stable** track: existing samples and hosts may keep using it; implementations must accept both 0.1 and 0.2. Migration from 0.1 is in the **Migration** chapter at the end of this document.
- Format name: `svg3dx`. Recommended namespace prefix: `s3dx`. Logo mark: `s3dx`; full title: `svg 3dx`.
- This draft file is not guaranteed to parse in a formal release. Implementations must recognize the 3D namespace by URI, not by the prefix literal (recommended prefix `s3dx`).
- The file extension is `.svg`, with root attribute `svg3d="true"` marking 3D content. A dedicated `.svg3dx` extension is under consideration for a formal release.
- **Bilingual editions**: Chinese and English are maintained in parallel. XML element names, attribute names, and material keywords are English identifiers in both editions; the Chinese edition uses the official Chinese nouns from the vocabulary.

## 1. Document model

### 1.1 Root element and switch

- Root element is SVG `<svg>`, with optional extension attribute `svg3d` (no namespace prefix) on the root.
- `svg3d="true"` enables 3D semantics; absent or `svg3d="false"` means all `s3dx:*` elements and their subtrees are treated as unknown-namespace SVG: kept in the DOM, not evaluated, not rendered, and do not affect 2D content.
- `svg3d` is a global switch and outranks the namespace: when `false`, ignore 3D content even if the namespace is correct.
- The attribute name is `svg3d`. It means “this SVG contains 3D content,” decoupled from the project name. Standard SVG user agents ignore unknown attributes and are unaffected for 2D rendering.

### 1.2 Namespace

- 3D elements use namespace `urn:s3dx:draft:0.2`, recommended prefix `s3dx`.
- 3D **elements** enter the namespace: core primitives are listed in §3.2 (`point`, `box`, `cylinder`, `sphere`, `cone`, `torus`, `wedge`, `pyramid`, `prism`, `sector-cylinder`, `line`, `arc`, `path`, `extrude`, `revolve`, `loft`, `sweep`, `pipe`, `gltf`); child `<s3dx:section>` (and `<s3dx:path>` when used as a trajectory container); plus `<s3dx:if>`, `<s3dx:if-not>`, `<s3dx:loop-points>`, `<s3dx:loop-range>`, `<s3dx:bool-union>`, `<s3dx:bool-subtract>`, `<s3dx:bool-intersect>`, `<s3dx:use>`, `<s3dx:model>`, `<s3dx:materials>`, `<s3dx:material>`, `<s3dx:animate>`, `<s3dx:animateTransform>`. A machine-readable element/attribute catalog is [`namespaces/svg3dx/svg3dx.draft.0.2.xml`](../namespaces/svg3dx/svg3dx.draft.0.2.xml), registered in [`namespaces/registry.xml`](../namespaces/registry.xml); **evaluation and semantics remain defined by this document**.
- **Unprefixed attributes** (null namespace): geometry attrs (lowerCamelCase, see §3.2), plus `href`, `mode`, `test`, `points`, `start`, `end`, `step`, `active`, `svg3d`, appearance `fill` / `material` / `opacity` (§8), and animation `attributeName` / `from` / `to` / `dur` / `repeat` / `begin` / `calcMode` / `type` plus `fill` on animation elements (§10).
- **Namespaced attributes**: 3D transform uses `s3dx:transform` (see §3.4), **not** the SVG presentation attribute `transform`, to avoid clashing with the 2D 6-number `matrix`.
- Standard SVG parsers keep unknown-namespace elements in the DOM without rendering or further processing. This format relies on that behavior for 2D compatibility.
- **Foreign namespaces and metadata (mandatory)**: When parsing, implementations must place foreign-namespace elements/attributes fully into the DOM; official round-trips and optimize must keep those nodes intact. Geometry evaluation covers only this format’s `s3dx` semantics plus SVG grouping/style scope (see §12); foreign namespaces and the standard SVG [`<metadata>`](https://www.w3.org/TR/SVG11/metadata.html) subtree remain in the DOM for hosts and domain tools (see §9). Animation elements remain in the DOM and are interpreted by hosts that implement an animation clock (see §10).

### 1.3 2D compatibility

- Pure 2D content uses only standard SVG-namespace elements; instantiation uses standard `<use>`, not `<s3dx:use>`.
- The same `<g>` may be referenced by both standard `<use>` and `<s3dx:use>`: the former applies in 2D rendering, the latter in 3D evaluation; they do not interfere.
- This format does not define a 3D viewport. Projection, view transform, and visible range of 3D geometry are decided by the host environment.

### 1.4 World coordinate system

- **Right-handed**; **`+Z` is the height direction**.
- The **XY plane** corresponds to the SVG 2D drawing plane: unprefixed SVG geometry inside a section (`path` / `circle` / …) and sections with default `normal="0 0 1"` lie in local XY.
- Prefer laying out horizontal placement and planar polylines in XY; raise along `+Z` when something needs to stand up.

## 2. Parameter system

### 2.1 Declaration sites

Parameters are CSS custom properties. Supported declaration sites (nearest declaration wins on lookup; see §2.3):

1. `:root` rules in a `<style>` block: `:root { --name: value; }` (document-level defaults, inherited by all descendants)
2. Class rules in a `<style>` block: `.className { --name: value; }`
3. Inline `style` on an element: `style="--name: value;"` (including the root `<svg>`)

**Parameter lookup**: Implementations must recognize custom properties on `:root`, class selectors, and inline `style`. `:root` matches CSS and is equivalent to declaring on the document root; root-element inline `style` and `:root` share the document-root scope, with inline winning. Documents may still use full CSS for 2D styling (implementations may ignore selectors not listed above).

### 2.2 Reference syntax

- Parameter references use standard CSS `var(--name)` (`<dashed-ident>`, same as SVG / CSS custom properties).
- Declaration and reference are paired: declare `--D: 200`, reference `var(--D)` (the `--` inside the parentheses is required).
- **Scalar arithmetic** uses standard CSS `calc(...)`; do not glue operators directly after `var()`:
  - Correct: `calc(var(--D) - 10)`, `calc(var(--R) / 3)`
  - Incorrect: `var(--D)-10`, `var(--R)/3`
- `[name]` and `var(name)` without `--` are not supported; implementations must treat such forms as syntax errors and warn.
- Loop iteration variables are legal dashed-idents: `var(--loop-index)`, `var(--loop-value)`, etc. (see §6).

### 2.3 Scope lookup order

Walk the DOM ancestor chain upward; nearest declaration wins; stop when found:

1. External parameters (highest priority)
2. Animation sample overrides (see §10; injected only by hosts that implement an animation clock)
3. Nearest ancestor `<g>` class rules or inline `style`
4. Farther ancestors’ class rules or inline `style`
5. Document-root scope: root-element inline `style`, then `:root` rules
6. Defaults

When `s3dx:loop-*` elements nest, inner iteration variables shadow outer ones.

### 2.4 Type parsing

- Pure numeric string → number.
- Space-separated number sequence → vector.
- `true` / `false` → boolean.
- Otherwise → string.
- Type mismatch during expression evaluation (e.g. string used in numeric arithmetic) → evaluation error.

### 2.5 External parameters

- External parameters are a name→value map. Injection form is host-defined (URL query, host API, CLI, etc.); this specification does not bind one.
- Highest priority. On hit, use the external value and do not continue DOM lookup.
- Does not modify the DOM or change computed CSS values; only acts as the highest-priority lookup result during evaluation.
- Missing external parameters fall back to DOM declarations; if the DOM has none either → evaluation error.
- External keys correspond to custom-property names: `D` or `--D` are both accepted (normalize by stripping an optional leading `--` before lookup).
- External values are typed by the same rules as §2.4.
- **Boundary vs parameter UI (clarification)**: **Displaying** `:root` direct literals in a host params chrome does **not** by itself count as supplying external parameters. A key becomes an external override only when the host **explicitly pins** it (user confirms an override, or an API/URL injects it). While unpinned, lookup continues down §2.3 (including animation samples and the DOM).
- **Same property as an animation**: a pinned external wins (animation does not apply to that key for the frame). Host UI **should** indicate “overriding animation” and offer unpinning to restore animation drive; hosts should not silently promote form edits to external overrides with no affordance.

**Whitelist (mandatory)**: Externals may **only** override custom properties declared as **direct literals** under a `<style>` `:root` rule.

- Allowed: `:root { --H: 100; --Label: tank; }`, external may pass `H` / `Label`.
- Not allowed to override:
  - Parameters that appear only in class rules (e.g. `.tanks { --R: 50; }`)
  - `:root` derived declarations containing `var(` / `calc(` (e.g. `--D: calc(var(--H) - 20)`)
  - Custom properties on root-element or other inline `style` (public tunable parameters belong in `:root`)
- For external keys outside the whitelist: implementations **must not apply** that key and must warn; they must not silently treat it as an arbitrary DOM parameter override.
- Purpose: confine host-tunable entry points to values the document explicitly publishes as direct literals, so external params cannot rewrite internal derived quantities or local parameters and destabilize the model.

### 2.6 Expressions, `calc()`, and `ref()`

Layered convention (stay close to CSS; comparison / logic and positioning-point refs are filled in by this format):

| Layer | Form | Use |
|---|---|---|
| Parameter reference | `var(--name)` | Custom property / loop-injected variable |
| Scalar arithmetic | `calc(...)` | `+ - * /` and parentheses; syntax aligned with CSS Values `calc()` |
| Positioning-point reference | `ref(#id)` | Current coordinates of `<s3dx:point id="…">` (see §2.9) |
| Comparison / logic | This format’s expressions | `=` `<` `>` `<=` `>=` `<>`, plus `and` `or` `not` (for `test` on `s3dx:if` / `s3dx:if-not`, etc.) |

- In numeric attributes: literals, `var(--*)`, or `calc(...)`.
- In **point** and **point-list** attributes: three-number literals, `var(--*)` (vector), embedded `calc(...)`, or `ref(#id)` (see §2.9).
- In condition `test`: either side of a comparison may be a literal, `var(--*)`, or `calc(...)`, e.g. `test="var(--R) = 50"`, `test="calc(var(--R) / 2) &lt; 20"`. `ref(#id)` is not allowed in `test`.
- `=` means equality comparison; there is no assignment.
- In XML attributes, `<` and `&` must be escaped as `&lt;` and `&amp;`.
- Inside `calc()`, prefer spaces around `+` / `-` as in CSS (e.g. `calc(var(--D) - 10)`).
- Evaluation failure (syntax error, undefined parameter, type mismatch, invalid `ref`) → skip the failing element’s subtree + warning.

### 2.7 Alignment with CSS / SVG

- **`var()` / `calc()` themselves are CSS standards**. In SVG user agents that support CSS, when used on **CSS properties** (`<style>`, element `style="..."`) they follow CSS cascade and computation.
- This format additionally specifies that in **svg3dx-evaluated attribute values** (e.g. numeric attributes, `test`, `s3dx:transform`) authors may also write `var(--*)` / `calc(...)` / (in point attributes) `ref(#id)`, parsed by the **svg3dx evaluator**. This does **not** require browsers to substitute variables on **non-CSS XML attributes**.
- Therefore: 2D styling goes through CSS; 3D parameters / expressions go through the svg3dx evaluator — aligned syntax, different host responsibilities.
- Custom property names must be legal CSS `<dashed-ident>` (e.g. `--D`, `--loop-value`); names containing `.` such as `--loop.value` are **not** allowed.
- A `var(--*)` value may be multiple space-separated tokens (CSS allows multi-token substitution); this format uses that for vector embedding (see §2.8).

### 2.8 Expanding vectors in attribute values

- When a vector-typed variable (e.g. `var(--loop-value)` as a 3D point inside `loop-points`) is embedded in an attribute value, expand it as three space-separated numbers (aligned with CSS `var()` multi-token substitution).
- Example: `s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 var(--loop-value))"` with `--loop-value: 100 200 300` is equivalent to `matrix(1 0 0 0 1 0 0 0 1 100 200 300)`.
- The normative 3D matrix form uses **space separation** (see §3.4) so vectors embed directly.
- To access components individually, use separate custom properties: `var(--loop-value-x)`, `var(--loop-value-y)`, `var(--loop-value-z)` (injected when a loop expands; see §6).
- Operate on components with `calc`, e.g. `calc(var(--loop-value-x) * 50)`.
- Vector sequences in the `points` attribute, and each `ref(#id)`, expand by the same rules (`ref(#id)` expands to three numbers).

### 2.9 Positioning-point reference `ref(#id)`

- Syntax: `ref(#id)`, where `id` is the `id` of a document `<s3dx:point>` (fragment only; not an external IRI).
- Scope: whole value of a **point**-typed attribute, or one token standing for a single point inside a **point list** (may mix with literal points).
- No parallel `*-ref` attributes; literals, `var`/`calc`, and `ref` share the same attribute slot and are distinguished by syntax.
- **Live binding**: persist `ref(#id)` in the file; official optimize **must not** inline `ref(#id)` to numbers.
- **Each evaluation** derives coordinates (not a write-time snapshot):
  1. \(P_{\mathrm{world}} = M_{\mathrm{ancestors}}(\mathrm{point})\cdot M_{\mathrm{point}}\cdot \mathrm{at}\)
  2. \(P_{\mathrm{local}} = \bigl(M_{\mathrm{ancestors}}(\mathrm{consumer})\cdot M_{\mathrm{consumer}}\bigr)^{-1}\cdot P_{\mathrm{world}}\)
  - \(M\) is the accumulated `s3dx:transform` chain on that node and its 3D assembly ancestors (see §3.1); `at` is the positioning point’s local coordinates.
- The target must be `s3dx:point`; missing id, wrong type, or non-invertible transform → warn and skip the consuming primitive (same as attribute evaluation failure).
- Resolution uses the original positioning-point element with that `id`; it does not resolve synthetic path ids from `<s3dx:use>` instantiation.
- The `at` attribute of `<s3dx:point>` must not itself be `ref(#id)` (this draft allows only literals / `var` / `calc`).

```xml
<s3dx:point id="A" at="0 0 0"/>
<s3dx:point id="B" at="100 0 0"/>
<s3dx:line from="ref(#A)" to="ref(#B)"/>
<s3dx:path form="polyline" points="ref(#A)  ref(#B)  100 0 100"/>
```

## 3. 3D primitives

### 3.1 Common rules

- 3D primitives are elements in the `s3dx:` namespace. Primitives generally do not nest inside each other (group with `<g>`); allowed children are limited to:
  - `<s3dx:section>` (profile for extrude / revolve / loft / sweep; see §3.2.4)
  - `<s3dx:path>` (trajectory container for sweep / pipe; may also be a standalone composite curve; see §3.2.3)
  - **Exception**: `<s3dx:path>` may directly contain `<s3dx:line>` / `<s3dx:arc>` as curve segments (aligned with STEP `composite_curve` / OCC `Wire`)
  - `<s3dx:animateTransform>` (transform animation; not part of the geometry operation graph; see §10)
- Primitive attribute tables are maintained in this section and the appendix; adding rows does not change document syntax. Attributes not listed must be ignored with a warning.
- Local → parent → world accumulation: local geometry defined by primitive attributes first applies the element’s own `s3dx:transform`, then accumulates `s3dx:transform` along ancestor **3D assembly containers** (`<g>`, `<s3dx:use>`, `<s3dx:if>` / `<s3dx:if-not>`, `<s3dx:loop-*>`, `<s3dx:bool-*>`, etc.). 2D profile children inside `<s3dx:section>` belong to section composition and do not enter that 3D transform chain.
- **Layering principle**: the core layer only accepts generic solids, curves, and referenced triangle assets (via `gltf`) that vendors can map; industry-specific shapes (duct fittings, heads, etc.) stay out of the core — see Appendix §13.3 (expressible via `loft` / `revolve` / boolean combinations).

### 3.2 Primitive attribute tables (draft 0.2)

Attribute names align with [`samples/draft-0.1-example.svg3dx`](../samples/draft-0.1-example.svg3dx); geometry semantics align with AutoCAD solid primitives, Open CASCADE constructors (`MakePrism` / `MakeRevol` / `ThruSections`), and glTF 2.0 assets referenced by `s3dx:gltf`.

**Attribute naming**: Primitive attribute names use SVG-common **lowerCamelCase** (leading lowercase, e.g. `length`, `lengthVec`, `bottomCenterPt`). Element names stay lowercase; multi-word names use hyphens (`sector-cylinder`, `if-not`, `loop-points`, `bool-union`). XML attribute names are case-sensitive; implementations must not treat `Length` as an alias of `length`.

**Official display names**: The “Attribute” column stores English identifiers; official localized nouns (e.g. `length` → Chinese **长度**, English display **length**) are defined in the [official vocabulary](./svg3dx-vocab-draft-0.2.md). Titles in parentheses after a primitive (e.g. `s3dx:box` (Box)) are that type’s official English display name.

#### 3.2.1 Types and shared conventions

| Type token | Meaning | Attribute value form |
|---|---|---|
| number | Scalar length / size | `100`, `var(--D)`, `calc(var(--D) - 10)` |
| boolean | True / false | `true` / `false` |
| point | 3D point | `x y z` (three numbers, space-separated); or `ref(#id)` (see §2.9) |
| vector | 3D direction or displacement | `x y z`; implementations should normalize direction vectors (zero vector is an error) |
| angle | Degrees (°), counterclockwise positive | `90`, `var(--A)`, `calc(var(--A) * 2)` |
| point list | Sequence of points | `x1 y1 z1 x2 y2 z2 …` (length must be a multiple of 3); any point may be written as `ref(#id)` |
| vector list | Sequence of vectors | Same as point list (3 numbers per vector) |
| number list | Sequence of scalars | `u0 v0 u1 v1 …` |
| IRI | Resource reference | Same resolution rules as SVG external resources (relative to the document base URL) |

**Common optional attribute** (applies to all 3D primitives; not repeated row-by-row below):

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `s3dx:transform` | 12-number matrix | identity | See §3.4; applied before parent transforms; **not** SVG `transform` |

**Size scale and recommended defaults**:

- Primary dimensions (edge length, diameter, height, path span, etc.) should be on the order of **`100`** (in document user units), for sample alignment and interoperability.
- In the tables below, the “Default” column: for **optional** attributes it is the evaluation default when omitted; for **required** attributes the number is a **recommended default** — documents should still write the attribute. For spheres sized around diameter `100`, the recommended radius is `50`.

**Local-frame conventions**:

- Primitive attributes define geometry in local coordinates; then apply the element’s `s3dx:transform`, then accumulate ancestor 3D assembly-container `s3dx:transform` values (see §3.1).
- For primitives with `lengthVec` / `widthVec`: height direction is `normalize(lengthVec × widthVec)` (right-handed). When omitted, defaults are `lengthVec="1 0 0"`, `widthVec="0 1 0"`, height along `+Z`.
- For solids of revolution with bottom/top centers: axis is `topCenterPt − bottomCenterPt`; length is its magnitude. Coincident centers are an error.
- When angle is omitted, closed solids of revolution use a full turn `360`.
- Length-class attributes must be positive; diameter/radius must be positive. Cone with `topDiameter="0"` degenerates to a pointed tip and is allowed.

#### 3.2.2 Positioning point

##### `s3dx:point` (Positioning point)

A referable spatial anchor in the namespace: appears in the node tree; evaluation emits a positioning-point instruction so hosts (especially editors) may draw a marker; it does **not** participate in boolean solid operations. Other primitives’ point attributes may reference its current coordinates via `ref(#id)` (see §2.9).

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `id` | conditional | string | — | Unique in the document; required when targeted by `ref(#id)` |
| `at` | no | point | `0 0 0` | Local coordinates; literals / `var` / `calc` only — not `ref(#id)` |

Common optional attributes: `s3dx:transform`, `class`, and host-drawing `fill` / `opacity` (drawable shared set).

```xml
<s3dx:point id="A" at="0 0 0"/>
<s3dx:point id="B" at="100 0 50" s3dx:transform="translate(0 20 0)"/>
```

#### 3.2.3 Basic solids

##### `s3dx:box` (Box)

Aligned with AutoCAD `BOX` length/width/height semantics; directions are vectors so orientation is arbitrary.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `length` | yes | number | `100` | Edge length along `lengthVec` |
| `width` | yes | number | `100` | Edge length along `widthVec` |
| `height` | yes | number | `100` | Edge length along `lengthVec × widthVec` |
| `lengthVec` | no | vector | `1 0 0` | Length direction |
| `widthVec` | no | vector | `0 1 0` | Width direction (must not be colinear with lengthVec) |

Local origin: one corner of the bottom face; the bottom face is spanned by `lengthVec`/`widthVec`, extruded in the height direction.

##### `s3dx:cylinder` (Cylinder)

Aligned with “bottom center + other center + diameter” (equivalent to AutoCAD cylinder “other center” and OCC `MakeCylinder` axis segment).

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `diameter` | yes | number | `100` | Cylinder diameter |
| `bottomCenterPt` | yes | point | `0 0 0` | Bottom-face center |
| `topCenterPt` | yes | point | `0 0 100` | Top-face center |

End faces are perpendicular to the axis. For a sector cylinder see `sector-cylinder`.

##### `s3dx:sphere` (Sphere)

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `radius` | yes | number | `50` | Radius (diameter on the order of `100`) |
| `center` | yes | point | `0 0 0` | Sphere center |

##### `s3dx:cone` (Cone / frustum)

Aligned with OCC `MakeCone(r1,r2,h)`: end diameters may differ; `topDiameter=0` is a pointed cone. Eccentric ends use `loft`, not a separate primitive.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `bottomDiameter` | yes | number | `100` | Bottom diameter |
| `topDiameter` | yes | number | `40` | Top diameter; `0` means pointed tip |
| `bottomCenterPt` | yes | point | `0 0 0` | Bottom-face center |
| `topCenterPt` | yes | point | `0 0 100` | Top-face center |

Ends must be coaxial (line of centers is the axis).

##### `s3dx:torus` (Torus)

Aligned with AutoCAD `TORUS` / OCC `MakeTorus`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `diameter1` | yes | number | `100` | Major diameter = 2 × (torus center to tube center) |
| `diameter2` | yes | number | `25` | Tube cross-section diameter |
| `angle` | no | angle | `360` | Sweep angle around the ring; `<360` is a sector torus |
| `torusCenterPt` | yes | point | `0 0 0` | Torus center |
| `normal` | yes | vector | `0 0 1` | Normal of the torus plane |

Sweep start orientation: implementations may use a fixed heuristic; a formal release may add `refDir` [TBD].

##### `s3dx:wedge` (Wedge)

Aligned with AutoCAD `WEDGE`; truncated wedge follows OCC `ltx`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `length` | yes | number | `100` | Bottom length (wedge taper along this direction) |
| `width` | yes | number | `100` | Bottom width |
| `height` | yes | number | `100` | Height at the thick end |
| `lengthVec` | no | vector | `1 0 0` | Length direction (toward the thin end) |
| `widthVec` | no | vector | `0 1 0` | Width direction |
| `topLength` | no | number | `0` | Top-edge length at the thin end; `0` is a pointed wedge |

##### `s3dx:prism` (Prism)

Bottom polygon extruded straight along the normal (rectangular/polygonal shortcut for `extrude`).

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `points` | yes | point list | `0 0 0  100 0 0  100 100 0  0 100 0` | Bottom polygon vertices, ≥3 points; ordered, non-self-intersecting; first/last need not repeat |
| `height` | yes | number | `100` | Extrusion height |
| `normal` | no | vector | inferred from first three bottom points, right-handed | Extrusion direction |

##### `s3dx:sector-cylinder` (Sector Cylinder)

Aligned with OCC `MakeCylinder(r, h, angle)`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `diameter` | yes | number | `100` | Diameter |
| `bottomCenterPt` | yes | point | `0 0 0` | Bottom-face center |
| `topCenterPt` | yes | point | `0 0 100` | Top-face center |
| `angle` | no | angle | `360` | Sweep angle around the axis (degrees); `360` is equivalent to `cylinder` |

Angle conventions (aligned with OCC `MakeCylinder`):

- Axis: `bottomCenterPt` → `topCenterPt`.
- **0°** lies in the plane perpendicular to the axis, along the projection of world **`+X`** onto that plane (if the axis is parallel to `+X`, use the `+Y` projection instead).
- Sweep is measured **right-handed** around the axis (counterclockwise looking along the axis positive direction), from 0° to `angle`.

##### `s3dx:pyramid` (Pyramid / frustum)

Aligned with IFC `IfcRectangularPyramid`, PDMS `PYRA`: rectangular base + apex (or top rectangle).

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `length` | yes | number | `100` | Bottom edge length |
| `width` | yes | number | `100` | Bottom edge width |
| `height` | yes | number | `100` | Height from base to top |
| `lengthVec` | no | vector | `1 0 0` | Base length direction |
| `widthVec` | no | vector | `0 1 0` | Base width direction |
| `topLength` | no | number | `0` | Top edge length; `0` is a pointed pyramid |
| `topWidth` | no | number | `topLength` | Top edge width; defaults to `topLength` |

Local origin: base center; height along `lengthVec × widthVec`.

#### 3.2.4 Curve primitives (line / arc / composite path)

Aligned with STEP / IFC `polyline` / `trimmed_curve(circle)` / `composite_curve`, and OCC `Edge` / `Wire`: 3D lines and arcs are first-class primitives — displayable alone, or used as **trajectory segments** of `<s3dx:path>` (what the centerline itself looks like).

Note: how faces meet at corners of a sweep / pipe (`round` / `bevel` / `miter`; outer and inner may differ) is controlled by the parent body’s outer / inner corner attributes and generated automatically at evaluation. `line`/`arc` inside `path` only express trajectory geometry.

Correspondence (non-normative):

| svg3dx | STEP | IFC | OCC |
|---|---|---|---|
| `line` | `polyline` (two points) / `line`+trim | `IfcPolyline` (two points) | `Geom_Line` → `Edge` |
| `arc` | `trimmed_curve` + `circle` | `IfcTrimmedCurve` + `IfcCircle`; or `IfcArcIndex` | `Geom_Circle` → `Edge` |
| `path` | `composite_curve` | `IfcCompositeCurve` / `IfcIndexedPolyCurve` | `TopoDS_Wire` |

##### `s3dx:line` (3D line segment)

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `from` | conditional | point | `0 0 0` | Start; as a `path` segment immediately after a previous segment, may be omitted (defaults to previous end) |
| `to` | yes | point | `100 0 0` | End; must not coincide with start |

```xml
<s3dx:line from="0 0 0" to="100 0 0"/>
```

##### `s3dx:arc` (3D arc segment)

The arc lies in the plane with origin `center` and normal `normal`; angular parameter is measured from `xDir` (projected onto that plane), right-handed around `normal`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `form` | no | enum | see inference | Parameter form: `angles` or `ends`; if omitted, inferred from attributes; authors and optimize output should write an explicit `form` |
| `center` | yes | point | `0 0 0` | Arc center |
| `normal` | yes | vector | `0 0 1` | Arc-plane normal |
| `radius` | conditional | number | `100` | Radius; may be omitted under `form="ends"` and checked against chord length |
| `xDir` | no | vector | see notes | **`angles`**: 0° reference direction; default is a stable in-plane direction aligned with world axes as far as possible |
| `startAngle` | no | angle | `0` | **`angles`**: start angle |
| `angle` | conditional | angle | `90` | **`angles`**: sweep angle (may be negative for reverse) |
| `from` | conditional | point | — | **`ends`**: arc start (must lie on the circle within tolerance); as a `path` segment may be omitted to connect to previous end |
| `to` | conditional | point | — | **`ends`**: arc end (must lie on the circle) |

**`form` (parameter form)**: the two authoring systems are mutually exclusive; implementations must interpret by `form` and ignore (or strip on optimize) attributes exclusive to the other form. Inference when omitted: both `from` and `to` non-empty → `ends`; otherwise → `angles`.

1. **`form="angles"`** (center + radius + angles): `center` `normal` `radius` `startAngle` `angle` (optional `xDir`)
2. **`form="ends"`** (center + endpoints): `center` `normal` `from` `to` (optional `radius`); minor/major ambiguity resolved by optional `major="true"` [TBD]; draft 0.2 defaults to the ≤180° minor arc

```xml
<!-- Angle-parameter form -->
<s3dx:arc form="angles" center="0 0 0" normal="0 0 1" radius="100"
          xDir="1 0 0" startAngle="0" angle="90"/>

<!-- Endpoint form (common for 90° pipe bends) -->
<s3dx:arc form="ends" center="100 0 50" normal="0 -1 0" radius="50"
          from="100 0 0" to="150 0 50"/>
```

Constraints: `radius > 0`; `|angle|` of 0 is degenerate (skip + warning); a full circle may use `angle="360"` (displayed as a closed curve; as a path segment start and end coincide).

##### `s3dx:path` (composite 3D curve / trajectory)

Aligned with `composite_curve` / `Wire`: ordered curve segments joined end-to-end. May be:

- A **standalone primitive** (centerline, annotation guide, pipe-route preview, etc.)
- A **trajectory child** of `sweep` / `pipe`

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `form` | no | enum | see inference | Parameter form: `polyline` (point list) or `segments` (curve-segment children) |
| `points` | conditional | point list | `0 0 0  100 0 0  100 0 100` | **`polyline`**: polyline shorthand (≥2 points); equivalent to end-to-end `line` segments |

Children (**`form="segments"`**): `<s3dx:line>` / `<s3dx:arc>` in document order (spline / helix [TBD]).

**`form`**: mutually exclusive with `points` vs children. Inference when omitted: `line`/`arc` children present → `segments`; else `points` present → `polyline`. If both appear, prefer children and warn; optimize should remove the side that does not match `form`.

Segment continuity: each segment’s start must equal the previous end (suggested implementation tolerance ≤ 1e-6 × characteristic size, or warn and force join).

```xml
<!-- Trajectory itself includes an arc segment (curve-path geometry) -->
<s3dx:path form="segments">
  <s3dx:line from="0 0 0" to="100 0 0"/>
  <s3dx:arc form="ends" center="100 0 50" normal="0 -1 0" radius="50"
            from="100 0 0" to="150 0 50"/>
  <s3dx:line from="150 0 50" to="150 0 100"/>
</s3dx:path>

<!-- Polyline trajectory; for sweep/pipe, face joining at corners is filled by outer/inner corner -->
<s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
```

`sweep` takes its trajectory as a child `<s3dx:path>`. `pipe` selects the trajectory with `form`: `form="child"` uses a child `<s3dx:path>`; `form="inline"` uses the parent attribute `path="x1 y1 z1 …"` (mutually exclusive).

#### 3.2.5 Constructed solids (extrude / revolve / loft / sweep)

Correspond to the common swept-family constructors across STEP / IFC / SolidWorks / PDMS; prefer composing these for industry specials rather than defining dedicated primitives.

Correspondence (non-normative; see Appendix §13.4):

| svg3dx | STEP (ISO 10303-42) | IFC | SolidWorks | PDMS/E3D | Blender / 3ds Max |
|---|---|---|---|---|---|
| `extrude` | `extruded_area_solid` | `IfcExtrudedAreaSolid` | Extrude | EXTR (linear) | Extrude / Extrude modifier |
| `revolve` | `revolved_area_solid` | `IfcRevolvedAreaSolid` | Revolve | REVO | Spin / Lathe |
| `loft` | (section skinning, often mapped to B-Rep) | `IfcSectionedSolid*` approx. | Loft | multi-section compose | Loft / curve loft |
| `sweep` | `surface_curve_swept_area_solid` | `IfcFixedReferenceSweptAreaSolid` etc. | Sweep | EXTR along path | Curve Bevel / Sweep modifier |
| `pipe` | `swept_disk_solid` | `IfcSweptDiskSolid` | Sweep (circular profile) | CYLI segments / elbow CTOR | Bevel Depth tube |

**Role split**:

| Role | Element | Content |
|---|---|---|
| Pose | `origin` / `normal` / `xDir` on `extrude` / `sweep`; each `loft` / `revolve` `section` carries its own (`revolve` may also use the section’s `s3dx:transform` for relative offset); revolve body pose via parent `s3dx:transform` | Where the section sits and which way it faces |
| 2D profile | 2D shapes inside `<s3dx:section>` (may be multiple) | Section-local 2D |
| 3D trajectory | `<s3dx:path>` (`points` or `line`/`arc` segments) | Centerline **path geometry** (segments that compose the trajectory itself) |
| Sweep corner | Outer / inner corner on `sweep` / `pipe` (`outerCorner` / `innerCorner` and their radii) | How **outer and inner** faces join at trajectory corners; generated from those attributes at evaluation |

Section local → parent-local / world (`extrude` / `loft` / `sweep` / `revolve`):

- Local \(u\) axis: project `xDir` onto the plane perpendicular to `normal` and normalize (denoted \(\hat{X}\)).
- Local \(v\) axis: \(\hat{Y} = \hat{N} \times \hat{X}\) (right-handed; \(\hat{N}\) is normalized `normal`).
- Point map: \(P = \mathrm{origin} + u\,\hat{X} + v\,\hat{Y}\).
- Defaults: `origin="0 0 0"`, `normal="0 0 1"`, `xDir="1 0 0"`.
- If the section has `s3dx:transform`: after the point map, multiply by that transform in **parent-construct local** space (e.g. offset relative to the revolve body).
- For `revolve`, when transform / pose are unset, a default orientation matrix maps XY → body-local XOZ (see `s3dx:revolve`).

`revolve` constraint: the section plane must be **parallel to the revolve body’s +Z** (after transform, section normal \(\hat{N}'\) satisfies \(\lvert \hat{N}' \cdot \hat{Z}\rvert \approx 0\)); otherwise the section is **invalid** and yields no geometry. Identity transform + default XY = perpendicular to body Z → invalid.

##### `<s3dx:section>` (Section; not a standalone primitive)

Only a child of `extrude` / `revolve` / `loft` / `sweep`. Constructed solids hang profiles under exactly one `<s3dx:section>` (`loft`: several) so the tree stays consistent; profile complexity lives inside the section.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `origin` | no | point | see notes | Section origin; `loft` / `revolve` sections may carry their own; `extrude` / `sweep` default to inheriting parent pose |
| `normal` | no | vector | see notes | Section-plane normal; under `revolve`, must be ⊥ body Z after transform |
| `xDir` | no | vector | see notes | Section-local +X reference |
| `s3dx:transform` | no | 12-number matrix | identity | Extra transform relative to the parent construct (often an offset for `revolve`) |

Allowed children in draft 0.2 (at least one; **2D shapes only** — bool / conditional / loop not supported yet):

| Child | Notes |
|---|---|
| `<path d="…">` | SVG path; 0.1 implementations must support at least `M`/`L`/`H`/`V`/`Z` (and relative forms); `C`/`S`/`Q`/`T`/`A` are recommended (flattened to polylines for solid construction) |
| `<circle cx cy r>` | Circle |
| `<ellipse cx cy rx ry>` | Ellipse |
| `<polygon points="x1 y1 …">` | Closed polyline (2D point list) |
| `<polyline points="…">` | Polyline (may be open) |
| `<rect x y width height>` | Axis-aligned rectangle |

With multiple 2D shapes: each participates **independently** in the parent construct (for `revolve`, all are revolved together). Do not union / boolean them; evaluate each in document order.

Trajectory uses `<s3dx:path>` (see §3.2.3): polyline `points` or `line`/`arc` segments. Face joining at `sweep` / `pipe` corners is separate — see outer / inner corner.

##### `s3dx:extrude` (Extrude)

Aligned with STEP `extruded_area_solid` / IFC `IfcExtrudedAreaSolid` / OCC `MakePrism` / AutoCAD `EXTRUDE`. The parent carries section pose and extrusion extent; the profile must be a child `<s3dx:section>`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `origin` | no | point | `0 0 0` | Section origin |
| `normal` | no | vector | `0 0 1` | Section normal; also default extrusion direction |
| `xDir` | no | vector | `1 0 0` | Section-local +X |
| `dir` | no | vector | `normal` | Extrusion direction (may be oblique) |
| `length` | yes | number | `100` | Extrusion length |

Children: exactly one `<s3dx:section>` (closed profile → solid).

```xml
<s3dx:extrude origin="0 0 0" normal="0 0 1" length="100">
  <s3dx:section>
    <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/>
  </s3dx:section>
</s3dx:extrude>
```

##### `s3dx:revolve` (Revolve)

Aligned with STEP `revolved_area_solid` / OCC `MakeRevol` / AutoCAD `REVOLVE` / Blender Spin.

- **Axis**: revolve-body local **+Z** through the body origin; body pose only via parent `s3dx:transform` (and the host transform chain).
- **Section**: 2D profile stays in section-local **XY**; locate it relative to the body with `origin` / `normal` / `xDir` and `s3dx:transform`; evaluate in body-local space, then spin about body +Z.
- **Validity**: after transform, the section plane must be **parallel to body +Z**; otherwise invalid. An identity transform leaves the default XY section **perpendicular** to body Z → invalid.
- **Default orientation** (no pose attrs and no `s3dx:transform`): inject  
  `s3dx:transform="matrix(1 0 0 0 0 1 0 -1 0 0 0 0)"`  
  i.e. section-local \((u,v,0) \mapsto (u,0,v)\) (body-local XOZ; \(u\)=radial, \(v\)=axial). For offsets, keep that 3×3 and change only the translation.
- **Sense**: positive `angle` is **counterclockwise** about +Z (right-hand rule).

Profile complexity lives inside the `section`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `angle` | no | angle | `360` | Revolution angle (positive = CCW) |
| `solid` | no | boolean | `true` | Whether to attempt a solid. When the angle is less than 360°, **closed path** (`d` includes `Z`) and **closed circle** (`<circle>`) get triangulated end-face caps; other 2D shapes or open profiles do not get caps even if `solid="true"`, only the revolved side |

Children: exactly one `<s3dx:section>` (generatrix profile; may contain multiple 2D shapes, each revolved). A full turn is already closed by the side surface, so no caps are needed.

```xml
<!-- Default orientation: XY→XOZ; spin CCW about body +Z. Offset via translation only -->
<s3dx:revolve solid="true" angle="270">
  <s3dx:section s3dx:transform="matrix(1 0 0 0 0 1 0 -1 0 0 0 0)">
    <path d="M 40 0 L 100 0 L 100 100 L 40 60 Z"/>
  </s3dx:section>
</s3dx:revolve>
```

##### `s3dx:loft` (Loft)

Aligned with OCC `ThruSections` / SolidWorks Loft / blended surfaces: skin several sections (**no sweep path**; sections are already posed). Each pose hangs on its own `<s3dx:section>`.

Loft does **not** need a sweep-style “corner type”: adjacent sections have no centerline kink; geometry is determined by section poses and the **blend / approach law** between sections.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `solid` | no | boolean | `true` | Whether to close as a solid |
| `blend` | no | enum | `linear` | **Approach law** for shape transition between sections (below) |

Children: at least two `<s3dx:section>` elements, in document order as the section sequence.

**Approach law `blend` (profile-shape transition)**

Between adjacent sections, pose / center advances **uniformly** in parameter \(t \in [0,1]\); profile-shape interpolation weight is \(s = f(t)\) with \(f(0)=0\), \(f(1)=1\). `blend` only changes *when* the shape morphs, not how the section center travels:

| Value | \(f(t)\) | Shape |
|---|---|---|
| `linear` | \(t\) | Shape changes at constant rate |
| `sine` | \(\sin(\pi t / 2)\) | Stays like the start section longer, then accelerates to the end |
| `cosine` | \(\tfrac12 - \tfrac12\cos(\pi t)\) | Slow at ends, fast in the middle |
| `tan` | \(\tan(\pi t / 4)\) | Slower early, faster late |
| `cotan` | \(1 - \tan(\pi (1-t) / 4)\) | Faster early, slower late (mirror of `tan`) |

Constraints and implementation:

- draft 0.2 **must** support all five above; unknown values fall back to `linear` + warning.
- With multiple sections, the approach law applies **between each adjacent pair**.
- Guide-curve / centerline loft (SolidWorks guide / centerline loft) is not in the 0.1 core.

```xml
<s3dx:loft solid="true" blend="linear">
  <s3dx:section origin="0 0 0" normal="0 0 1">
    <path d="M -50 -50 L 50 -50 L 50 50 L -50 50 Z"/>
  </s3dx:section>
  <s3dx:section origin="0 0 100" normal="0 0 1">
    <circle cx="0" cy="0" r="40"/>
  </s3dx:section>
</s3dx:loft>
```

##### `s3dx:sweep` (Sweep)

Aligned with STEP `surface_curve_swept_area_solid`, IFC `IfcFixedReferenceSweptAreaSolid` / `IfcSurfaceCurveSweptAreaSolid`, SolidWorks Sweep, 3ds Max Sweep, OCC `MakePipeShell`: one section moved along a path to form a solid.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `orient` | no | enum | `frenet` | Section attitude: `frenet` (parallel transport along path) \| `fixed` (IFC FixedReference: `refDir` projected as section-local +X) \| `parallel` (`refDir` projected as section-local +Y / “up”) |
| `refDir` | conditional | vector | — | Reference for `orient=fixed` / `parallel`. Prefer a direction with a sufficient angle to the path tangent (an in-plane bend bisector readily becomes parallel to the tangent and singular); when parallel to the tangent, use previous-frame parallel transport and keep frame handedness continuous |
| `solid` | no | boolean | `true` | Whether a closed section produces a solid |
| `outerCorner` | no | enum | `round` | **Outer corner** (convex side of the bend); see below |
| `innerCorner` | no | enum | `round` | **Inner corner** (concave side of the bend); see below |
| `outerCornerRadius` | conditional | number | `50` | Fillet radius when the outer type is `round`; when omitted, implementations may pick a length-based default and warn |
| `innerCornerRadius` | conditional | number | `50` | Fillet radius when the inner type is `round`; omit → same default policy |
| `miterLimit` | no | number | `4` | Miter limit (below); must be `≥ 1`; applies when either side is `miter` |

Children: exactly one `<s3dx:section>`, plus a **required** trajectory child `<s3dx:path>`. The 2D profile is interpreted in each path frame’s local \((u,v)\) (attitude from `orient`).

**Two layers**

| Layer | Expressed by | Meaning |
|---|---|---|
| **Trajectory** | `<s3dx:path>` `points` / `line` / `arc` | The centerline itself: where the polyline goes, how curve segments bend |
| **Corner joining** | Outer / inner corner (+ radii when `round`) | At trajectory **kink vertices**, how the swept **outer and inner** faces round / bevel / miter; **generated from those attributes at evaluation** |

An `arc` inside `path` means “this trajectory segment *is* an arc”; outer/inner `round` means “at a polyline kink, join that side of the sweep as a round corner.” The former is path definition; the latter is sweep construction.

**Outer vs inner corner (same split as common CAD / SVG `stroke-linejoin` / Blender Bevel outer·inner)**

At a kink the swept solid has an **outer** (convex) side and an **inner** (concave) side. Those sides often need different join states (e.g. miter outside, bevel inside), so they are authored separately:

| Attribute | Side |
|---|---|
| `outerCorner` (+ `outerCornerRadius`) | Outer (convex) |
| `innerCorner` (+ `innerCornerRadius`) | Inner (concave) |

Resolution (each side independently; default `round`):

```
outer = outerCorner ?? "round"
inner = innerCorner ?? "round"
outerR = outerCornerRadius
innerR = innerCornerRadius
```

At interior vertices where the trajectory tangent is discontinuous, the implementation generates joining from the resolved outer / inner types. Corner type is authored on the outer / inner attributes; `path` children describe trajectory geometry only. Enum values match SVG/CSS `stroke-linejoin`’s three mainstream joins (same identifiers):

| Value | Result | Notes |
|---|---|---|
| `round` | Round / fillet | **Default**; tangent circular join; radius from that side’s `*CornerRadius` |
| `bevel` | Bevel fill | Keep the kink; dual-frame bevel join on that side; section half-width stays the same at the corner |
| `miter` | Miter | Keep the kink; wall-wall miter on that side (section may widen); when the ratio exceeds `miterLimit`, join as bevel |

**Miter limit `miterLimit` (default 4)**

Aligned with SVG/CSS [`stroke-miterlimit`](https://www.w3.org/TR/SVG11/painting.html#StrokeMiterlimitProperty) (also default **4**). Definition: the ratio of miter tip extent from the path center to the profile half-width at that vertex. For a planar kink with turn angle \(\theta\):

\[
\frac{\text{miterExtent}}{\text{halfWidth}} \approx \frac{1}{\sin(\theta/2)}
\]

When that ratio is \(\le\) `miterLimit`, keep the miter; otherwise join that vertex as bevel. Default `4` keeps miters for about \(\theta \gtrsim 29°\) (sharper bends become bevel). Valid range `miterLimit ≥ 1`; values below `1` clamp to `1`. Note: Canvas / PDF / PostScript often default to **10** (miters kept down to about \(\theta \gtrsim 11.5°\)); this format follows SVG with **4**.

Path shaping vs profile joining:

- When resolved **outer = inner = `round`**: fillet the centerline (common equal-sides case); centerline radius prefers `outerR`, else `innerR` / implementation default.
- When the two sides **differ**, or either is `bevel` / `miter`: keep the trajectory kink; join each profile-ring vertex by the type of the side it lies on. When only one side is `round`, implementations should round that side in profile space; if one-sided rounds are unsupported, they may join as `bevel` and warn.
- Corner joining applies only at kinks whose deflection meets the implementation threshold.
- When a radius exceeds available adjacent edge length, shrink to fit and warn.
- Where the trajectory segment is already a smooth curve (e.g. interior samples of a path-child `arc`), tangent stays continuous and the path remains smooth; corner joining applies only at kink vertices with discontinuous tangent.
- `orient` controls section attitude and is independent of corner joining.

```xml
<!-- Same type on both sides -->
<s3dx:sweep orient="frenet" solid="true"
            outerCorner="round" innerCorner="round"
            outerCornerRadius="50" innerCornerRadius="50">
  <s3dx:section>
    <path d="M -20 -10 L 20 -10 L 20 10 L -20 10 Z"/>
  </s3dx:section>
  <s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
</s3dx:sweep>

<!-- Different states: miter outside, bevel inside -->
<s3dx:sweep orient="frenet" solid="true" outerCorner="miter" innerCorner="bevel">
  <s3dx:section>
    <path d="M -20 -10 L 20 -10 L 20 10 L -20 10 Z"/>
  </s3dx:section>
  <s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
</s3dx:sweep>
```

Constraints:

- Polyline paths need at least two segments (≥3 points); corners follow outer / inner; implementations should produce non-self-intersecting geometry and warn when that cannot be guaranteed.
- When `orient` exceeds current kernel capability: evaluate as `frenet` and warn.
- The 0.1 core covers single-section sweeps; multi-section variation along a path (SolidWorks guides / IFC SectionedSolid) may be approximated with `loft`, or deferred to later extensions.

##### `s3dx:pipe` (Swept disk / round pipe)

Aligned with STEP `swept_disk_solid` / IFC `IfcSweptDiskSolid`: circular (optionally hollow) section swept along a 3D path. Generic expression for pipe, cable, and elbow segments; closer to exchange standards than a general `sweep`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `form` | no | enum | see inference | Trajectory form: `inline` (parent `path` point list) or `child` (child `<s3dx:path>`) |
| `radius` | yes | number | `20` | Outer radius (≡ STEP `radius`) |
| `innerRadius` | no | number | — | Inner radius; omit for solid; recommended example `16` (must `0 < innerRadius < radius`) |
| `path` | conditional | point list | — | **`inline`**: centerline polyline point list |
| `outerCorner` / `innerCorner` | no | enum | `round` | Outer / inner face joining, same as `sweep` |
| `outerCornerRadius` / `innerCornerRadius` | conditional | number | `50` | Same as `sweep` |
| `miterLimit` | no | number | `4` | Same as `sweep` |

Children: under **`form="child"`**, a `<s3dx:path>` is required (polyline or `line`/`arc` segments). Trajectory `form`: `inline` and `child` are mutually exclusive (one required). Inference when omitted: `<s3dx:path>` child present → `child`; else `path` attribute present → `inline`. Optimize should remove the side that does not match `form`.

```xml
<s3dx:pipe form="child" radius="20" innerRadius="16"
           outerCorner="round" innerCorner="round"
           outerCornerRadius="50" innerCornerRadius="50">
  <s3dx:path form="polyline" points="0 0 0  100 0 0  100 0 100"/>
</s3dx:pipe>
```

Semantically equivalent to `sweep` + circular `<s3dx:section>` (plus an inner circle when hollow), but implementations should prefer a swept-disk algorithm (section always perpendicular to path tangent). Trajectory vs outer / inner corner joining is the same split as `sweep`.

#### 3.2.6 External triangle asset (`s3dx:gltf`)

##### `s3dx:gltf` (Referenced glTF 2.0 asset)

svg3dx documents are self-describing **parametric assembly recipes**: constructors, parameters, conditionals, booleans, and poses. Triangle meshes are referenced via `s3dx:gltf` as external glTF/GLB assets (kept in glTF’s native format)—the same external-resource model as SVG `<image href>` / CSS `url()`.

| Attribute | Required | Type | Default | Notes |
|---|---|---|---|---|
| `href` | yes | IRI | — | Reference to a glTF 2.0 resource (`.glb` or `.gltf`). Relative references resolve against the **document base URL**. Must **not** be a bare fragment `#id` (that is `s3dx:use` semantics). Must **not** be a `data:` URI in this draft |

Constraints and resolution:

- **Authoring recommendation**: relative paths in the same delivery tree as the document (same directory or a subdirectory such as `assets/…`).
- **Absolute / remote** `https://…` IRIs are syntactically allowed; whether the host fetches them (CORS, offline, sandbox) is host-defined. Core compliance requires resolving and loading **relative** same-tree references against the document base.
- **Required media**: `.glb`. Implementations **should** also support `.gltf` plus buffers/textures referenced relatively from that `.gltf` URL (glTF’s own rules).
- Load failure (missing, CORS, corrupt) → skip that `s3dx:gltf` instance + warning.
- This draft does **not** embed glTF bytes in the XML.

```xml
<s3dx:gltf href="assets/bunny.glb"/>
```

**Axis conversion (normative).** glTF 2.0 is Y-up; svg3dx is Z-up (§1.4). Implementations MUST treat referenced assets as glTF Y-up and MUST apply the following basis conversion \(C\) **once** at the `s3dx:gltf` instance root, **before** the element’s `s3dx:transform` (do not write \(C\) into authored `s3dx:transform`):

\[
(x,y,z)_{\mathrm{glTF}} \mapsto (x,\ -z,\ y)_{\mathrm{svg3dx}}
\]

Column-major 4×4 (same layout as common GPU / Three.js `Matrix4`):

```
1  0  0  0
0  0 -1  0
0  1  0  0
0  0  0  1
```

World composition:

\[
M_{\mathrm{world}} = M_{\mathrm{parents}} \cdot M_{\mathrm{element}} \cdot C \cdot M_{\mathrm{gltfLocal}}
\]

Authored transforms are interpreted in **svg3dx space after** \(C\) (asset stands on XY with height along +Z when `s3dx:transform` is identity).

**Appearance.** Primary shading comes from the glTF asset’s materials. Element `fill` / `material` (§8), when present, MAY multiply into base color; hosts that cannot composite MUST keep glTF materials and MAY warn.

**Assembly with conditionals.** Prefer pairing `gltf` with `s3dx:if` / `s3dx:if-not` when one logical product maps to multiple non-uniform tessellated variants (e.g. mesh LODs):

```xml
<s3dx:if test="var(--LOD) = 0">
  <s3dx:gltf href="assets/bunny-lod0.glb"/>
</s3dx:if>
<s3dx:if test="var(--LOD) = 1">
  <s3dx:gltf href="assets/bunny.glb"/>
</s3dx:if>
```

#### 3.2.7 Core-layer quick reference

| Primitive | Required | Optional / children |
|---|---|---|
| `point` | — | id (required when referenced), at |
| `box` | length, width, height | lengthVec, widthVec |
| `cylinder` | diameter, bottomCenterPt, topCenterPt | — |
| `sphere` | radius, center | — |
| `cone` | bottomDiameter, topDiameter, bottomCenterPt, topCenterPt | — |
| `torus` | diameter1, diameter2, torusCenterPt, normal | angle |
| `wedge` | length, width, height | lengthVec, widthVec, topLength |
| `pyramid` | length, width, height | lengthVec, widthVec, topLength, topWidth |
| `prism` | points, height | normal |
| `sector-cylinder` | diameter, bottomCenterPt, topCenterPt | angle |
| `line` | to | from |
| `arc` | center, normal | form=`angles`\|`ends`; angles: radius, xDir, startAngle, angle; ends: from, to (optional radius) |
| `path` | one side per form | form=`polyline` (points) \| `segments` (children: `line` / `arc`) |
| `extrude` | length | origin, normal, xDir, dir; exactly 1 × `<s3dx:section>` |
| `revolve` | — | angle, solid; exactly 1 × `<s3dx:section>` (plane must ∥ body +Z; pose/offset on section; CCW about body +Z) |
| `loft` | — | solid, blend; ≥2 × `<s3dx:section>` (each carries pose; no sweep corners) |
| `sweep` | — | orient, refDir, solid, outerCorner, innerCorner, outerCornerRadius, innerCornerRadius, miterLimit; 1 × `<s3dx:section>` + 1 × `<s3dx:path>` |
| `pipe` | radius + trajectory | form=`inline`\|`child`; innerRadius, outerCorner, innerCorner, outerCornerRadius, innerCornerRadius, miterLimit; path / `<s3dx:path>` |
| `gltf` | href | (drawable: fill, material, opacity, s3dx:transform) |

#### 3.2.8 Reference sources (non-normative)

- STEP ISO 10303-42: `composite_curve`, `trimmed_curve`, `circle`, `extruded/revolved/surface_curve_swept_area_solid`, `swept_disk_solid`, CSG primitives.
- IFC: `IfcCompositeCurve`, `IfcIndexedPolyCurve`, `IfcTrimmedCurve`, `IfcExtrudedAreaSolid`, `IfcRevolvedAreaSolid`, `IfcSweptDiskSolid`, `IfcFixedReferenceSweptAreaSolid`, `IfcCsgPrimitive3D`, `IfcTriangulatedFaceSet`.
- SolidWorks: Extrude / Revolve / Sweep / Loft.
- PDMS / AVEVA E3D: BOX, CYLI, CONE, PYRA, CTOR, EXTR, REVO and related equipment primitives.
- AutoCAD / OCC: solid primitives and `MakePrism` / `MakeRevol` / `MakePipeShell` / `ThruSections`; curves `Edge` / `Wire`.
- Blender / 3ds Max: Extrude, Spin, Curve Bevel / Sweep modifiers; triangle assets via glTF/GLB.
- Triangle assets: glTF 2.0 (referenced by `s3dx:gltf`), aligned with SVG external resource references.

### 3.3 glTF notes

- Evaluation emits a `gltf` primitive instruction with resolved `href` (and styles / transform). Loading and decoding the asset is a **host / render-stage** concern; the core evaluator does not meshing-decode glTF.
- Boolean operands may be `gltf` if the kernel supports mesh booleans on the loaded triangles; otherwise skip + warning.
- Recommended pattern for product families with non-uniform tessellated variants: `s3dx:if` + multiple `s3dx:gltf` hrefs (see §3.2.5).
- **Package format `.svg3dxz`**: a ZIP (store / deflate). The package root MUST contain entry file **`main.svg3dx`** (XML recipe); sidecar assets (e.g. `.glb` / `.gltf`) live in the same package. Relative `href`s resolve against the package root (i.e. relative to `main.svg3dx`). Implementations SHOULD provide **byte-level** open / write for packages (`&[u8]` ↔ `{ main.svg3dx text, path→bytes sidecars }`); the host obtains and persists those bytes. glTF mesh decode remains a render-host concern. Standalone `.svg3dx` files remain valid.

### 3.4 3D transform (`s3dx:transform`)

- 3D transforms are written on the namespaced attribute **`s3dx:transform`**, **not** the SVG standard attribute `transform`. This keeps 2D 6-number `transform` and 3D 12-number matrices from competing for the same name.
- The value supports two **persistent forms**, distinguished by syntax. Both evaluate to the same 12-number affine matrix (3×3 linear + translation):

  1. **Matrix form**:

     `matrix(a b c  d e f  g h i  tx ty tz)`

     The first 9 numbers are a 3×3 linear transform (column vectors: `(a,b,c)` / `(d,e,f)` / `(g,h,i)` are the X/Y/Z axes); the last 3 are translation.

  2. **TRS form** (translate / rotate / scale):

     `translate(tx ty tz) rotate(rx ry rz) scale(sx sy sz)`

     - Each function may be omitted; defaults are `translate(0 0 0)`, `rotate(0 0 0)`, `scale(1 1 1)`. A subset is allowed (e.g. only `translate(...)`).
     - Functions are recognized **by name**, independent of written order; documents and samples should prefer `translate` → `rotate` → `scale`.
     - **Rotation**: `rotate(rx ry rz)` uses **degrees**. For column vectors, `R = Rz · Ry · Rx`: rotate by `rx` about the fixed X axis, then `ry` about the fixed Y axis, then `rz` about the fixed Z axis, so `p' = Rz Ry Rx p`. This matches Three.js Euler order `XYZ`.
     - **Composition (column vectors)**: `M = T · R · S` (scale, then the rotation above, then translate), matching common local object matrices and transform-gizmo semantics.
     - Must **not** mix `matrix(...)` with TRS functions in the same attribute value; if mixed, implementations should warn and attempt to parse by the **first recognizable form**, falling back to identity on failure.

- **Number separators**: the normative form is **space-separated** (newlines allowed), consistent with this format’s point lists / vectors (e.g. `lengthVec="1 0 0"`) and SVG number-list habit, and convenient for embedding vectors such as `var(--loop-value)` into components. Implementations may treat commas as optional separators equivalent to spaces (aligned with SVG `comma-wsp`), but documents and samples should use the space form.
- Examples:
  - `s3dx:transform="matrix(1 0 0 0 1 0 0 0 1 100 200 300)"`
  - `s3dx:transform="translate(100 200 300) rotate(0 45 0) scale(1 1 1)"`
  - `s3dx:transform="rotate(90 90 0)"` equals `matrix(0 0 -1 1 0 0 0 -1 0 0 0 0)`; local `+X (1 0 0)` lands on `(0 0 -1)`.
  - `s3dx:transform="translate(var(--x) 0 calc(var(--h) / 2))"`
- Values may contain `var(--*)` / `calc(...)` (parsed by the svg3dx evaluator) on matrix components or TRS function components.
- Both forms are valid persistence syntax and evaluate equivalently. Representing the same affine transform in the other form is not necessarily unique or lossless (shear, non-unique Euler angles, expression structure, floating-point precision, etc.).
- Scope: 3D-related SVG host elements (e.g. `<g>`) and `s3dx:*` elements (including `<s3dx:use>`, `<s3dx:model>`, primitives on loop/boolean containers, etc.).
- The unprefixed SVG attribute `transform` is always interpreted with **SVG / CSS 2D** semantics (typically 6-number `matrix`, etc.) and does **not** carry this format’s 3D transform.
- Standard SVG/CSS `matrix()` is 6 parameters and `matrix3d()` is 16; the 12-number `matrix(...)` and the TRS function list on `s3dx:transform` are **svg3dx extensions**, evaluated by this format and not required to be natively supported by browsers.
- Accumulation order: in-group `s3dx:transform` → instance `s3dx:transform` → parent `s3dx:transform`.

## 4. Combination and booleans

### 4.1 Role of `<g>`

- `<g>` provides grouping, naming (`id`), parameter scope (`class` / `style`), and `s3dx:transform`. It does not carry conditionals or boolean operations.
- Children accumulate in document order (equivalent to union) without changing geometry-accumulation semantics.

### 4.2 Boolean elements

- `s3dx:bool-union`: union of all children.
- `s3dx:bool-subtract`: first child is the minuend; subsequent children are subtracted in order.
- `s3dx:bool-intersect`: intersection of all children.
- Children evaluate in document order; scope is closed inside the element and does not interact with already-accumulated parent results.
- Nesting is allowed: inner results evaluate first and become one operand of the outer.
- Empty element: skip entirely; no geometry; no error.
- Single child: emit that child as-is; no boolean is performed.
- Operands may be `<s3dx:use>`; the boolean applies to the referenced geometry set, not the element itself.
- `<s3dx:point>` must not be a boolean solid operand; if present, skip that operand and warn.

## 5. Conditionals

### 5.1 Elements

Conditionals are independent control-flow elements, alongside booleans and loops as structural expressions:

- `<s3dx:if test="condition">`: subtree evaluates when the condition is true; skipped entirely when false.
- `<s3dx:if-not test="condition">`: subtree evaluates when the condition is false; skipped when true.

### 5.2 Rules

- Attribute `test` is required; values support expressions (see §2.6).
- May appear inside `<g>`, `<defs>`, `<s3dx:model>`, `<s3dx:loop-*>`, `<s3dx:bool-*>`, and nested `s3dx:if` / `s3dx:if-not`.
- Allowed children match `<g>` under 3D evaluation: primitives, `<s3dx:use>`, nested `if` / `if-not` / `loop-*` / `bool-*`, and inner `<g>`.
- As a 3D assembly container, may optionally carry `s3dx:transform` (applied to the subtree when evaluated, same as `<g>` / `loop-*` / `bool-*`); does not own naming/grouping (reusable named groups still use `<g id="...">`).
- Failed condition evaluation (undefined parameter, syntax error, type mismatch): treat as false + warning.
- No `else`; exclusive branches use a pair of `s3dx:if` + `s3dx:if-not` with the same `test`.
- Do not hang `if` / `ifnot` attributes on standard SVG elements; older spellings are not compliant with this draft.

## 6. Loop expansion

### 6.1 Division of labor

- `<g>` owns named grouping and parameter scope; `<s3dx:if>` / `<s3dx:if-not>` own conditions; `<s3dx:loop-*>` owns repeated expansion.
- Loop elements must live inside `<g>`, `<defs>`, `<s3dx:model>`, conditionals, or boolean elements.
- Direct children may be primitives, `<s3dx:use>`, and nested `loop-*` / `bool-*` / `if` / `if-not`.

### 6.2 `s3dx:loop-points`

- Attribute `points`: a multiple of 3 numbers; every three form a 3D point; iterate the point sequence in order.
- Each iteration injects (legal `<dashed-ident>`):
  - `--loop-index`: integer from 0
  - `--loop-value`: current 3D point (three space-separated numbers)
  - `--loop-value-x` / `--loop-value-y` / `--loop-value-z`: component scalars

### 6.3 `s3dx:loop-range`

- Attributes `start`, `end`, `step` (optional, default 1); support literals / `var(--*)` / `calc(...)`; evaluate to numbers.
- Iterate a numeric sequence inclusive of `start`, exclusive of `end`.
- Each iteration injects:
  - `--loop-index`: integer from 0
  - `--loop-value`: current numeric value (scalar)

### 6.4 Common rules

- Iteration variable names are fixed to the dashed-idents above; custom iteration names are not supported.
- Nested loops: same-named inner variables shadow outer ones; nearest wins.
- Expansion timing: after parameter evaluation, before condition evaluation.
- As a 3D assembly container, may optionally carry `s3dx:transform`; applied to the subtree of each iteration when evaluated.
- Unknown `s3dx:loop-*` elements: skip the whole subtree as an unknown element; no error.
- Extensibility: `loop-*` is an open namespace; later versions may add modes; implementations that meet an unrecognized `loop-*` should skip rather than error.
- Expanded copies participate independently in boolean accumulation in document order.

## 7. Model and display

### 7.1 `<s3dx:model>`

- Attributes: `id` (required), `mode` (required), `s3dx:transform` (optional, 12-number 3D matrix), `active` (optional, boolean).
- `mode` values: `solid` (shaded solid), `wireframe`, `hidden-line`. [TBD] whether `points` etc. are needed.
- Children: one or more `<s3dx:use>`, specifying display content in document order.
- No `visible` attribute; display coverage is entirely determined by child `<s3dx:use>` elements.
- Semantics: defines a display configuration, not a camera or projection.
- The same `<g>` may be referenced by multiple models; geometry evaluates once; rendering proceeds per model configuration.

### 7.2 Multi-model switching

- A file may define multiple `<s3dx:model>` elements.
- Default active model: the one marked `active="true"`; if none, the first `<s3dx:model>` in document order.
- External parameters may override (e.g. pass `model=wireframe-view` and switch by matching `id`).

### 7.3 Relation to standard `<view>`

- Standard SVG `<view>` and `<s3dx:model>` are semantically independent and must not substitute for each other. Standard `<view>` overrides canvas viewport; `<s3dx:model>` selects 3D render mode.

## 8. Materials and shading

Shading is a **render-stage** concern (same layer as `<s3dx:model mode>`), not part of geometry evaluation. Final 3D color is the **component-wise product** of element fill and material color (sRGB), optionally times glTF vertex / base color when compositing against a `gltf` asset (§3.2.5).

### 8.1 `<s3dx:materials>` / `<s3dx:material>`

```xml
<s3dx:materials>
  <s3dx:material id="tank-paint"
                 color="0.2 0.45 0.85 1"
                 metalness="0"
                 roughness="0.55"/>
  <s3dx:material id="frosted-glass"
                 color="0.90 0.95 1.0 0.25"
                 metalness="0"
                 roughness="0.05"/>
</s3dx:materials>
```

- `<s3dx:materials>`: direct child of root `<svg>`; children **only** `<s3dx:material>`; does not participate in geometry evaluation, booleans, or loops.
- A document may contain multiple `<s3dx:materials>` blocks, merged in document order; duplicate `id`: warn, later overrides earlier.
- `<s3dx:material>`: `id` required (unique in the document after merge). Attributes:
  - `color`: RGBA, components recommended ∈ [0,1] (sRGB); with 3 numbers, A is treated as `1`. No separate `opacity`.
  - `metalness`: default `0`.
  - `roughness`: default `0.5`.
- This draft has no textures (baseColorTexture etc. deferred).

### 8.2 Element color `fill`

- 3D shading uses SVG **`fill`** (presentation attribute or CSS). The value may be a space-separated RGBA number list (same shape as material `color`; 3 numbers → A=1) or an SVG color (`#RGB`, `#RRGGBB`, `#RRGGBBAA`, `rgb()`, `rgba()`). An unparsed value falls back to the default color with a warning.
- On the same element: CSS `fill` (class rule or inline `style`) outranks presentation attribute `fill`.
- When `fill` is undeclared, the 3D default color is `0.53 0.67 0.80 1`.
- If standard SVG `opacity` is also present, multiply it with `fill`’s A again.

### 8.3 Material reference

A material reference uses the same forms as an SVG paint property (`fill` / `stroke`): a bare name is only a built-in keyword, and a document definition is referenced only with `url(#id)`.

- The presentation attribute has two values:
  - Built-in keyword: `material="steel"`, `material="glass"`.
  - Document material: `material="url(#tank-paint)"`.
- `#id` is not a material reference. `material="#glass"` is invalid; `#id` is a fragment reference for attributes such as `href`, not a paint value.
- CSS custom properties use the same forms: `--material: steel;` / `--material: url(#tank-paint);`.
- Scope: 3D-related hosts (e.g. `<g>`) and `s3dx:*` primitives/containers (including boolean, conditional, and loop containers).
- On the same element: CSS `--material` outranks `material`; if neither is declared → built-in **`default`**.
- Resolution:
  1. `url(#id)` → the document material library. A missing id falls back to `default` with a warning.
  2. A bare name → the built-in keyword table only. A hit uses that preset; a miss falls back to `default` with a warning. A bare name does not look up a document material `id`, so `material="tank-paint"` does not select the document material `id="tank-paint"`.
- When a document material `id` collides with a built-in keyword, the bare name still means the built-in; the document definition requires `url(#id)`. If the document contains `id="glass"`, `material="glass"` is built-in glass and `material="url(#glass)"` is that document material.

### 8.4 Composition

```
outRGB = fill.rgb * material.color.rgb
outA   = fill.a   * material.color.a   [* opacity if present]
```

For `s3dx:gltf`, primary appearance is the asset’s PBR materials; if the host applies element `fill` / `material`, then `out *= fill × material` on base color (and vertex color when present). Translucent depth composition is host-defined.

Boolean results use the `fill` / `material` resolved on the **boolean container** itself; child operands’ individual appearance is not retained on the result.

Curves: primarily use composed RGB; implementations may ignore metalness / roughness.

### 8.5 Built-in presets (reference look)

All metallic-roughness. `default` is a neutral multiplier that does not change element `fill`.  
**Keyword** is the stored value; **English** is the official display name (English UI / docs):

| Keyword | English | color (RGBA) | metalness | roughness |
|---|---|---|---|---|
| `default` | Default | `1 1 1 1` | 0 | 0.6 |
| `steel` | Steel | `0.56 0.57 0.58 1` | 1 | 0.35 |
| `stainless` | Stainless | `0.70 0.70 0.72 1` | 1 | 0.25 |
| `aluminum` | Aluminum | `0.91 0.92 0.92 1` | 1 | 0.30 |
| `copper` | Copper | `0.95 0.64 0.54 1` | 1 | 0.35 |
| `brass` | Brass | `0.88 0.78 0.45 1` | 1 | 0.30 |
| `plastic` | Plastic | `0.85 0.85 0.85 1` | 0 | 0.45 |
| `rubber` | Rubber | `0.15 0.15 0.15 1` | 0 | 0.85 |
| `concrete` | Concrete | `0.55 0.55 0.52 1` | 0 | 0.90 |
| `glass` | Glass | `0.90 0.95 1.0 0.25` | 0 | 0.05 |
| `wood` | Wood | `0.55 0.35 0.18 1` | 0 | 0.75 |

## 9. Metadata (follows SVG)

Application and vendor descriptive data are carried in standard SVG [`<metadata>`](https://www.w3.org/TR/SVG11/metadata.html), using the same authoring pattern as 2D SVG. Implementations must follow the rules below.

### 9.1 Container and payload

- **Container**: Write `<metadata>` in the SVG namespace.
- **Payload**: Inside `<metadata>`, write elements from other XML namespaces to express vendor or domain property tables. Field names, types, optionality, and versioning are defined by the specification bound to that namespace URI; this core format defines the container, association, and preservation rules.
- **Implementation duties**: After parsing, keep every `<metadata>` element and its full foreign-namespace subtree in the DOM; official round-trips and optimize must retain those nodes. Geometry evaluation, booleans, and loop expansion process only this format’s geometry semantics (see §12). Hosts and domain tools may read the preserved metadata subtree directly.
- **Division of roles with materials**: `<s3dx:materials>` / `material` supply 3D **render** shading; `<metadata>` supplies object **description**. Both may appear in the same document, each for its role.

### 9.2 Association

Authors associate metadata with objects using one or more of the SVG mechanisms below:

| Mode | Usage |
|---|---|
| Child element (primary path) | Place `<metadata>` as a child of the host (e.g. `<g>`); association is the DOM parent/child link. Prefer one `<metadata>` per host, early among children (aligned with SVG guidance). |
| Document-level | Place `<metadata>` under the root `<svg>` to describe the whole document (for example, the vendor profile this file uses). |
| Non-local / library-style | Place `<metadata>` elsewhere in the document; in the payload use RDF `about="#elementId"` (or an equivalent pointer defined by that foreign namespace) to reference a graphics element that has an `id`. |

### 9.3 Vendor property tables and registry

- **Introducing a property table**: Declare `xmlns:prefix="namespaceURI"` on the root `<svg>`. Document-level `<metadata>` may carry that namespace’s profile declaration (for example a property-table document path or product line).
- **Where tables live**: Vendor property tables are **machine-readable XML definitions** under [`namespaces/`](../namespaces/), in a folder named by the vendor id (e.g. `acme/`), with filenames such as `vendor.topic.version.xml` (e.g. `acme.equipment.1.0.xml`). The definition lists elements and attributes in that namespace (e.g. `acme:nozzle`, `tag`, `nominalSize`) for implementation validation and host parsing.
- **Registry (index)**: [`namespaces/registry.xml`](../namespaces/registry.xml) indexes entries by `namespace` URI with `vendor`, `status`, `spec` (path relative to `namespaces/`), `prefix`, `title`, and related fields for discovery and interface naming.
- **Core implementations**: Geometry evaluation must retain the foreign nodes above and may treat foreign-namespace elements as opaque subtrees. A host that interprets fields for a given URI must validate and read elements/attributes according to the property-table definition referenced in the registry.

### 9.4 Sample

Shell cylinder + side nozzle with in-place `<metadata>` and a vendor namespace: [draft-0.1-metadata-oem-nozzle.svg3dx](../samples/draft-0.1-metadata-oem-nozzle.svg3dx).

## 10. Animation (SMIL-shaped subset)

This format provides a **thin subset** aligned with common SVG SMIL authoring patterns for mechanism demos, parameter sweeps, and product presentation. Elements live in the `s3dx` namespace; browsers are **not** required to run native SMIL on `s3dx:*`. Unprefixed standard SVG `<animate>` / `<animateTransform>` do **not** carry this format’s 3D animation semantics.

Subset capabilities:

- **Parameter timeline**: `<s3dx:animate>` drives CSS custom properties (indirectly driving sizes, conditionals, etc.).
- **Transform animation**: `<s3dx:animateTransform>` drives a node’s 3D pose (composited onto `s3dx:transform`).

This subset does **not** include: `animateMotion`, event-based `begin`, multi-keyframe `values` / `keyTimes`, or direct animation of primitive geometry attributes (e.g. `length`, `diameter`). Geometric sizes must be driven indirectly through `var(--*)` by parameter animation.

### 10.1 Shared timing attributes

The following unprefixed attributes apply to both `<s3dx:animate>` and `<s3dx:animateTransform>`:

| Attribute | Required | Default | Description |
|---|---|---|---|
| `from` | yes | — | Animation start value |
| `to` | yes | — | Animation end value |
| `dur` | yes | — | One-shot duration: `Ns` or `Nms` (`N` positive); other forms warn and ignore the animation |
| `repeat` | no | `1` | Non-negative integer: play count; `0` means indefinite loop; other forms warn and treat as `1` |
| `fill` | no | `remove` | **End behavior** (same attribute name as appearance `fill`, different meaning): `freeze` keeps the end value; `remove` clears the sample override and falls back to the declaration |
| `begin` | no | `0s` | Offset from document animation clock zero; same syntax as `dur`; event sync is **not** supported |
| `calcMode` | no | `linear` | Interpolation **approach law**, same values as loft `blend`: `linear` / `sine` / `cosine` / `tan` / `cotan` (see §3.2); unknown values warn and behave as `linear` |

Interpolation: within the active interval, obtain normalized time \(t \in [0,1]\), then interpolate `from`→`to` (scalar or per-component) with weight \(s = f_{\mathrm{calcMode}}(t)\) (\(f\) matches loft `blend`). Clock source and playback controls are host-defined.

### 10.2 `<s3dx:animate>` (parameter timeline)

- **Sole target**: CSS custom properties (`<dashed-ident>`).
- **Attributes**:
  - `attributeName` (required): must include the leading `--` (e.g. `--H`, `--yaw`); omitting `--` is an error — warn and ignore.
  - `from` / `to`: scalar numbers (parsed per §2.4); other timing attrs per §10.1.
- **Attachment (normative)**: must be a **direct child** of a **parameter-scope host**; the **parent is the injection point**. This subset provides **no** `href` / remote target.
  - Under the root `<svg>`: overrides document-root scope (corresponding to `:root` declarations).
  - Under a `<g>` that declares the custom property (class rule or inline `style`): override is visible only when evaluating that `<g>` subtree (§2.3).
  - If the parent is not a scope host, or the element is hung on a primitive in hopes of changing document-global parameters: warn and ignore.
- **Whitelist**: `attributeName` must already have a **direct literal** declaration in the parent scope — under root `<svg>`, a direct `:root` literal (aligned with §2.5); under `<g>`, a name declared on that node’s class or inline style. Undeclared: warn and ignore.
- **Priority**: animation sample overrides rank below **explicit** external parameters and above DOM declarations (see §2.3, §2.5). A params chrome that only shows `:root` defaults must not block this animation while unpinned.
- **Host effect**: after sampling into the parameter override, the host **must trigger a full geometry evaluation** (parameter sweeps / size coupling).
- **Params chrome (recommended)**: for properties driven by this element, show the live sample and mark them as animation-driven; a user edit counts as pinning an external override (clearable).

### 10.3 `<s3dx:animateTransform>` (transform animation)

- Direct child of the **transformed node**; that node must be allowed to carry `s3dx:transform` (a 3D-related `<g>`, or an `s3dx:*` assembly/primitive container).
- **Attributes**:
  - `attributeName`: fixed to `transform` (SMIL convention); semantics point at **`s3dx:transform`**, not SVG 2D `transform`. When omitted, treat as `transform`; other values warn and ignore the animation.
  - `type` (required): `translate` | `rotate` | `scale`.
  - `from` / `to`: three numbers (space-separated), matching §3.4 TRS components (`rotate` in degrees).
  - Other timing attributes per §10.1.
- **Composition**: at time \(t\), the host builds animation matrix \(M_\mathrm{anim}(t)\) from `type`/`from`/`to`, and composes it with the node’s **already evaluated** authored `s3dx:transform` base matrix \(M_\mathrm{base}\) as \(M = M_\mathrm{anim}\cdot M_\mathrm{base}\) (author transform first, then animation; column-vector convention matches §3.4). Do **not** rewrite the `s3dx:transform` string in the DOM.
- **Host effect**: update scene-instance matrices only; hosts **must not** force a geometry-kernel re-run solely for transform animation.

### 10.4 Static evaluation and hosts without a clock

- `<s3dx:animate>` / `<s3dx:animateTransform>` do **not** participate in the geometry operation graph, booleans, or loop expansion; after parse they must remain in the DOM (official round-trips and optimize keep them intact).
- Hosts that do not implement an animation clock: ignore animation elements and evaluate the static document; do **not** auto-apply `from`. For a static preview pose, authors must write the rest value into parameter declarations or `s3dx:transform`.

```xml
<svg svg3d="true" xmlns="http://www.w3.org/2000/svg"
     xmlns:s3dx="urn:s3dx:draft:0.2">
  <style>:root { --H: 100; }</style>
  <s3dx:animate attributeName="--H" from="80" to="160"
                dur="2s" repeat="0"/>
  <!-- … -->
</svg>
```

## 11. `<s3dx:use>`

- Attributes: `href` (required, references a definition target by `id`), `s3dx:transform` (optional, 12-number 3D matrix).
- No `x`/`y`; 3D translation uses `tx/ty/tz` of `s3dx:transform`.
- Used only in 3D context; standard `<use>` is only for 2D content — the two must not be mixed.
- **Reference scope (normative)**: `href` may only reference a **first-level node** in the definition set (`<defs>`), i.e. a direct child of `<defs>` that has an `id`. Nested descendants are not allowed; referencing the **parent of the `<s3dx:use>` itself** is also not allowed. If either constraint is violated, the reference is invalid: **ignore** that `<s3dx:use>` node **and warn**.
- If `<s3dx:use>` references a pure-2D `<g>` (only 2D elements): skip + warning.
- Transform accumulation: referenced group’s own `s3dx:transform` → `<s3dx:use>`’s `s3dx:transform` → parent `s3dx:transform`.

## 12. Evaluation model

### 12.1 Stage order

1. Parse the document tree
2. Build parameter scopes
3. Resolve external parameters
4. Apply animation sample overrides (if the host implements the §10 clock; otherwise skip)
5. Expand `loop-*` (evaluate `loop-range` parameters)
6. Evaluate `test` on `s3dx:if` / `s3dx:if-not` (each expanded copy judged independently)
7. Evaluate expressions (primitive attributes, `s3dx:transform`, etc.)
8. Build the geometry operation graph
9. Kernel evaluation → geometry set
10. Filter/render by `<s3dx:model>` `mode`, materials / `fill`, and child `<s3dx:use>`; then composite `s3dx:animateTransform` scene matrices (if the host implements a clock)

Key point: geometry evaluation is an **instantaneous snapshot** given the current parameter map and each node’s authored `s3dx:transform`; results are shared across models. The evaluation stage processes parameters, control flow, and geometry; `<s3dx:model>` and the material library apply at render time; SVG `<metadata>` and foreign-namespace payloads remain in the DOM for hosts (§9). Parameter animation triggers full re-evaluation via overrides; transform animation only updates scene matrices (§10).

### 12.2 Error handling

- Evaluation-error scope: expression syntax errors, undefined parameter references, type mismatches, `loop-range` parameters that are not numeric after evaluation.
- Handling: skip the failing element and its subtree; record a warning. Warning form is host-defined; this specification does not bind one.
- Document-level fatal errors (ill-formed XML, missing root): follow existing XML/SVG rules; outside this format’s “skip” scope.
- “Skip + warning” is the recommended behavior; implementations may choose stricter error modes, but that is not a compliance requirement.

### 12.3 Determinism and precision

- The same file evaluated on different kernels: topological equivalence is the kernel’s responsibility; this format does not specify numeric precision.
- Definitions in `<defs>` not reachable from any `<s3dx:model>` instantiation chain are not evaluated.

## 13. Appendix

### 13.1 Open items

1. Beyond the core primitives (see §3.2), still open:
   - Whether `path` gains spline / helix child segments (`spline` / `helix`).
   - Whether `arc` major-arc ambiguity (`major`) and three-point arcs (start / on-arc / end, aligned with IFC `IfcArcIndex`) enter the core.
   - Compliance level for `A`/`C`/`Q` in `<path d>` inside `section`.
   - Whether multi-section-along-path `sweep` (guides / IFC SectionedSolid) enters the core.
   - Whether sector-torus sweep start orientation gains `refDir`.
   - Whether open `revolve` profiles produce a shell or auto-cap.
   - Whether `loft` supports pointed sections (apex instead of `section`).
   - Whether Fillet / Chamfer / Shell “feature modifiers” enter as optional operators (SolidWorks has them; STEP/IFC exchange less often as parametric recipes).
2. Whether the display `mode` set is enough (need `points`, `shaded-edges`, curve-specific `wire`, etc.).
3. File extensions: document `.svg3dx`; distribution package `.svg3dxz` (ZIP, entry `main.svg3dx`, see §3.3).
4. Final form of the formal-release namespace URI.
5. Whether arbitrary vector parameters also get component splitting (loop vectors are `--loop-value-x` / `-y` / `-z`) [TBD].
6. Textures and fuller PBR channels [TBD] (materials basics are in §8).
7. Whether animation expands toward fuller SMIL alignment (`values` / `keyTimes`, event `begin`, `animateMotion`, etc.) [TBD].

### 13.2 Samples

| File | Content |
|---|---|
| [draft-0.2-point-ref.svg3dx](../samples/draft-0.2-point-ref.svg3dx) | `s3dx:point` + `ref(#id)` shared endpoints |
| [draft-0.2-animate-param.svg3dx](../samples/draft-0.2-animate-param.svg3dx) | `s3dx:animate` driving `--H` |
| [draft-0.2-animate-transform.svg3dx](../samples/draft-0.2-animate-transform.svg3dx) | `s3dx:animateTransform` rotating a mechanism arm |
| [draft-0.1-example.svg3dx](../samples/draft-0.1-example.svg3dx) | (0.1 stable sample) Parameters, booleans, conditionals, `loop-*`, multi-model, 2D annotation |
| [draft-0.1-line.svg3dx](../samples/draft-0.1-line.svg3dx) | `s3dx:line` |
| [draft-0.1-arc.svg3dx](../samples/draft-0.1-arc.svg3dx) | `s3dx:arc` (angle params / endpoints) |
| [draft-0.1-path.svg3dx](../samples/draft-0.1-path.svg3dx) | `s3dx:path` (`points` and `line`/`arc` segments) |
| [draft-0.1-curves.svg3dx](../samples/draft-0.1-curves.svg3dx) | Curves + `pipe` along a curve |
| [draft-0.1-extrude.svg3dx](../samples/draft-0.1-extrude.svg3dx) / [revolve](../samples/draft-0.1-revolve.svg3dx) / [loft](../samples/draft-0.1-loft.svg3dx) / [sweep](../samples/draft-0.1-sweep.svg3dx) / [pipe](../samples/draft-0.1-pipe.svg3dx) | `section` + pose / composite trajectory |
| [draft-0.1-materials.svg3dx](../samples/draft-0.1-materials.svg3dx) | Built-in presets: boxes on top row, spheres below |
| [draft-0.1-materials-custom.svg3dx](../samples/draft-0.1-materials-custom.svg3dx) | Custom `<s3dx:materials>` + box |
| [draft-0.1-color.svg3dx](../samples/draft-0.1-color.svg3dx) | Element `fill` color (attribute / CSS) |
| [draft-0.1-metadata-oem-nozzle.svg3dx](../samples/draft-0.1-metadata-oem-nozzle.svg3dx) | SVG `<metadata>` + vendor NS: shell cylinder and side nozzle |
| [draft-0.1-gltf.svg3dx](../samples/draft-0.1-gltf.svg3dx) | `s3dx:gltf` + Stanford Bunny `.glb` |
| [draft-0.1-gltf-if.svg3dx](../samples/draft-0.1-gltf-if.svg3dx) | `if` + Bunny LOD variants (`--LOD`) |
| [draft-0.1-gltf.svg3dxz](../samples/draft-0.1-gltf.svg3dxz) | `.svg3dxz` package: `main.svg3dx` + `assets/bunny.glb` |
| [draft-0.1-gltf-if.svg3dxz](../samples/draft-0.1-gltf-if.svg3dxz) | `.svg3dxz` package: `main.svg3dx` + Bunny LOD `.glb`s |
| Other `draft-0.1-*.svg3dx` | Basic solids, conditionals and loops |

### 13.3 Domain extensions (non-core; not required)

The following names lean toward industry short names or vendor primitives and are **not** in the core compliance set; express them with core constructors.

| Extension | Prefer with core | Notes |
|---|---|---|
| `rectocircle` (square-to-round) | `loft`: rectangle + circle `section` | |
| `ecccone` / PDMS `SNOU` | `loft` of two circles (possibly eccentric) or `cone` | |
| `saddle` (saddle tee) | `cylinder` + boolean | |
| `ellipsehead` / PDMS `DISH` | `revolve` generatrix | |
| `squarering` / PDMS `RTOR` | `sweep` rectangular section + arc/polyline path, or approximate with `torus` | |
| `obliquecylinder` / PDMS `SLCY` | `cylinder` + boolean cut, or `gltf` | |
| `recsection` | `extrude` / `sweep` | |

If extension elements appear: core implementations should skip and warn; opening a general file must not depend on extensions.

### 13.4 Cross-system construction map (non-normative)

Survey scope: STEP ISO 10303-42, IFC 4.x, SolidWorks, AVEVA PDMS/E3D, Smart 3D (similar equipment-primitive approach), Blender, 3ds Max.

| Capability | In svg3dx core? | Notes |
|---|---|---|
| Box / cylinder / cone / sphere / torus / wedge | yes | CSG primitives; present across systems |
| Pyramid / frustum | yes (`pyramid`) | IFC Pyramid, PDMS PYRA |
| Positioning point | yes (`point`) | Construction / edit anchor; share via `ref(#id)` |
| 3D line / arc | yes (`line` / `arc`) | STEP trimmed circle, IFC TrimmedCurve / ArcIndex, OCC Edge |
| Composite curve / trajectory | yes (`path`) | STEP composite_curve, IFC CompositeCurve / IndexedPolyCurve, OCC Wire |
| Extrude | yes | STEP/IFC/SW/PDMS/Blender/Max |
| Revolve | yes | Same; Blender Spin |
| Loft | yes | SW/OCC/Blender plugins; IFC approximates with sectioned solids |
| Sweep (section + path) | yes | STEP surface_curve_swept, IFC FixedReferenceSwept, SW, Max Sweep |
| Swept disk | yes (`pipe`) | First-class in STEP/IFC; pipe centerline + radius |
| Boolean union/subtract/intersect | yes | STEP CSG, IFC BooleanResult, SW Combine |
| Triangle / indexed mesh | yes (`gltf` references glTF/GLB) | IFC Tessellated, glTF, Blender/Max meshes |
| Half-space | no | Present in IFC; rarely used in generic recipes |
| Boundary / Class-A dual-guide surfaces | no | Advanced SW surfacing; high exchange cost |
| Fillet / Chamfer / Shell | no (TBD) | Feature modifiers; approximate with boolean or `gltf` |
| Tapered extrude | no (TBD) | IFC has subtypes; approximate with `loft` |
| Equipment short names DISH/SNOU/RTOR/SLCY | no | See §13.3; map to constructors |
| Parameter / transform animation (SMIL-shaped subset) | yes (`animate` / `animateTransform`) | See §10; host clock driven |

## 14. Migration

### 14.1 From draft 0.1 to draft 0.2

1. **Namespace URI**: change `xmlns:s3dx` (or equivalent binding) from `urn:s3dx:draft:0.1` to `urn:s3dx:draft:0.2`.
2. **Optional 0.2 capabilities**:
   - Primitive `<s3dx:point>` (positioning point, attribute `at`)
   - Live reference `ref(#id)` in point / point-list attributes (see §2.9)
   - Animation subset `<s3dx:animate>` / `<s3dx:animateTransform>` (see §10)
3. **Files without those constructs**: changing the URI alone yields a conforming 0.2 document; geometry evaluation matches 0.1.
4. **Implementation duty**: evaluators must accept both `urn:s3dx:draft:0.1` and `urn:s3dx:draft:0.2`. If a 0.1-URI document uses `point` / `ref(#id)`, evaluate and warn that the 0.2 URI is preferred.
5. **Official optimize**: must not inline `ref(#id)` to numeric literals; must keep animation elements intact.
6. **`<s3dx:exp>`**: 0.2 does not use this element. Write expressions on primitive attributes (literals, `var(--*)`, `calc(...)`). Because draft 0.1 was never formally released, implementations reading a 0.1 file must ignore `<s3dx:exp>` nodes.
