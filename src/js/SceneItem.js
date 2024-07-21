import ObsClient from './ObsClient.js';

export class SceneItem {
  /** @private @readonly @type {ObsClient} */
  obs;
  /** @type {boolean} */
  sceneItemEnabled;
  /** @type {string} */
  sceneUuid;
  /** @type {number} */
  sceneItemId;
  /** @type {string} */
  sourceName;
  /** @type {string} */
  sourceUuid;

  /**
   * @param {ObsClient} obsClient
   * @param {string} sceneUuid
   * @param {SceneItemConfig} config
   */
  constructor(obsClient, sceneUuid, config) {
    this.obs = obsClient;
    this.sceneUuid = sceneUuid;

    this.sceneItemEnabled = config.sceneItemEnabled;
    this.sceneItemId = config.sceneItemId;
    this.sourceName = config.sourceName;
    this.sourceUuid = config.sourceUuid;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isEnabled() {
    return (
      await this.obs.ws.call('GetSceneItemEnabled', {
        sceneUuid: this.sceneUuid,
        sceneItemId: this.sceneItemId,
      })
    ).sceneItemEnabled;
  }

  /**
   * @returns {Promise<void>}
   */
  async toggle() {
    const enabled = await this.isEnabled();
    await this.obs.ws.call('SetSceneItemEnabled', {
      sceneUuid: this.sceneUuid,
      sceneItemId: this.sceneItemId,
      sceneItemEnabled: !enabled,
    });
  }
}

/**
 * @typedef {Object} SceneItemConfig
 * @property {boolean} sceneItemEnabled
 * @property {number} sceneItemId
 * @property {string} sourceName
 * @property {string} sourceUuid
 */
