import { asserts } from "../../deps.ts";
import {
  assertOutput as assertOutputHelper,
  run as runHelper,
} from "../integration_test_helper.ts";

export async function run(command?: string) {
  if (command) {
    command = command.replace(
      /\{path\}/g,
      "tests/integration/file_manager_with_too_many_options/expected_outputs/",
    );
  }

  command = command ? " " + command : "";

  const fullCommand =
    `deno run --allow-read --allow-write tests/integration/file_manager_with_too_many_options/cli.ts${command}`;

  const stdout = await runHelper(fullCommand);

  return stdout.trim();
}

export function assertOutput(actual: string, expectedFile: string) {
  assertOutputHelper(
    actual,
    expectedFile,
    false,
    "tests/integration/file_manager_with_too_many_options/expected_outputs/" +
      expectedFile,
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

Deno.test("should show greeting: -G", async () => {
  const stdout = await run("-G");
  asserts.assertEquals(stdout.trim(), "Greeted from the main command.");
});

Deno.test("should show log value: -G", async () => {
  const stdout = await run("-L Sup");
  asserts.assertEquals(stdout.trim(), "Log value: Sup");
});

Deno.test("should show greeting and a log value: -G", async () => {
  const stdout = await run("-G -L Sup");
  asserts.assertEquals(
    stdout.trim(),
    "Greeted from the main command.\nLog value: Sup",
  );
});

// Test that the main command's `handle()` method is not called beacuse it
// doesn't take in an arg.

Deno.test("show unknown argument error: test", async () => {
  const stdout = await run("test");
  assertOutput(stdout, "unknown_argument_test.txt");
});

// Read command

Deno.test("should show read missing argument error: read", async () => {
  const stdout = await run("read");
  assertOutput(stdout, "read_missing_argument.txt");
});

Deno.test("should show read help menu: read -h", async () => {
  const stdout = await run("read -h");
  assertOutput(stdout, "read_help.txt");
});

Deno.test("should show read help menu: read --help", async () => {
  const stdout = await run("read --help");
  assertOutput(stdout, "read_help.txt");
});

Deno.test("should show file does not exist: read -D some_file", async () => {
  const stdout = await run("read -D {path}some_file");
  asserts.assertEquals(stdout.trim(), "File doesn't exist.");
});

Deno.test("should show file exists: read -D file_to_read.txt", async () => {
  const stdout = await run(
    "read -D tests/integration/file_manager_with_too_many_options/file_to_read.txt",
  );
  asserts.assertEquals(stdout.trim(), "File exists.");
});

Deno.test("should show contents: read file_to_read.txt", async () => {
  const stdout = await run(
    "read tests/integration/file_manager_with_too_many_options/file_to_read.txt",
  );
  asserts.assertEquals(stdout, "YOU SHALL NOT PASS");
});

Deno.test("should show contents with extra log value: read -L file_to_read.txt", async () => {
  const stdout = await run(
    "read -L SomeValue tests/integration/file_manager_with_too_many_options/file_to_read.txt",
  );
  asserts.assertEquals(stdout, "SomeValue\nYOU SHALL NOT PASS");
});

Deno.test("should do a dry run and add an extra log value: read -L --dry-run file_to_read.txt", async () => {
  const stdout = await run(
    "read -L SomeValue --dry-run tests/integration/file_manager_with_too_many_options/file_to_read.txt",
  );
  asserts.assertEquals(stdout, "SomeValue\nFile exists.");
});

Deno.test("should show file does not exist: read -D read", async () => {
  const stdout = await run("read -D read");
  asserts.assertEquals(stdout.trim(), "File doesn't exist.");
});

Deno.test("should show file does not exist: read -D test", async () => {
  const stdout = await run("read -D {path}test");
  asserts.assertEquals(stdout.trim(), "File doesn't exist.");
});

Deno.test("should show unknown argument error: read -D -D test", async () => {
  const stdout = await run("read -D -D test");
  assertOutput(stdout, "read_d_provided_more_than_once.txt");
});

Deno.test("should show unknown argument error: read arg1 arg2", async () => {
  const stdout = await run("read arg1 arg2");
  assertOutput(stdout, "read_unknown_argument_arg2.txt");
});
