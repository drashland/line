import { Subcommand } from "./subcommand.ts";

/**
 * A class that represents a subcommand's option as an object.
 */
export class SubcommandOption {
  /**
   * The subcommand this option belongs to.
   */
  public subcommand: Subcommand;

  /**
   * This option's name. For example, "--my-cool-option".
   */
  public name = "";

  /**
   * This option's description.
   */
  public description = "";

  //////////////////////////////////////////////////////////////////////////////
  // FILE MARKER - CONSTRUCTOR /////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param subcommand - See this.subcommand property.
   */
  constructor(subcommand: Subcommand) {
    this.subcommand = subcommand;
  }
}
