import { Maincommand } from "../../src/main_command.ts";
import { Line } from "../../mod.ts";

class CatCommand extends Maincommand {
  public signature = "[file1] [...files]";
  public handle() {
    const file1 = this.getArgumentValue("file1");
    const otherFiles = this.getArgumentValue("...files");
    console.log(file1);
    console.log(otherFiles);
  }
}
const line = new Line({
  name: "cat",
  description: "Echo out contents of any number of given files",
  version: "v1.0.0",
  command: "cat",
  main_command_handler: CatCommand,
});
line.run();
