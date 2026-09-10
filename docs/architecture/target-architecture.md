# Smart Barn target architecture

Status: **TARGET / EVOLUTIONARY**

This document preserves the architectural intent of Smart Barn so that humans and AI agents can implement narrow areas without losing the system-level constraints.

## 1. Core principle

Smart Barn is a modular engineering platform. Logical boundaries are mandatory now; physical distribution into independently deployed applications/services is evolutionary and must happen only where it provides value.

The stable dependency direction is:

```text
Domain / Application
        ↓
Ports and contracts
        ↓
Adapters (UI, GraphQL, persistence, 2D, 3D, BIM, infrastructure)
```

Provider/framework details must not become the domain model.

## 2. Bounded contexts

Primary functional bounded contexts are independent:

- floor-field
- walls
- roof
- openings
- MEP (future)
- BOM / quantities (future)

A functional module MUST NOT directly depend on another functional module. Cross-module workflows belong to orchestration/application layers and communicate through explicit contracts, IDs and events.

Shared platform capabilities are intentionally small and domain-neutral: identity/auth, routing/shell, settings, localization, design system, module contracts, versioning, coordinates/reference primitives, telemetry and infrastructure abstractions.

## 3. Frontend target

```text
                    Shell / Host
          auth · navigation · settings
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Floor Field MFE      Walls MFE        Roof MFE
        │                │                │
 independent build/release/agent ownership
```

Microfrontends are deployment boundaries for meaningful business capabilities, not individual widgets. Toolbar, controls, typography, dialogs, inputs and tokens remain shared UI/platform concerns.

Current modules under `libs/modules/*` must therefore be **microfrontend-ready**, but we do not require every module to become a remote immediately. A future deployable wrapper may be introduced as `apps/mfe/<module>` without moving domain/application logic out of its library.

The shell owns cross-cutting concerns such as authentication, top-level navigation, settings/theme/locale and composition. Microfrontends should communicate as little as possible and MUST NOT share mutable global domain state.

## 4. Backend target

```text
Clients / MFEs
      │
      ▼
GraphQL Gateway / Supergraph
      │
 ┌────┼──────────────┐
 ▼    ▼              ▼
Floor Walls         Roof      ... subgraphs/services
```

The target API surface is GraphQL with one logical client entry point. Functional services/subgraphs own their schema fragments and resolvers. GraphQL is a transport/query adapter, never the source of truth for engineering semantics.

The domain/application layer must remain callable without GraphQL or HTTP (workers, CLI, BIM export, deterministic calculations and tests).

GraphQL Federation is the preferred target when services become independently deployable. Until independent deployment is justified, the same boundaries may live in a modular backend process.

## 5. CAD / CAM / BIM data strategy

GraphQL selection sets should prevent over-fetching of large engineering aggregates. Clients request only the fields needed by the current representation, for example geometry/constraints for 2D, materials plus geometry metadata for 3D, or composition/quantities for BOM.

Large binary assets are not transported as giant GraphQL JSON payloads. IFC, GLB/glTF, meshes, textures and generated artifacts are stored in object storage/CDN. GraphQL returns metadata, revision/hash, authorization and asset references.

The deterministic Smart Barn JSON/domain model remains the source of truth. IFC/BIM, Three.js, Konva and GraphQL are adapters/representations.

## 6. Agent ownership model

Repository boundaries should also be usable as AI-agent context boundaries. A module owner/agent should be able to work primarily inside a vertical slice such as:

```text
libs/modules/floor-field/       domain + application contracts
apps/mfe/floor-field/           optional deployable frontend
apps/services/floor-field/      optional deployable backend/subgraph
```

An agent responsible for one bounded context must not modify another context merely to obtain data. It should evolve a versioned public contract or request an orchestration/platform change.

Shared platform agents may own `libs/platform/*`, `libs/ui/ds`, `libs/ui/kit`, shell/gateway and cross-cutting contracts, but platform code must not absorb functional business logic.

## 7. Independent delivery

Target state: each promoted MFE/service can build, test and deploy independently. CI/CD and IaC are scoped by affected project/module rather than rebuilding/deploying the entire platform unnecessarily.

Deployment independence must not create infrastructure lock-in. Runtime artifacts, configuration and infrastructure follow the provider-neutral deployment architecture documented separately in `deployment.md`.

## 8. Shared contracts and coupling rules

Allowed shared dependencies:

```text
functional module → platform contracts
MFE              → its functional module + UI DS/kit
service          → its functional module + transport/persistence ports
adapters          → domain/application ports
```

Forbidden architectural shortcuts:

```text
floor-field → walls
walls       → roof
MFE A       → internal state of MFE B
service A   → tables owned internally by service B
GraphQL DTO → canonical domain model
Three/Konva/IFC objects → persisted canonical model
provider SDK → domain/application layer
```

Integration contracts must be explicit, versionable and testable. Contract tests are preferred at deployment boundaries.

## 9. Design system

`libs/ui/ds` owns design tokens and semantic visual contracts. `libs/ui/kit` owns reusable Angular UI primitives/adapters. Functional modules consume semantic tokens/components rather than inventing parallel primitives. Theme values are semantic and support light/dark/system modes.

## 10. Evolution rule

Start as a well-structured modular monorepo/modular backend. Promote a bounded context to a microfrontend, microservice or GraphQL subgraph when independent deployment, scaling, ownership or release cadence justifies the operational cost.

The migration must be extraction, not rewrite. If extracting a module requires rewriting its domain logic, the current boundary is considered insufficient and should be corrected first.

## 11. Decision records

Significant irreversible or cross-cutting decisions should receive a separate ADR under `docs/architecture/adr/`. ADRs record context, decision, consequences and superseding decisions rather than silently rewriting architectural history.
