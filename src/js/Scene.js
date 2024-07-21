import ObsClient from './ObsClient.js';
import { SceneItem } from './SceneItem.js';

export class Scene {
  /** @type {boolean} */
  inited = false;
  /** @type {Map<string, SceneItem>} */
  items;
  /** @private @readonly @type {ObsClient} */
  obs;
  /** @type {string} */
  sceneName;
  /** @type {string} */
  sceneUuid;

  /**
   * @param {ObsClient} obsClient
   * @param {SceneConfig} config
   */
  constructor(obsClient, config) {
    this.obs = obsClient;
    this.sceneName = config.sceneName;
    this.sceneUuid = config.sceneUuid;

    this.init();
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    this.items = new Map(
      (await this.getItemList()).map(i => [i.sourceUuid, i])
    );
    this.inited = true;
  }

  /**
   * @returns {Promise<SceneItem[]>}
   */
  async getItemList() {
    const sceneUuid = this.sceneUuid;
    return (
      await this.obs.ws.call('GetSceneItemList', { sceneUuid })
    ).sceneItems.map(i => new SceneItem(this.obs, sceneUuid, i));
  }

  /**
   * @returns {Promise<void>}
   */
  async setScene() {
    const sceneUuid = this.sceneUuid;
    await this.obs.ws.call('SetCurrentProgramScene', { sceneUuid });
  }
}

/**
 * @typedef {Object} SceneConfig
 * @property {string} sceneName
 * @property {string} sceneUuid
 */
