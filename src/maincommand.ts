import { Line, SubcommandOption } from "../mod.ts";
import { BaseCommand } from "./base_command.ts";

/**
 * A class that represents a subcommand as an object.
 */
export class Maincommand extends BaseCommand {
  /**
   * This maincommand's description.
   */
  public description = "";

  /**
   * This maincommand's name.
   */
  public name = "";

  /**
   * This maincommand's signature. For example, "run [arg1] [arg2]".
   */
  public signature = "";

  /**
   * This subcommand's options.
   */
  public options: typeof SubcommandOption[] = [];

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param cli - See this.cli property.
   */
  constructor(cli: Line) {
    super(
      cli,
    );
    this.initiated_options = this.options.map((option) => new option(this));
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The handler for this subcommand. All subcommand classes must define this
   * method, so that they can be executed.
   */
  public handle(): void {
    return;
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(returnOutput = false): string | void {
    let help = `USAGE\n\n`;

    help +=
      `    ${this.cli.command} ${this.signature} [deno flags] [options]\n`;
    help += "\n";

    if (this.initiated_options.length > 0) {
      help += "OPTIONS\n\n";
      this.initiated_options.forEach(
        (option) => {
          help += `    ${option.name}\n`;
          help += `        ${option.description}\n`;
        },
      );
    }

    if (returnOutput) {
      return help;
    }

    console.log(help);
  }
}
