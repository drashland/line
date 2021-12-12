import { ICLIOptions, IConstructable } from "./interfaces.ts";
import { MainCommand } from "./main_command.ts";

/**
 * A class to help build CLIs. This class is responsible for the initial set up
 * of the CLI. Specifically, it sets up the main command so that it can show
 * help menus. If a main command contains subcommands, then those subcommands
 * are set up in the main command when it is constructed.
 */
export class CLI {
  /**
   * This CLI's description.
   */
  public description: string;

  /**
   * See MainCommand.
   */
  public main_command!: MainCommand;

  /**
   * This CLI's name.
   */
  public name: string;

  /**
   * This CLI's version.
   */
  public version: string;

  /**
   * See ICLIOptions.
   */
  #options: ICLIOptions;

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param options - See ICLIOptions for more information.
   */
  constructor(options: ICLIOptions) {
    this.#options = options;
    this.name = options.name;
    this.description = options.description;
    this.version = options.version;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PUBLIC METHODS //////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Run this CLI.
   */
  public async run(): Promise<void> {
    // Set up the main command. We do this early in case we need to show its
    // help menu.
    this.main_command =
      new (this.#options.command as unknown as IConstructable<MainCommand>)(
        this,
      );
    this.main_command.setUp();

    const input = Deno.args[0];

    // If there is no input, then show the user how to use this CLI
    if (Deno.args.length <= 0) {
      return this.showHelp();
    }

    // If the input is an option, then process that option
    switch (input) {
      case "-h":
      case "--help":
        return this.showHelp();
      case "-v":
      case "--version":
        return this.showVersion();
    }

    // If we get here, then let the main command take over
    await this.main_command.run(input);

    Deno.exit(0);
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - PROTECTED METHODS ///////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * This method is a wrapper around the main command's help menu. Reason it
   * needs to be wrapped is because we need to show the CLI's name and
   * description before showing the main command's help menu.
   */
  protected showHelp(): void {
    console.log(`${this.name} - ${this.description}\n`);
    this.main_command.showHelp();
    Deno.exit(0);
  }

  /**
   * Show this CLI's version.
   */
  protected showVersion(): void {
    console.log(`${this.name} ${this.version}`);
    Deno.exit(0);
  }
}
