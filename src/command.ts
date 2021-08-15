import * as Line from "../mod.ts";

/**
 * The main command of the CLI.
 */
export class Command implements Line.Interfaces.ICommand {
  /**
   * The command that is used on the command line.
   */
  // TODO(crookse) Make command take in arguments
  public signature!: string;

  /**
   * An array of subcommands that this command can execute.
   */
  public subcommands: typeof Line.Subcommand[] = [];

  public cli: Line.Cli;

  public options: {[k: string]: string} = {};

  constructor(cli: Line.Cli) {
    this.cli = cli;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  public arg(arg: string): string | undefined {
    return this.cli.command_line.getArgumentValue(arg);
  }

  public option(option: string): boolean | string | undefined {
    return this.cli.command_line.getOptionValue(option);
  }
}
