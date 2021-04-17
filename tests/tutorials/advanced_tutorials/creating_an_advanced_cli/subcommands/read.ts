import { Subcommand } from "../../../../../mod.ts";

const decoder = new TextDecoder();

export class ReadSubcommand extends Subcommand {
  public signature = "read [file]";
  public description = "Display the contents of a file.";
  public handle(): void {
    const file = this.getArgumentValue("file");
    if (!file) {
      this.showHelp();
      return;
    }
    const contents = Deno.readFileSync(file);
    console.log(decoder.decode(contents));
  }
}
