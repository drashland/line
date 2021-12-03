import { MainCommand } from "./main_command.ts";

export interface IConstructable<T> {
  new (...args: unknown[]): T;
}

export interface IArgument {
  description: string;
  // type: string;
  value?: string;
}

export interface IOption {
  description: string;
  signatures: string[];
  // deno-lint-ignore camelcase
  takes_value: boolean;
  value?: boolean | string;
}

export interface IHelpable {
  showHelp: () => void;
}

/**
 * The options that can be passed into the CLI.
 *
 * name
 *     The CLI's name.
 *
 * description
 *     The CLI's description.
 *
 * version
 *     The CLI's version.
 *
 * command
 *     The main command.
 */
export interface ICLIOptions {
  name: string;
  description: string;
  version: string;
  command: typeof MainCommand;
}
