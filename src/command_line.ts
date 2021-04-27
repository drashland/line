import { Subcommand } from "../mod.ts";

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
   * subcommand's signature property. For example, if "rhum" is the main command
   * and there is a subcommand in this CLI that defines its signature property
   * as "run [directory|file]", then the command "rhum run tests" will become
   * { "[directory|file]": "tests" } in this property.
   */
  public arguments: { [key: string]: string | undefined } = {};

  /**
   * Storage to hold all options and their values in the command line. For
   * example, the command "rhum run tests/ --ftc hello --fts 'good goodbye'"
   * will become { "--ftc": "hello", "--fts": "good goodbye" } in this property.
   */
  public options: { [key: string]: string | undefined } = {};

  /**
   * The subcommand in this command line. This is the second argument in the
   * command line. For example, "commit" is the subcommand in the command "git
   * commit".
   */
  public subcommand: string;

  /**
   * See https://doc.deno.land/builtin/stable#Deno.args.
   */
  protected deno_args: string[];

  /**
   * See https://deno.land/manual/getting_started/permissions#permissions-list.
   */
  protected deno_flags: string[] = [];

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param denoArgs - See this.deno_args property.
   * @param subcommands - Used to match subcommand arguments to arguments in the
   * command line.
   */
  constructor(denoArgs: string[], subcommands: Subcommand[]) {
    this.deno_args = denoArgs;

    // The second argument is always the subcommand
    this.subcommand = this.deno_args.shift() as string;

    this.extractDenoFlagsFromArguments();

    this.extractOptionsFromArguments();

    this.matchArgumentsToNames(subcommands);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get an argument value from Deno.args.
   *
   * @param argumentName - The name of the argument to get. The name of the
   * argument should match the argument's signature in a subcommand's signature
   * property. For example, if the signature is "run [some-cool-arg]", then the
   * argument name would be "[some-cool-arg]".
   *
   * @returns The argument's value or null if it has no value.
   */
  public getArgumentValue(argumentName: string): null | string {
    return this.arguments["[" + argumentName + "]"] ?? null;
  }

  /**
   * Get the Deno flags (e.g., --allow-net) taken from Deno.args.
   *
   * @returns An array of Deno flags.
   */
  public getDenoFlags(): string[] {
    return this.deno_flags;
  }

  /**
   * Get an option value from Deno.args.
   *
   * @param optionName - The name of the option to get.
   *
   * @returns The option's value or null if it has no value.
   */
  public getOptionValue(optionName: string): null | string {
    return this.options[optionName] ?? null;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PROTECTED /////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Extract all Deno flags from the arguments.
   */
  protected extractDenoFlagsFromArguments(): void {
    const denoFlags = [
      "--allow-all",
      "--allow-net",
      "--allow-read",
      "--allow-run",
      "--allow-write",
      "--reload",
      "-A",
    ];

    this.deno_args.forEach((datum: string) => {
      if (denoFlags.indexOf(datum) != -1) {
        this.deno_flags.push(datum);
      }
    });

    for (const index in this.deno_flags) {
      // Get the location of the flag in the line
      const flag = this.deno_flags[index];
      const flagIndex = this.deno_args.indexOf(flag);

      // Remove the flag from the line
      this.deno_args.splice(flagIndex, 1);
    }
  }

  /**
   * Extract all options and their values from Deno.args.
   */
  protected extractOptionsFromArguments(): void {
    this.deno_args.forEach((datum: string) => {
      if (datum.includes("--")) {
        this.options[datum] = undefined;
      }
    });

    for (const optionName in this.options) {
      // Get the location of the option in the line
      const index = this.deno_args.indexOf(optionName);

      // The input AFTER the location of the option is the value of the option
      this.options[optionName] = this.deno_args[index + 1];
      this.deno_args.splice(index + 1, 1);

      // Remove the option from the line because it now has a name and a value
      this.deno_args.splice(index, 1);
    }
  }

  /**
   * Match all of the subcommand's argument names to their respective arguments
   * based on location in the command line. For example, the first element in
   * the signature will be taken off, which is the subcommand name. Everything
   * that follows the subcommand name will be the argument names. For example,
   * if the subcommand's signature is "run <directory> {file}", and the
   * arguments in Deno.args are "['thisDir', 'thisFile']", then the "run"
   * subcommand name will be taken off and the following object will be created:
   * { "<directory>: "thisDir", "{file}: "thisFile" }.
   *
   * Note that the argument names contain their surrounding brackets.
   */
  protected matchArgumentsToNames(subcommands: Subcommand[]): void {
    subcommands.forEach((subcommand: Subcommand) => {
      const sigSplit = subcommand.signature.split(" ");
      sigSplit.shift(); // Take off the subcommand and leave only the args

      // Match arguments in the signature to arguments in the command line
      for (let i = 0; i < sigSplit.length; i++) {
        this.arguments[sigSplit[i]] = this.deno_args[i];
      }
    });
  }
}
