import * as argParser from "../../src/arg_parser.ts";

Deno.test("ensures last option index is correctly set", () => {
  const args = "run -D firstArg secondArg";

  const lastIndex = extractOptionsFromDenoArgs(
    args.split(" "),
    "run",
    "subcommand",
    new Map<string, any>(
      [
        "-D",
        {
          takes_value: false,
        }
      ],
    )
  );
});
