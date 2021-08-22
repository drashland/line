import * as Line from "../mod.ts";

/**
 * This class represents a subcommand. It can only be executed by the main
 * command.
 */
export class Subcommand {
  [key: string]: unknown

  /**
   * This subcommand's signature. For example, `copy [source] [destination]`.
   */
  public signature!: string;

  /**
   * This subcommand's description.
   */
  public description!: string;

  /**
   * This subcommand's options.
   */
  public options: { [k: string]: string } = {};
  public options_parsed: string[] = [];

  /**
   * An object that describes the arguments in the signature. If a subcommand
   * defines this property, then it will be used in the help menu.
   */
  public arguments: { [k: string]: string } = {};

  /**
   * See Line.Cli.
   */
  public cli: Line.Cli;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @param cli - See Line.Cli.
   */
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

  public setUp(): void {
    if (!this.handle) {
      throw new Error(
        `Subcommand '${this.signature.split(" ")[0]}' not implemented.`,
      );
      Deno.exit(1);
    }

    if (Object.keys(this.options).length > 0) {
      for (const options in this.options) {
        let split = options.split(",");
        split.forEach((option) => {
          this.options_parsed.push(option.trim());
        });
      }
    }

    this.cli.command_line.extractOptionsFromArguments(this);

    this.cli.command_line.matchArgumentsToNames(this);

    let args = this.signature.split(" ");
    args.shift(); // Take off the subcommand and only leave the args

    // Take off the surrounding square brackets from the args
    args = args.map((arg: string) => {
      return arg.replace(/\[|\]/g, "");
    });

    // If the arg has not been described, then make sure the the help menu can
    // show that the arg has "(no description)"
    args.forEach((arg: string) => {
      if (!(arg in this.arguments)) {
        this.arguments[arg] = "(no description)";
      }
    });

    // Ignore all described args that are not in the signature
    for (const arg in this.arguments) {
      if (args.indexOf(arg) === -1) {
        delete this.arguments[arg];
      }
    }
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): string | void {
    const subcommand = this.signature.split(" ")[0];

    let help = `USAGE (for: ${this.cli.command.signature} ${subcommand})\n\n`;

    help +=
      `    ${this.cli.command.signature} ${this.formatSignature()} [deno flags] [options]\n`;

    help += "\n";
    help += "ARGUMENTS\n\n";
    for (const argument in this.arguments) {
      help += `    ${argument}\n`;
      help += `        ${this.arguments[argument]}\n`;
    }
    help += `\n`;

    help += `OPTIONS\n\n`;
    help += `    -h, --help\n`;
    help += `        Show this menu.\n`;

    if (Object.keys(this.options).length > 0) {
      help += `\n`;
      for (const key in this.options) {
        help += `    ${this.formatOptions(key)}\n`;
        help += `        ${this.options[key]}\n`;
      }
    }

    console.log(help);
  }

  /**
   * Format the signature for help menu purposes.
   *
   * @returns The formatted signature.
   */
  protected formatSignature(): string {
    const split = this.signature.split(" ");

    let formatted = "";

    split.forEach((item: string, index: number) => {
      if (split.length == (index + 1)) {
        formatted += `${item.replace("[", "[arg: ")}`;
      } else {
        formatted += `${item.replace("[", "[arg: ")} `;
      }
    });

    return formatted;
  }

  /**
   * Format the options for help menu purposes.
   *
   * @returns The formatted options.
   */
  protected formatOptions(options: string): string {
    let formatted = "";

    const split = options.split(",");

    split.forEach((option: string, index: number) => {
      if (split.length == (index + 1)) {
        formatted += `${option.trim()}`;
      } else {
        formatted += `${option.trim()}, `;
      }
    });

    return formatted;
  }
}
