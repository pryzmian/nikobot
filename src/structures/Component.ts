import type { MessageComponentInteraction } from 'discord.js';
import type { ComponentBase } from '../types/component/BaseComponent.js';
import type { ComponentOptions } from '../types/component/ComponentOptions.js';
import { Base } from './Base.js';

export abstract class BaseComponent extends Base implements ComponentBase {
    public readonly name: string;
    public readonly type: ComponentOptions['type'];

    public constructor(options: ComponentOptions) {
        super();
        this.name = options.name;
        this.type = options.type;
    }

    public abstract execute(interaction: MessageComponentInteraction): Promise<void> | void;
}
