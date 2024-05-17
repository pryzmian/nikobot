import type { AutocompleteBase } from '../../types/autocomplete/BaseAutocomplete.js';
import type { AutocompleteOptions } from '../../types/autocomplete/AutocompleteOptions.js';
import { Base } from '../Base.js';
import { AutocompleteInteraction } from 'discord.js';

export abstract class BaseAutocomplete extends Base implements AutocompleteBase {
    public readonly name: string;

    public constructor(options: AutocompleteOptions) {
        super();
        this.name = options.name;
    }

    public abstract execute(interaction: AutocompleteInteraction): Promise<void> | void;
}
