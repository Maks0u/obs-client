import type { ObsClient } from './ObsClient.js';
import type { SceneItemConfig } from './types.js';

export class SceneItem {
    private readonly obs: ObsClient;
    sceneItemEnabled: boolean;
    sceneUuid: string;
    sceneItemId: number;
    sourceName: string;
    sourceUuid: string;

    constructor(obsClient: ObsClient, sceneUuid: string, config: SceneItemConfig) {
        this.obs = obsClient;
        this.sceneUuid = sceneUuid;

        this.sceneItemEnabled = config.sceneItemEnabled;
        this.sceneItemId = config.sceneItemId;
        this.sourceName = config.sourceName;
        this.sourceUuid = config.sourceUuid;
    }

    async isEnabled(): Promise<boolean> {
        const { sceneItemEnabled } = await this.obs.ws.call('GetSceneItemEnabled', {
            sceneUuid: this.sceneUuid,
            sceneItemId: this.sceneItemId,
        });

        return sceneItemEnabled;
    }

    async toggle(): Promise<void> {
        const enabled = await this.isEnabled();
        await this.obs.ws.call('SetSceneItemEnabled', {
            sceneUuid: this.sceneUuid,
            sceneItemId: this.sceneItemId,
            sceneItemEnabled: !enabled,
        });
    }
}
