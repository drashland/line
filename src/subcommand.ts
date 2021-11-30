import * as Line from "../mod.ts";
import * as argParser from "./arg_parser.ts";
import { Command } from "./command.ts";
import { IArgument, IOption } from "./interfaces.ts";
import { TArgument, TOption } from "./types.ts";
import { colors } from "../deps.ts";

/**
 * This class represents a subcommand. It can only be executed by the main
 * command.
 */
export abstract class Subcommand {
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
  public options: TOption = {};

  /**
   * This subcommand's argument descriptions.
   */
  public arguments: TArgument = {};

  public name!: string;

  /**
   * See Line.Cli.
   */
  public main_command: Command;

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

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @param cli - See Line.Cli.
   */
  constructor(mainCommand: Command) {
    this.main_command = mainCommand;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - ABSTRACT METHODS ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  public abstract handle(): void;

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

  /**
   * Run this subcommand.
   */
  public async run(): Promise<void> {
    let denoArgs = Deno.args.slice(); // Make a copy that we  can mutate

    // Remove the subcommand from the command line. We only care about the items
    // that come after the subcommand.
    const commandIndex = denoArgs.indexOf(this.name);
    denoArgs = denoArgs.slice(commandIndex + 1, denoArgs.length);

    const optionsErrors = argParser.extractOptionsFromDenoArgs(
      denoArgs,
      this.name,
      "subcommand",
      this.#options_map,
    );

    const argsErrors = argParser.extractArgumentsFromDenoArgs(
      denoArgs,
      this.name,
      "subcommand",
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
          `Subcommand '${this.name}' used incorrectly. Error(s) found:\n${errorString}\n`,
      );
      console.log(this.#getUsage());
      Deno.exit(1);
    }

    await this.handle();

    Deno.exit(0);
  }

  /**
   * Set up this subcommand so it can be used during runtime.
   */
  public setUp(): void {
    this.name = this.signature.split(" ")[0];
    this.signature = this.signature.trim();

    argParser.setArgumentsMapInitialValues(
      this.signature,
      this.name,
      "subcommand",
      this.arguments,
      this.#arguments_map,
    );

    argParser.setOptionsMapInitialValues(
      this.options,
      this.#options_map,
    );
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): void {
    const subcommand = this.name;

    let help = this.#getUsage();

    if (this.#arguments_map.size > 0) {
      help += "\n\nARGUMENTS\n";
      for (const [argument, argumentObj] of this.#arguments_map.entries()) {
        help += `\n    ${argument}\n`;
        help += `        ${argumentObj.description}`;
      }
    }

    help += `\n\nOPTIONS\n\n`;
    help += `    -h, --help\n`;
    help += `        Show this menu.\n`;

    if (this.#options_map.size > 0) {
      for (const [option, optionObject] of this.#options_map.entries()) {
        help += `\n    ${option}\n`;
        help += `        ${optionObject.description}`;
      }
    }

    console.log(help);
  }

  /**
   * Get the "USAGE" section for the help menu.
   *
   * @returns The "USAGE" section.
   */
  #getUsage(): string {
    let formatted = `USAGE (for: \`${this.main_command.name} ${this.name}\`)\n\n`;

    formatted += `    ${this.main_command.name} ${this.name} [option]
    ${this.main_command.name} ${this.name} [options] ${this.#getUsageArgs()}`;

    return formatted;
  }

  #getUsageArgs(): string {
    let match = this.signature.match(/\[\w+\]/g);
    if (match) {
      match = match.map((arg: string) => {
        return arg.replace("[", "[arg: ");
      });
    }
    return match ? match.join(" ") : "";
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
}
