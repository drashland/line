# Commander

A service to help build command-line interfaces (CLIs).

## Table of Contents

- [Quickstart](#quickstart)
- [Tutorials](#tutorials)
    - [Adding Options](#adding-options)

## Quickstart

1. Create your `app.ts` file.

```typescript
import {
  Commander,
  Subcommand,
} from "https://raw.githubusercontent.com/drashland/services/v0.3.0/cli/commander/mod.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

class Read extends Subcommand {
  public signature = "read [file]";
  public description = "Read a file.";

  public handle(): void { // can also be async
    const file = this.getArgument("[file]");
    if (!file) {
      return console.log("File not specified");
    }
    const contents = Deno.readFileSync(file);
    console.log(decoder.decode(contents));
  }
}

class Write extends Subcommand {
  public signature = "write [file] [contents]";
  public description = "Write contents to a file.";

  public handle(): void { // can also be async
    const file = this.getArgument("[file]");
    if (!file) {
      return console.log("File not specified");
    }
    const contents = this.getArgument("[contents]");
    if (!contents) {
      return console.log("Contents not specified");
    }
    try {
      Deno.writeFileSync(file, encoder.encode(contents));
      console.log("Successfully wrote file.");
    } catch (error) {
      console.log(error);
    }
  }
}

const service = new Commander({
  command: "fm",
  name: "File Manager",
  description: "A file manager.",
  version: "v1.0.0",
  subcommands: [
    Read,
    Write,
  ],
});

service.run();
```

2. Install your `app.ts` file as a binary under the name `fm`.

```shell
$ deno install --allow-read --allow-write --name fm app.ts
```

3. Run your app.

```shell
$ fm

File Manager - A file manager.

USAGE

    fm [option | [[subcommand] [args] [deno flags] [options]]

OPTIONS

    -h, --help    Show this menu.
    -v, --version Show this CLI's version.

SUBCOMMANDS

    read
        Read a file.
    write
        Write contents to a file.
```
