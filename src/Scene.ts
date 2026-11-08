import type { ObsClient } from './ObsClient.js';
import { SceneItem } from './SceneItem.js';
import type { SceneConfig, SceneItemConfig } from './types.js';

export class Scene {
    inited = false;
    items: Map<string, SceneItem> = new Map();
    private readonly obs: ObsClient;
    sceneName: string;
    sceneUuid: string;

    constructor(obsClient: ObsClient, config: SceneConfig) {
        this.obs = obsClient;
        this.sceneName = config.sceneName;
        this.sceneUuid = config.sceneUuid;

        this.init();
    }

    async init(): Promise<void> {
        const sceneItems = await this.getItemList();
        this.items = new Map(sceneItems.map(sceneItem => [sceneItem.sourceUuid, sceneItem]));
        this.inited = true;
    }

    async getItemList(): Promise<SceneItem[]> {
        const sceneUuid = this.sceneUuid;
        const { sceneItems } = await this.obs.ws.call('GetSceneItemList', { sceneUuid });
        return sceneItems.map(
            (config: unknown) => new SceneItem(this.obs, sceneUuid, config as SceneItemConfig)
        );
    }

    async setScene(): Promise<void> {
        const sceneUuid = this.sceneUuid;
        await this.obs.ws.call('SetCurrentProgramScene', { sceneUuid });
    }
}
