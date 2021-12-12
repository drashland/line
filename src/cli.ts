import { ICLIOptions, IConstructable } from "./interfaces.ts";
import { MainCommand } from "./main_command.ts";

/**
 * A class to help build CLIs.
 */
export class CLI {
  /**
   * See MainCommand.
   */
  public main_command!: MainCommand;

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
    this.#setUpMainCommand();
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Run this CLI.
   */
  public async run(): Promise<void> {
    if (this.main_command.setUp) {
      this.main_command.setUp();
    }

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

  public showHelp(): void {
    console.log(`${this.name} - ${this.description}\n`);
    this.main_command.showHelp();
    Deno.exit(0);
  }

  /**
   * Show this CLI's version.
   */
  protected showVersion(): void {
    console.log(`${this.name} ${this.version}`);
  }

  #setUpMainCommand(): void {
    this.main_command =
      new (this.#options.command as unknown as IConstructable<MainCommand>)(
        this,
      );
  }
}
