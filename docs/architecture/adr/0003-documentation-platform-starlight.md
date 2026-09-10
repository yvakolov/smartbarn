# ADR-0003: Use Starlight for product and user documentation

- Status: Accepted
- Date: 2026-09-10

## Context

Smart Barn requires versioned product documentation, a user guide, architecture documentation and bilingual content. Documentation must live close to the code, be authored primarily in Markdown, support static deployment, search and future embedding of architecture diagrams.

## Decision

Use Astro Starlight as the documentation application under `apps/docs`.

Documentation source is Markdown/MDX. Russian is the default locale and English is the secondary locale.

The documentation application is independent from the Angular client. It is a separate deployable artifact and can later be hosted under a dedicated documentation URL or subpath.

LikeC4 remains the source of truth for architecture diagrams. Documentation may embed or link generated LikeC4 views; the architecture model itself stays under `architecture/`.

## Consequences

- User documentation and architecture documentation are versioned with code.
- Documentation can be reviewed in the same workflow as implementation.
- Russian and English content can evolve independently.
- The client application does not carry documentation framework dependencies in its runtime bundle.
- Starlight/Astro are documentation-only dependencies and must not leak into product domain or frontend module architecture.

## Alternatives considered

- VitePress: strong Markdown-first option, but would introduce Vue specifically for documentation.
- Docusaurus: mature, but heavier and React-centric for this use case.
- Hand-built Angular documentation area: rejected because it would couple documentation delivery to the product client and increase maintenance.

## References

- `apps/docs`
- `architecture/`
- ADR-0002
