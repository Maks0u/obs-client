import ObsClient from './ObsClient.js';
import { sleep, waitFor } from './utils.js';

export class Stream {
  /** @type {boolean} */
  inited = false;
  /** @private @readonly @type {ObsClient} */
  obs;
  /** @type {boolean} */
  isActive = false;

  /**
   * @param {ObsClient} obsClient
   */
  constructor(obsClient) {
    this.obs = obsClient;

    this.init();
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    this.isActive = await this.getActiveStatus();
    this.inited = true;
  }

  /**
   * @returns {Promise<StreamStatus>}
   */
  async getStatus() {
    return await this.obs.ws.call('GetStreamStatus');
  }

  /**
   * @returns {Promise<boolean>}
   */
  async getActiveStatus() {
    return (await this.getStatus()).outputActive;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async bandwidthTestActive() {
    const settings = await this.obs.ws.call('GetStreamServiceSettings');
    return settings.streamServiceSettings.bwtest;
  }

  async toggleBandwidthTest() {
    const active = await this.bandwidthTestActive();
    await this.obs.ws.call('SetStreamServiceSettings', {
      streamServiceSettings: { bwtest: !active },
      streamServiceType: 'rtmp_common',
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.inited) return;
    if (this.isActive) return;

    await this.obs.ws.call('StartStream');
    await this.waitForStreamON();
    this.isActive = true;
  }

  /**
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.inited) return;
    if (!this.isActive) return;

    await this.obs.ws.call('StopStream');
    await this.waitForStreamOFF();
    this.isActive = false;
  }

  async waitForStreamON() {
    await this.waitForStreamActive(true);
  }

  async waitForStreamOFF() {
    await this.waitForStreamActive(false);
  }

  async waitForStreamActive(active) {
    await sleep(800);
    await waitFor(async () => active === (await this.getActiveStatus()), {
      tick: 100,
      timeout: 10000,
    });
  }
}

/**
 * @typedef {Object} StreamStatus
 * @property {boolean} outputActive Whether the output is active
 * @property {number} outputBytes Number of bytes sent by the output
 * @property {number} outputCongestion Congestion of the output
 * @property {number} outputDuration Current duration in milliseconds for the output
 * @property {boolean} outputReconnecting Whether the output is currently reconnecting
 * @property {number} outputSkippedFrames Number of frames skipped by the output's process
 * @property {string} outputTimecode Current formatted timecode string for the output
 * @property {number} outputTotalFrames Total number of frames delivered by the output's process
 */
