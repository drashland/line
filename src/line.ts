import { ConsoleLogger } from "../deps.ts";

import { CommandLine, ILineConfigs, ILogger, Subcommand } from "../mod.ts";
import { Maincommand } from "./main_command.ts";

/**
 * A class to help build CLIs.
 */
export class Line {
  /**
   * This CLI's main command (e.g., rhum).
   */
  public command: string;

  /**
   * The command line this CLI parses.
   */
  public command_line: CommandLine;

  /**
   * This CLI's description.
   */
  public description: string;

  /**
   * This CLI's logger.
   */
  public logger: ILogger = {
    debug: ConsoleLogger.debug,
    error: ConsoleLogger.error,
    info: ConsoleLogger.info,
    warn: ConsoleLogger.warn,
  };

  /**
   * This CLI's name.
   */
  public name: string;

  /**
   * This CLI's subcommands.
   */
  public subcommands: Subcommand[] = [];

  public main_command_handler: Maincommand | null = null;

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
   * @param configs - See ILineConfigs for more information.
   */
  constructor(configs: ILineConfigs) {
    this.command = configs.command;
    this.name = configs.name;
    this.description = configs.description, this.version = configs.version;
    if (configs.subcommands) {
      this.subcommands = this.instantiateSubcommands(configs.subcommands);
    }
    if (configs.main_command_handler) {
      this.main_command_handler = new configs.main_command_handler(this);
    }
    const args = Deno.args;
    this.command_line = new CommandLine(
      args,
      this.subcommands,
      this.main_command_handler,
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PUBLIC ////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Exit the program.
   *
   * @param code - The exit code.
   * @param messageType - The message type to display (e.g., error, warn, info).
   * @param message - The message to display to the user.
   * @param cb - The callback to execute before exiting the program. For
   * example, show the help menu.
   */
  public exit(
    code: number,
    messageType: keyof ILogger,
    message: string,
    cb?: () => void,
  ): void {
    this.logger[messageType](`${message}\n`);
    if (cb) {
      cb();
    }
    Deno.exit(code);
  }

  /**
   * Get a subcommand.
   *
   * @param subcommandName - The name of the subcommand to get.
   *
   * @returns The subcommand or null if not found.
   */
  public getSubcommand(subcommandName: string): null | Subcommand {
    const results = (this.subcommands as Subcommand[])
      .filter((subcommand: Subcommand) => {
        return subcommand.name == subcommandName;
      });

    return results[0] ?? null;
  }

  /**
   * Run this CLI.
   */
  public run(): void {
    if (!this.command_line.subcommand && !this.main_command_handler) {
      return this.showHelp();
    }

    const input = this.getSubcommand(this.command_line.subcommand);

    // It's a subcommand, so make all of its options and run its handle method
    if (input) {
      input.instantiateOptions();
      input.handle();
      return;
    }

    // Not a subcommand? Maybe it's a command option.
    switch (Deno.args[0]) {
      case "-h":
      case "--help":
        return this.showHelp();
      case "-v":
      case "--version":
        return this.showVersion();
      default:
        break;
    }

    // Not an option? Maybe its the maincommand
    if (this.main_command_handler) {
      this.main_command_handler.handle();
      return;
    }

    // Not a command either!? Oo, well guess we'll have to tell the user whatever they typed isn't correct
    return this.exit(
      1,
      "error",
      `Unknown input "${this.command_line.subcommand}" specified.`,
      () => {
        let availOptions = `AVAILABLE OPTIONS\n\n`;
        availOptions += `    -h, --help\n`;
        availOptions += `    -v, --version\n`;
        console.log(availOptions);

        let availSubcommands = `AVAILABLE SUBCOMMANDS\n\n`;
        this.subcommands.forEach(
          (subcommand: Subcommand) => {
            availSubcommands += `    ${subcommand.name}\n`;
          },
        );
        console.log(availSubcommands);
      },
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - METHODS - PROTECTED /////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Take the subcommands array and instantiate all classes inside of it.
   */
  protected instantiateSubcommands(
    subcommands: typeof Subcommand[],
  ): Subcommand[] {
    const ret: Subcommand[] = [];

    subcommands.filter((subcommand: typeof Subcommand) => {
      const s = new subcommand(this);
      s.name = s.signature.split(" ")[0];
      ret.push(s);
    });

    return ret;
  }

  /**
   * Show this CLI's help menu.
   */
  protected showHelp(): void {
    let help = `${this.name} - ${this.description}\n\n`;

    help += `USAGE\n\n`;
    help +=
      `    ${this.command} [option | [[subcommand] [args] [deno flags] [options]]]\n`;
    help += `\n`;

    help += `OPTIONS\n\n`;
    help += `    -h, --help    Show this menu.\n`;
    help += `    -v, --version Show this CLI's version.\n`;
    help += `\n`;

    help += `SUBCOMMANDS\n\n`;
    (this.subcommands as Subcommand[]).forEach((subcommand: Subcommand) => {
      help += `    ${subcommand.name}\n`;
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
