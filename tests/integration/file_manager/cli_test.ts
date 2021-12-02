import { asserts } from "../../deps.ts";
import {
  run as runHelper,
  assertOutput as assertOutputHelper
} from "../integration_test_helper.ts";

export async function run(command?: string) {
  if (command) {
    command = command.replace(/\{path\}/g, "tests/integration/file_manager/expected_outputs/");
  }

  command = command
    ? " " + command
    : "";

  const fullCommand = `deno run --allow-read --allow-write tests/integration/file_manager/cli.ts${command}`;

  const stdout = await runHelper(fullCommand);

  return stdout.trim();
}

export function assertOutput(actual: string, expectedFile: string) {
  assertOutputHelper(
    actual,
    expectedFile,
    true,
    "tests/integration/file_manager/expected_outputs/" + expectedFile,
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
  const stdout = await run("-h");
  assertOutput(stdout, "version.txt");
});

// Test falling back to main command. The `test` subcommand does not exist, so
// we expect the main command to handle it.

Deno.test("should fall back to main command: test", async () => {
  const stdout = await run("test");
  assertOutput(stdout, "Main Command handle() called");
});

// Read command

Deno.test("should show read help menu: read", async () => {
  const stdout = await run("read");
  assertOutput(stdout, "read_help.txt");
});

Deno.test("should show read help menu: read -h", async () => {
  const stdout = await run("read -h");
  assertOutput(stdout, "read_help.txt");
});

Deno.test("should show read help menu: read --help", async () => {
  const stdout = await run("read --help");
  assertOutput(stdout, "read_help.txt");
});

Deno.test("should show error: read some_file", async () => {
  const stdout = await run("read {path}some_file");
  asserts.assert(stdout.trim().includes("Error reading file."));
});

Deno.test("should show contents: read file_to_read.txt", async () => {
  const stdout = await run("read tests/integration/file_manager/file_to_read.txt");
  asserts.assertEquals(stdout, "YOU SHALL NOT PASS");
});

Deno.test("should show unknown argument error: read -D test", async () => {
  const stdout = await run("read -D {path}test");
  assertOutput(stdout, "read_with_unknown_argument_1.txt");
});

Deno.test("should show unknown argument error: read -D -D test", async () => {
  const stdout = await run("read -D -D test");
  assertOutput(stdout, "read_with_unknown_argument_2.txt");
});

Deno.test("should show unknown argument error: read arg1 arg2", async () => {
  const stdout = await run("read arg1 arg2");
  assertOutput(stdout, "read_with_unknown_argument_3.txt");
});

// Write command

Deno.test("should show write help menu: write", async () => {
  const stdout = await run("write");
  assertOutput(stdout, "write_help.txt");
});

Deno.test("should show write help menu: write -h", async () => {
  const stdout = await run("write -h");
  assertOutput(stdout, "write_help.txt");
});

Deno.test("should show write help menu: write --help", async () => {
  const stdout = await run("write --help");
  assertOutput(stdout, "write_help.txt");
});

Deno.test("should show missing arugment error: write some_file", async () => {
  const stdout = await run("write some_file");
  assertOutput(stdout, "write_missing_argument.txt");
});

Deno.test("should show unknown argument error: write -D some_file.txt contents", async () => {
  const stdout = await run("write -D {path}some_file.txt");
  assertOutput(stdout, "write_with_unknown_argument_1.txt");
});

Deno.test("should show unknown argument error: write -D -D some_file.txt contents", async () => {
  const stdout = await run("write -D -D some_file.txt contents");
  assertOutput(stdout, "write_with_unknown_argument_2.txt");
});

Deno.test("should show unknown argument error: write arg1 arg2 arg3", async () => {
  const stdout = await run("write arg1 arg2 arg3");
  assertOutput(stdout, "write_with_unknown_argument_3.txt");
});

Deno.test("should write file: write file_to_write.txt something", async () => {
  // Write the file
  let stdout = await run("write {path}file_to_write.txt something");
  asserts.assertEquals(stdout, "File written.");

  // Read the file to ensure that the file was written
  stdout = await run("read {path}file_to_write.txt");
  asserts.assertEquals(stdout, "something");

  // Delete the file to clean up the expected_outputs directory
  stdout = await run("delete {path}file_to_write.txt");
  asserts.assertEquals(stdout, "File deleted.");
});

// Delete command

Deno.test("should show delete help menu: delete", async () => {
  const stdout = await run("delete");
  assertOutput(stdout, "delete_help.txt");
});

Deno.test("should show delete help menu: delete -h", async () => {
  const stdout = await run("delete -h");
  assertOutput(stdout, "delete_help.txt");
});

Deno.test("should show delete help menu: delete --help", async () => {
  const stdout = await run("delete --help");
  assertOutput(stdout, "delete_help.txt");
});

Deno.test("should show error: delete some_file", async () => {
  const stdout = await run("delete some_file");
  asserts.assert(stdout.trim().includes("Error deleting file."));
});

Deno.test("should show unknown argument error: delete -D some_file.txt", async () => {
  const stdout = await run("delete -D {path}some_file.txt");
  assertOutput(stdout, "delete_with_unknown_argument_1.txt");
});

Deno.test("should show unknown argument error: delete -D -D some_file.txt", async () => {
  const stdout = await run("delete -D -D some_file.txt");
  assertOutput(stdout, "delete_with_unknown_argument_2.txt");
});

Deno.test("should show unknown argument error: delete arg1 arg2 arg3", async () => {
  const stdout = await run("delete arg1 arg2 arg3");
  assertOutput(stdout, "delete_with_unknown_argument_3.txt");
});

Deno.test("should delete a file: delete file_to_delete.txt", async () => {
  // Write a file
  let stdout = await run("write {path}file_to_delete.txt something");
  asserts.assertEquals(stdout, "File written.");

  // Read that the file exists
  stdout = await run("read {path}file_to_delete.txt");
  asserts.assertEquals(stdout, "something");

  // Assert deletion
  stdout = await run("delete {path}file_to_delete.txt");
  asserts.assertEquals(stdout, "File deleted.");
});
