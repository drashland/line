import { Rhum } from "../deps.ts";
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
  Rhum.testSuite("constructor()", () => {
    Rhum.testCase("Sets the sucommand property", () => {
      const C = new CommandLine(["hiya:)"], []);
      Rhum.asserts.assertEquals(C.subcommand, "hiya:)");
    });
    Rhum.testCase("Extracts the options", () => {
      const C = new CommandLine([
        "hiya:)",
        "--givemoney",
        "true",
        "--amount",
        "10000000",
        "--currency",
        "GBP",
      ], []);
      Rhum.asserts.assertEquals(C.options, {
        "--amount": "10000000",
        "--currency": "GBP",
        "--givemoney": "true",
      });
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
    Rhum.testCase("Sets the arguments", () => {
      // const L = new Line({
      //   name: "hiya:)",
      //   description: "Say hi :)",
      //   subcommands: [S],
      //   command: "hey_gurl",
      //   version: "v4.2.0" // lol
      // })
      const C = new CommandLine(
        ["hey:)", "marco", "polo", "ahyoufoundme"],
        [subcommand3Args],
      );
      Rhum.asserts.assertEquals(C.arguments, {
        "[a]": "marco",
        "[b]": "polo",
        "[c]": "ahyoufoundme",
      });
    });
  });
  Rhum.testSuite("getArgumentValue()", () => {
    Rhum.testCase("can get an argument", () => {
      const commandLine = new CommandLine(
        ["run", "hella"],
        [subcommand1Arg],
      );
      const actual = commandLine.getArgumentValue("arg1");
      const expected = "hella";
      Rhum.asserts.assertEquals(actual, expected);
    });
    Rhum.testCase("can get multiple arguments", () => {
      const commandLine = new CommandLine(
        ["run", "he", "ll", "a"],
        [subcommand3Args],
      );
      const a1 = commandLine.getArgumentValue("a");
      const a2 = commandLine.getArgumentValue("b");
      const a3 = commandLine.getArgumentValue("c");
      Rhum.asserts.assertEquals(a1, "he");
      Rhum.asserts.assertEquals(a2, "ll");
      Rhum.asserts.assertEquals(a3, "a");
    });
  });

  Rhum.testSuite("getDenoFlags()", () => {
    Rhum.testCase("gets Deno flags after subcommand", () => {
      const commandLine = new CommandLine(
        ["run", "--allow-all", "hella"],
        [subcommand1Arg],
      );
      const a1 = commandLine.getArgumentValue("arg1");
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
      const a1 = commandLine.getArgumentValue("arg1");
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
          "--allow-read",
          "--allow-run",
          "--allow-write",
          "--allow-net",
        ],
        [subcommand1Arg],
      );
      const a1 = commandLine.getArgumentValue("arg1");
      const e1 = "hella";
      Rhum.asserts.assertEquals(a1, e1);

      const a2 = commandLine.getDenoFlags();
      const e2 = [
        "--allow-read",
        "--allow-run",
        "--allow-write",
        "--allow-net",
      ];
      Rhum.asserts.assertEquals(a2, e2);
    });
  });

  Rhum.testSuite("getOptionValue()", () => {
    Rhum.testCase("can get an option", () => {
      const commandLine = new CommandLine(
        [
          "run",
          "hella",
          "--option1",
          "hella",
        ],
        [subcommand1Arg],
      );
      const a1 = commandLine.getOptionValue("--option1");
      const e1 = "hella";
      Rhum.asserts.assertEquals(a1, e1);
    });

    Rhum.testCase("can get multiple options", () => {
      const commandLine = new CommandLine(
        [
          "run",
          "hella",
          "--option1",
          "he",
          "--option2",
          "ll",
          "--option3",
          "a",
        ],
        [subcommand1Arg],
      );
      const a1 = commandLine.getOptionValue("--option1");
      const e1 = "he";
      Rhum.asserts.assertEquals(a1, e1);

      const a2 = commandLine.getOptionValue("--option2");
      const e2 = "ll";
      Rhum.asserts.assertEquals(a2, e2);

      const a3 = commandLine.getOptionValue("--option3");
      const e3 = "a";
      Rhum.asserts.assertEquals(a3, e3);
    });

    Rhum.testCase("can get options after the subcommand", () => {
      const commandLine = new CommandLine(
        [
          "run",
          "--option1",
          "hellaOption",
          "hellaArg",
        ],
        [subcommand1Arg],
      );
      const a1 = commandLine.getOptionValue("--option1");
      const e1 = "hellaOption";
      Rhum.asserts.assertEquals(a1, e1);

      const a2 = commandLine.getArgumentValue("arg1");
      const e2 = "hellaArg";
      Rhum.asserts.assertEquals(a2, e2);
    });
  });
});

Rhum.run();
