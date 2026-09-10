# ADR-0002: DDD, FSD, C4/LikeC4 and ADR as architecture standards

- Status: Accepted
- Date: 2026-09-10

## Context

Smart Barn is evolving toward a distributed modular platform with independently owned functional modules, potential microfrontends, microservices and AI-agent ownership boundaries. The architecture must preserve domain boundaries, make frontend ownership explicit, keep architecture visible in executable diagrams and retain the reasoning behind architectural decisions.

## Decision

### 1. Domain-Driven Design is the product-level architecture baseline

The Smart Barn product is decomposed into bounded contexts. Functional modules such as `floor-field`, `walls`, `roof`, openings, MEP, BOM and future manufacturing/CAM contexts own their domain model and application rules.

Domain and application layers must not depend on frameworks, rendering engines, transport protocols, infrastructure providers or persistence implementations.

Cross-context integration is explicit through contracts, events, application services or orchestration. Direct coupling between functional contexts is prohibited unless documented by a later ADR.

### 2. Feature-Sliced Design is the frontend structure inside each microfrontend

Each deployable microfrontend follows FSD internally. The target layering is:

```text
app
pages
widgets
features
entities
shared
```

Domain-specific code remains owned by the corresponding bounded context. Shared frontend code is limited to genuinely platform-wide concerns such as UI primitives, design system, API clients, auth/session adapters and common utilities.

FSD does not replace DDD. DDD defines product/domain boundaries; FSD structures the frontend implementation inside a bounded context or microfrontend.

### 3. C4 Model is the architecture visualization standard

The architecture is documented at C4 levels as appropriate:

- System Context
- Container
- Component
- Code only when it adds durable architectural value

C4 views are maintained as code using LikeC4. Source files live under `architecture/` and are versioned with the implementation.

Architecture changes that affect system boundaries, deployable units, dependencies, integrations or data ownership must update the relevant LikeC4 model in the same change.

### 4. ADR is mandatory for architecture-significant decisions

Every architecture-significant decision receives an ADR under `docs/architecture/adr/`.

Use ADRs for decisions involving, among other things:

- bounded-context boundaries
- microfrontend or microservice extraction
- GraphQL federation and gateway behavior
- storage and data ownership
- authentication and authorization architecture
- deployment/IaC strategy
- rendering/BIM/CAD engine boundaries
- major framework or platform substitutions

ADRs are immutable historical records. A superseded decision is not rewritten; a new ADR references and supersedes the old one.

## Agent ownership rule

The intended long-term ownership unit is the bounded context. An AI agent assigned to a context should be able to work primarily inside that context's domain/application/frontend/backend/deployment slice without requiring the entire Smart Barn codebase as working context.

A functional boundary should therefore align, where practical, with all of the following:

```text
DDD bounded context
      =
frontend ownership boundary
      =
backend ownership boundary
      =
potential deployment boundary
      =
AI-agent context boundary
```

These boundaries may remain physically co-located in the monorepo until independent deployment is justified.

## Consequences

- Modularity is enforced before distribution.
- Microfrontends and microservices can be extracted without redefining the domain.
- Architecture becomes inspectable and reviewable as code.
- Agents have explicit ownership and dependency boundaries.
- Architecture decisions retain their rationale over time.
- Some duplicated adapter/UI code is acceptable when it preserves bounded-context independence.

## Guardrails

- Do not create shared libraries merely to remove small duplication.
- `shared` must not become a hidden domain layer.
- Microfrontends must not communicate through undocumented global state.
- GraphQL schemas remain transport contracts, not the domain model.
- LikeC4 diagrams describe actual or explicitly marked target architecture; speculative views must be labelled as target/future.
