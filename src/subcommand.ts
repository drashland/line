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
  public options: Line.Types.TOption = {};

  /**
   * An object that describes the arguments in the signature. If a subcommand
   * defines this property, then it will be used in the help menu.
   */
  public arguments: { [k: string]: string } = {};

  /**
   * See Line.Cli.
   */
  public cli: Line.Cli;

  /**
   * Used internally during runtime for performance and getting/checking of
   * options.
   */
  #options_map: Map<string, Line.Interfaces.IOption> = new Map();

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

  public hasOption(option: string): boolean {
    return this.#options_map.has(option);
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

  public getOption(optionName: string): Line.Interfaces.IOption {
    // We add the ! to the end because
    // `CommandLine.extractOptionsFromArguments()` will exit if any option is
    // passed into the command line that does not exist. This being said, when
    // `CommandLine.extractOptionsFromArguments()` calls this method, the option
    // WILL exist.
    return this.#options_map.get(optionName)!;
  }

  /**
   * Get the subcommand form the signature, which is the first item in the
   * signature.
   *
   * @returns The subcommand.
   */
  public getSubcommand(): string {
    return this.signature.split(" ")[0];
  }

  /**
   * Create the options Map so that it can be used during runtime. We do not use
   * `this.options` directly because it is just the interface that users use to
   * define their options. The Map created in this method creates an object that
   * we can parse better during runtime.
   */
  #createOptionsMap(): void {
    for (const optionSignatures in this.options) {
      const split = optionSignatures.split(",");
      split.forEach((signature: string) => {
        // Trim any leading or trailing spaces that might be in the signature
        signature = signature.trim();

        // Check to see if this option takes in a value
        let optionTakesValue = false;
        if (signature.includes("[value]")) {
          signature = signature.replace(/\s+\[value\]/, "");
          optionTakesValue = true;
        }

        this.#options_map.set(signature.trim(), {
          takes_value: optionTakesValue,
          // The value starts off as `undefined` because we do not know what the
          // value of the option is yet. We find out what the value is when
          // `CommandLine.extractOptionsFromArguments()` is called.
          value: undefined,
        });
      });
    }
  }

  /**
   * Validate this subcommand. Exit if there are any errors.
   */
  #validate(): void {
    if (!this.handle) {
      console.log(`Subcommand '${this.getSubcommand()}' does not have a \`handle()\` method implemented.`);
      Deno.exit(1);
    }

    // TODO(crookse): Check that the options' signatures are valid
    // TODO(crookse): Check that the arguments have descriptions
  }

  /**
   * Set up this subcommand so it can handle any options and arguments passed in
   * through the command line..
   */
  public setUp(): void {
    this.#validate();

    this.#createOptionsMap();

    this.#createArgumentsMap();

    this.cli.command_line.extractOptionsFromArguments(this);

    this.cli.command_line.matchArgumentsToNames(this);
  }

  #createArgumentsMap(): void {
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

    let help = `USAGE (for: \`${this.cli.main_command.signature} ${subcommand}\`)\n\n`;

    help += this.getUsage();

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
  protected getUsage(): string {
    const mainCommand = this.cli.main_command.signature;

    const split = this.signature.split(" ");
    const subcommand = split[0];

    let formatted = `    ${mainCommand} ${subcommand} [option]
    ${mainCommand} ${subcommand} [options] `;

    // Take off the subcommand so that we do not parse it when we start
    // formatting the signature in the `.forEach()` below
    split.shift();

    split.forEach((item: string, index: number) => {
      if (split.length == (index + 1)) {
        formatted += `${item.replace("[", "[arg: ")}`;
      } else {
        // If this is not the last argument, then add a trailing space so that
        // the next argument is not hugging up against this one
        formatted += `${item.replace("[", "[arg: ")} `;
      }
    });

    return formatted + "\n";
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
