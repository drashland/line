import { Subcommand } from "../mod.ts";

type TLogMethod = (messag: string) => void;

/**
 * This CLI's configs.
 */
export interface ICommanderConfigs {
  name: string;
  description: string;
  command: string;
  subcommands: typeof Subcommand[];
  version: string;
}

/**
 * This CLI's logger.
 */
export interface ILogger {
  debug: TLogMethod;
  error: TLogMethod;
  info: TLogMethod;
  warn: TLogMethod;
}
