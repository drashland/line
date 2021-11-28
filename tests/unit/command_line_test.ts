import { Rhum } from "../deps.ts";
import * as Line from "../../mod.ts";

Rhum.testPlan("command_line_test.ts", () => {
  Rhum.testSuite("constructor()", () => {
    Rhum.testCase("formats the command line", () => {
      const cli = new Line.Cli({
        name: "Main command with arguments",
        description: "A main command with arguments",
        version: "v1.0.0",
        command: Command1,
      });

      const c = new Line.CommandLine(
        cli,
        ["--print=true"],
      );
      Rhum.asserts.assertEquals(c.deno_args, ["--print", "true"]);
    });
  });

  Rhum.testSuite("extractOptionsFromArguments()", () => {
    Rhum.testCase("extracts all options", () => {
      const cli = getCli(Command1);
      const c = new Line.CommandLine(
        cli,
        ["--print=true", "--some-option", "some-option-value", "-t"],
      );

      c.extractOptionsFromArguments(new Command1(cli));

      Rhum.asserts.assertEquals(
        c.options,
        {
          "--print": true,
          "--some-option": "some-option-value",
          "-t": true,
        },
      );
    });
  });

  Rhum.testSuite("getArgumentValue()", () => {
    Rhum.testCase("gets the argument if it exists", () => {
      const cli = getCli(Command1);
      const c = new Line.CommandLine(
        cli,
        ["some-source"],
      );

      const command = new Command1(cli);
      command.setUp();
      c.matchArgumentsToNames(command);

      Rhum.asserts.assertEquals(
        c.getArgumentValue(command, "source"),
        "some-source",
      );
    });
  });

  Rhum.testSuite("getOptionValue()", () => {
    // 'exists' means that the option was passed in without any value. While it
    // does not have a value, it 'exists' in the command line. Therefore, the
    // option's value is true -- meaning it exists.
    Rhum.testCase("returns true if the option 'exists'", () => {
      const cli = getCli(Command1);
      const c = new Line.CommandLine(
        cli,
        ["-p"],
      );

      const command = new Command1(cli);
      command.setUp();

      c.extractOptionsFromArguments(command);

      Rhum.asserts.assertEquals(
        c.getOptionValue(command, "p"),
        true,
      );
    });

    Rhum.testCase("returns the value associated with the option", () => {
      const cli = getCli(Command1);
      const c = new Line.CommandLine(
        cli,
        ["-p=test", "--long", "w00t"],
      );

      const command = new Command1(cli);
      command.setUp();

      c.extractOptionsFromArguments(command);

      Rhum.asserts.assertEquals(
        c.getOptionValue(command, "p"),
        "test",
      );

      Rhum.asserts.assertEquals(
        c.getOptionValue(command, "long"),
        "w00t",
      );
    });

    Rhum.testCase("returns undefined for unrecognized options", () => {
      const cli = getCli(Command1);
      const c = new Line.CommandLine(
        cli,
        ["-d=test", "--nope", "w00t"],
      );

      const command = new Command1(cli);
      command.setUp();

      c.extractOptionsFromArguments(command);

      Rhum.asserts.assertEquals(
        c.getOptionValue(command, "d"),
        undefined,
      );

      Rhum.asserts.assertEquals(
        c.getOptionValue(command, "nope"),
        undefined,
      );
    });
  });

  Rhum.testSuite("matchArgumentsToNames()", () => {
    Rhum.testCase("matches arguments to command signature", () => {
      const cli = getCli(Command1);
      const c = new Line.CommandLine(
        cli,
        ["some-source", "some-destination"],
      );

      c.matchArgumentsToNames(new Command1(cli));

      Rhum.asserts.assertEquals(
        c.arguments,
        {
          "source": "some-source",
          "destination": "some-destination",
        },
      );
    });
  });
});

Rhum.run();

////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - HELPERS ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function getCli(command: typeof Line.Command) {
  return new Line.Cli({
    name: "CLI Name",
    description: "CLI Description",
    version: "v1.0.0",
    command: command,
  });
}

class Command1 extends Line.Command {
  public signature = "cp [source] [destination]";

  public arguments = {
    source: "The source file to copy.",
    destination: "The destination of the copied file.",
  };

  public options = {
    "-p, --print": "Print the results to the screen.",
    "-l, --long": "Some option IDK.",
  };

  public handle(): void {
    console.log(this.arg("source"), this.arg("destination"));
  }
}
