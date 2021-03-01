import { Commander, ILogger, SubcommandOption } from "../mod.ts";

export class Subcommand {
  public cli: Commander;
  public name: string = "";
  public description: string = "";
  public signature: string = "";
  public options: (typeof SubcommandOption[] | SubcommandOption[]) = [];

  constructor(cli: Commander) {
    this.cli = cli;
  }

  public getArgument(argumentName: string): string | null {
    return this.cli.command_line.getArgument(argumentName);
  }

  public getOption(optionName: string): string | null {
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

    return this.cli.command_line.getOption(optionName);
  }

  public exit(
    code: number,
    messageType: keyof ILogger,
    message: string,
    cb?: () => void,
  ): void {
    this.cli.exit(code, messageType, message, cb);
  }

  public getDenoFlags(): string[] {
    return this.cli.command_line.getDenoFlags();
  }

  public handle(): void {
    return;
  }

  /**
   * Take the array of Option classes and instantiate all of them.
   */
  public instantiateOptions(): void {
    let options: SubcommandOption[] = [];

    (this.options as unknown as (typeof SubcommandOption)[])
      .filter((option: typeof SubcommandOption) => {
        const o = new option(this);
        o.name = o.signature.split(" ")[0];
        options.push(o);
      });

    this.options = options;
  }

  /**
   * Show this subcommand's help menu.
   */
  public showHelp(): void {
    let help = `USAGE\n\n`;

    help +=
      `    ${this.cli.command} ${this.signature} [deno flags] [options]\n`;
    help += "\n";

    help += "OPTIONS\n\n";
    (this.options as SubcommandOption[]).forEach((option: SubcommandOption) => {
      help += `    ${option.name}\n`;
      help += `        ${option.description}\n`;
    });

    console.log(help);
  }
}
