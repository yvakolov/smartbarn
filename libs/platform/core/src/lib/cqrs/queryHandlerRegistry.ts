import type { MessageToken } from './messageToken';
import { DuplicateQueryHandlerError, type Query, type QueryHandler } from './query';

/**
 * Stores exactly one query handler per canonical query token.
 */
export class QueryHandlerRegistry {
  private readonly handlers = new Map<MessageToken, QueryHandler>();

  /**
   * Registers a query handler for its canonical token.
   *
   * @throws {DuplicateQueryHandlerError} When the token is already registered.
   */
  register<TQuery extends Query, TResult>(handler: QueryHandler<TQuery, TResult>): void {
    if (this.handlers.has(handler.token)) {
      throw new DuplicateQueryHandlerError(handler.token);
    }

    this.handlers.set(handler.token, handler as QueryHandler);
  }

  /**
   * Returns the handler registered for a query token, if present.
   */
  get(token: MessageToken): QueryHandler | undefined {
    return this.handlers.get(token);
  }

  /**
   * Returns all registered query tokens in registration order.
   */
  tokens(): readonly MessageToken[] {
    return [...this.handlers.keys()];
  }
}
