import * as Line from "../mod.ts";

/**
 * A class to help build CLIs.
 */
export class Cli {
  /**
   * See Line.command.
   */
  public command: Line.Interfaces.ICommand;

  /**
   * All of the subcommands from the command, but instantiated.
   */
  public subcommands: Line.Subcommand[] = [];

  /**
   * See Line.CommandLine.
   */
  public command_line: Line.CommandLine;

  public command_options: string[] = [];

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
    // TODO(crookse) Change `configs` to `options`
    this.name = configs.name;
    this.description = configs.description;
    this.version = configs.version;
    this.command = new (configs.command as typeof Line.Command)(this);
    this.command_line = new Line.CommandLine(this, Deno.args);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Run this CLI.
   */
  public run(): void {
    if (this.command.setUp) {
      this.command.setUp();
    }

    this.instantiateSubcommands();

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
        subcommand.setUp();

        // No args passed to the subcommand? Show how to use the subcommand.
        if (!Deno.args[1]) {
          subcommand.showHelp();
          Deno.exit(0);
        }

        // Show the subcommands help menu?
        if (Deno.args[1].trim() == "-h" || Deno.args[1].trim() == "--help") {
          subcommand.showHelp();
          Deno.exit(0);
        }

        if (subcommand.handle && typeof subcommand.handle == "function") {
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
          this,
        ),
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
    help += this.getUsage();
    help += `\n`;

    if (this.command.takes_args) {
      help += `ARGUMENTS\n\n`;
      for (const argument in this.command.arguments) {
        help += `    ${argument}\n`;
        help += `        ${this.command.arguments[argument]}\n`;
      }
      help += `\n`;
    }

    if (this.subcommands.length > 0) {
      help += `SUBCOMMANDS\n\n`;
      this.subcommands.forEach((subcommand: Line.Subcommand) => {
        help += `    ${subcommand.signature.split(" ")[0]}\n`;
        help += `        ${subcommand.description}\n`;
      });
      help += `\n`;
    }

    help += `OPTIONS\n\n`;
    help += `    -h, --help\n`;
    help += `        Show this menu.\n`;
    help += `    -v, --version\n`;
    help += `        Show this CLI's version.\n`;
    help += `\n`;

    if (this.command.options_parsed.length > 0) {
      for (const options in this.command.options) {
        help += `    ${options}\n`;
        help += `        ${this.command.options[options]}\n`;
      }
      help += `\n`;
    }

    console.log(help);
  }

  protected getUsage(): string {
    if (this.subcommands.length > 0) {
      return `    ${this.command.signature} [option | [subcommand] [args] [deno flags] [subcommand options]]\n`;
    }

    let formatted = "";

    const split = this.command.signature.split(" ");
    split.forEach((arg: string, index: number) => {
      if (split.length == (index + 1)) {
        formatted += `${arg.replace("[", "[arg: ")}`;
      } else {
        formatted += `${arg.replace("[", "[arg: ")} `;
      }
    });

    return `    ${formatted} [deno flags] [options]\n`;
  }

  /**
   * Show this CLI's version.
   */
  protected showVersion(): void {
    console.log(`${this.name} ${this.version}`);
  }
}
