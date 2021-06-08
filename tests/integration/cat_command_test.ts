import { Rhum } from "../deps.ts";

const decoder = new TextDecoder();

Rhum.testPlan("tests/integration/cat_command_test.ts", () => {
  Rhum.testSuite("Usage as a Main Command", () => {
    Rhum.testCase("Displays the main help menu", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "tests/integration/cat_command_data.ts",
          "mod.ts",
          "deps.ts",
          "hella.ts",
        ],
        stdout: "piped",
      });
      const stdout = decoder.decode(await p.output());
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(
        stdout,
        `mod.ts\n[ \x1b[32m"deps.ts"\x1b[39m, \x1b[32m"hella.ts"\x1b[39m ]\n`,
      );
    });
  });
});

Rhum.run();
