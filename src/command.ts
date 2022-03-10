import * as argParser from "./arg_parser.ts";
import { TArgument, TOption } from "./types.ts";
import { IArgument, IOption } from "./interfaces.ts";

/**
 * A class representing a command in the CLI.
 */
export abstract class Command {
  /**
   * The types of commands that can extend this class.
   */
  abstract type: "command" | "subcommand";

  /**
   * A key-value pair object of argument descriptions where the key is the
   * argument and the value is the description.
   */
  public arguments: TArgument = {};

  /**
   * This command's name.
   */
  public name!: string;

  /**
   * A key-value pair object of options where the key is the option signature
   * (or a comma-delimited list of signatures) and the value is the description.
   */
  public options: TOption = {};

  /**
   * This command's signature.
   */
  public signature!: string;

  /**
   * Used internally during runtime for performance and getting/checking of
   * arguments.
   */
  protected arguments_map: Map<string, IArgument> = new Map();

  /**
   * Used internally during runtime for performance and getting/checking of
   * options.
   */
  protected options_map: Map<string, IOption> = new Map();

  /**
   * Does this command take arguments?
   */
  protected takes_arguments = false;

  /**
   * Does this command take options?
   */
  protected takes_options = false;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - ABSTRACT METHODS ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Run this command's handler.
   */
  abstract handle(): void;

  /**
   * Show this command's help menu.
   */
  abstract showHelp(): void;

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
   * Get the value of the specified option.
   *
   * @param optionName - The option in question.
   *
   * @returns The value of the option in the command line or undefined if the
   * option does not exist.
   */
  public option(optionName: string): string[] | boolean | undefined {
    const optionObject = this.options_map.get(optionName);

    if (optionObject) {
      return optionObject.value;
    }

    return undefined;
  }

  /**
   * Set up this command.
   */
  public setUp(): void {
    this.name = this.signature.split(" ")[0];
    this.signature = this.signature.trim();

    argParser.setArgumentsMapInitialValues(
      this.signature,
      this.name,
      this.arguments,
      this.arguments_map,
    );

    argParser.setOptionsMapInitialValues(
      this.options,
      this.options_map,
    );

    // console.log(`In setUp, this.options_map: ${JSON.stringify(this.options_map)}`);

    this.takes_arguments = this.arguments_map.size > 0;
    this.takes_options = this.options_map.size > 0;
  }

  /**
   * Get the help menu "ARGUMENTS" section for this command.
   *
   * @returns The help menu "ARGUMENTS" section for this command.
   */
  public getHelpMenuArguments(): string {
    let help = "";

    if (this.takes_arguments) {
      help += `\n\nARGUMENTS\n`;
      for (const [argument, argumentObject] of this.arguments_map.entries()) {
        help += `\n    ${argument}\n`;
        help += `        ${argumentObject.description}`;
      }
    }

    return help;
  }

  /**
   * Get the help menu "OPTIONS" section for this command.
   *
   * @returns The help menu "OPTIONS" section for this command.
   */
  public getHelpMenuOptions(): string {
    let help = `\n\nOPTIONS\n\n`;
    help += `    -h, --help\n`;
    help += `        Show this menu.\n`;
    help += `    -v, --version\n`;
    help += `        Show this CLI's version.\n`;

    if (this.takes_options) {
      const optionsProcessed: string[] = [];
      // console.log(`this.options_map: ${JSON.stringify(this.options_map)}`);
      for (const [option, optionObject] of this.options_map.entries()) {
        let alreadyProcessed = false;
        optionObject.signatures.forEach((signature: string) => {
          if (optionsProcessed.indexOf(signature) !== -1) {
            alreadyProcessed = true;
          }
        });

        // console.log(`In getHelpMenuOptions, optionObject = ${JSON.stringify(optionObject)}`);
        if (!alreadyProcessed) {
          help += `\n    ${optionObject.signatures.join(", ")}\n`;
          help += `        ${optionObject.description}`;
        }
        optionsProcessed.push(option);
      }
    }

    return help;
  }

  protected validateDenoArgs(denoArgs: string[]): string[] {
    // console.log('Beg of validateDenoArgs');
    const optionsErrors = argParser.extractOptionsFromDenoArgs(
      denoArgs,
      this.options_map,
    );

    const argsErrors = argParser.extractArgumentsFromDenoArgs(
      denoArgs,
      this.name,
      this.signature,
      this.arguments_map,
    );

    // Combine all the errors and remove any duplicates
    return [...new Set(optionsErrors!.concat(argsErrors) ?? null)].sort();
  }
}
