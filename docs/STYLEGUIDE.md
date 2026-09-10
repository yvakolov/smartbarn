# Smart Barn Style Guide

This document defines project-wide code and naming conventions. New code, architecture contracts, CQRS message tokens, configuration and documentation examples must follow these rules.

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

## JSDoc and self-documenting code

Use **JSDoc** for code contracts whose intent, invariants or usage are not fully expressed by their TypeScript signature.

JSDoc is required for:

- exported/public classes, interfaces, types and functions that form platform or bounded-context contracts;
- CQRS commands, queries, events, buses, handlers and registries;
- `CommandsRegistry` descriptors and contextual predicates;
- domain entities/value objects where invariants or reference semantics matter;
- renderer/adapter boundaries and infrastructure provider contracts;
- non-obvious public methods, side effects, units, coordinate/reference-plane semantics and error conditions.

JSDoc should explain **why, contract and constraints**, not mechanically repeat the identifier or TypeScript type. Prefer meaningful names and strong types over comments for obvious implementation details.

Use tags such as `@param`, `@returns`, `@throws`, `@example`, `@remarks` and `@deprecated` only when they add information that is not already obvious from the signature.

Example:

```ts
/**
 * Dispatches a command to the single handler registered for its canonical token.
 *
 * @throws {UnknownCommandError} When the command token has no registered handler.
 */
execute<TCommand extends Command, TResult>(command: TCommand): Promise<TResult>;
```

Do not use comments as a substitute for decomposition. Internal code should remain readable through naming, small functions, explicit types and clear boundaries; add JSDoc where semantic context would otherwise be lost.

## Angular form validation

Form validation must use Angular's form validation mechanisms rather than ad-hoc validation embedded in templates or click handlers.

Rules:

- use Angular native/built-in validators for standard constraints such as required values, minimum/maximum values, lengths, patterns and email format;
- use reusable custom Angular validators for Smart Barn-specific field rules and cross-field constraints;
- use async validators only for validation that genuinely requires asynchronous I/O;
- keep validation rules out of visual components when they represent reusable application/domain semantics;
- expose validation state through Angular form APIs and signals rather than duplicating it in unrelated component state;
- validation messages must be localized through the project i18n layer;
- do not dispatch a CQRS command from an invalid form;
- UI/form validation improves interaction but does not replace domain invariants or backend validation at trust boundaries.

Custom validators should be typed, reusable and named with `camelCase`. Add JSDoc when a validator encodes non-obvious engineering/business constraints.

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

Code review, agents and future lint/custom validation should treat this guide as the canonical code policy. Architecture examples and generated code must use the same convention. New public contracts should not be considered complete until their required JSDoc is present.
