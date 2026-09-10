/**
 * Supported CQRS message categories used in canonical Smart Barn tokens.
 */
export type MessageType = 'command' | 'query' | 'event';

/**
 * Branded canonical identifier used by CQRS buses and registries.
 *
 * @remarks
 * Tokens use `<boundedContext>.<scope>.<type>.<name>` dot notation. Each
 * semantic segment uses camelCase when it contains multiple words.
 */
export type MessageToken = string & { readonly __brand: 'MessageToken' };

const tokenPattern = /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*){3}$/;

/**
 * Creates a validated canonical CQRS message token.
 *
 * @throws {Error} When the token does not contain four valid camelCase-compatible
 * dot-separated segments or when its type segment is not command/query/event.
 *
 * @example
 * `createMessageToken('floorField.layer.command.moveUp')`
 */
export function createMessageToken(value: string): MessageToken {
  if (!tokenPattern.test(value)) {
    throw new Error(`Invalid CQRS message token: ${value}`);
  }

  const [, , type] = value.split('.');
  if (!isMessageType(type)) {
    throw new Error(`Invalid CQRS message type in token: ${value}`);
  }

  return value as MessageToken;
}

/**
 * Returns whether a value is one of the supported CQRS message types.
 */
export function isMessageType(value: string): value is MessageType {
  return value === 'command' || value === 'query' || value === 'event';
}
