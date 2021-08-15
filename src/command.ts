import * as Line from "../mod.ts";

/**
 * The main command of the CLI.
 */
export class Command {
  /**
   * The command that is used on the command line.
   */
  public command!: string;

  /**
   * An array of subcommands that this command can execute.
   */
  public subcommands: typeof Line.Subcommand[] = [];

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * A method to be implemented by the child class.
   */
  public handle(): void {
    return;
  }
}
