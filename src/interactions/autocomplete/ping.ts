import type { AutocompleteInteraction } from "discord.js";
import { BaseAutocomplete } from "../../structures/Autocomplete.js";

export default class PingAutocomplete extends BaseAutocomplete {
  public constructor() {
    super({
      name: 'ping',
    });
  }

  public execute(interaction: AutocompleteInteraction): void {
    
  }
}