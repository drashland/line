import { asserts } from "../../deps.ts";
import {
  assertOutput as assertOutputHelper,
  run as runHelper,
} from "../integration_test_helper.ts";

export async function run(command?: string) {
  if (command) {
    command = command.replace(
      /\{path\}/g,
      "tests/integration/duplicate_subcommands/expected_outputs/",
    );
  }

  command = command ? " " + command : "";

  const fullCommand =
    `deno run --allow-read --allow-write tests/integration/duplicate_subcommands/cli.ts${command}`;

  const stdout = await runHelper(fullCommand);

  return stdout.trim();
}

export function assertOutput(actual: string, expectedFile: string) {
  assertOutputHelper(
    actual,
    expectedFile,
    false,
    "tests/integration/duplicate_subcommands/expected_outputs/" + expectedFile,
  );
}

// Main command

Deno.test("should show help menu: (no arguments provided)", async () => {
  const stdout = await run();
  assertOutput(stdout, "help.txt");
});

Deno.test("should show help menu: --help", async () => {
  const stdout = await run("--help");
  assertOutput(stdout, "help.txt");
});

Deno.test("should show help menu: -h", async () => {
  const stdout = await run("-h");
  assertOutput(stdout, "help.txt");
});

Deno.test("should show version: --version", async () => {
  const stdout = await run("--version");
  assertOutput(stdout, "version.txt");
});

Deno.test("should show version: -v", async () => {
  const stdout = await run("-v");
  assertOutput(stdout, "version.txt");
});

// If a handle method is on the main command, then let it handle all unknown
// items in Deno.args
Deno.test("should let main command handle arguments: main", async () => {
  const stdout = await run("main");
  assertOutput(stdout, "main_throws_unknown_argument_error.txt");
});

// Duplicate subcommand in `Deno.args` should be counted as an arg

Deno.test("should execute the subcommand: sub", async () => {
  const stdout = await run("sub");
  assertOutput(stdout, "sub_runs_handle_method.txt");
});

Deno.test("should throw an argument error: sub sub", async () => {
  const stdout = await run("sub sub");
  assertOutput(stdout, "sub_throws_argment_error.txt");
});
