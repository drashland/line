import * as Line from "../../../mod.ts";

class MainCommand extends Line.MainCommand {
  public signature = "main";
  public description = "The main command.";

  public options = {
    "-L [log_value], --log-value [log_value]": "Log value",
    "--some-option [arg_1] [arg_2]": "some description",
    "--some-option-1 [arg_1] [arg_2] [arg_3]": "some description 1",
  };

  public handle(): void {
    const logValue = this.option("-L");
    const someOption = this.option("--some-option");
    const someOption1 = this.option("--some-option-1");

    if (logValue) {
        console.log(`logValue: ${logValue}`);
    }

    if (someOption) {
        console.log(`someOption: ${someOption}`);
    }

    if (someOption1) {
        console.log(`someOption1: ${someOption1}`);
    }
  }
}

const cli = new Line.CLI({
  name: "A main command with multiple arguments for options.",
  description: "Options with multiple arguments",
  version: "v1.0.0",
  command: MainCommand,
});

cli.run();
