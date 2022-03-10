import * as Line from "../../../mod.ts";

class MainCommand extends Line.MainCommand {
  public signature = "main";
  public description = "The main command.";

  public subcommands = [
    Subcommand,
  ];

  public handle(): void {
    console.log("Main command.");
  }
}

class Subcommand extends Line.Subcommand {
  public signature = "sub";
  public description = "A subcommand.";

  public handle() {
    console.log("The subcommand.");
  }
}

const cli = new Line.CLI({
  name: "A main command with a subcommand.",
  description: "Subcommands cannot be written twice.",
  version: "v1.0.0",
  command: MainCommand,
});

cli.run();
