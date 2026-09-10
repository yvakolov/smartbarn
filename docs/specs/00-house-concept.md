# General House Concept

Status: **FIXED for V1**

## Product concept

Smart Barn describes a standardized Barn House as an engineered configurable product. The construction technology is deliberately kept coherent rather than offering multiple competing construction systems.

The source of truth is the Smart Barn domain/transport model (JSON). 2D, 3D and BIM are representations/adapters of that model, not independent sources of truth.

## Base configuration

- Building type: Barn House
- Storeys: 1
- Plan: rectangular
- Overall dimensions: 6000 × 9000 mm
- Base floor area: 54 m²
- Roof: gable
- Roof pitch: 30° from horizontal
- Thermal envelope: warm exterior envelope
- Exterior walls: SIP
- Interior: initially free/open
- Roofing: C21 profiled sheet
- Exterior colour reference: RAL 7024

## V1 scope

Included:

- zero/lower floor field
- exterior walls and gables
- structural openings
- roof
- insulation
- vapour/wind membranes
- JUTAVEK 85
- vertical facade battens
- roofing system and C21 sheet
- fasteners and construction consumables

Excluded from V1:

- foundation
- windows and doors as purchased products (openings are modelled separately)
- interior partitions
- rooms
- interior finishes
- HVAC
- plumbing
- electrical systems
- smart-home systems
- landscape

## Coordinate/reference-plane principle

Construction assemblies are defined relative to stable reference surfaces. Changing layer thickness must not move the reference plane itself.

- Floor field datum: upper plane of the upper sheathing, `Z = 0`; the base assembly develops downward.
- Exterior wall datum: exterior face; wall thickness develops inward.
- Roof datum: sloped reference plane at 30°, starting at the upper outer edge of the longitudinal wall/mauerlat and running toward the ridge.

Construction nodes are intersections and priority relationships between these reference planes.

## Geometry hierarchy

Longitudinal walls are master geometry for building width. Gable/front walls are dependent geometry and fit between the inner faces of the longitudinal walls.

## Software principle

The domain model must not depend on Angular, Konva.js, Three.js or IFC. Rendering and exchange are adapters:

- `libs/2d-engine` — Konva.js
- `libs/3d-engine` — Three.js
- `libs/bim-converter` — Smart Barn ↔ IFC
