import { AutocompleteInteraction } from "discord.js";

export interface AutocompleteBase {
  name: string;
  execute: (interaction: AutocompleteInteraction) => Promise<void> | void;
}
//el de cadenceXD me autoocmpletaba el texto de paso

// s  
// xd, es que ya las tengo hechas en otro codigo que tenia empezado