////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - MODULES ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

import { Maincommand } from "./src/maincommand.ts";
export { Maincommand }
export { CommandLine } from "./src/command_line.ts";
import { Line } from "./src/line.ts";
export { Line }
export { Subcommand } from "./src/subcommand.ts";
export { SubcommandOption } from "./src/subcommand_option.ts";

////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - TYPES /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export type { ILineConfigs, ILogger, TLogMethod } from "./src/interfaces.ts";

class Catd extends Maincommand {
    public signature = "[file] [file?]"

    public handle() {
        
    }
}

const l = new Line({
    name: "CatD",
    version: "v1.0.0",
    maincommand: Catd,
    description: "cat clone",
    command: "catd"
})

l.run()
