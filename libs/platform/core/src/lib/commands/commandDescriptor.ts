import type { MessageToken } from '../cqrs/messageToken';

/**
 * Runtime context supplied by presentation/application surfaces when discovering commands.
 *
 * @remarks
 * The platform keeps this contract intentionally generic. Functional bounded contexts may
 * extend the context through typed values without coupling platform core to editor concepts.
 */
export interface CommandContext {
  readonly values?: Readonly<Record<string, unknown>>;
}

/**
 * Metadata and contextual predicates describing one executable application command.
 *
 * @remarks
 * Descriptors are presentation-neutral. Toolbars, context menus, command palettes and
 * desktop shortcuts consume the same stable command token instead of duplicating actions.
 */
export interface CommandDescriptor {
  readonly token: MessageToken;
  readonly titleKey: string;
  readonly descriptionKey?: string;
  readonly category?: string;
  readonly group?: string;
  readonly icon?: string;
  readonly order?: number;
  readonly destructive?: boolean;
  readonly toggle?: boolean;
  readonly isApplicable?: (context: CommandContext) => boolean;
  readonly isVisible?: (context: CommandContext) => boolean;
  readonly canExecute?: (context: CommandContext) => boolean;
}

/**
 * Resolved command metadata for a concrete UI/application context.
 */
export interface ResolvedCommandDescriptor extends CommandDescriptor {
  readonly applicable: boolean;
  readonly visible: boolean;
  readonly enabled: boolean;
}
