import { MainCommand } from "./main_command.ts";

/**
 * The representation of an argument during runtime.
 */
export interface IArgument {
  /** The argument's description. */
  description: string;
  /** The argument's value provided through the command line. */
  value?: string;
}

/**
 * The options that can be passed into the CLI.
 */
export interface ICLIOptions {
  /** The CLI's name. */
  name: string;
  /** The CLI's description. */
  description: string;
  /** The CLI's version. */
  version: string;
  /** The main command. */
  command: typeof MainCommand;
}

/**
 * A helper interface to help construct main commands and subcommands. This
 * prevents the need to instantiate command classes before plugging them into
 * `Line.CLI` and `Line.MainCommand`.
 */
export interface IConstructable<T> {
  new (...args: unknown[]): T;
}

/**
 * The representation of an option during runtime.
 */
export interface IOption {
  /** The option's description. */
  description: string;
  /** A comma-delimited list of the option's signatures. */
  signatures: string[];
  /** Does this option take in a value? */
  // deno-lint-ignore camelcase
  takes_value: boolean;
  /**
   * The option's value. Initially set to `false` and set to `true` if provided
   * through the command line. Value is the provided value through the command
   * line if this option takes in a value.
   */
  value?: boolean | string;
}
