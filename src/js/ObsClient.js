import OBSWebSocket from 'obs-websocket-js';
import { AudioInput, Scene, Stream, waitFor } from '../../index.js';

/**
 * Wrapper for obs-websocket-js
 */
export default class ObsClient {
  /** @type {Map<string, AudioInput>} */
  audioInputs;
  /** @private @type {boolean} */
  connected = false;
  /** @private @type {boolean} */
  inited = false;
  /** @private @type {string} */
  password;
  /** @type {Map<string, Scene>} */
  scenes;
  /** @type {Stream} */
  stream;
  /** @private @type {string} */
  url;
  /** @type {OBSWebSocket} */
  ws = new OBSWebSocket();

  /**
   * @param {string} port
   * @param {string} host
   * @param {string} password
   */
  constructor(port = '4455', host = '127.0.0.1', password = '') {
    this.url = `ws://${host}:${port}`;
    this.password = password;
  }

  // ==================== Connection ==================== //

  /**
   * @returns {Promise<void>}
   */
  async init() {
    if (this.inited) return;

    this.initListeners();
    await this.connect();
    await this.load();
    this.inited = true;
  }

  /**
   * Reverse init actions
   * @returns {Promise<void>}
   */
  async destroy() {
    await this.disconnect();
    this.removeAllListeners();
    this.inited = false;
  }

  /**
   * @returns {Promise<void>}
   */
  async reinit() {
    await this.destroy();
    await this.init();
  }

  /**
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * @private
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connected) return;

    await this.ws.connect(this.url, this.password);
  }

  /**
   * @private
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.connected) return;

    await this.ws.disconnect();
  }

  /**
   * Load scenes, inputs, etc.
   * @private
   * @returns {Promise<void>}
   */
  async load() {
    this.stream = new Stream(this);

    this.scenes = new Map(
      (await this.getSceneList()).map(s => [s.sceneUuid, s])
    );

    this.audioInputs = new Map(
      (await this.getAudioInputList()).map(i => [i.inputUuid, i])
    );

    await waitFor(() => this.stream.inited);
    await Promise.all(
      [...this.scenes.values()].map(scene => waitFor(() => scene.inited))
    );
  }

  /**
   * Subscribe to listeners
   * @private
   * @returns {void}
   */
  initListeners() {
    this.ws.on('ConnectionOpened', this.onConnectionOpened, this);
    this.ws.on('ConnectionClosed', this.onConnectionClosed, this);
    this.ws.on('ConnectionError', this.onConnectionError, this);
    this.ws.on('ExitStarted', this.onExitStarted, this);
    this.ws.on('InputMuteStateChanged', this.onInputMuteChange, this);
    this.ws.on('InputVolumeChanged', this.onInputVolumeChange, this);
  }

  /** @private */
  removeAllListeners() {
    this.ws.removeAllListeners();
  }

  // ==================== Events ==================== //

  /** @private */
  onConnectionOpened() {
    this.connected = true;
  }

  /** @private */
  onConnectionClosed() {
    this.connected = false;
  }

  /** @private */
  onConnectionError() {
    this.destroy();
  }

  /** @private */
  onExitStarted() {
    this.destroy();
  }

  /** @private */
  onInputMuteChange({ inputName, inputUuid, inputMuted }) {
    this.audioInputs.get(inputUuid)?.emit(inputMuted ? 'mute' : 'unmute');
  }

  /** @private */
  onInputVolumeChange({ inputName, inputUuid, inputVolumeMul, inputVolumeDb }) {
    this.audioInputs.get(inputUuid)?.emit('volumechange', inputVolumeDb);
  }

  // ==================== Requests ==================== //

  /**
   * @returns {Promise<Scene>}
   */
  async getCurrentProgramScene() {
    return new Scene(this, await this.ws.call('GetCurrentProgramScene'));
  }

  /**
   * @private
   * @returns {Promise<Scene[]>}
   */
  async getSceneList() {
    return (await this.ws.call('GetSceneList')).scenes.map(
      s => new Scene(this, s)
    );
  }

  /**
   * @private
   * @returns {Promise<AudioInput[]>}
   */
  async getAudioInputList() {
    const batch = [
      'browser_source',
      'vlc_source',
      'audio_capture',
      'window_capture',
      'game_capture',
      'dshow_input',
      'wasapi_input_capture',
      'wasapi_output_capture',
      'wasapi_process_output_capture',
    ].map(inputKind => {
      return {
        requestType: 'GetInputList',
        requestData: { inputKind },
      };
    });

    return (await this.ws.callBatch(batch))
      .flatMap(res => res.responseData.inputs)
      .map(i => new AudioInput(this, i));
  }
}
