import type { Event } from './event';
import { EventHandlerRegistry } from './eventHandlerRegistry';

/**
 * Publishes an event to all handlers registered for its canonical token.
 */
export class EventBus {
  constructor(private readonly registry: EventHandlerRegistry) {}

  /**
   * Publishes an event to subscribers in deterministic registration order.
   *
   * @remarks
   * Events with no subscribers are valid and complete without error. Handler failures are
   * propagated so callers can apply an explicit reliability policy at a higher layer.
   */
  async publish(event: Event): Promise<void> {
    for (const handler of this.registry.get(event.token)) {
      await handler.handle(event);
    }
  }
}
