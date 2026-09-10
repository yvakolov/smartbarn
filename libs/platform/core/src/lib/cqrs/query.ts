import type { MessageToken } from './messageToken';

/**
 * Base contract for application queries dispatched through QueryBus.
 */
export interface Query<TPayload = unknown> {
  readonly token: MessageToken;
  readonly payload: TPayload;
}

/**
 * Resolves a query without mutating authoritative domain state.
 */
export interface QueryHandler<TQuery extends Query = Query, TResult = unknown> {
  readonly token: MessageToken;
  handle(query: TQuery): Promise<TResult> | TResult;
}

/**
 * Raised when a query is dispatched without a registered handler.
 */
export class UnknownQueryError extends Error {
  constructor(token: MessageToken) {
    super(`No query handler registered for token: ${token}`);
    this.name = 'UnknownQueryError';
  }
}

/**
 * Raised when more than one handler is registered for the same query token.
 */
export class DuplicateQueryHandlerError extends Error {
  constructor(token: MessageToken) {
    super(`Query handler already registered for token: ${token}`);
    this.name = 'DuplicateQueryHandlerError';
  }
}
