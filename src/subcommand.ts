import { Command } from "./command.ts";
import { MainCommand } from "./main_command.ts";
import { colors } from "../deps.ts";

/**
 * This class represents a subcommand in the CLI. It can only be executed by the
 * main command.
 */
export class Subcommand extends Command {
  /**
   * @inheritdoc
   */
  public description = "(no description)";

  /**
   * See MainCommand.
   */
  public main_command: MainCommand;

  /**
   * @inheritdoc
   */
  public type: "command" | "subcommand" = "subcommand";

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
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
   * This method is to be implemented by the user of this framework. This method
   * is executed during runtime and should contain the code that this subcommand
   * should process. For example, if the subcommand should write a file, then
   * this method could have `Deno.writeFileSync( ... )` in its body.
   */
  public handle(): void {
    return;
  }

  /**
   * Run this subcommand.
   */
  public async run(): Promise<void> {
    const denoArgs = Deno.args.slice(); // Make a copy that we can mutate
    // Remove the subcommand from the arg list because we only care about the
    // arguments passed in. Everything after the subcommand should be options or
    // arguments to the subcommand.
    denoArgs.shift();

    const errors = super.validateDenoArgs(denoArgs);

    if (errors.length > 0) {
      let errorString = "";
      errors.forEach((error: string) => {
        errorString += `\n  * ${error}`;
      });
      console.log(
        colors.red(`[ERROR] `) +
          `Subcommand '${this.name}' used incorrectly. Error(s) found:\n${errorString}\n`,
      );
      console.log(
        this.#getHelpMenuUsage() +
          `\n\n    Run \`${this.main_command.name} ${this.name} --help\` for more information.`,
      );
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

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PRIVATE METHODS /////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

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
