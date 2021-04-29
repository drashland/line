import { Rhum } from "../../../deps.ts";

const workingDir =
  "./tests/tutorials/advanced_tutorials/creating_an_advanced_cli";
const decoder = new TextDecoder();
const helpOutput =
  `File Manager - A file manager to handle reading and writing of files.

USAGE

    fm [option | [[subcommand] [args] [deno flags] [options]]]

OPTIONS

    -h, --help    Show this menu.
    -v, --version Show this CLI's version.

SUBCOMMANDS

    read
        Display the contents of a file.
    write
        Write the contents of one file to another.\n\n`;
const versionOutput = "File Manager v1.0.0\n";
let p;
let stdout;
let decodedStdout;
let stderr;
let decodedStderr;

Rhum.testPlan("tutorials/advanced_tutorials/create_an_advanced_cli", () => {
  Rhum.testSuite("help", () => {
    Rhum.testCase("Displays help when no arguments given", async () => {
      p = Deno.run({
        cmd: ["deno", "run", "cli.ts"],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, helpOutput);
    });
    Rhum.testCase("Displays help when --help option is given", async () => {
      p = Deno.run({
        cmd: ["deno", "run", "cli.ts", "--help"],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, helpOutput);
    });
    Rhum.testCase("Displays help when -h option is given", async () => {
      p = Deno.run({
        cmd: ["deno", "run", "cli.ts", "-h"],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, helpOutput);
    });
  });
  Rhum.testSuite("version", () => {
    Rhum.testCase("Displays version when -v is used", async () => {
      // version
      p = Deno.run({
        cmd: ["deno", "run", "cli.ts", "-v"],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, versionOutput);
    });
    Rhum.testCase("Displays version when --version is used", async () => {
      p = Deno.run({
        cmd: ["deno", "run", "cli.ts", "--version"],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, versionOutput);
    });
  });
  Rhum.testSuite("read", () => {
    Rhum.testCase("Will read when given a file", async () => {
      // read
      p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "cli.ts",
          "read",
          "file_to_read.txt",
        ],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, "Hello world :)\n");
    });
    Rhum.testCase(
      "Will display read help when no arguments given",
      async () => {
        p = Deno.run({
          cmd: ["deno", "run", "--allow-read", "cli.ts", "read"],
          cwd: workingDir,
          stdout: "piped",
        });
        stdout = await p.output();
        decodedStdout = decoder.decode(stdout);
        await p.status();
        p.close();
        Rhum.asserts.assertEquals(
          decodedStdout,
          "USAGE\n\n    fm read [file] [deno flags] [options]\n\n\n",
        );
      },
    );
  });
  Rhum.testSuite("write", () => {
    Rhum.testCase("Will write to a new file", async () => {
      // write
      p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "--allow-write",
          "cli.ts",
          "write",
          "file_to_read.txt",
          "new_file.txt",
        ],
        cwd: workingDir,
        stdout: "piped",
        stderr: "piped",
      });
      stdout = await p.output();
      stderr = await p.stderrOutput();
      decodedStdout = decoder.decode(stdout);
      decodedStderr = decoder.decode(stderr);
      await p.status();
      p.close();
      Deno.removeSync(workingDir + "/new_file.txt");
      Rhum.asserts.assertEquals(decodedStdout, "");
      Rhum.asserts.assertEquals(decodedStderr, "");
    });
    Rhum.testCase("Will not write when dst exists", async () => {
      p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "--allow-write",
          "cli.ts",
          "write",
          "file_to_read.txt",
          "file_with_text.txt",
        ],
        cwd: workingDir,
        stdout: "piped",
        stderr: "piped",
      });
      stdout = await p.output();
      stderr = await p.stderrOutput();
      decodedStdout = decoder.decode(stdout);
      decodedStderr = decoder.decode(stderr);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(decodedStdout, "");
      Rhum.asserts.assertEquals(
        decodedStderr,
        "file_with_text.txt already exists! Try use the --overwrite flag to overwrite it.\n",
      );
    });
    Rhum.testCase(
      "Will write if dst exists and --overwrite flag is passed",
      async () => {
        p = Deno.run({
          cmd: [
            "deno",
            "run",
            "--allow-read",
            "--allow-write",
            "cli.ts",
            "write",
            "file_to_read.txt",
            "file_with_text.txt",
            "--overwrite",
            "yes",
          ],
          cwd: workingDir,
          stdout: "piped",
          stderr: "piped",
        });
        stdout = await p.output();
        stderr = await p.stderrOutput();
        decodedStdout = decoder.decode(stdout);
        decodedStderr = decoder.decode(stderr);
        await p.status();
        p.close();
        Rhum.asserts.assertEquals(decodedStdout, "");
        Rhum.asserts.assertEquals(decodedStderr, "");
      },
    );
    Rhum.testCase("Will display help when no args given", async () => {
      Deno.writeFileSync(
        workingDir + "/file_with_text.txt",
        new TextEncoder().encode("Line is cool!"),
      );
      p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "--allow-write",
          "cli.ts",
          "write",
        ],
        cwd: workingDir,
        stdout: "piped",
      });
      stdout = await p.output();
      decodedStdout = decoder.decode(stdout);
      await p.status();
      p.close();
      Rhum.asserts.assertEquals(
        decodedStdout,
        "USAGE\n\n    fm write [src] [dst] [deno flags] [options]\n\nOPTIONS\n\n    --overwrite\n        Allow the destination file to be overwritten\n\n",
      );
    });
  });
});

Rhum.run();
