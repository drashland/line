import * as Line from "../mod.ts";

/**
 * The main command of the CLI.
 */
export class Command implements Line.Interfaces.ICommand {
  /**
   * The command that is used on the command line.
   */
  public signature!: string;

  /**
   * An array of subcommands that this command can execute.
   */
  public subcommands: typeof Line.Subcommand[] = [];

  public cli: Line.Cli;

  public arguments: { [k: string]: string } = {};

  public options: { [k: string]: string } = {};

  public options_parsed: string[] = [];

  public takes_args = false;

  constructor(cli: Line.Cli) {
    this.cli = cli;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  public arg(arg: string): string | undefined {
    return this.cli.command_line.getArgumentValue(this, arg);
  }

  public opt(option: string): boolean | string | undefined {
    return this.cli.command_line.getOptionValue(this, option);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PROTECTED /////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  public setUp(): void {
    if (!this.signature) {
      throw new Error("The main command is missing the `signature` property.");
    }

    // A main command cannot take in args AND have subcommands. Reason is
    // because we cannot differentiate between an argument AND a subcommand.
    const split = this.signature.split(" ");
    split.shift();
    if (split.length > 0) {
      this.takes_args = true;
      if (this.subcommands.length > 0) {
        throw new Error(
          "The main command cannot take in args and have subcommands.",
        );
      }
    }

    // Create the list of options that this main command takes
    if (Object.keys(this.options).length > 0) {
      for (const options in this.options) {
        let split = options.split(",");
        split.forEach((option) => {
          this.options_parsed.push(option.trim());
        });
      }
    }

    this.cli.command_line.extractOptionsFromArguments(this);

    if (this.takes_args) {
      this.cli.command_line.matchArgumentsToNames(this);
      for (const argument in this.cli.command_line.arguments) {
        if (!(argument in this.arguments)) {
          throw new Error(
            `Main command argument '${argument}' is missing a description.`,
          );
        }
      }
    }
  }
}
