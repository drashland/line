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
  // FILE MARKER - PUBLIC METHODS //////////////////////////////////////////////
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
    const optionObject = this.#options_map.get(option);

    if (optionObject) {
      return optionObject.value;
    }

    return undefined;
  }

  /**
   * Set up this subcommand so it can handle any options and arguments passed in
   * through the command line..
   */
  public setUp(): void {
    this.#validateSubcommand();
    this.#createOptionsMap();
    this.#createArgumentsMap();
    this.cli.command_line.matchArgumentsToNames(this);
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): string | void {
    const subcommand = this.signature.split(" ")[0];

    let help = `USAGE (for: \`${this.cli.main_command.signature} ${subcommand}\`)\n\n`;

    help += this.#getUsage();

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
        help += `    ${this.#formatOptions(key)}\n`;
        help += `        ${this.options[key]}\n`;
      }
    }

    console.log(help);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PRIVATE METHODS /////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Create the arguments Map so that it can be used during runtime. We do not
   * use `this.arguments` directly because it is just the interface that users
   * use to define their argument descriptions. The Map created in this method
   * creates an object that we can parse better during runtime.
   */
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
   * Create the options Map so that it can be used during runtime. We do not use
   * `this.options` directly because it is just the interface that users use to
   * define their options. The Map created in this method creates an object that
   * we can parse better during runtime.
   */
  #createOptionsMap(): void {
    this.#setOptionsMapInitialValues();
    this.#validateOptionsInCommandLine();
    this.#setOptionsMapActualValues();
  }

  /**
   * Get the subcommand form the signature, which is the first item in the
   * signature.
   *
   * @returns The subcommand.
   */
  #getSubcommandName(): string {
    return this.signature.split(" ")[0];
  }

  /**
   * Get the "USAGE" section for the help menu.
   *
   * @returns The "USAGE" section.
   */
  #getUsage(): string {
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
   * Take the validated command line and set actual values in the options Map.
   */
  #setOptionsMapActualValues(): void {
    let denoArgs = this.cli.command_line.getDenoArgs();

    // Remove the subcommand from the command line. We only care about the items
    // that come after the subcommand.
    const subcommandIndex = denoArgs.indexOf(this.#getSubcommandName());
    denoArgs = denoArgs.slice(subcommandIndex + 1, denoArgs.length);


    for (const [option, optionObject] of this.#options_map.entries()) {
      const optionLocation = denoArgs.indexOf(option);

      // If the option is not in the command line, then skip this process
      if (optionLocation === -1) {
        continue;
      }

      // If we get here, then the option is present in the command line.
      // Therefore, we check to see if it takes in a value. If it does, then the
      // next item in the command line is the option's value.
      if (optionObject.takes_value) {
        optionObject.value = denoArgs[optionLocation + 1];
        continue;
      }

      // If we get here, then the option does not take in a value, but it still
      // exists in the command line. Therefore, we just set it to `true` to
      // denote that, "Yes, this option exists in the command line," and calls
      // to `this.option(optionName)` will return `true`.
      //
      // This code is introduced because sometimes users do not want their
      // options to take in values. They just want the option to exist; and if
      // it does, then they can handle it accordingly in their `handle()`
      // methods.
      optionObject.value = true;
    }
  }

  /**
   * Format the options for help menu purposes.
   *
   * @returns The formatted options.
   */
  #formatOptions(options: string): string {
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

  /**
   * Set the initial values of the options Map.
   */
  #setOptionsMapInitialValues(): void {
    // Create the options map
    for (const optionSignatures in this.options) {
      // The key in the `options` property can be a command-delimited list of
      // options, so we split on the commad just in case it is a comma-delimited
      // list
      const split = optionSignatures.split(",");

      // For each option signature specified ...
      split.forEach((signature: string) => {
        // ... trim leading/trailing spaces that might be in the signature
        signature = signature.trim();

        // ... check to see if this option takes in a value
        let optionTakesValue = false;
        if (signature.includes("[value]")) {
          // If it does take in a value, then take out the `[value]` portion of
          // the signature. We do not need this when creating the options Map.
          signature = signature.replace(/\s+\[value\]/, "").trim();
          optionTakesValue = true;
        }

        this.#options_map.set(signature, {
          takes_value: optionTakesValue,
          // The value starts off as `undefined` because we do not know what the
          // value of the option is yet. We find out later in this method.
          value: undefined,
        });
      });
    }
  }

  /**
   * This should be called after `this.#setOptionsMapInitialValues()`. Reason
   * being, this method uses the options Map to check if options exist and the
   * `#setOptionsMapInitialValues()` creates the Map.
   *
   * This method validates that all options passed into the command line for
   * this subcommand meet all requirements.
   *
   * If any option is passed in that is not part of the subcommand, then the
   * program will exit.
   */
  #validateOptionsInCommandLine(): void {
    let denoArgs = this.cli.command_line.getDenoArgs();

    // Remove the subcommand from the command line. We only care about the items
    // that come after the subcommand.
    const subcommandIndex = denoArgs.indexOf(this.#getSubcommandName());
    denoArgs = denoArgs.slice(subcommandIndex + 1, denoArgs.length);

    denoArgs.forEach((arg: string) => {
      if (arg.match(/^-/)) {
        if (!this.#options_map.has(arg)) {
          console.log(`Unknown '${arg}' option found.`);
          Deno.exit(1);
        }
      }
    });
  }

  /**
   * Validate this subcommand. Exit if there are any errors.
   */
  #validateSubcommand(): void {
    if (!this.handle) {
      console.log(`Subcommand '${this.#getSubcommandName()}' does not have a \`handle()\` method implemented.`);
      Deno.exit(1);
    }

    // TODO(crookse): Check that the options' signatures are valid
    // TODO(crookse): Check that the arguments have descriptions
  }

}
