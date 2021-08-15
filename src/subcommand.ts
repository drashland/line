import * as Line from "../mod.ts";

/**
 * This class represents a subcommand. It can only be executed by the main
 * command.
 */
export class Subcommand {
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
  public options: {[k: string]: string} = {};

  /**
   * An object that describes the arguments in the signature. If a subcommand
   * defines this property, then it will be used in the help menu.
   */
  public arg_descriptions: {[k: string]: string} = {};

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
  public getArgumentValue(argument: string): string | undefined {
    return this.cli.command_line.getArgumentValue(argument);
  }

  /**
   * Get the value of the specified option.
   *
   * @param option - The option in question.
   *
   * @returns True if the option exists in the command line or the value of the
   * option if one was specified.
   */
  public getOptionValue(option: string): string|boolean|undefined {
    return this.cli.command_line.getOptionValue(option);
  }

  /**
   * A method to be implemented by a child class.
   */
  public handle(): void {
    return;
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): string | void {
    let help = `USAGE\n\n`;

    help +=
      `    ${this.cli.command.signature} ${this.formatSignature()} [deno flags] [options]\n`;

    if (Object.keys(this.arg_descriptions).length > 0) {
      help += "\n";
      help += "ARGS\n\n";
      for (const key in this.arg_descriptions) {
        help += `    ${key}\n`;
        help += `        ${this.arg_descriptions[key]}\n`;
      }
    }

    if (Object.keys(this.options).length > 0) {
      help += "\n";
      help += "OPTIONS\n\n";
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
    split.shift();

    let formatted = "";

    split.forEach((arg: string, index: number) => {
      if (split.length == (index + 1)) {
        formatted += `${arg.replace("[", "[arg:")}`;
      } else {
        formatted += `${arg.replace("[", "[arg:")} `;
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
