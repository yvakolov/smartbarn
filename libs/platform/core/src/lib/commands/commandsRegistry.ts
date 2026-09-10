import type { MessageToken } from '../cqrs/messageToken';
import type {
  CommandContext,
  CommandDescriptor,
  ResolvedCommandDescriptor,
} from './commandDescriptor';

/** Raised when a command descriptor is registered more than once. */
export class DuplicateCommandDescriptorError extends Error {
  constructor(token: MessageToken) {
    super(`Command descriptor already registered for token: ${token}`);
    this.name = 'DuplicateCommandDescriptorError';
  }
}

/** Raised when metadata is requested for an unknown command token. */
export class UnknownCommandDescriptorError extends Error {
  constructor(token: MessageToken) {
    super(`No command descriptor registered for token: ${token}`);
    this.name = 'UnknownCommandDescriptorError';
  }
}

/**
 * Authoritative catalog of executable application commands and their presentation metadata.
 *
 * @remarks
 * Handler registration remains separate: this registry describes discoverability and
 * applicability, while CommandBus and its handler registry own execution.
 */
export class CommandsRegistry {
  private readonly descriptors = new Map<MessageToken, CommandDescriptor>();

  /** Registers one command descriptor under its canonical command token. */
  register(descriptor: CommandDescriptor): void {
    if (this.descriptors.has(descriptor.token)) {
      throw new DuplicateCommandDescriptorError(descriptor.token);
    }

    this.descriptors.set(descriptor.token, descriptor);
  }

  /** Returns metadata for a registered command. */
  get(token: MessageToken): CommandDescriptor {
    const descriptor = this.descriptors.get(token);
    if (!descriptor) {
      throw new UnknownCommandDescriptorError(token);
    }

    return descriptor;
  }

  /** Returns the complete catalog in deterministic category/group/order/title order. */
  list(): readonly CommandDescriptor[] {
    return [...this.descriptors.values()].sort(compareDescriptors);
  }

  /**
   * Resolves contextual state and returns visible, applicable commands in deterministic order.
   */
  resolve(context: CommandContext = {}): readonly ResolvedCommandDescriptor[] {
    return this.list()
      .map((descriptor) => resolveDescriptor(descriptor, context))
      .filter((descriptor) => descriptor.applicable && descriptor.visible);
  }
}

function resolveDescriptor(
  descriptor: CommandDescriptor,
  context: CommandContext,
): ResolvedCommandDescriptor {
  const applicable = descriptor.isApplicable?.(context) ?? true;
  const visible = applicable && (descriptor.isVisible?.(context) ?? true);
  const enabled = visible && (descriptor.canExecute?.(context) ?? true);

  return { ...descriptor, applicable, visible, enabled };
}

function compareDescriptors(left: CommandDescriptor, right: CommandDescriptor): number {
  return compareText(left.category, right.category)
    || compareText(left.group, right.group)
    || (left.order ?? 0) - (right.order ?? 0)
    || left.titleKey.localeCompare(right.titleKey)
    || left.token.localeCompare(right.token);
}

function compareText(left?: string, right?: string): number {
  return (left ?? '').localeCompare(right ?? '');
}
