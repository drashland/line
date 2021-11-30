import * as argParser from "./arg_parser.ts";
import { Command } from "./command.ts";
import { MainCommand } from "./main_command.ts";
import { IArgument, IOption } from "./interfaces.ts";
import { TArgument, TOption } from "./types.ts";
import { colors } from "../deps.ts";

/**
 * This class represents a subcommand. It can only be executed by the main
 * command.
 */
export class Subcommand extends Command {
  /**
   * See MainCommand.
   */
  public main_command: MainCommand;

  public description = "(no description)";

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @param mainCommand - See MainCommand.
   */
  constructor(mainCommand: MainCommand) {
    super();
    this.main_command = mainCommand;
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
    const argumentObject = this.arguments_map.get(argumentName);

    if (argumentObject) {
      return argumentObject.value;
    }

    return undefined;
  }

  /**
   * To be implemented by the user.
   */
  public handle(): void {
    return;
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
    const optionObject = this.options_map.get(optionName);

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
      this.options_map,
    );

    const argsErrors = argParser.extractArgumentsFromDenoArgs(
      denoArgs,
      this.name,
      "subcommand",
      this.signature,
      this.arguments_map,
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
      console.log(this.#getHelpMenuUsage());
      Deno.exit(1);
    }

    await this.handle();

    Deno.exit(0);
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): void {
    let help = this.#getHelpMenuUsage();
    help += this.getHelpMenuArguments();
    help += this.getHelpMenuOptions();

    console.log(help);
  }

  /**
   * Get the help menu "USAGE" section.
   *
   * @returns The help menu "USAGE" section.
   */
  #getHelpMenuUsage(): string {
    let help = `USAGE (for: \`${this.main_command.name} ${this.name}\`)\n\n`;

    help += `    ${this.main_command.name} ${this.name} [option]
    ${this.main_command.name} ${this.name} [options] ${this.#getHelpMenuUsageArgs()}`;

    return help;
  }

  /**
   * Get the help menu "USAGE" section arguments.
   *
   * @returns The help menu "USAGE" section arguments.
   */
  #getHelpMenuUsageArgs(): string {
    let match = this.signature.match(/\[\w+\]/g);
    if (match) {
      match = match.map((arg: string) => {
        return arg.replace("[", "[arg: ");
      });
    }
    return match ? match.join(" ") : "";
  }
}
