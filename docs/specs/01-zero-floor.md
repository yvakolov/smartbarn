# Zero / Ground Floor Field

Status: **FIXED where specified**

## Boundary

The lower boundary of Smart Barn V1 is the **upper plane of the foundation binding beam**. The foundation and its binding beam belong to the foundation system and are not part of the zero-floor BOM.

## Reference plane

The floor-field datum is the **upper plane of the upper sheathing = Z 0**. The base assembly develops downward. If the upper sheathing thickness changes, Z 0 remains fixed and lower geometry moves accordingly.

## SIP panel

- Total thickness: 224 mm
- Width: 622 mm
- Standard lengths: 2500 mm / 2800 mm
- Upper skin: OSB 12 mm
- Core: EPS 200 mm
- Lower skin: OSB 12 mm
- EPS density: 16–18 kg/m³
- Perimeter EPS recess: 50 mm

## Timber

- Load-bearing connecting beams: pine 90 × 195 mm
- Perimeter SIP edging: pine 45 × 195 mm
- Timber treatment: NEOMID 430 ECO

## Fastening

SIP skins are fixed with ring-shank drum nails 2.5 × 50 mm.

- spacing: 150 mm
- fastening: from both OSB faces
- BOM design norm: 14 nails per linear metre of joint

## Foam joint

Foam: PENOSIL GoldGun 65, 750 ml.

Application pattern:

- two longitudinal beads
- one zigzag bead

Calculation norms:

- design consumption: 6.0 L per linear metre of joint
- procurement consumption: 6.6 L per linear metre
- procurement rule: 1 can per 9 linear metres of joint

## Current modelling stage

The generic floor-field editor models field geometry and ordered layers first. Automatic beam layout and decomposition into individual SIP panels are separate later modules and must not be hard-coded into the generic field editor.
