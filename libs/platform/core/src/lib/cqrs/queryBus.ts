import type { Query } from './query';
import { UnknownQueryError } from './query';
import { QueryHandlerRegistry } from './queryHandlerRegistry';

/**
 * Dispatches application queries to exactly one registered query handler.
 */
export class QueryBus {
  constructor(private readonly registry: QueryHandlerRegistry) {}

  /**
   * Executes a query through the handler registered for its canonical token.
   *
   * @throws {UnknownQueryError} When no handler is registered for the token.
   */
  async execute<TResult>(query: Query): Promise<TResult> {
    const handler = this.registry.get(query.token);
    if (!handler) {
      throw new UnknownQueryError(query.token);
    }

    return (await handler.handle(query)) as TResult;
  }
}
