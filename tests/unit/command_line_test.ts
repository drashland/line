import { Rhum } from "../../deps.ts";
import { CommandLine, Line, Subcommand } from "../../mod.ts";

class Subcommand1Arg extends Subcommand {
  public signature = "run [arg1]";
  public description = "Run something.";
}

class Subcommand3Args extends Subcommand {
  public signature = "run [a] [b] [c]";
  public description = "Run something.";
}

const l = new Line({
  command: "lt",
  name: "Tester",
  description: "Tester description",
  subcommands: [],
  version: "v1.0.0",
});

const subcommand1Arg = new Subcommand1Arg(l);
const subcommand3Args = new Subcommand3Args(l);

Rhum.testPlan("command_line_test.ts", () => {
  Rhum.testSuite("getArgument()", () => {
    Rhum.testCase("can get an argument", () => {
      const commandLine = new CommandLine(
        ["run", "hella"],
        [subcommand1Arg],
      );
      const actual = commandLine.getArgument("[arg1]");
      const expected = "hella";
      Rhum.asserts.assertEquals(actual, expected);
    });
    Rhum.testCase("can get multiple arguments", () => {
      const commandLine = new CommandLine(
        ["run", "he", "ll", "a"],
        [subcommand3Args],
      );
      const a1 = commandLine.getArgument("[a]");
      const a2 = commandLine.getArgument("[b]");
      const a3 = commandLine.getArgument("[c]");
      Rhum.asserts.assertEquals(a1, "he");
      Rhum.asserts.assertEquals(a2, "ll");
      Rhum.asserts.assertEquals(a3, "a");
    });
    Rhum.testCase("ignores arguments not in subcommand signature", () => {
      const commandLine = new CommandLine(
        ["run", "he", "ll", "a", "ignored"],
        [subcommand3Args],
      );
      const actual = commandLine.arguments;
      const expected = {
        "[a]": "he",
        "[b]": "ll",
        "[c]": "a",
      };
      Rhum.asserts.assertEquals(actual, expected);
    });
  });

  Rhum.testSuite("getDenoFlags()", () => {
    Rhum.testCase("gets Deno flags after subcommand", () => {
      const commandLine = new CommandLine(
        ["run", "--allow-all", "hella"],
        [subcommand1Arg],
      );
      const a1 = commandLine.getArgument("[arg1]");
      const e1 = "hella";
      Rhum.asserts.assertEquals(a1, e1);

      const a2 = commandLine.getDenoFlags();
      const e2 = ["--allow-all"];
      Rhum.asserts.assertEquals(a2, e2);
    });

    Rhum.testCase("gets Deno flags after subcommand argument", () => {
      const commandLine = new CommandLine(
        ["run", "hella", "--allow-all"],
        [subcommand1Arg],
      );
      const a1 = commandLine.getArgument("[arg1]");
      const e1 = "hella";
      Rhum.asserts.assertEquals(a1, e1);

      const a2 = commandLine.getDenoFlags();
      const e2 = ["--allow-all"];
      Rhum.asserts.assertEquals(a2, e2);
    });

    Rhum.testCase("gets only recognized Deno flags", () => {
      const commandLine = new CommandLine(
        [
          "run",
          "hella",
          "--allow-read", "--allow-run", "--allow-write", "--allow-net"
        ],
        [subcommand1Arg],
      );
      const a1 = commandLine.getArgument("[arg1]");
      const e1 = "hella";
      Rhum.asserts.assertEquals(a1, e1);

      const a2 = commandLine.getDenoFlags();
      const e2 = ["--allow-read", "--allow-run", "--allow-write", "--allow-net"];
      Rhum.asserts.assertEquals(a2, e2);
    });
  });
});

Rhum.run();
