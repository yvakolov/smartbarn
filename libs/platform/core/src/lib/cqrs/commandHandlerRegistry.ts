import type { Command, CommandHandler } from './command';
import { DuplicateCommandHandlerError } from './command';
import type { MessageToken } from './messageToken';

/**
 * Stores the single executable handler registered for each command token.
 *
 * @remarks
 * This registry is intentionally separate from CommandsRegistry. It maps a
 * command token to executable behavior, while CommandsRegistry describes the
 * discoverable command catalog used by UI surfaces.
 */
export class CommandHandlerRegistry {
  private readonly handlers = new Map<MessageToken, CommandHandler>();

  /**
   * Registers one handler for a canonical command token.
   *
   * @throws {DuplicateCommandHandlerError} When the token is already registered.
   */
  register<TCommand extends Command, TResult>(handler: CommandHandler<TCommand, TResult>): void {
    if (this.handlers.has(handler.token)) {
      throw new DuplicateCommandHandlerError(handler.token);
    }

    this.handlers.set(handler.token, handler as CommandHandler);
  }

  /**
   * Resolves a handler by canonical command token.
   */
  get(token: MessageToken): CommandHandler | undefined {
    return this.handlers.get(token);
  }

  /**
   * Returns whether a handler is registered for the command token.
   */
  has(token: MessageToken): boolean {
    return this.handlers.has(token);
  }
}
