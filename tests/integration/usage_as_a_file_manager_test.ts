import { Rhum } from "../deps.ts";

const decoder = new TextDecoder();

const help =
  `File Manager - A file manager.\n\nUSAGE\n\n    fm [option | [[subcommand] [args] [deno flags] [options]]]\n\nOPTIONS\n\n    -h, --help    Show this menu.\n    -v, --version Show this CLI's version.\n\nSUBCOMMANDS\n\n    read\n        Read a file.\n    write\n        Write contents to a file.\n\n`;

Rhum.testPlan("tests/integration/usage_as_a_file_manager_test.ts", () => {
  Rhum.testSuite("No arguments", () => {
    Rhum.testCase("Displays the main help menu", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "tests/integration/usage_as_a_file_manager_data.ts",
        ],
        stdout: "piped",
      });
      const stdout = decoder.decode(await p.output());
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(stdout, help);
    });
  });
  Rhum.testSuite("Options", () => {
    Rhum.testCase("Can run the version option to get the version", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "tests/integration/usage_as_a_file_manager_data.ts",
          "-v",
        ],
        stdout: "piped",
      });
      const stdout = decoder.decode(await p.output());
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(stdout, "File Manager v1.0.0\n");
      const p2 = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "tests/integration/usage_as_a_file_manager_data.ts",
          "--version",
        ],
        stdout: "piped",
      });
      const stdout2 = decoder.decode(await p2.output());
      await p2.status();
      p2.close();
      Rhum.asserts.assertEquals(stdout2, "File Manager v1.0.0\n");
    });
    Rhum.testCase("Can run the help option to get the version", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "tests/integration/usage_as_a_file_manager_data.ts",
          "-h",
        ],
        stdout: "piped",
      });
      const stdout = decoder.decode(await p.output());
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(stdout, help);
      const p2 = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "tests/integration/usage_as_a_file_manager_data.ts",
          "--help",
        ],
        stdout: "piped",
      });
      const stdout2 = decoder.decode(await p2.output());
      await p2.status();
      p2.close();
      Rhum.asserts.assertEquals(stdout2, help);
    });
  });
  Rhum.testSuite("Using the read subcommand", () => {
    Rhum.testCase(
      "Can read a file with the read flag and when the file exists",
      async () => {
        const p = Deno.run({
          cmd: [
            "deno",
            "run",
            "--allow-read",
            "tests/integration/usage_as_a_file_manager_data.ts",
            "read",
            "mod.ts",
          ],
          stdout: "piped",
        });
        const stdout = decoder.decode(await p.output());
        await p.status();
        p.close();
        Rhum.asserts.assertEquals(
          stdout.includes(
            `export { CommandLine } from "./src/command_line.ts";`,
          ),
          true,
        );
      },
    );
    Rhum.testCase(
      "Cannot read a file with the read flag and when the file doesnt exist",
      async () => {
        const p = Deno.run({
          cmd: [
            "deno",
            "run",
            "--allow-read",
            "tests/integration/usage_as_a_file_manager_data.ts",
            "read",
          ],
          stdout: "piped",
        });
        await p.status();
        const stdout = decoder.decode(await p.output());
        p.close();
        Rhum.asserts.assertEquals(stdout, "File not specified\n");
      },
    );
  });
  Rhum.testSuite("Using the write subcommand", () => {
    Rhum.testCase("Can write to a file with the write flag", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "--allow-write",
          "tests/integration/usage_as_a_file_manager_data.ts",
          "write",
          "tmp.ts",
          "hello",
        ],
        stdout: "piped",
      });
      const stdout = decoder.decode(await p.output());
      await p.status();
      p.close();
      const writtenFileContent = decoder.decode(Deno.readFileSync("./tmp.ts"));
      Deno.removeSync("./tmp.ts");
      Rhum.asserts.assertEquals(stdout, "Successfully wrote file.\n");
      Rhum.asserts.assertEquals(writtenFileContent, "hello");
    });
    Rhum.testCase(
      "Cannot read a file with the read flag and when the file doesnt exist",
      async () => {
        const p = Deno.run({
          cmd: [
            "deno",
            "run",
            "--allow-read",
            "tests/integration/usage_as_a_file_manager_data.ts",
            "write",
          ],
          stdout: "piped",
        });
        await p.status();
        const stdout = decoder.decode(await p.output());
        p.close();
        Rhum.asserts.assertEquals(stdout, "File not specified\n");
      },
    );
  });
});

Rhum.run();
