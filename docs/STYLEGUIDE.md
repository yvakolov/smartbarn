# Smart Barn Style Guide

This document defines project-wide naming conventions. New code, architecture contracts, CQRS message tokens, configuration and documentation examples must follow these rules.

## Naming principle

Use **camelCase** for identifiers and dot-notation token segments composed of multiple words.

Examples:

- `floorField`
- `referencePlane`
- `commandRegistry`
- `activeSelection`
- `findById`
- `moveUp`

Do not use kebab-case or snake_case for semantic identifiers when the identifier is composed of words.

Incorrect:

- `floor-field`
- `reference-plane`
- `find-by-id`
- `move_up`

Correct:

- `floorField`
- `referencePlane`
- `findById`
- `moveUp`

## TypeScript

- variables, functions, methods and object properties: `camelCase`
- classes, interfaces, types, enums and Angular components/services: `PascalCase`
- constants that represent ordinary typed values should prefer descriptive `camelCase`; use `UPPER_SNAKE_CASE` only where an external convention or true environment-level constant requires it
- boolean names should communicate state/capability, e.g. `isVisible`, `canExecute`, `hasSelection`

## CQRS message tokens

Canonical message tokens use dot notation:

`<boundedContext>.<scope>.<type>.<name>`

Every segment is a semantic identifier. Multi-word segments use `camelCase`.

Examples:

- `floorField.layer.command.add`
- `floorField.layer.command.moveUp`
- `floorField.geometry.command.resize`
- `floorField.selection.query.current`
- `floorField.layer.query.findById`
- `floorField.layer.event.added`
- `floorField.referencePlane.event.changed`

Rules:

- bounded-context and scope segments use `camelCase` when multi-word;
- `type` is `command`, `query`, or `event`;
- command names are imperative verbs/actions;
- query names describe read intent;
- event names describe facts that already happened;
- tokens must not encode UI, transport, vendor or shortcut implementation details;
- tokens are stable public identifiers: renaming a TypeScript class must not change the token;
- one token has one semantic meaning.

## File-system exception

This naming rule applies to semantic identifiers, not automatically to every filesystem path. Existing repository paths such as `floor-field`, Angular file names, package names, URLs, npm conventions or tool-required configuration may follow their ecosystem convention. Do not rename established paths merely to satisfy identifier casing unless a separate migration decision explicitly requires it.

## Enforcement

Code review, agents and future lint/custom validation should treat this guide as the canonical naming policy. Architecture examples and generated code must use the same convention.
