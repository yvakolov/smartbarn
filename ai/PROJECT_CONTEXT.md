# Smart Barn — Project Context

> Shared vendor-neutral context for Claude Code, Codex and future AI orchestrators/agents.

## Purpose

This file is the common orientation layer for AI work in Smart Barn. Keep it compact. It must explain what the project is, the non-negotiable architectural rules, and where an agent should load deeper context when a task requires it.

Do **not** preload every specification, ADR, module or workflow. Route to them lazily.

## Product

Smart Barn is an engineering platform for designing a standardized Barn House as a configurable product. The deterministic Smart Barn domain model is the source of truth. UI, 2D, 3D, BIM/IFC, GraphQL and deployment infrastructure are adapters or representations around that model.

The development strategy is small, complete, independently understandable increments: implement one bounded capability, make it work, validate it, document it, then proceed to the next capability.

## Non-negotiable architecture

- DDD is the product-wide foundation.
- Platform code does not absorb functional business-domain rules.
- Functional bounded contexts do not import one another's internals.
- Cross-context behavior goes through explicit contracts/orchestration.
- FSD is the UI organization standard inside independently deployable microfrontends.
- Desktop and mobile are separate applications. Mobile is a PWA with a touch-first interaction model; shared domain/application logic lives in libraries.
- Angular frontend code is zoneless and signal-first.
- CQRS uses explicit CommandBus, QueryBus, EventBus, handler registries and a complete CommandsRegistry.
- CQRS message identifiers use canonical dot notation; multi-word semantic token segments use camelCase, e.g. `floorField.layer.command.moveUp`.
- Desktop keyboard shortcuts are a desktop-only adapter over command tokens; mobile does not inherit shortcut behavior.
- 2D uses a renderer adapter around Konva; renderer state is not domain state.
- 3D uses a renderer adapter around Three.js; Three runtime objects are not transport/domain models.
- BIM/IFC is an adapter. IFC is not the Smart Barn source of truth.
- GraphQL is a query/transport adapter, not the domain model.
- Architecture-significant decisions require an ADR.
- C4/LikeC4 is the Architecture-as-Code representation and must be updated when the architecture materially changes.
- Infrastructure must preserve provider independence through explicit contracts/adapters.

## Current application topology

- `apps/frontend/client` — desktop CAD application.
- `apps/frontend/mobile` — target dedicated mobile PWA application.
- `apps/backend/api` — NestJS API.
- `apps/docs` — independently deployable Astro Starlight documentation application.
- `libs/platform/*` — platform contracts/services.
- `libs/modules/*` — functional bounded contexts.
- `libs/ui/ds` — design tokens/system.
- `libs/ui/kit` — shared UI primitives.
- `libs/2d-engine`, `libs/3d-engine`, `libs/bim-converter` — technical adapters/engines.

## Current delivery priority

The first vertical slice is the Floor Field Editor and its deployment. Follow GitHub Issues priority (`P0` before `P1`, etc.). Do not expand scope ahead of release blockers unless a prerequisite requires it.

Current P0 direction includes:

1. platform shell/design system/localization foundations;
2. working deterministic Floor Field Editor;
3. desktop 2D/3D experience;
4. dedicated mobile PWA with separate touch mechanics and device routing;
5. CI/build validation;
6. verified public deployment.

## Lazy context routing

Load only what the task needs:

| Task | Read next |
| --- | --- |
| Naming / code conventions / CQRS token naming | `docs/STYLEGUIDE.md` |
| Product/construction rules | `docs/specs/README.md` and the relevant file under `docs/specs/` |
| Module boundaries | `docs/architecture/modules.md` |
| Target distributed architecture | `docs/architecture/target-architecture.md` |
| Deployment / provider independence | `docs/architecture/deployment.md` |
| Architecture decisions | `docs/architecture/adr/README.md`, then only relevant ADRs |
| C4 / system topology | `architecture/smartbarn.c4` |
| Floor Field domain work | `libs/modules/floor-field/` plus relevant construction spec |
| Walls domain work | `libs/modules/walls/` plus `docs/specs/02-exterior-walls.md` |
| Roof domain work | `libs/modules/roof/` plus `docs/specs/03-roof.md` |
| User-facing feature change | relevant app/module plus `apps/docs/` user guide |
| Current work queue | GitHub Issues, ordered by explicit `P0`/`P1`/`P2`/`P3` priority |

As the AI subsystem grows, add routing here to dedicated files under `ai/` for skills, agent roles, MCP/tool policies and repeatable workflows. Keep this file as the router, not the storage location for every detail.

## Documentation Definition of Done

A user-facing feature is not complete until its user documentation is updated. Architecture-significant changes also update the relevant ADR and LikeC4 model.

## Secret management

Secret values must never be committed to Git or written into agent context, ADRs, Issues, logs or documentation.

### Current provider

For the current GitHub-based deployment stage, **GitHub Actions Secrets** is the temporary secret provider. GitHub supports repository, environment and organization scoped Actions secrets; Smart Barn should prefer the narrowest appropriate scope, with deployment-specific secrets placed at environment scope where practical.

Repository files contain only logical secret names and configuration contracts, never values.

### Provider-independent rule

Application/domain code must not depend on GitHub Secrets. Infrastructure/deployment code consumes logical secret names through a provider boundary. When deployment moves to another secret manager, replace the infrastructure adapter/provider mapping without changing domain/application code.

Target conceptual contract:

```text
application / service
        ↓
logical configuration contract
        ↓
secret-provider adapter
        ↓
GitHub Actions Secrets   ← current
Vault / cloud secret manager / other provider ← future
```

Non-sensitive configuration belongs in ordinary configuration/variables, not the secret store.

## Agent working rules

- Inspect current repository state before modifying files.
- Load `docs/STYLEGUIDE.md` before creating or changing semantic identifiers, public contracts or CQRS message tokens.
- Prefer the smallest complete increment that closes or materially advances the highest-priority Issue.
- Preserve deterministic domain behavior and reference-plane semantics.
- Do not invent TBD engineering values.
- Do not couple functional modules for convenience.
- Do not claim a build, test, deployment or URL works unless it has actually been validated.
- During the current prototype phase, commit directly to `main` and do not create PRs unless this policy is explicitly changed.
