import type { MessageToken } from './messageToken';

/**
 * Base contract for application commands dispatched through CommandBus.
 */
export interface Command<TPayload = unknown> {
  readonly token: MessageToken;
  readonly payload: TPayload;
}

/**
 * Executes a command and returns its application-level result.
 */
export interface CommandHandler<TCommand extends Command = Command, TResult = void> {
  readonly token: MessageToken;
  handle(command: TCommand): Promise<TResult> | TResult;
}

/**
 * Raised when a command is dispatched without a registered handler.
 */
export class UnknownCommandError extends Error {
  constructor(token: MessageToken) {
    super(`No command handler registered for token: ${token}`);
    this.name = 'UnknownCommandError';
  }
}

/**
 * Raised when more than one handler is registered for the same command token.
 */
export class DuplicateCommandHandlerError extends Error {
  constructor(token: MessageToken) {
    super(`Command handler already registered for token: ${token}`);
    this.name = 'DuplicateCommandHandlerError';
  }
}
