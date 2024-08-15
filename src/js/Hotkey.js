import ObsClient from './ObsClient.js';

export class Hotkey {
  /** @type {string} */
  name;
  /** @private @readonly @type {ObsClient} */
  obs;

  /**
   * @param {ObsClient} obsClient
   * @param {string} hotkeyName
   */
  constructor(obsClient, hotkeyName) {
    this.obs = obsClient;
    this.name = hotkeyName;
  }

  /**
   * Triggers hotkey
   * @returns {Promise<void>}
   */
  async trigger() {
    await this.obs.ws.call('TriggerHotkeyByName', { hotkeyName: this.name });
  }
}
