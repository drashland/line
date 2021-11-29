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
export function extractArgumentsFromDenoArgs(
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

  // Match the arguments in the command line to arguments in the command
  // signature
  for (const [argName, argObject] of argsMap.entries()) {
    // The first item is the arg value
    const argValue = denoArgs[0];

    if (!argValue) {
      errors.push(`Argument '${argName}' is missing`);
    } else {
      argObject.value = argValue;
      // Remove the first item from Deno args. When we do this, the next item
      // will be the first item.
      denoArgs.splice(0, 1);
    }
  }

  // At this point, all of the Deno args should be extracted. The Deno args
  // array should contain 0 elements. If there are any elements left, then too
  // many arguments were given.
  if (denoArgs.length > 0) {
    errors.push(`Extra arguments provided: ${denoArgs.join(", ")}.`);
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
  numCommandArguments: number,
): string[] {
  const errors: string[] = [];

  let optionsExtracted: IOption[] = [];

  for (const [option, optionObject] of optionsMap.entries()) {
    const optionLocation = denoArgs.indexOf(option);

    // If the option is not in the command line, then skip this process
    if (optionLocation === -1) {
      continue;
    }

    // Check if this option has already been extracted from the command line
    if (optionAlreadyExtracted(option, optionsExtracted)) {
      continue;
    }

    // If we get here, then the option is present in the command line.
    // Therefore, we check to see if it takes in a value. If it does, then the
    // next item in the command line is the option's value.
    if (optionObject.takes_value) {
      const nextValue = denoArgs[optionLocation + 1];
      optionObject.value = nextValue;
      denoArgs.splice(optionLocation, 2);
      optionsExtracted.push(optionObject);
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
    optionsExtracted.push(optionObject);
  }

  // Take off elements from the end of the Deno args array. The number of
  // elements to take off is equal to the number of arguments the command takes.
  // We use `.slice()` to make a copy of the Deno args array. We do not want to
  // mutate it in case this function does not return any errors.
  const denoArgsCopy = denoArgs.slice()
  denoArgsCopy.splice((denoArgs.length - numCommandArguments), numCommandArguments);

  if (denoArgsCopy.length > 0) {
    denoArgsCopy.forEach((arg: string) => {
      if (optionsMap.has(arg)) {
        denoArgs.splice(denoArgs.indexOf(arg), 1);
        errors.push(`Option '${optionsMap.get(arg)!.signatures.join(", ")}' provided more than once`);
      }
    });
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
    const optionObject: IOption = {
      signatures: [],
      takes_value: false,
    };

    // The key in the `options` property can be a command-delimited list of
    // options, so we split on the commad just in case it is a comma-delimited
    // list
    const split = optionSignatures.split(",");
    // For each option signature specified ...
    split.forEach((signature: string) => {
      // ... trim leading/trailing spaces that might be in the signature
      signature = signature.trim();


      // ... check to see if this option takes in a value
      if (signature.includes("[value]")) {
        // If it does take in a value, then take out the `[value]` portion of
        // the signature. We do not need this when creating the options Map.
        signature = signature.replace(/\s+\[value\]/, "").trim();
        optionObject.takes_value = true;
      }

      optionObject.signatures.push(signature);
      optionsMap.set(signature, optionObject)
    });
  }
}


/**
 * Has the specified option been extracted from the command line?
 */
function optionAlreadyExtracted(optionName: string, optionsExtracted: IOption[]) {
  let extracted = false;
  optionsExtracted.forEach((optionExtracted: IOption) => {
    if (optionExtracted.signatures.indexOf(optionName) !== -1) {
      extracted = true;
    }
  });

  return extracted;
}
