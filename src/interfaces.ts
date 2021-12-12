import { MainCommand } from "./main_command.ts";

/**
 * The representation of an argument during runtime.
 *
 * description - The argument's description.
 * value - The argument's value provided through the command line.
 */
export interface IArgument {
  description: string;
  // type: string;
  value?: string;
}

/**
 * The options that can be passed into the CLI.
 *
 * name - The CLI's name.
 * description - The CLI's description.
 * version - The CLI's version.
 * command - The main command.
 */
export interface ICLIOptions {
  name: string;
  description: string;
  version: string;
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
 *
 * description - The option's description.
 * signatures - A comma-delimited list of the option's signatures.
 * takes_value - Does this option take in a value?
 * value - The option's value. Initially set to `false` and set to `true` if
 * provided through the command line. Value is the provided value through the
 * command line if this option takes in a value.
 */
export interface IOption {
  description: string;
  signatures: string[];
  // deno-lint-ignore camelcase
  takes_value: boolean;
  value?: boolean | string;
}
