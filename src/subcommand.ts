import { Line, ILogger, SubcommandOption } from "../mod.ts";

/**
 * A class that represents a subcommand as an object.
 */
export class Subcommand {
  /**
   * The CLI processing this subcommand.
   */
  public cli: Line;

  /**
   * This subcommand's description.
   */
  public description: string = "";

  /**
   * This subcommand's name.
   */
  public name: string = "";

  /**
   * This subcommand's options.
   */
  public options: (typeof SubcommandOption[] | SubcommandOption[]) = [];

  /**
   * This subcommand's signature. For example, "run [arg1] [arg2]".
   */
  public signature: string = "";

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param cli - See this.cli property.
   */
  constructor(cli: Line) {
    this.cli = cli;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * A convenience method to help exit the CLI from a subcommand.
   *
   * @param code - The exit code to use in the Deno.exit() call (e.g.,
   * Deno.exit(1)).
   * @param messageType - The type of message to display before exiting. See
   * ILogger keys for allowed values.
   * @param message - The message to display before exiting.
   * @param cb - (optional) A callback to execute before exiting. This is useful
   * if you want to show the help menu before exiting.
   */
  public exit(
    code: number,
    messageType: keyof ILogger,
    message: string,
    cb?: () => void,
  ): void {
    this.cli.exit(code, messageType, message, cb);
  }

  /**
   * Get an argument value from the command line.
   *
   * @param argumentName - The name of the argument containing the value.
   *
   * @returns The value of the argument or null if no value.
   */
  public getArgumentValue(argumentName: string): string | null {
    return this.cli.command_line.getArgumentValue(argumentName);
  }

  /**
   * Get the Deno flags from the command line.
   *
   * @returns The Deno flags.
   */
  public getDenoFlags(): string[] {
    return this.cli.command_line.getDenoFlags();
  }

  /**
   * Get an option value from the command line.
   *
   * @param optionName - The name of the option to get.
   *
   * @returns The value of the option or null if no value.
   */
  public getOptionValue(optionName: string): string | null {
    const results = (this.options as SubcommandOption[])
      .filter((option: SubcommandOption) => {
        return option.name == optionName;
      });

    const exists = results[0] ?? null;

    if (!exists) {
      this.cli.logger.error(
        `The "${optionName}" option does not exist on "${this.name}" subcommand.`,
      );
      Deno.exit(1);
    }

    return this.cli.command_line.getOptionValue(optionName);
  }

  /**
   * The handler for this subcommand. All subcommand classes must define this
   * method, so that they can be executed.
   */
  public handle(): void {
    return;
  }

  /**
   * Take the array of Option classes in this.options and instantiate all of
   * them.
   */
  public instantiateOptions(): void {
    let options: SubcommandOption[] = [];

    (this.options as unknown as (typeof SubcommandOption)[])
      .filter((option: typeof SubcommandOption) => {
        const o = new option(this);
        options.push(o);
      });

    this.options = options;
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(returnOutput = false): string|void {
    let help = `USAGE\n\n`;

    help +=
      `    ${this.cli.command} ${this.signature} [deno flags] [options]\n`;
    help += "\n";

    if (this.options.length > 0) {
      help += "OPTIONS\n\n";
      (this.options as SubcommandOption[]).forEach((option: SubcommandOption) => {
        help += `    ${option.name}\n`;
        help += `        ${option.description}\n`;
      });
    }

    if (returnOutput) {
      return help;
    }

    console.log(help);
  }
}
