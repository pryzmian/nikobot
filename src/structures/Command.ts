import type { CommandOptions } from "../types/command/CommandOptions.js";
import type { CommandBase } from "../types/command/BaseCommand.js";
import type { ChatInputCommandInteraction } from 'discord.js';
import { Base } from "./Base.js";

export abstract class BaseCommand extends Base implements CommandBase {
  public readonly isDev?: boolean
  public readonly isBeta?: boolean
  public readonly isSystemCommand?: boolean
  public readonly data: CommandOptions["data"]

  public constructor(options: CommandOptions) {
    super()
    this.isDev = options.isDev
    this.isBeta = options.isBeta
    this.data = options.data
  }

  public abstract execute(interaction: ChatInputCommandInteraction): Promise<void> | void;

  public toJSON() {
    return { ...this.data.toJSON() };
  }
}