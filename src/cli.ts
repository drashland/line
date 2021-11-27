import * as Line from "../mod.ts";

/**
 * A class to help build CLIs.
 */
export class Cli {
  /**
   * See Line.Command.
   */
  public main_command: Line.Interfaces.ICommand;

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
   * All of the subcommands from the command, but instantiated.
   */
  public subcommands: Line.Subcommand[] = [];

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
  constructor(options: Line.Interfaces.ICliOptions) {
    this.name = options.name;
    this.description = options.description;
    this.version = options.version;
    this.main_command = new (options.command as typeof Line.Command)(this);
    this.command_line = new Line.CommandLine(this, Deno.args);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Run this CLI.
   */
  public async run(): Promise<void> {
    this.instantiateSubcommands();

    if (this.main_command.setUp) {
      this.main_command.setUp();
    }

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

    // If the input wasn't a subcommand, then let the main command take over
    if (this.main_command.handle) {
      await this.main_command.handle();
    } else {
      // todo show error saying the subcommand wasnt recognised?
      this.showHelp();
    }

    Deno.exit(0);
  }

  /**
   * Instantiate all subcommands so that they can be run.
   */
  public instantiateSubcommands(): void {
    if (!this.main_command.subcommands) {
      return;
    }

    if (this.main_command.subcommands.length <= 0) {
      return;
    }

    this.main_command.subcommands.forEach((subcommand: typeof Line.Subcommand) => {
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
  public showHelp(): void {
    let help = `${this.name} - ${this.description}\n\n`;

    help += `USAGE\n\n`;
    help += this.getUsage();
    help += `\n`;

    if (this.main_command.takes_args) {
      help += `ARGUMENTS\n\n`;
      for (const argument in this.main_command.arguments) {
        help += `    ${argument}\n`;
        help += `        ${this.main_command.arguments[argument]}\n`;
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

    if (this.main_command.options_parsed.length > 0) {
      for (const options in this.main_command.options) {
        help += `    ${options}\n`;
        help += `        ${this.main_command.options[options]}\n`;
      }
      help += `\n`;
    }

    console.log(help);
  }

  /**
   * Get the "Usage" section of the menu.
   *
   * @returns The usage section.
   */
  protected getUsage(): string {
    if (this.subcommands.length > 0) {
      return `    ${this.main_command.signature} [option]
    ${this.main_command.signature} [subcommand] [subcommand options] [args]\n`;
    }

    let formatted = "";

    const split = this.main_command.signature.split(" ");
    split.forEach((arg: string, index: number) => {
      if (split.length == (index + 1)) {
        formatted += `${arg.replace("[", "[arg: ")}`;
      } else {
        formatted += `${arg.replace("[", "[arg: ")} `;
      }
    });

    return `    ${formatted} [options]\n`;
  }

  /**
   * Show this CLI's version.
   */
  protected showVersion(): void {
    console.log(`${this.name} ${this.version}`);
  }
}
