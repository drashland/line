import { IArgument, IOption } from "./interfaces.ts";
import { TArgument, TOption } from "./types.ts";

////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - EXPORTED FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Match all of the command's argument names to their respective arguments
 * based on location of the argument in the command line.
 *
 * @param denoArgs - Everything after the options in the `Deno.args` array.
 * @param commandName - If `run [arg]` is the signature, then `run` is the name.
 * @param commandSignature - The command's `signature` prop.
 * @param argsMap - The command's arguments Map (e.g., `#arguments_map` prop).
 */
export function extractArgumentsFromDenoArgs(
  denoArgs: string[],
  commandName: string,
  commandSignature: string,
  argsMap: Map<string, IArgument>,
): string[] {
  // console.log('Beg of extractArgumentsFromDenoArgs');
  const errors: string[] = [];

  // Remove the command from the signature. We only care about its arguments.
  commandSignature = commandSignature.replace(commandName, "").trim();

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
      // Remove the first item from `Deno.args`. When we do this, the next item
      // will be the first item.
      denoArgs.splice(0, 1);
    }
  }

  // At this point, all of the `Deno.args` should be extracted. The `Deno.args`
  // array should contain 0 elements. If there are any elements left, then too
  // many arguments were given.
  if (denoArgs.length > 0) {
    errors.push(`Unknown argument(s) provided: ${denoArgs.join(", ")}.`);
  }

  // console.log('End of extractArgumentsFromDenoArgs');


  return errors;
}

/**
 * Take the command line and set actual values in the options Map. After setting
 * the options, take them out of the command line so it can be checked for
 * arguments.
 *
 * @param denoArgs - Everything after the command in the `Deno.args` array.
 * @param optionsMap - The command's options Map (e.g., `#options_map` prop).
 */
export function extractOptionsFromDenoArgs(
  denoArgs: string[],
  optionsMap: Map<string, IOption>,
): string[] | undefined {
  const errors: string[] = [];
  const passedInOptions = getOptionsPassedIntoDenoArgs(denoArgs, optionsMap);
  // console.log(`passedInOptions: ${passedInOptions}`);
  // console.log(`optionsMap: ${JSON.stringify(optionsMap)}`);

  let isValue = false;
  let lastOptionObject: IOption | null = null;
  const optionsProcessed = new Set();
  let i: number = 0;

  while (i < passedInOptions.length) {
    // console.log(`i: ${i}`);
    if (!optionsMap.has(passedInOptions[i])) {
      optionsProcessed.add(passedInOptions[i]);
      errors.push(`Unknown item '${passedInOptions[i]}' provided`);
      i++;
      continue;
    }

    console.log('After first continue');

    let optionObject = optionsMap.get(passedInOptions[i])!;

    let alreadyProcessed = false;
    optionObject.signatures.forEach((signature: string) => {
      if (optionsProcessed.has(signature)) {
        alreadyProcessed = true;
      }
    });

    if (alreadyProcessed) {
      errors.push(
        `Option '${
          optionObject.signatures.join(", ")
        }' was provided more than once`,
      );

      i++;
      continue;
    }

    // console.log('After second return');
    optionsProcessed.add(passedInOptions[i]);

    optionObject.value = passedInOptions.slice(i + 1, i + optionObject.arg_count + 1);

    let ndx = -1;
    if ((ndx = optionObject.value.findIndex((optArg: string) => optionsMap.has(optArg))) !== -1) {
      errors.push(
        `Option ${passedInOptions[i]}, has the wrong number of arguments`
      );

      i += ndx + 1;
    }
    // console.log(`optionObject.value: ${optionObject.value}`);
    i += optionObject.arg_count + 1;
  }

  /*
  passedInOptions.forEach((option: string) => {
    // If this option is a value, then set it on the last option that was
    // processed
    if (lastOptionObject && isValue) {
      if (lastOptionObject.value instanceof Array) {
        lastOptionObject.value[i++] = option;
      }
      // Reset the variables used to set values on a last option processed
      lastOptionObject = null;
      isValue = false;
      return;
    }

    // If this option is not in the options map, then we have no idea what it
    // is. The user made a mistake, so tell them they passed in an unknown item.
    if (!optionsMap.has(option)) {
      optionsProcessed.push(option);
      errors.push(`Unknown item '${option}' provided`);
      return;
    }

    // If we get here, then we have an option that is defined in this CLI. Let's
    // track it and proceed to check if it requires a value.
    const optionObject = optionsMap.get(option)!;
    lastOptionObject = optionObject;

    // If we already processed this option, then tell the user it was provided
    // more than once. Options should only be passed in once.
    let alreadyProcessed = false;
    optionObject.signatures.forEach((signature: string) => {
      if (optionsProcessed.indexOf(signature) !== -1) {
        alreadyProcessed = true;
      }
    });


    // If this option takes a value, then set the flag to say that the next
    // option is the value
    if (optionObject.takes_value) {
      isValue = true;
      return;
    }

    // If we get here, then the option currently being processed does not
    // require a value. It just needs to "exist" in the command line, so we set
    // its value to true. We set it to true so when `this.option("option")` is
    // called from the command or subcommand class, it evaluates to true.
  });
  */

  return errors;
}

/**
 * Take a command's arguments Map (e.g., `#arguments_map` prop) and set the
 * initial values of each argument.
 *
 * @param commandSignature - The command's `signature` prop.
 * @param commandName - If `run [arg]` is the signature, then `run` is the name.
 * @param argsDescriptions - The command's argument descriptions (if any).
 * @param argsMap - The command's arguments Map (e.g., `#arguments_map` prop).
 */
export function setArgumentsMapInitialValues(
  commandSignature: string,
  commandName: string,
  argsDescriptions: TArgument,
  argsMap: Map<string, IArgument>,
): void {
  // Remove the command from the signature. We only care about its arguments.
  commandSignature = commandSignature.replace(commandName, "").trim();

  // If the command does not take in any arguments, then we can skip this entire
  // process
  if (commandSignature.length === 0) {
    return;
  }

  const argsArray = commandSignature.split(" ").map((arg: string) => {
    return arg.replace(/\[|\]/g, ""); // Take off square brackets
  });

  argsArray.forEach((arg: string) => {
    // Set the description (if one exists)
    let description = "(no description)";
    if (arg in argsDescriptions) {
      description = argsDescriptions[arg];
    }

    argsMap.set(arg.trim(), {
      description: description,
    });
  });
}

/**
 * Take a command's options Map (e.g., `#options_map` prop) and set the initial
 * values of each option.
 *
 * @param options - The command's `options` prop.
 * @param optionsMap - The command's options Map (e.g., `#options_map` prop).
 */
export function setOptionsMapInitialValues(
  options: TOption,
  optionsMap: Map<string, IOption>,
): void {
  for (const optionSignatures in options) {
    // Create the option object that get stored in the options Map. This will be
    // mutated down below if needed.
    const optionObject: IOption = {
      description: options[optionSignatures],
      signatures: [],
      arg_count: 0,
      // deno-lint-ignore camelcase
      takes_value: false,
    };

    // The key in the `options` property can be a command-delimited list of
    // option signatures, so we split the list apart in case it is.
    const split = optionSignatures.split(",");

    // For each option signature specified ...
    split.forEach((signature: string) => {
      // ... trim leading/trailing spaces that might be in the signature ...
      let openBracketNdx = signature.indexOf('[');

      if (openBracketNdx === -1) {
        signature = signature.trim();
      } else {
        optionObject.takes_value = true;
        let sig = signature.substring(0, openBracketNdx).trim();
        let argStr = signature.substring(openBracketNdx);
        signature = sig;
        let switchFlag: boolean = false;
        let argCount: number = 0;

        // console.log(`signature: ${signature}`);
        for (const c of argStr) {
          switch (c) {
            case '[':
              if (switchFlag === true) {
                throw new Error("Left open bracket after another left open bracket found.");
              }

              switchFlag = !switchFlag;
              break;
            case ']':
              if (switchFlag === false) {
                throw new Error("Right open bracket has no matching left open bracket");
              }

              switchFlag = !switchFlag;
              // console.log('Right bracket found!');
              argCount++;

              break;
            case ' ':
            case '\t':
            case '\n':
              if (switchFlag === true) {
                throw new Error("White space char inside brackets");
              }

              break;
            default:
              if (switchFlag === false) {
                  throw new Error("Non white-space character outside bracket");
              }

              break;
          }
        }

        // ... and check to see if it takes in a value
        /*
        if (signature.includes("[value]")) {
          // If it takes in a value, then remove the `[value]` portion ...
          signature = signature.replace(/\s+\[value\]/, "").trim();
          // ... and set the option object's `takes_value` flag to true
          optionObject.takes_value = true;
        }
        */

        // Once done, add all signatures that this option has ...
        optionObject.value = new Array(argCount);
        optionObject.arg_count = argCount;

        optionObject.signatures.push(signature);
        // ... and set this option -- identifiable by signature -- in the
        // command's options Map
      }

      // console.log(`before setting optionsMap, optionObject: ${JSON.stringify(optionObject)}`);
      optionsMap.set(signature, optionObject);

    });
  }
}

////////////////////////////////////////////////////////////////////////////////
// FILE MARKER - LOCAL FUNCTIONS ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Get the last option's index (or the index of its value if it requires a
 * value).
 *
 * @param denoArgs - The `Deno.args` array.
 * @param optionsMap - The command's options Map (e.g., `#options_map` prop).
 *
 * @returns The index of the last option or the last option's value if it
 * requires a value.
 */
function getLastOptionIndex(
  denoArgs: string[],
  optionsMap: Map<string, IOption>,
): number {
  let lastOptionIndex = -1;

  const optionsProcessed: string[] = [];

  denoArgs.forEach((arg: string, index: number) => {
    // console.log(`arg: ${arg}`);
    if (optionsMap.has(arg)) {
      const option = optionsMap.get(arg)!;
      // console.log(`option: ${JSON.stringify(option)}`);
      let alreadyProcessed = false;
      option.signatures.forEach((signature: string) => {
        if (optionsProcessed.indexOf(signature) !== -1) {
          alreadyProcessed = true;
        }
      });

      if (alreadyProcessed) {
        lastOptionIndex = index;
        return;
      }

      lastOptionIndex = index;
      let optionObject = optionsMap.get(arg);
      // console.log(`optionObject: ${JSON.stringify(optionObject)}`);
      if (optionObject!.takes_value && optionObject!.value instanceof Array) {
          // console.log(`optionObject!.value.length: ${optionObject!.value.length}`);
          lastOptionIndex += optionObject!.value.length;
      }

      optionsProcessed.push(arg);
    }
  });

  // console.log(`lastOptionIndex: ${lastOptionIndex}`);

  return lastOptionIndex;
}

/**
 * Get all of the options that were passed in. We do this by checking what the
 * last option is in the command line. Once we have the last option, we take
 * everything from the beginning of the command line to the last option (and its
 * value if it requires a value) and return it.
 *
 * @param denoArgs - The `Deno.args` array.
 * @param optionsMap - The command's options Map (e.g., `#options_map` prop).
 *
 * @returns All options that were passed in the `Deno.args` array.
 */
function getOptionsPassedIntoDenoArgs(
  denoArgs: string[],
  optionsMap: Map<string, IOption>,
): string[] {
  // First, we get the index of the last option (and its value if it requires
  // one)
  const lastOptionIndex = getLastOptionIndex(denoArgs, optionsMap);

  // Next, we splice `Deno.args` from the beginning til the last option (and its
  // value if it requires one). We want to include the last option (and its
  // value if it requires one) so we add `+ 1`.
  return denoArgs.splice(0, lastOptionIndex + 1);
}
