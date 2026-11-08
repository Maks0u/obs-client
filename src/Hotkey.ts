import type { ObsClient } from './ObsClient.js';

export class Hotkey {
    name: string;
    private readonly obs: ObsClient;

    constructor(obsClient: ObsClient, hotkeyName: string) {
        this.obs = obsClient;
        this.name = hotkeyName;
    }

    async trigger(): Promise<void> {
        await this.obs.ws.call('TriggerHotkeyByName', {
            hotkeyName: this.name,
        });
    }
}
