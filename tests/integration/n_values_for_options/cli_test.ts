import { asserts } from "../../deps.ts";
import {
  assertOutput as assertOutputHelper,
  run as runHelper,
} from "../integration_test_helper.ts";

export async function run(command?: string) {
  if (command) {
    command = command.replace(
      /\{path\}/g,
      "tests/integration/n_values_for_options/expected_outputs/",
    );
  }

  command = command ? " " + command : "";

  const fullCommand =
    `deno run --allow-read --allow-write tests/integration/n_values_for_options/cli.ts${command}`;

  const stdout = await runHelper(fullCommand);

  return stdout.trim();
}

export function assertOutput(actual: string, expectedFile: string) {
  assertOutputHelper(
    actual,
    expectedFile,
    false,
    "tests/integration/n_values_for_options/expected_outputs/" + expectedFile,
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
Deno.test("should print the log value", async () => {
  const stdout = await run("-L someValue");
  asserts.assertEquals(stdout, "logValue: someValue");
});

// Duplicate subcommand in `Deno.args` should be counted as an arg

Deno.test("should print out multiple arguments for option --some-option", async () => {
  const stdout = await run("--some-option hello world");
  asserts.assertEquals(stdout, "someOption: hello,world");
});

Deno.test("should handle multiple options with multiple arguments correctly", async () => {
  const stdout = await run(
    "--some-option hello world --some-option-1 foo bar baz",
  );
  asserts.assertEquals(
    stdout,
    "someOption: hello,world\nsomeOption1: foo,bar,baz",
  );
});
