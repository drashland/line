import * as Line from "../mod.ts";

/**
 * The command line is the entire line entered by the user. For example, if the
 * user enters "git commit -m 'test'", then "git commit -m 'test'" is the entire
 * command line.
 */
export class CommandLine {
  /**
   * Storage to hold all arguments in this command line. For example, the
   * command "rhum run tests/ --ftc hello something bye" contains the following
   * arguments: "tests/", "something", and "bye". "hello" is not an argument in
   * this command line. It is the value of the "--ftc" option.
   *
   * Furthermore, each argument is associated with a name. The name comes from a
   * command's signature property. For example, if "read" is the command and its
   * signature property is "read [directory|file]", then the command "read this"
   * will become { "directory|file": "this" } in this property.
   */
  public arguments: { [key: string]: string | undefined } = {};

  /**
   * Storage to hold all options and their values in the command line. For
   * example, the command "rhum run tests/ --ftc hello --fts 'good goodbye'"
   * will become { "--ftc": "hello", "--fts": "good goodbye" } in this property.
   */
  public options: { [key: string]: string | boolean } = {};

  /**
   * See https://doc.deno.land/builtin/stable#Deno.args.
   */
  public deno_args: string[];

  /**
   * See Line.Cli.
   */
  protected cli: Line.Cli;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param denoArgs - See this.deno_args property.
   */
  constructor(cli: Line.Cli, denoArgs: string[] = []) {
    this.cli = cli;
    this.deno_args = denoArgs.slice(); // Make a copy so they can be mutated
    this.formatCommandLine();
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  public getDenoArgs(): string[] {
    return this.deno_args;
  }

  /**
   * Get an argument value from Deno.args.
   *
   * @param argumentName - The name of the argument to get. The name of the
   * argument should match the argument's signature in a subcommand's signature
   * property. For example, if the signature is "run [some-cool-arg]", then the
   * argument name would be "[some-cool-arg]".
   *
   * @returns The argument's value or undefined if it has no value.
   */
  public getArgumentValue(
    command: Line.Command | Line.Subcommand,
    argumentName: string,
  ): undefined | string {
    return this.arguments[argumentName] ?? undefined;
  }

  /**
   * Get an option value from Deno.args.
   *
   * @param optionName - The name of the option to get.
   *
   * @returns The option's value or true if it was passed in. Sometimes options
   * do not require a value - only that they exist. For example:
   *
   *     `chmod -R`
   *
   * In the case of `chmod`, the `-R` option does not require a value. `chmod`
   * just checks if it is passed in and handles it accordingly.
   */
  public getOptionValue(
    command: Line.Command | Line.Subcommand,
    opt: string,
  ): boolean | string | undefined {
    const shortName = `-${opt}`;
    const longName = `--${opt}`;

    if (shortName in this.options) {
      return this.options[shortName];
    }

    if (longName in this.options) {
      return this.options[longName];
    }

    return undefined;
  }

  /**
   * Match all of the commands's argument names to their respective arguments
   * based on location of the argument in the command line.
   *
   * @param command - The command in question that should have the command line
   * arguments matched to its signature.
   */
  public matchArgumentsToNames(
    command: Line.Interfaces.ICommand | Line.Subcommand,
  ): void {
    const sigSplit = command.signature.split(" ");
    sigSplit.shift(); // Take off the command and leave only the args

    // Match arguments in the signature to arguments in the command line
    for (let i = 0; i < sigSplit.length; i++) {
      if (command instanceof Line.Command) {
        this.arguments[sigSplit[i].replace(/\[|\]/g, "")] = this.deno_args[i];
      } else {
        this.arguments[sigSplit[i].replace(/\[|\]/g, "")] =
          this.deno_args[i + 1];
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PROTECTED /////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Format the command line so that it can be further parsed during runtime.
   * For example, split options from their values by removing the `=` sign.
   */
  protected formatCommandLine(): void {
    const formatted: string[] = [];

    this.deno_args.forEach((item: string) => {
      if ((item.match(/^-/) || item.match(/^--/)) && item.includes("=")) {
        const split = item.split("=");
        formatted.push(split[0]);
        formatted.push(split[1]);
        return;
      }

      formatted.push(item);
    });

    this.deno_args = formatted;
  }
}
