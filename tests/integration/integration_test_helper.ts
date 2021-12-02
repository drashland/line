import { asserts } from "../deps.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/**
 * Run a command.
 */
export async function run(command: string) {
  const p = Deno.run({
    cmd: command.split(" "),
    stdout: "piped",
  });

  const stdout = decoder.decode(await p.output());
  await p.status();
  p.close();

  return stdout.trim();
}

/**
 * Assert the actual stdout with the expected file. The expected file contains
 * what we expect the stdout to be.
 *
 * @param actual - The stdout from Deno.run().
 * @param expectedFile - The file containing what we expect from stdout.
 * @param writeExpectedFile - Do you want to write the expected file? Set this
 * to `true` to write all expected output files. Then set this to false to
 * ensure that all tests still pass. This is good if we need to regenerate all
 * expected files.
 * @param expectedFileLocation - If the above is set to `true`, then this
 * function will write the expected file to this location.
 */
export function assertOutput(
  actual: string,
  expectedFile: string,
  writeExpectedFile: boolean,
  expectedFileLocation: string,
) {
  if (writeExpectedFile) {
    Deno.writeFileSync(
      expectedFileLocation,
      encoder.encode(actual),
    );
  }

  if (Deno.build.os == "windows") {
    asserts.assertEquals(
      actual.trim(), // We trim because counting new lines sucks
      decoder.decode(Deno.readFileSync(
        expectedFileLocation,
      ))
        .replace(/\r/g, "") // windows is special
        .trim(), // We trim because counting new lines sucks
    );
    return;
  }

  asserts.assertEquals(
    actual.trim(), // We trim because counting new lines sucks
    decoder.decode(Deno.readFileSync(
      expectedFileLocation,
    )).trim(), // We trim because counting new lines sucks
  );
}
