import { Maincommand } from "./maincommand";
import { Maincommand } from "./maincommand.ts";

/**
 * A class that represents a subcommand's option as an object.
 */
export class MaincommandOption {
  /**
   * The subcommand this option belongs to.
   */
  public main_command: Maincommand;

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
   * @param maincommand - See this.subcommand property.
   */
  constructor(maincommand: Maincommand) {
    this.main_command = maincommand;
  }
}
