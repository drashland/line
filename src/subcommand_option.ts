import { Subcommand } from "./subcommand.ts";

export class SubcommandOption {
  public subcommand: Subcommand;
  public name: string = "";
  public description: string = "";
  public signature: string = "";

  constructor(subcommand: Subcommand) {
    this.subcommand = subcommand;
  }
}
