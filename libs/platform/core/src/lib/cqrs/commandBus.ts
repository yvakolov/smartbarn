import type { Command, CommandHandler } from './command';
import { UnknownCommandError } from './command';
import { CommandHandlerRegistry } from './commandHandlerRegistry';

/**
 * Dispatches application commands to exactly one registered handler.
 *
 * @remarks
 * CommandBus contains no bounded-context business logic. Functional modules
 * register handlers through the platform contract and own their execution rules.
 */
export class CommandBus {
  constructor(private readonly handlers: CommandHandlerRegistry) {}

  /**
   * Executes a command through the handler registered for its canonical token.
   *
   * @throws {UnknownCommandError} When no handler exists for the command token.
   */
  async execute<TCommand extends Command, TResult = void>(command: TCommand): Promise<TResult> {
    const handler = this.handlers.get(command.token) as CommandHandler<TCommand, TResult> | undefined;

    if (!handler) {
      throw new UnknownCommandError(command.token);
    }

    return await handler.handle(command);
  }
}
