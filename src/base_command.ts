import { ILogger, Line } from "../mod.ts";
import { SubcommandOption } from "./subcommand_option.ts";

export abstract class BaseCommand {
  /**
   * The CLI processing this maincommand.
   */
  public cli: Line;

  abstract name: string;

  protected initiated_options: SubcommandOption[] = [];

  /**
   * This maincommand's options.
   */
  public options: (typeof SubcommandOption[] | SubcommandOption[]) = [];

  constructor(cli: Line) {
    this.cli = cli;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The handler for this command. All command classes must define this
   * method, so that they can be executed.
   */
  public handle(): void {
    return;
  }

  /**
   * A convenience method to help exit the CLI from a maincommand.
   *
   * @param code - The exit code to use in the Deno.exit() call (e.g.,
   * Deno.exit(1)).
   * @param messageType - The type of message to display before exiting. See
   * ILogger keys for allowed values.
   * @param message - The message to display before exiting.
   * @param cb - (optional) A callback to execute before exiting. This is useful
   * if you want to show the help menu before exiting.
   */
  public exit(
    code: number,
    messageType: keyof ILogger,
    message: string,
    cb?: () => void,
  ): void {
    this.cli.exit(code, messageType, message, cb);
  }

  /**
   * Get an argument value from the command line.
   *
   * @param argumentName - The name of the argument containing the value.
   *
   * @returns The value of the argument or null if no value.
   */
  public getArgumentValue(argumentName: string): string | null {
    return this.cli.command_line.getArgumentValue(argumentName);
  }

  /**
   * Get the Deno flags from the command line.
   *
   * @returns The Deno flags.
   */
  public getDenoFlags(): string[] {
    return this.cli.command_line.getDenoFlags();
  }

  /**
   * Get an option value from the command line.
   *
   * @param optionName - The name of the option to get.
   *
   * @returns The value of the option or null if no value.
   */
  public getOptionValue(optionName: string): string | null {
    const results = (this.options as SubcommandOption[])
      .filter((option: SubcommandOption) => {
        return option.name == optionName;
      });

    const exists = results[0] ?? null;

    if (!exists) {
      this.cli.logger.error(
        `The "${optionName}" option does not exist on "${this.name}" subcommand.`,
      );
      Deno.exit(1);
    }

    return this.cli.command_line.getOptionValue(optionName);
  }
}
