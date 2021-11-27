import * as Line from "../mod.ts";

/**
 * The main command of the CLI.
 */
export class Command implements Line.Interfaces.ICommand {
  /**
   * The main command that is used on the command line. For example, in the
   * following command line ...
   *
   *   `deno run -A app.ts`
   *
   * ... the `deno` part is the main command.
   */
  public signature!: string;

  /**
   * An array of subcommands that this main command can execute.
   */
  public subcommands: typeof Line.Subcommand[] = [];

  public cli: Line.Cli;

  public arguments: { [k: string]: string } = {};

  public options: Line.Types.TOption = {};

  public options_parsed: string[] = [];

  public takes_args = false;

  constructor(cli: Line.Cli) {
    this.cli = cli;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get the value of the specified argument.
   *
   * @param argumentName - The argument in question.
   *
   * @returns The value of the argument or undefined if no value was specified.
   */
  public argument(argument: string): string | undefined {
    return this.cli.command_line.getArgumentValue(this, argument);
  }

  /**
   * Get the value of the specified option.
   *
   * @param option - The option in question.
   *
   * @returns True if the option exists in the command line or the value of the
   * option if one was specified.
   */
  public option(option: string): string | boolean | undefined {
    return this.cli.command_line.getOptionValue(this, option);
  }

  /**
   * Set up this main comman.
   */
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
    // if (Object.keys(this.options).length > 0) {
    //   for (const options in this.options) {
    //     let split = options.split(",");
    //     split.forEach((option) => {
    //       this.options_parsed.push(option.trim());
    //     });
    //   }
    // }

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
