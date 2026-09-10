import type { MessageToken } from './messageToken';
import { DuplicateEventHandlerError, type Event, type EventHandler } from './event';

/**
 * Stores zero or more event handlers per canonical event token.
 */
export class EventHandlerRegistry {
  private readonly handlers = new Map<MessageToken, EventHandler[]>();

  /**
   * Registers an event handler for its canonical token.
   *
   * @throws {DuplicateEventHandlerError} When the same handler instance is already registered for the token.
   */
  register<TEvent extends Event>(handler: EventHandler<TEvent>): void {
    const existing = this.handlers.get(handler.token) ?? [];
    if (existing.includes(handler as EventHandler)) {
      throw new DuplicateEventHandlerError(handler.token);
    }

    this.handlers.set(handler.token, [...existing, handler as EventHandler]);
  }

  /**
   * Returns handlers registered for an event token in deterministic registration order.
   */
  get(token: MessageToken): readonly EventHandler[] {
    return this.handlers.get(token) ?? [];
  }

  /**
   * Returns all event tokens that currently have subscribers.
   */
  tokens(): readonly MessageToken[] {
    return [...this.handlers.keys()];
  }
}
