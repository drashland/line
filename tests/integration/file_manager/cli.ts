import * as Line from "../../../mod.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

class Main extends Line.MainCommand {
  public subcommands = [
    Read,
    Write,
    Delete,
    // Copy
  ];

  public signature = "fm";

  public handle(): void {
    console.log("Main Command handle() called");
  }
}

class Read extends Line.Subcommand {
  public signature = "read [file]";
  public description = "Read a file.";

  public handle(): void {
    const file = this.argument("file")!;

    try {
      console.log(decoder.decode(Deno.readFileSync(file)));
    } catch (error) {
      console.log("Error reading file.", error.message);
    }
  }
}

class Write extends Line.Subcommand {
  public signature = "write [file] [contents]";
  public description = "Write contents to a file.";

  public handle(): void {
    const file = this.argument("file")!;
    const contents = this.argument("contents")!;

    try {
      Deno.writeFileSync(file, encoder.encode(contents));
      console.log("File written.");
    } catch (error) {
      console.log("Error writing file.", error.message);
    }
  }
}

class Delete extends Line.Subcommand {
  public signature = "delete [file]";
  public description = "Delete a file.";

  public handle(): void {
    const file = this.argument("file")!;

    try {
      Deno.removeSync(file);
      console.log("File deleted.");
    } catch (error) {
      console.log("Error deleting file.", error.message);
    }
  }
}

const service = new Line.Cli({
  name: "File Manager",
  description: "A file manager.",
  version: "v1.0.0",
  command: Main,
});

service.run();
