import { Line, Subcommand } from "../../mod.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

class Read extends Subcommand {
  public signature = "read [file]";
  public description = "Read a file.";

  public handle(): void { // can also be async
    const file = this.getArgumentValue("file");
    if (!file) {
      return console.log("File not specified");
    }
    const contents = Deno.readFileSync(file);
    console.log(decoder.decode(contents));
  }
}

class Write extends Subcommand {
  public signature = "write [file] [contents]";
  public description = "Write contents to a file.";

  public handle(): void { // can also be async
    const file = this.getArgumentValue("file");
    if (!file) {
      return console.log("File not specified");
    }
    const contents = this.getArgumentValue("contents");
    if (!contents) {
      return console.log("Contents not specified");
    }
    try {
      Deno.writeFileSync(file, encoder.encode(contents));
      console.log("Successfully wrote file.");
    } catch (error) {
      console.log(error);
    }
  }
}

const service = new Line({
  command: "fm",
  name: "File Manager",
  description: "A file manager.",
  version: "v1.0.0",
  subcommands: [
    Read,
    Write,
  ],
});

service.run();
