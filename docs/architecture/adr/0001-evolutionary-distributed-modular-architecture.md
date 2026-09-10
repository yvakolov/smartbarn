# ADR-0001: Evolutionary distributed modular architecture

- Status: Accepted
- Date: 2026-09-10

## Context

Smart Barn is expected to grow into a CAD/CAM/BIM engineering platform with multiple independently evolving functional areas and AI agents working in narrow contexts. A single tightly coupled frontend/backend would increase build scope, context size and coordination cost. Premature physical distribution, however, would introduce network, consistency, observability and operational complexity before it is needed.

## Decision

1. Use bounded functional modules from the beginning.
2. Keep platform/core and functional modules separate.
3. Make functional modules microfrontend-ready and microservice-ready without requiring immediate physical distribution.
4. Promote business modules—not UI widgets—to independently deployed microfrontends when justified.
5. Use a shell/host for auth, navigation, settings, localization, design-system integration and runtime composition.
6. Target a GraphQL gateway/supergraph as the unified query surface when backend modules are promoted to services/subgraphs.
7. Keep GraphQL outside the canonical domain model; resolvers adapt application services.
8. Use object storage/CDN for large IFC/GLB/mesh/binary assets; GraphQL carries selective structured data and asset metadata/references.
9. Keep cross-context communication contract-based; no direct functional-module dependencies or shared mutable domain state.
10. Align code ownership, AI-agent context and deployable boundaries wherever practical.
11. Preserve infrastructure independence through IaC and provider adapters.

## Consequences

Positive:

- independent agent/team ownership becomes practical;
- bounded contexts can later receive independent CI/CD and scaling;
- smaller context/build/deployment scope after extraction;
- selective GraphQL queries reduce application-level over-fetching;
- the current modular implementation can evolve without a rewrite.

Costs:

- explicit contracts and versioning are required;
- distributed modules add network failure modes, observability and release governance;
- microfrontends may duplicate dependencies if shared-runtime policy is poorly controlled;
- GraphQL requires query complexity/depth controls, batching, caching and N+1 prevention;
- service extraction introduces consistency and transaction-boundary decisions.

## Guardrail

Physical distribution is not a goal by itself. A module is promoted only when independent deployment, ownership, scaling or release cadence provides enough benefit to pay the operational cost.
