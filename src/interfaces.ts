import * as Line from "../mod.ts";

export interface IConstructable<T> {
  new (...args: unknown[]): T;
}

export interface IArgument {
  description: string;
  // type: string;
  value?: string;
}

export interface IOption {
  takes_value: boolean;
  value?: boolean | string;
}

export interface IHelpable {
  showHelp: () => void;
}

export interface ICommand {
  signature: string;
  subcommands: typeof Line.Subcommand[];
  arguments: { [k: string]: string };
  options: Line.Types.TOption;
  options_parsed: string[];
  takes_args: boolean;
  cli: Line.Cli;
  handle?: () => void;
  setUp?: () => void;
  getOption?: (optionName: string) => IOption;
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
export interface ICliOptions {
  name: string;
  description: string;
  version: string;
  command: typeof Line.Command;
}
