# Architecture Decision Records

ADR is the mandatory format for architecture-significant Smart Barn decisions.

## Naming

```text
NNNN-short-kebab-case-title.md
```

Numbers are monotonically increasing and never reused.

## Status values

- Proposed
- Accepted
- Deprecated
- Superseded by ADR-NNNN

## Required sections

```markdown
# ADR-NNNN: Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context

## Decision

## Consequences

## Alternatives considered

## References
```

## Rules

1. Accepted ADRs are historical records and are not rewritten to change the original decision.
2. Reversals or replacements are documented by a new ADR that references the superseded ADR.
3. Changes to bounded contexts, deployment boundaries, platform dependencies, transports, persistence, authentication, rendering/BIM/CAD engines, IaC or cross-module contracts require an ADR.
4. When an ADR changes architecture topology, update the relevant LikeC4 source in the same change.
5. ADR text should explain why the decision exists, not only what code was changed.
