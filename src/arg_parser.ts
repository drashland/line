import { IArgument, IOption } from "./interfaces.ts";
import { TOption } from "./types.ts";

/**
 * Match all of the commands's argument names to their respective arguments
 * based on location of the argument in the command line.
 *
 * @param command - The command in question that should have the command line
 * arguments matched to its signature.
 */
export function matchArgumentsToNames(
  denoArgs: string[],
  commandName: string,
  commandType: "command" | "subcommand",
  commandSignature: string,
  argumentsMap: Map<string, IArgument>,
): void {
  // Remove the command from the signature. We only care about its arguments.
  commandSignature = commandSignature.replace(commandName, "").trim();

  // Remove the command from the command line. We only care about the arguments
  // passed in.
  const commandIndex = denoArgs.indexOf(commandName);
  denoArgs = denoArgs.slice(commandIndex + 1, denoArgs.length);

  // // Match arguments in the signature to arguments in the command line
  for (let i = 0; i < commandSignature.length; i++) {
    const argumentObj = argumentsMap.get(commandSignature[i].replace(/\[|\]/g, ""));
    if (argumentObj) {
      argumentObj.value = denoArgs[i];
    }
  }
}

/**
 * Take the validated command line and set actual values in the options Map.
 */
export function setOptionsMapActualValues(
  denoArgs: string[],
  commandName: string,
  commandType: "command" | "subcommand",
  optionsMap: Map<string, IOption>,
): void {
  // Remove the subcommand from the command line. We only care about the items
  // that come after the subcommand.
  const commandIndex = denoArgs.indexOf(commandName);
  denoArgs = denoArgs.slice(commandIndex + 1, denoArgs.length);


  for (const [option, optionObject] of optionsMap.entries()) {
    const optionLocation = denoArgs.indexOf(option);

    // If the option is not in the command line, then skip this process
    if (optionLocation === -1) {
      continue;
    }

    // If we get here, then the option is present in the command line.
    // Therefore, we check to see if it takes in a value. If it does, then the
    // next item in the command line is the option's value.
    if (optionObject.takes_value) {
      optionObject.value = denoArgs[optionLocation + 1];
      continue;
    }

    // If we get here, then the option does not take in a value, but it still
    // exists in the command line. Therefore, we just set it to `true` to
    // denote that, "Yes, this option exists in the command line," and calls
    // to `this.option(optionName)` will return `true`.
    //
    // This code is introduced because sometimes users do not want their
    // options to take in values. They just want the option to exist; and if
    // it does, then they can handle it accordingly in their `handle()`
    // methods.
    optionObject.value = true;
  }
}

/**
 * Set the initial values of the options Map.
 */
export function setOptionsMapInitialValues(
  options: TOption,
  optionsMap: Map<string, IOption>,
): void {
  // Create the options map
  for (const optionSignatures in options) {
    // The key in the `options` property can be a command-delimited list of
    // options, so we split on the commad just in case it is a comma-delimited
    // list
    const split = optionSignatures.split(",");

    // For each option signature specified ...
    split.forEach((signature: string) => {
      // ... trim leading/trailing spaces that might be in the signature
      signature = signature.trim();

      // ... check to see if this option takes in a value
      let optionTakesValue = false;
      if (signature.includes("[value]")) {
        // If it does take in a value, then take out the `[value]` portion of
        // the signature. We do not need this when creating the options Map.
        signature = signature.replace(/\s+\[value\]/, "").trim();
        optionTakesValue = true;
      }

      optionsMap.set(signature, {
        takes_value: optionTakesValue,
        // The value starts off as `undefined` because we do not know what the
        // value of the option is yet. We find out later in this method.
        value: undefined,
      });
    });
  }
}

/**
 * This should be called after `this.#setOptionsMapInitialValues()`. Reason
 * being, this method uses the options Map to check if options exist and the
 * `#setOptionsMapInitialValues()` creates the Map.
 *
 * This method validates that all options passed into the command line for
 * this subcommand meet all requirements.
 *
 * If any option is passed in that is not part of the subcommand, then the
 * program will exit.
 */
export function parseOptionsInCommandLine(
  denoArgs: string[],
  commandName: string,
  commandType: "command" | "subcommand",
  optionsMap: Map<string, IOption>,
  helpMenu: () => void,
): void {
  // Remove the subcommand from the command line. We only care about the items
  // that come after the subcommand.
  const commandIndex = denoArgs.indexOf(commandName);
  denoArgs = denoArgs.slice(commandIndex + 1, denoArgs.length);

  denoArgs.forEach((arg: string) => {
    if (arg.match(/^-/)) {
      if (!optionsMap.has(arg)) {
        console.log(`Unknown '${arg}' option found for '${commandName}' ${commandType}.`);
        Deno.exit(1);
      }
    }
  });
}
