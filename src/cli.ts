import * as Line from "../mod.ts";

/**
 * A class to help build CLIs.
 */
export class Cli {
  /**
   * See Line.command.
   */
  public command: Line.Command;

  /**
   * All of the subcommands from the command, but instantiated.
   */
  public subcommands: Line.Subcommand[] = [];

  /**
   * See Line.CommandLine.
   */
  public command_line: Line.CommandLine;

  /**
   * This CLI's description.
   */
  public description: string;

  /**
   * This CLI's name.
   */
  public name: string;

  /**
   * This CLI's version.
   */
  public version: string;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param options - See ICliOptions for more information.
   */
  constructor(configs: Line.Interfaces.ICliOptions) {
    this.name = configs.name;
    this.description = configs.description;
    this.version = configs.version;
    this.command = new (configs.command as typeof Line.Command)();
    // TODO(crookse) Validate that this.command has all fields and methods.
    this.command_line = new Line.CommandLine(Deno.args);
    this.instantiateSubcommands();
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Run this CLI.
   */
  public run(): void {
    const input = Deno.args[0];

    // If the input is an option, then process that option
    switch (input) {
      case "-h":
      case "--help":
        return this.showHelp();
      case "-v":
      case "--version":
        return this.showVersion();
    }

    // If the input matches a subcommand, then let the subcommand take over
    this.subcommands.forEach((subcommand: Line.Subcommand) => {
      if (input == subcommand.signature!.split(" ")[0]) {

        // No args passed to the subcommand? Show how to use the subcommand.
        if (!Deno.args[1]) {
          subcommand.showHelp();
          Deno.exit(0);
        }

        if (subcommand.handle) {
          this.command_line.matchArgumentsToNames(subcommand);
          subcommand.handle();
          Deno.exit(0);
        }
      }
    });

    if (!input) {
      this.showHelp();
      Deno.exit(0);
    }

    // If the input wasn't a subcommand, then let the main command take over
    if (this.command.handle) {
      this.command.handle();
    }

    Deno.exit(0);
  }

  public instantiateSubcommands(): void {
    if (!this.command.subcommands) {
      return;
    }

    if (this.command.subcommands.length <= 0) {
      return;
    }

    this.command.subcommands.forEach((subcommand: typeof Line.Subcommand) => {
      // TODO(crookse) Validate subcommand fields and methods
      this.subcommands.push(
        new (subcommand as unknown as typeof Line.Subcommand)(
          this
        )
      );
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PROTECTED /////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Show this CLI's help menu.
   */
  protected showHelp(): void {
    let help = `${this.name} - ${this.description}\n\n`;

    help += `USAGE\n\n`;
    help +=
      `    ${this.command.command} [option | [[subcommand] [args] [deno flags] [subcommand options]]]\n`;
    help += `\n`;

    help += `OPTIONS\n\n`;
    help += `    -h, --help\n`;
    help += `        Show this menu.\n`;
    help += `    -v, --version\n`;
    help += `        Show this CLI's version.\n`;
    help += `\n`;

    help += `SUBCOMMANDS\n\n`;
    this.subcommands.forEach((subcommand: Line.Subcommand) => {
      help += `    ${subcommand.signature.split(" ")[0]}\n`;
      help += `        ${subcommand.description}\n`;
    });

    console.log(help);
  }

  /**
   * Show this CLI's version.
   */
  protected showVersion(): void {
    console.log(`${this.name} ${this.version}`);
  }
}
