import { Command } from "./command.ts";
import { Subcommand } from "./subcommand.ts";
import { IConstructable } from "./interfaces.ts";
import { colors } from "../deps.ts";

/**
 * The main command of the CLI.
 */
export class MainCommand extends Command {
  /**
   * An array of subcommands that this main command can run. These should not be
   * instantiated.
   */
  public subcommands: typeof Subcommand[] = [];

  /**
   * @inheritdoc
   */
  public type: "command" | "subcommand" = "command";

  /**
   * Used internally during runtime for performance and getting/checking/running
   * subcommands.
   */
  #subcommands_map: Map<string, Subcommand> = new Map();

  /**
   * Does this command take subcommands?
   */
  #takes_subcommands = false;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PUBLIC METHODS //////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @inheritdoc
   *
   * To be implemented by the user if they need it. Sometimes a main command
   * does not need to implement this.
   */
  public handle(): void {
    return;
  }

  /**
   * Run this command.
   *
   * @param input - The `Deno.args[0]` value.
   */
  public async run(input: string): Promise<void> {
    const denoArgs = Deno.args.slice();

    // If this command takes in arguments, then we expect one to be specified
    if (
      (this.takes_arguments || this.#subcommands_map.size > 0) &&
      (denoArgs.length <= 0)
    ) {
      this.showHelp();
      Deno.exit(1);
    }

    await this.#runSubcommand(input, denoArgs);

    const errors = super.validateDenoArgs(denoArgs);

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
   * Set up this command.
   */
  public setUp(): void {
    super.setUp();
    this.#setUpSubcommands();
    this.#takes_subcommands = this.#subcommands_map.size > 0;
  }

  /**
   * Show this command's help menu.
   */
  public showHelp(): void {
    let help = this.#getHelpMenuUsage();

    help += this.getHelpMenuArguments();
    help += this.#getHelpMenuSubcommands();
    help += this.getHelpMenuOptions();

    console.log(help);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PRIVATE METHODS /////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Get the help menu "SUBCOMMANDS" section for this command.
   *
   * @returns The help menu "SUBCOMMANDS" section for this command.
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

  /**
   * Get the help menu "USAGE" section for this command.
   *
   * @returns The help menu "USAGE" section for this command.
   */
  #getHelpMenuUsage(): string {
    let usage = `USAGE\n\n`;

    usage += `    ${this.name} [option]\n`;
    let options = "";

    if (this.takes_options) {
      options = " [options]";
    }

    if (
      this.takes_arguments &&
      !this.#takes_subcommands
    ) {
      usage += `    ${this.name}${options}`;
      for (const [argument, _argumentObject] of this.arguments_map.entries()) {
        usage += ` [arg: ${argument}]`;
      }
    }

    if (
      this.#takes_subcommands &&
      !this.takes_arguments
    ) {
      usage += `    ${this.name} [subcommand]`;
    }

    if (
      this.takes_arguments &&
      this.#takes_subcommands
    ) {
      usage += `    ${this.name}${options}`;

      for (const [argument, _argumentObject] of this.arguments_map.entries()) {
        usage += ` [arg: ${argument}]`;
      }

      usage += `\n    ${this.name} [subcommand]`;
    }

    return usage;
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
   * Run the given subcommand (if it exists).
   *
   * @param input - The input from Deno.args.
   * @param denoArgs - The Deno.args array.
   */
  async #runSubcommand(input: string, denoArgs: string[]): Promise<void> {
    // If the input matches a subcommand, then let the subcommand take over
    for (
      const [_subcommand, subcommandObject] of this.#subcommands_map.entries()
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
        Deno.exit(0);
      }
    }
  }
}
