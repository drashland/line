import { Subcommand } from "../../../../../mod.ts";
import { OverwriteOption } from "../options/overwrite.ts";

export class WriteSubcommand extends Subcommand {
  public signature = "write [src] [dst]";
  public description = "Write the contents of one file to another.";
  public options = [
    OverwriteOption,
  ];
  public handle(): void {
    const source = this.getArgumentValue("src");
    const destination = this.getArgumentValue("dst");
    if (!source || !destination) {
      this.showHelp();
      return;
    }
    try {
      Deno.statSync(destination); // Will throw an error if file doesnt exist
      if (!this.getOptionValue("--overwrite")) {
        return console.error(
          `${destination} already exists! Try use the --overwrite flag to overwrite it.`,
        );
      }
    } catch (_err) {
      // Do nothing, carry on...
    }
    const contents = Deno.readFileSync(source);
    Deno.writeFileSync(destination, contents);
  }
}
