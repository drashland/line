import * as Line from "../mod.ts";
import * as argParser from "./arg_parser.ts";

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
   * Run this subcommand.
   */
  public run(): void {
    argParser.parseOptionsInCommandLine(
      this.cli.command_line.getDenoArgs(),
      this.#getSubcommandName(),
      "subcommand",
      this.#options_map,
      this.showHelp,
    );

    argParser.setOptionsMapActualValues(
      this.cli.command_line.getDenoArgs(),
      this.#getSubcommandName(),
      "subcommand",
      this.#options_map,
    );

    this.cli.command_line.matchArgumentsToNames(this);

    this.handle();

    Deno.exit(0);
  }

  public setUp(): void {
    this.#createArgumentsMap();

    argParser.setOptionsMapInitialValues(
      this.options,
      this.#options_map,
    );
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): void {
    const subcommand = this.#getSubcommandName();

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
