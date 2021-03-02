import { Commander, Subcommand } from "../mod.ts";

/**
 * The command line is the entire line entered by the user. For example, if the
 * user enters "git commit -m 'test'", then that entire line is the command
 * line.
 */
export class CommandLine {
  /**
   * The CLI processing this command line.
   */
  public cli: Commander;

  /**
   * The subcommand in this command line. This is the second argument in the
   * command line. For example, if the user enters "git commit", then the
   * subcommand is "commit".
   */
  public subcommand: string;

  /**
   * Storage to hold all arguments in the line. For example, if the user enters
   * in "rhum run tests/ --filter-test-case hello arg2 arg3", then the arguments
   * are "tests/", "arg2", and "arg3". "hello" is not an argument in this line.
   * It is an option value.
   *
   * Each argument is associated with a name. The name comes from a subcommand's
   * signature property. For example, if a subcommand defines a signature of
   * "run [directory|file]" and the user enters in "rhum run tests", then this
   * property will evaluate to { "[directory|file]": "tests" }.
   */
  protected arguments: { [key: string]: string | undefined } = {};

  /**
   * See https://doc.deno.land/builtin/stable#Deno.args.
   */
  protected deno_args: string[];

  /**
   * See https://deno.land/manual/getting_started/permissions#permissions-list.
   */
  protected deno_flags: string[] = [];

  /**
   * Storage to hold all options and their values in the line. For example, if
   * the user enters in "rhum run tests/ --ftc hello --fts goodbye", then the
   * options and values are "tests/", "arg2", and "arg3". "hello" is not an
   * argument in this line.  It is an option value.
   */
  protected options: { [key: string]: string | undefined } = {};

  //////////////////////////////////////////////////////////////////////////////
//////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param cli - The application this command line belongs to.
   */
  constructor(cli: Commander) {
    this.cli = cli;
    this.deno_args = Deno.args.slice();

    // The second argument is always the subcommand
    this.subcommand = this.deno_args.shift() as string;

    this.extractDenoFlagsFromArguments();

    this.extractOptionsFromArguments();

    this.matchArgumentsToNames();
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get an argument taken from Deno.args.
   *
   * @param argumentName - The name of the argument to get. The name of the
   * argument should match the argument's signature in a subcommand's signature
   * property. For example, if the signature is ...
   *
   *     run [some-cool-arg]
   *
   * ... then the argument name would be "[some-cool-arg]".
   *
   * @returns The argument's value or null if it has no value.
   */
  public getArgument(argumentName: string): null | string {
    return this.arguments[argumentName] ?? null;
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
   * Get an option taken from Deno.args.
   *
   * @param argumentName - The name of the option to get. The name of the
   * option should match the options's signature in a subcommand's option's
   * signature property. For example, if the signature is ...
   *
   *     --some-cool-option [some-cool-value]
   *
   * ... then the option name would be "--some-cool-option".
   *
   * @returns The option's value or null if it has no value.
   */
  public getOption(optionName: string): null | string {
    return this.options[optionName] ?? null;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PROTECTED /////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Match all of the subcommand's argument names to their respective arguments
   * based on location in the command line. For example, the first element in
   * the signature will be taken off, which is the subcommand name. Everything
   * that follows the subcommand name will be the argument names. If the
   * subcommand signature is ...
   *
   *     run [directory] {file} <something>
   *
   * ... and the arguments are ...
   *
   *     ["thisDir", "thisFile", "something"]
   *
   * ... then the "run" subcommand name will be taken off and the following
   *     object will be created ...
   *
   *     {
   *       "[directory]: "thisDir",
   *       "{file}:      "thisFile",
   *       "<something>: "something",
   *     }
   *
   * Note that the argument names do contain their surrounding brackets.
   */
  protected matchArgumentsToNames(): void {
    (this.cli.subcommands as (typeof Subcommand)[])
      .forEach((subcommand: typeof Subcommand) => {
        const sigSplit = (subcommand as unknown as Subcommand)
          .signature
          .split(" ");
        sigSplit.shift();
        for (let i = 0; i < sigSplit.length; i++) {
          this.arguments[sigSplit[i]] = this.deno_args[i];
        }
      });
  }

  protected extractDenoFlagsFromArguments(): void {
    // Extract all options from the line
    this.deno_args.forEach((datum: string) => {
      if (datum.includes("-A")) {
        this.deno_flags.push("-A");
      }
      if (datum == "--allow-all") {
        this.deno_flags.push("--allow-all");
      }
      if (datum == "--allow-read") {
        this.deno_flags.push("--allow-read");
      }
      if (datum == "--allow-run") {
        this.deno_flags.push("--allow-run");
      }
      if (datum == "--allow-write") {
        this.deno_flags.push("--allow-write");
      }
    });

    for (const index in this.deno_flags) {
      const flag = this.deno_flags[index];

      // Get the location of the flag in the line
      const flagIndex = this.deno_args.indexOf(flag);

      // Remove the flag from the line
      this.deno_args.splice(flagIndex, 1);
    }
  }

  protected extractOptionsFromArguments(): void {
    // Extract all options from the line
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
}
