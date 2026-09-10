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
- use Angular async validators for validation that depends on server-side or database-backed state;
- keep validation rules out of visual components when they represent reusable application/domain semantics;
- expose validation state through Angular form APIs and signals rather than duplicating it in unrelated component state;
- validation messages must be localized through the project i18n layer;
- do not dispatch a CQRS command from an invalid or pending form;
- UI/form validation improves interaction but does not replace domain invariants or backend validation at trust boundaries.

Custom validators should be typed, reusable and named with `camelCase`. Add JSDoc when a validator encodes non-obvious engineering/business constraints.

### Server-backed async validation

For fields whose validity depends on current backend/database state, use a dedicated validation endpoint before submitting a complex form command/request.

Required behavior:

- expose dedicated backend validation endpoints for server/database-dependent field checks;
- Angular async validators call these endpoints and map the response into Angular `ValidationErrors`;
- prefer field-focused validation contracts instead of submitting the entire complex form solely to discover one invalid field;
- debounce/cancel stale async validation requests where appropriate so rapid input does not create races or unnecessary backend load;
- treat the server as authoritative: final command/request handling must validate again at the trust boundary because database state can change after pre-validation;
- backend validation errors must use a stable structured error contract that can identify the affected field(s) and machine-readable error code(s).

The validation endpoint is a preflight UX mechanism, not a replacement for validation during the final write operation.

### Form error handling and field UX

All reusable input components must provide a consistent invalid/error state.

- use a centralized/form-aware error handler or error-mapping utility to convert Angular and backend validation errors into field-level presentation state;
- visually highlight invalid fields using the shared design system; do not implement one-off error styling per feature;
- render localized field error messages adjacent to or otherwise clearly associated with the affected control;
- backend field errors returned after submit must be mapped back to the corresponding Angular control where possible;
- non-field/global errors must be surfaced separately and must not be falsely attached to an arbitrary field;
- avoid showing validation errors prematurely: use a consistent policy based on touched/dirty/submitted state, except where immediate validation is required by the interaction;
- preserve accessibility semantics for invalid controls and their messages.

### Form actions

Primary submit/execute buttons must be disabled while the form is invalid or async validation is pending.

A form action must not dispatch its CQRS command while:

- `form.invalid` is true;
- `form.pending` is true;
- an explicit submission is already in progress when duplicate execution is unsafe.

The disabled state is a UX guard only. The command handler/backend must still reject invalid input independently.

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
