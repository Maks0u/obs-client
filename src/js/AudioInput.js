import { EventEmitter } from 'node:events';
import ObsClient from './ObsClient.js';

export class AudioInput extends EventEmitter {
  /** @type {number} */
  dB;
  /** @type {string} */
  inputKind;
  /** @type {string} */
  inputName;
  /** @type {string} */
  inputUuid;
  /** @type {boolean} */
  mute;
  /** @private @readonly @type {ObsClient} */
  obs;
  /** @type {string} */
  unversionedInputKind;

  /**
   * @param {ObsClient} obsClient
   * @param {InputConfig} config
   */
  constructor(obsClient, config) {
    super();
    this.obs = obsClient;
    this.inputKind = config.inputKind;
    this.inputName = config.inputName;
    this.inputUuid = config.inputUuid;
    this.unversionedInputKind = config.unversionedInputKind;

    this.init();
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    this.mute = await this.isMuted();
    this.dB = await this.getVolume();

    this.on('mute', this.onMute);
    this.on('unmute', this.onUnmute);
    this.on('volumechange', this.onVolumeChange);
  }

  /**
   * @returns {void}
   */
  onMute() {
    this.mute = true;
  }

  /**
   * @returns {void}
   */
  onUnmute() {
    this.mute = false;
  }

  /**
   * @param {number} inputVolumeDb
   * @returns {void}
   */
  onVolumeChange(inputVolumeDb) {
    this.dB = inputVolumeDb;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isMuted() {
    const inputUuid = this.inputUuid;
    return (await this.obs.ws.call('GetInputMute', { inputUuid })).inputMuted;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async toggleMute() {
    const inputUuid = this.inputUuid;
    return (await this.obs.ws.call('ToggleInputMute', { inputUuid }))
      .inputMuted;
  }

  /**
   * @returns {Promise<number>}
   */
  async getVolume() {
    const inputUuid = this.inputUuid;
    return (await this.obs.ws.call('GetInputVolume', { inputUuid }))
      .inputVolumeDb;
  }

  /**
   * @param {number} inputVolumeDb
   * @returns {Promise<number>}
   */
  async setVolume(inputVolumeDb) {
    const inputUuid = this.inputUuid;
    await this.obs.ws.call('SetInputVolume', { inputUuid, inputVolumeDb });
    return inputVolumeDb;
  }
}

/**
 * @typedef {Object} InputConfig
 * @property {string} inputKind
 * @property {string} inputName
 * @property {string} inputUuid
 * @property {string} unversionedInputKind
 */
