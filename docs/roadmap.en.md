# svg3dx Roadmap

> Project overview: [README.md](../README.md).  
> **Language**: This file is the **English edition**. Chinese edition: [roadmap.md](./roadmap.md).  
> Version numbers here are **specification drafts**. svg3dx-core, svg3dx-viewer, and svg3dx-studio use their own semantic versions and record which draft they follow.

## Versions

| Draft | Role | Status |
|-------|------|--------|
| **0.1** | Initial draft (stable track) | Released |
| **0.2** | Feature trials | In progress, unstable |
| **0.3** | Vendor profiles | Planned |
| **0.4** | Engineering pilot | Planned |
| **0.5** | Pilot revision | Planned |
| **0.6** | Conformance | Planned |
| **0.7** | Construction gaps named by the pilot | Planned |
| **0.8** | Feature freeze | Planned |
| **0.9** | Release candidate | Planned |
| **1.0** | Standard release | Planned |

## Draft numbers and namespaces

- **0.1**, the stable track, uses `urn:s3dx:draft:0.1` and stays readable and writable until the 1.0 migration is done.
- **0.2** keeps `urn:s3dx:draft:0.2` through the trial period. Trial features are added and removed in this draft. The trial period does not open another URI.
- When trials close and **0.3** starts, that draft's migration chapter records kept, kept-with-changes, and removed items. A new URI is opened when authors must rewrite file content, and the previous track states how long implementations must still accept it.
- **0.4** does not change the URI. The freeze applies to the core that remains after trials close.
- **1.0** adopts a permanent namespace URI and replaces `urn:s3dx:draft:*`.

## 0.1 Initial draft

Released. Stable track.

Covers parameters, primitives, logic, booleans, materials, display, glTF, and vendor payloads carried in SVG `<metadata>`. This track adds no further primitives. Specification: [draft 0.1](./svg3dx-spec-draft-0.1.en.md).

## 0.2 Feature trials

In progress. This draft is where features are tried, and it is the unstable draft.

Features already written and features still to be tried stay in this draft. Wording may change, scope may narrow, and a feature may be removed entirely. Tools that implement only 0.1 keep using the stable track. Implementations that read 0.2 should expect the text to change until trials close. Specification: [draft 0.2](./svg3dx-spec-draft-0.2.en.md).

Each trial ships with a sample and a removal condition written down first. A trial leaves 0.2 when existing primitives already express it, or when it does not yield a stable meaning. A new trial is added to the tables below before it is written into the specification.

### Already in the draft

- Positioning point `point` and live `ref(#id)`
- Animation subset `animate` / `animateTransform` (`from` / `to`)

### Still to try

| Trial | Question to settle |
|-------|--------------------|
| One step further on animation (`values` / `keyTimes`) | Whether mechanism demos need more than `from` / `to` |
| Spline, helix, major arc, section curve commands | Whether real profiles get forced into the wrong recipe as polylines |
| Sweep start orientation `refDir`; whether an open revolve is capped | Whether construction results diverge across implementations |
| Fillet or chamfer, one of the two first | Whether a modifier belongs in the core, or booleans / `gltf` remain the approximation |
| One more pass of a vendor profile through the existing registry | Whether a foreign namespace can carry enterprise fields. The field tables themselves wait until 0.3 |

Textures and full PBR, cameras, IFC export, and the permanent namespace URI are outside this round of trials. They do not change how a recipe is written.

### Exit

0.2 closes with a list. Each item has one of three outcomes: keep in the core, keep after rewriting, or remove. 0.3 starts after that list is closed. From 0.3 on, drafts accept only what the list keeps.

## 0.3 Vendor profiles

Publish the rules for vendor profiles from the trial outcomes. What gets extended is the document model that remains in the core.

Section 9 already defines the `<metadata>` container, association, and the registry. This draft states the rules someone can follow to publish a profile:

- How a vendor namespace URI is chosen and versioned, and what `draft` / `stable` mean.
- A profile is published as a machine-readable definition under `namespaces/<vendor>/` and registered in `registry.xml`.
- Core evaluation retains the foreign subtree. Hosts interpret field meaning.
- Industry short names (dished heads, saddle tees, and the like) stay outside the core and are expressed with `loft`, `revolve`, and booleans.
- Round-trip and optimize retain foreign nodes, with samples that show it.

Field tables from a real enterprise appear in 0.4. They version with that vendor's own namespace and do not take a core draft number.

## 0.4 Engineering pilot

One or two companies, one class of component (an equipment shell plus nozzles, or a parametric fitting). Pilot files use only the core that remains after trials. The draft text stays frozen for the pilot. Issues are recorded, not edited into the draft.

Acceptance:

1. The partner can write an existing parametric component as an svg3dx recipe.
2. The evaluated result matches the original component topologically.
3. Vendor properties hang on `<metadata>` and survive a save and reload.

Each issue is classed as: required for 0.5, deferrable, or belonging to a vendor profile.

## 0.5 Pilot revision

Revise only the 0.4 list. Each item is accepted, deferred, or left on a vendor profile. Features removed in 0.2 stay on the removed list.

Record the decisions that stay fixed after this pass: SVG compatibility, parameters via CSS custom properties, kernel independence, no camera model, and no replacement of IFC. The revision includes a migration chapter. Open items are split into "must decide before 1.0" and "after 1.0".

## 0.6 Conformance

Build a test suite of valid documents, invalid documents, and expected warnings. State what an evaluator must implement, and that a host may omit the animation clock and vendor-field interpretation. Turn `.svg3dx` and `.svg3dxz` from open questions into specified forms.

## 0.7 Construction gaps

Add only constructions the pilot shows cannot be expressed with current primitives. Constructions that `loft` or booleans already express stay outside the core. If the pilot names no such gap, this draft changes no primitives, and the version number still stands.

## 0.8 Feature freeze

No new primitives. The form of the permanent namespace URI is decided here and switched at 1.0. Animation and materials stay within what remains after trials. At least one read-only round trip exists outside core.

## 0.9 Release candidate

Edit ambiguities, migration notes, the two language editions, and the vocabulary. Collect one round of comments from the pilot partners and the repository. Comments apply to wording and clear errors.

## 1.0 Standard release

Switch to the permanent namespace URI, replacing `urn:s3dx:draft:*`, when all of the following hold:

- Core primitives, parameters, logic, booleans, the animation subset kept after trials, and the vendor-profile rules are frozen.
- The 0.6 test suite passes.
- The 0.8 round trip outside core exists.
- Every item marked "must decide before 1.0" in 0.5 is closed or written into the deferred list.
- The specification states which older draft URIs implementations still accept, and until when.

Vendor profiles continue on their own URIs after 1.0. They are not tied to core versions.

## After 1.0

The following are not prerequisites for 1.0: shell; textures and full PBR; animation capabilities the trials did not keep (event triggers, `animateMotion`, and the like); numeric agreement across kernels; IFC export. Fillet and chamfer follow the 0.2 trial outcome. What that trial does not keep stays out of 1.0.

Taking any of these up again requires new evidence from use.
