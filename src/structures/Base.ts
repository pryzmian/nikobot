import { NikoClient } from './Client';

export abstract class Base {
    public readonly client: NikoClient;

    public constructor() {
        this.client = NikoClient.getInstance();
    }
}
