import type { BaseComponentParams, ComponentBase } from '../../types/component/BaseComponent.js';
import type { ComponentOptions } from '../../types/component/ComponentOptions.js';
import { Base } from '../Base.js';

export abstract class BaseComponent extends Base implements ComponentBase {
    public readonly name: string;

    public constructor(options: ComponentOptions) {
        super();
        this.name = options.name;
    }

    public abstract execute(params: BaseComponentParams): Promise<void> | void;
}
