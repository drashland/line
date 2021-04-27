import { Line } from "../../../../mod.ts";
import { WriteSubcommand } from "./subcommands/write.ts";
import { ReadSubcommand } from "./subcommands/read.ts";

const fm = new Line({
  command: "fm",
  name: "File Manager",
  description: "A file manager to handle reading and writing of files.",
  version: "v1.0.0",
  subcommands: [
    ReadSubcommand,
    WriteSubcommand,
  ],
});

fm.run();
