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

  console.log(denoArgs);

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

  // Make a copy of the Deno args array to work with. We will use this to
  // iterate over the array and mutate the original array during iteration.
  const denoArgsCopy = denoArgs.slice();
  denoArgsCopy.splice(
    denoArgsCopy.length - numCommandArguments,
    numCommandArguments,
  );

  let optionsExtracted: IOption[] = [];

  let lastOptionProcessed: IOption;
  let lastOptionProcessedName: null | string = null;

  denoArgsCopy.forEach((arg: string, index: number) => {
    // If this argument has already been processed, then that means we are
    // processing a duplicate. This is an error.
    optionsExtracted.forEach((optionExtracted: IOption) => {
      optionExtracted.signatures.forEach((signature: string) => {
        if (arg == signature) {
          errors.push(`Option '${arg}' was provided more than once.`);
        }
      });
    });

    // If the last option processed takes in a value ...
    if (lastOptionProcessed && lastOptionProcessed.takes_value) {
      // ... then this current arg is the value. Also, we only assign the value
      // to the option if the value explicitly has an `undefined` value.
      // `undefined` means that the value has not been set yet.
      if (lastOptionProcessed.value === undefined) {
        lastOptionProcessed.value = arg;
        denoArgs.splice(denoArgs.indexOf(arg), 1);
      }
      return;
    }

    if (optionsMap.has(arg)) {
      lastOptionProcessed = optionsMap.get(arg)!;
      // If the option does not take in a value, but it is an option in this
      // CLI, then we just set the value to true to say, "Yes, this option
      // exists and it has been passed into the command line."
      if (!lastOptionProcessed.takes_value) {
        lastOptionProcessed.value = true;
      }
      lastOptionProcessedName = arg;
      denoArgs.splice(denoArgs.indexOf(arg), 1);
      optionsExtracted.push(lastOptionProcessed);
      return;
    }

    errors.push(
      `Option '${lastOptionProcessedName}' does not take in a value. '${arg}' was provided.`,
    );
    denoArgs.splice(denoArgs.indexOf(arg), 1);
  });

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
      description: options[optionSignatures],
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
      optionsMap.set(signature, optionObject);
    });
  }
}

/**
 * Has the specified option been extracted from the command line?
 */
function optionAlreadyExtracted(
  optionName: string,
  optionsExtracted: IOption[],
) {
  let extracted = false;
  optionsExtracted.forEach((optionExtracted: IOption) => {
    if (optionExtracted.signatures.indexOf(optionName) !== -1) {
      extracted = true;
    }
  });

  return extracted;
}
