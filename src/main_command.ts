import * as argParser from "./arg_parser.ts";
import { Subcommand } from "./subcommand.ts";
import { TArgument, TOption } from "./types.ts";
import { IArgument, IOption } from "./interfaces.ts";
import { IConstructable } from "./interfaces.ts";
import { colors } from "../deps.ts";

/**
 * The main command of the CLI.
 */
export class MainCommand {
  public arguments: TArgument = {};
  public name!: string;
  public options: TOption = {};
  public signature!: string;
  public subcommands: typeof Subcommand[] = [];

  /**
   * Used internally during runtime for performance and getting/checking of
   * arguments.
   */
  #arguments_map: Map<string, IArgument> = new Map();

  /**
   * Used internally during runtime for performance and getting/checking of
   * options.
   */
  #options_map: Map<string, IOption> = new Map();

  /**
   * Used internally during runtime for performance and getting/checking of
   * options.
   */
  #subcommands_map: Map<string, Subcommand> = new Map();

  #takes_arguments: boolean = false;
  #takes_options: boolean = false;
  #takes_subcommands: boolean = false;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  public handle(): void {
    return;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PUBLIC METHODS //////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get the value of the specified argument.
   *
   * @param argumentName - The argument in question.
   *
   * @returns The value of the argument in the command line or undefined if the
   * argument does not exist.
   */
  public argument(argumentName: string): string | undefined {
    const argumentObject = this.#arguments_map.get(argumentName);

    if (argumentObject) {
      return argumentObject.value;
    }

    return undefined;
  }

  /**
   * Get the value of the specified option.
   *
   * @param optionName - The option in question.
   *
   * @returns The value of the option in the command line or undefined if the
   * option does not exist.
   */
  public option(optionName: string): string | boolean | undefined {
    const optionObject = this.#options_map.get(optionName);

    if (optionObject) {
      return optionObject.value;
    }

    return undefined;
  }

  public async run(input: string): Promise<void> {
    const denoArgs = Deno.args.slice();

    // If this command takes in arguments, then we expect one to be specified
    if (
      (this.#takes_arguments || this.#subcommands_map.size > 0) &&
      (denoArgs.length <= 0)
    ) {
      this.showHelp();
      Deno.exit(1);
    }

    // If the input matches a subcommand, then let the subcommand take over
    for (
      const [subcommand, subcommandObject] of this.#subcommands_map.entries()
    ) {
      if (input == subcommandObject.name) {
        // No args passed to the subcommand? Show how to use the subcommand.
        if (!denoArgs[1]) {
          subcommandObject.showHelp();
          Deno.exit(1);
        }

        // Show the subcommands help menu?
        if (
          denoArgs.indexOf("-h") !== -1 ||
          denoArgs.indexOf("--help") !== -1
        ) {
          subcommandObject.showHelp();
          Deno.exit(0);
        }

        await subcommandObject.run();
      }
    }

    const optionsErrors = argParser.extractOptionsFromDenoArgs(
      denoArgs,
      this.name,
      "command",
      this.#options_map,
    );

    const argsErrors = argParser.extractArgumentsFromDenoArgs(
      denoArgs,
      this.name,
      "command",
      this.signature,
      this.#arguments_map,
    );

    // Combine all the errors and remove any duplicates
    const errors = [...new Set(optionsErrors.concat(argsErrors))].sort();

    if (errors.length > 0) {
      let errorString = "";
      errors.forEach((error: string) => {
        errorString += `\n  * ${error}`;
      });
      console.log(
        colors.red(`[ERROR] `) +
          `Command '${this.name}' used incorrectly. Error(s) found:\n${errorString}\n`,
      );
      console.log(this.#getHelpMenuUsage());
      Deno.exit(1);
    }

    // If we get here, then the input did not match a subcommand. Therefore, we
    // pass the argument to the main command for further handling (if a handler
    // method exists).
    // If the input wasn't a subcommand, then let the main command take over
    await this.handle();
    Deno.exit(0);
  }

  /**
   * Instantiate all subcommands so that this class can run them during runtime.
   */
  #setUpSubcommands(): void {
    if (this.subcommands.length <= 0) {
      return;
    }

    this.subcommands.forEach((subcommand: typeof Subcommand) => {
      const subcommandObj =
        new (subcommand as unknown as IConstructable<Subcommand>)(this);
      subcommandObj.setUp();
      this.#subcommands_map.set(
        subcommandObj.name,
        subcommandObj,
      );
    });
  }

  /**
   * Set up this main comman.
   */
  public setUp(): void {
    this.name = this.signature.split(" ")[0];
    this.signature = this.signature.trim();

    this.#setUpSubcommands();

    argParser.setArgumentsMapInitialValues(
      this.signature,
      this.#getCommandName(),
      "command",
      this.arguments,
      this.#arguments_map,
    );

    argParser.setOptionsMapInitialValues(
      this.options,
      this.#options_map,
    );

    this.#takes_subcommands = this.#subcommands_map.size > 0;
    this.#takes_arguments = this.#arguments_map.size > 0;
    this.#takes_options = this.#options_map.size > 0;
  }

  #getHelpMenuUsage(): string {
    let usage = `USAGE\n\n`;

    usage += `    ${this.name} [option]\n`;
    let options = "";

    if (this.#takes_options) {
      options = " [options]";
    }

    if (
      this.#takes_arguments &&
      !this.#takes_subcommands
    ) {
      usage += `    ${this.name}${options}`;
      for (const [argument, argumentObject] of this.#arguments_map.entries()) {
        usage += ` [arg: ${argument}]`;
      }
    }

    if (
      this.#takes_subcommands &&
      !this.#takes_arguments
    ) {
      usage += `    ${this.name} [subcommand]`;
    }

    if (
      this.#takes_arguments &&
      this.#takes_subcommands
    ) {
      usage += `    ${this.name}${options}`;

      for (const [argument, argumentObject] of this.#arguments_map.entries()) {
        usage += ` [arg: ${argument}]`;
      }

      usage += `\n    ${this.name} [subcommand]`;
    }

    return usage;
  }

  /**
   * Show this CLI's help menu.
   */
  public showHelp(): void {
    let help = this.#getHelpMenuUsage();

    help += this.#getHelpMenuArguments();
    help += this.#getHelpMenuSubcommands();
    help += this.#getHelpMenuOptions();

    console.log(help);
  }

  #getCommandName(): string {
    return this.signature.split(" ")[0];
  }

  /**
   * Get the help menu "ARGUMENTS" section.
   *
   * @returns The help menu "ARGUMENTS" section.
   */
  #getHelpMenuArguments(): string {
    let help = "";

    if (this.#takes_arguments) {
      help += `\n\nARGUMENTS\n`;
      for (const [argument, argumentObject] of this.#arguments_map.entries()) {
        help += `\n    ${argument}\n`;
        help += `        ${argumentObject.description}`;
      }
    }

    return help;
  }

  #getHelpMenuOptions(): string {
    let help = `\n\nOPTIONS\n\n`;
    help += `    -h, --help\n`;
    help += `        Show this menu.\n`;
    help += `    -v, --version\n`;
    help += `        Show this CLI's version.\n`;

    if (this.#takes_options) {
      for (const [option, optionObject] of this.#options_map.entries()) {
        help += `\n    ${option}\n`;
        help += `        ${optionObject.description}`;
      }
    }

    return help;
  }

  /**
   * Get the help menu "SUBCOMMANDS" section.
   *
   * @returns The help menu "SUBCOMMANDS" section.
   */
  #getHelpMenuSubcommands(): string {
    let help = "";

    if (this.#takes_subcommands) {
      help += `\n\nSUBCOMMANDS\n`;
      for (
        const [subcommand, subcommandObject] of this.#subcommands_map.entries()
      ) {
        help += `\n    ${subcommand}\n`;
        help += `        ${subcommandObject.description}`;
      }
    }

    return help;
  }
}
