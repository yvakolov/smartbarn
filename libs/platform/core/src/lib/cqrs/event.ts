import type { MessageToken } from './messageToken';

/**
 * Base contract for immutable application/domain facts published through EventBus.
 */
export interface Event<TPayload = unknown> {
  readonly token: MessageToken;
  readonly payload: TPayload;
}

/**
 * Reacts to an event without owning the event's source transaction.
 */
export interface EventHandler<TEvent extends Event = Event> {
  readonly token: MessageToken;
  handle(event: TEvent): Promise<void> | void;
}

/**
 * Raised when the exact same event-handler instance is registered twice for one token.
 */
export class DuplicateEventHandlerError extends Error {
  constructor(token: MessageToken) {
    super(`Event handler already registered for token: ${token}`);
    this.name = 'DuplicateEventHandlerError';
  }
}
