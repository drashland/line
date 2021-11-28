import { IArgument, IOption } from "./interfaces.ts";
import { TArgument, TOption } from "./types.ts";

/**
 * Create the arguments Map so that it can be used during runtime. We do not
 * use `this.arguments` directly because it is just the interface that users
 * use to define their argument descriptions. The Map created in this method
 * creates an object that we can parse better during runtime.
 */
export function setArgumentsMapInitialValues(
  commandSignature: string,
  commandName: string,
  commandType: "command" | "subcommand",
  argDescriptions: TArgument,
  argMap: Map<string, IArgument>,
): void {
  // Remove the command from the signature. We only care about its arguments.
  commandSignature = commandSignature.replace(commandName, "").trim();

  const argsArray = commandSignature.split(" ").map((arg: string) => {
    return arg.replace(/\[|\]/g, ""); // Take off square brackets
  });

  argsArray.forEach((arg: string) => {
    // Set the description (if one exists)
    let description = "(no description)";
    if (arg in argDescriptions) {
      description = argDescriptions[arg];
    }

    argMap.set(arg.trim(), {
      description: description,
    });
  });
}

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
  argsMap: Map<string, IArgument>,
): string[] {
  const errors: string[] = [];

  // Remove the command from the signature. We only care about its arguments.
  commandSignature = commandSignature.replace(commandName, "").trim();

  const argsArray = commandSignature.split(" ").map((arg: string) => {
    return arg.replace(/\[|\]/g, ""); // Take off square brackets
  });

  // Remove the command from the command line. We only care about the arguments
  // passed in.
  const commandIndex = denoArgs.indexOf(commandName);
  denoArgs = denoArgs.slice(commandIndex + 1, denoArgs.length);

  // Match the items in the command line to arguments in the command
  let index = 0;
  for (const [argName, argObject] of argsMap.entries()) {
    const argValue = denoArgs[index];
    if (!argValue) {
      errors.push(`Argument '${argName}' is missing.`);
    }
    argObject.value = argValue;
    index++;
  }

  return errors;
}


/**
 * Take the command line and set actual values in the options Map. After setting
 * the options, take them out of the command line so it can be checked for
 * arguments.
 */
export function extractOptionsFromDenoArgs(
  denoArgs: string[],
  commandName: string,
  commandType: "command" | "subcommand",
  optionsMap: Map<string, IOption>,
): string[] {
  const errors = [];

  for (const [option, optionObject] of optionsMap.entries()) {
    const optionLocation = denoArgs.indexOf(option);

    // If the option is not in the command line, then skip this process
    if (optionLocation === -1) {
      continue;
    }

    const nextValue = denoArgs[optionLocation + 1];

    // If we get here, then the option is present in the command line.
    // Therefore, we check to see if it takes in a value. If it does, then the
    // next item in the command line is the option's value.
    if (optionObject.takes_value) {
      optionObject.value = nextValue;
      denoArgs.splice(optionLocation, 2);
      continue;
    }

    // If we get here, then we need to check if the next item in the command
    // line is an option. If it is not, then:
    //
    //   1. It is a value
    //   2. The option that we are currently checking does not take a value
    //   3. We throw an error
    if (!optionsMap.has(nextValue)) {
      errors.push(`Option '${option}' does not take in a value. \`${option} ${nextValue}\` was given.`);
      denoArgs.splice(optionLocation, 2);
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
    denoArgs.splice(optionLocation, 1);
  }

  return errors;
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
): string[] {
  const errors: string[] = [];

  denoArgs.forEach((arg: string, index: number) => {
    if (arg.match(/^-/)) {
      if (!optionsMap.has(arg)) {
        errors.push(`Unknown '${arg}' option was given.`);
        denoArgs.splice(index, 1);
      }
    }
  });

  return errors;
}
