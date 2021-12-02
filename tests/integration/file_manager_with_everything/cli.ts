import * as Line from "../../../mod.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

class Main extends Line.MainCommand {
  public subcommands = [
    Read,
  ];

  public signature = "fm [arg]";

  public options = {
    "-G               ": "Greet", // Assert that we trim
    "-L [value],          --log [value]": "Log a value." // Assert that we trim
  };

  public handle(): void {
    const arg = this.argument("arg")!;
    const greet = this.option("-G");
    const logValue = this.option("--log");

    console.log(`Passed in arg: ${arg}`);

    if (greet) {
      console.log("Greeted from the main command.");
    }

    if (logValue) {
      console.log(`Log value: ${logValue}`);
    }
  }
}

class Read extends Line.Subcommand {
  public signature = "read [file]";
  public description = "Read a file.";
  public options = {
    "-D, --dry-run": "Check if the file exists before reading.",
    "-L [value]": "Add an extra log value.",
  };

  public async handle(): Promise<void> {
    const file = this.argument("file")!;
    const dryRun = this.option("-D");
    const logValue = this.option("-L");

    if (logValue) {
      console.log(logValue);
    }

    if (dryRun) {
      try {
        await Deno.lstat(file);
        console.log("File exists.");
      } catch (error) {
        console.log("File doesn't exist.");
      }
      return;
    }

    try {
      console.log(decoder.decode(Deno.readFileSync(file)));
    } catch (error) {
      console.log("Error reading file.", error.message);
    }
  }
}

const service = new Line.Cli({
  name: "File Manager (with hella options)",
  description: "Woop woop IDK who would actually make a CLI like this",
  version: "v1.0.0",
  command: Main,
});

service.run();
