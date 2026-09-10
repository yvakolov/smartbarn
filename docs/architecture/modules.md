# Smart Barn modular architecture

Smart Barn is split into a platform core and independent functional modules.

## Platform core

`libs/platform/core` contains only cross-cutting contracts that are independent of floor, wall, roof or any specific construction technology.

Responsibilities:

- stable entity/module identifiers;
- versioned domain entities;
- module manifests and capabilities;
- shared coordinate/reference contracts;
- extension points used by renderers, persistence and future AI/BIM adapters.

The platform core must not import functional modules.

## Functional modules

Each construction subsystem is an independent module under `libs/modules/*`.

Initial modules:

- `floor-field` — floor/ceiling field editor;
- `walls` — wall domain and editor;
- `roof` — roof domain and editor.

A module owns its domain model, application rules and public API. UI, 2D, 3D, persistence and BIM integration consume that public API through adapters.

```text
apps/frontend/client
        |
        v
functional modules
  floor-field | walls | roof | ...
        |
        v
@smartbarn/platform-core

rendering / persistence / BIM / infrastructure
are adapters around module contracts
```

## Dependency rule

Allowed:

```text
app -> module -> platform-core
adapter -> module/platform-core
```

Forbidden:

```text
platform-core -> module
floor-field -> walls
walls -> roof
roof -> floor-field
module -> concrete infrastructure provider
```

Cross-module behavior is implemented by an orchestration/application layer that depends on module public APIs, not by direct feature-to-feature imports.

## Internal module shape

A functional module may grow internally as:

```text
libs/modules/<module>/src/lib/
  domain/
  application/
  ui/
  adapters/
```

Only `src/index.ts` is public. Internal paths are not application contracts.

## First implementation

The floor-field module is the first full module. Walls and roof begin as independent manifests/contracts and will be implemented without changing floor-field internals.
