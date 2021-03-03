import { Rhum } from "../../deps.ts";
import { CommandLine, Line, Subcommand, SubcommandOption } from "../../mod.ts";

class Subcommand1 extends Subcommand {
  public signature = "read [arg1]";
  public description = "Read something.";
}

class Subcommand2 extends Subcommand {
  public signature = "write [a] [b] [c]";
  public description = "Write something.";
  public options: typeof SubcommandOption[] = [
    Option1,
    Option2,
  ];
  public handle(): void {
    if (this.getOptionValue("--filter")) {
      throw new Error("filter");
    }
    if (this.getOptionValue("--verbose")) {
      throw new Error("verbose");
    }

    const a = this.getArgumentValue("a");
    const b = this.getArgumentValue("b");
    const c = this.getArgumentValue("c");
    throw new Error(`${a} ${b} ${c}`);
  }
}

class Option1 extends SubcommandOption {
  public name = "--filter";
  public description = "Filter something.";
}

class Option2 extends SubcommandOption {
  public name = "--verbose";
  public description = "Verbose something.";
}

const l = new Line({
  command: "lt",
  name: "Tester",
  description: "Tester description",
  subcommands: [
    Subcommand1,
    Subcommand2,
  ],
  version: "v1.0.0",
});

l.subcommands.forEach((subcommand: Subcommand) => {
  subcommand.instantiateOptions();
});

Rhum.testPlan("subcommand_test.ts", () => {
  Rhum.testSuite("getArgumentValue()", () => {
    Rhum.testCase("can get arguments", () => {
      l.command_line = new CommandLine(
        ["run", "hella", "1", "2"],
        l.subcommands,
      );

      let subcommand = l.getSubcommand("read");
      if (subcommand) {
        const actual = subcommand.getArgumentValue("arg1");
        const expected = "hella";
        Rhum.asserts.assertEquals(actual, expected);
      }

      subcommand = l.getSubcommand("write");
      if (subcommand) {
        let actual = subcommand.getArgumentValue("a");
        let expected = "hella";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getArgumentValue("b");
        expected = "1";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getArgumentValue("c");
        expected = "2";
        Rhum.asserts.assertEquals(actual, expected);
      }
    });
  });

  Rhum.testSuite("getDenoFlags()", () => {
    Rhum.testCase("can get options", () => {
      l.command_line = new CommandLine(
        [
          "run",
          "hella",
          "1",
          "2",
          "--allow-read",
          "--allow-run",
          "--allow-write",
          "--allow-net",
        ],
        l.subcommands,
      );

      const subcommand = l.getSubcommand("write");
      if (subcommand) {
        let actual = subcommand.getArgumentValue("a");
        let expected = "hella";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getArgumentValue("b");
        expected = "1";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getArgumentValue("c");
        expected = "2";
        Rhum.asserts.assertEquals(actual, expected);

        const dfA = subcommand.getDenoFlags();
        const dfE = [
          "--allow-read",
          "--allow-run",
          "--allow-write",
          "--allow-net",
        ];
        Rhum.asserts.assertEquals(dfA, dfE);
      }
    });
  });

  Rhum.testSuite("getOptionValue()", () => {
    Rhum.testCase("can get options", () => {
      l.command_line = new CommandLine(
        [
          "run",
          "hella",
          "1",
          "2",
          "--filter",
          "filterVal",
          "--verbose",
          "verboseVal",
        ],
        l.subcommands,
      );

      const subcommand = l.getSubcommand("write");
      if (subcommand) {
        let actual = subcommand.getArgumentValue("a");
        let expected = "hella";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getArgumentValue("b");
        expected = "1";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getArgumentValue("c");
        expected = "2";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getOptionValue("--filter");
        expected = "filterVal";
        Rhum.asserts.assertEquals(actual, expected);

        actual = subcommand.getOptionValue("--verbose");
        expected = "verboseVal";
        Rhum.asserts.assertEquals(actual, expected);
      }
    });
  });

  Rhum.testSuite("handle()", () => {
    Rhum.testCase("handles properly", () => {
      let subcommand: Subcommand | null;

      l.command_line = new CommandLine(
        ["write", "hella", "1", "2", "--filter", "filterVal"],
        l.subcommands,
      );
      subcommand = l.getSubcommand("write");
      if (subcommand) {
        try {
          subcommand.handle();
        } catch (error) {
          const actual = error.message;
          const expected = "filter";
          Rhum.asserts.assertEquals(actual, expected);
        }
      }

      l.command_line = new CommandLine(
        ["write", "hella", "1", "2", "--verbose", "verboseVal"],
        l.subcommands,
      );
      subcommand = l.getSubcommand("write");
      if (subcommand) {
        try {
          subcommand.handle();
        } catch (error) {
          const actual = error.message;
          const expected = "verbose";
          Rhum.asserts.assertEquals(actual, expected);
        }
      }

      l.command_line = new CommandLine(
        ["write", "hella", "1", "2"],
        l.subcommands,
      );
      subcommand = l.getSubcommand("write");
      if (subcommand) {
        try {
          subcommand.handle();
        } catch (error) {
          const actual = error.message;
          const expected = "hella 1 2";
          Rhum.asserts.assertEquals(actual, expected);
        }
      }
    });
  });

  Rhum.testSuite("showHelp()", () => {
    Rhum.testCase("help is created properly", () => {
      let subcommand: Subcommand | null;

      subcommand = l.getSubcommand("write");
      if (subcommand) {
        const actual = subcommand.showHelp(true);
        const expected = `USAGE

    lt write [a] [b] [c] [deno flags] [options]

OPTIONS

    --filter
        Filter something.
    --verbose
        Verbose something.
`;
        Rhum.asserts.assertEquals(actual, expected);
      }

      subcommand = l.getSubcommand("read");
      if (subcommand) {
        const actual = subcommand.showHelp(true);
        const expected = `USAGE

    lt read [arg1] [deno flags] [options]

`;
        Rhum.asserts.assertEquals(actual, expected);
      }
    });
  });
});

Rhum.run();
