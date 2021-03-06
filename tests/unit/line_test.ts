import { Rhum } from "../deps.ts";
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

Rhum.testPlan("tests/unit/subcommand_option_test.ts", () => {
  Rhum.testSuite("constructor()", () => {
    Rhum.testCase("Sets the property correctly based on options", () => {
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
      Rhum.asserts.assertEquals(service.command, "fm");
      Rhum.asserts.assertEquals(service.name, "File Manager");
      Rhum.asserts.assertEquals(service.description, "A file manager.");
      Rhum.asserts.assertEquals(service.version, "v1.0.0");
      Rhum.asserts.assertEquals(service.subcommands.length, 2);
    });
  });
  Rhum.testSuite("getSucommand()", () => {
    Rhum.testCase(
      "Returns the subcommand class if Line does contain the subcommand string",
      () => {
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
        const subcommand = service.getSubcommand("read");
        Rhum.asserts.assertEquals(subcommand !== null, true);
        Rhum.asserts.assertEquals(typeof subcommand, "object");
      },
    );
    Rhum.testCase(
      "Returns the null if Line does not contain the subcommand string",
      () => {
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
        const subcommand = service.getSubcommand("trapperHat");
        Rhum.asserts.assertEquals(subcommand, null);
      },
    );
  });
});

Rhum.run();
