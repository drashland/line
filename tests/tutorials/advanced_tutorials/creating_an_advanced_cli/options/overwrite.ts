import { SubcommandOption } from "../../../../../mod.ts";

export class OverwriteOption extends SubcommandOption {
  public name = "--overwrite";
  public description = "Allow the destination file to be overwritten";
}
