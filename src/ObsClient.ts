import OBSWebSocket, {
    type OBSResponseTypes,
    type RequestBatchRequest,
    type ResponseMessage,
} from 'obs-websocket-js';
import { AudioInput } from './AudioInput.js';
import { Hotkey } from './Hotkey.js';
import { Scene } from './Scene.js';
import { Stream } from './Stream.js';
import type { InputConfig, SceneConfig } from './types.js';
import { waitFor } from './utils.js';

export class ObsClient {
    audioInputs: Map<string, AudioInput>;
    connected = false;
    hotkeys: Map<string, Hotkey>;
    inited = false;
    initing = false;
    password: string;
    scenes: Map<string, Scene>;
    // @ts-ignore
    stream: Stream;
    url: string;
    ws: OBSWebSocket;

    constructor(port = '4455', host = '127.0.0.1', password = '') {
        this.url = `ws://${host}:${port}`;
        this.password = password;
        this.audioInputs = new Map();
        this.hotkeys = new Map();
        this.scenes = new Map();
        this.ws = new OBSWebSocket();
    }

    async init(): Promise<void> {
        if (this.inited) return;

        // prevents a crash if init() has just been called but is not yet completed
        if (this.initing) return waitFor(() => this.inited);
        this.initing = true;

        this.initListeners();
        await this.connect();
        await this.load();

        this.inited = true;
        this.initing = false;
    }

    /**
     * Reverse init actions
     */
    async destroy(): Promise<void> {
        await this.disconnect();
        this.removeAllListeners();
        this.inited = false;
    }

    async reinit(): Promise<void> {
        await this.destroy();
        await this.init();
    }

    isConnected(): boolean {
        return this.connected;
    }

    private async connect(): Promise<void> {
        if (this.connected) return;

        await this.ws.connect(this.url, this.password);
        await waitFor(() => this.connected);
    }

    private async disconnect(): Promise<void> {
        if (!this.connected) return;

        await this.ws.disconnect();
        await waitFor(() => !this.connected);
    }

    /**
     * Load scenes, inputs, etc.
     */
    private async load(): Promise<void> {
        this.stream = await Stream.create(this);

        this.scenes = new Map((await this.getSceneList()).map(s => [s.sceneUuid, s]));

        this.audioInputs = new Map((await this.getAudioInputList()).map(i => [i.inputUuid, i]));

        this.hotkeys = new Map((await this.getHotkeylist()).map(h => [h.name, h]));
    }

    /**
     * Subscribe to listeners
     */
    private initListeners(): void {
        this.ws.on('ConnectionOpened', this.onConnectionOpened, this);
        this.ws.on('ConnectionClosed', this.onConnectionClosed, this);
        this.ws.on('ConnectionError', this.onConnectionError, this);
        this.ws.on('ExitStarted', this.onExitStarted, this);
        this.ws.on('InputMuteStateChanged', this.onInputMuteChange, this);
        this.ws.on('InputVolumeChanged', this.onInputVolumeChange, this);
    }

    private removeAllListeners(): void {
        this.ws.removeAllListeners();
    }

    private onConnectionOpened(): void {
        this.connected = true;
    }

    private onConnectionClosed(): void {
        this.connected = false;
    }

    private onConnectionError(): void {
        this.destroy();
    }

    private onExitStarted(): void {
        this.destroy();
    }

    private onInputMuteChange({
        inputName,
        inputUuid,
        inputMuted,
    }: { inputName: string; inputUuid: string; inputMuted: boolean }): void {
        this.audioInputs.get(inputUuid)?.emit(inputMuted ? 'mute' : 'unmute');
    }

    private onInputVolumeChange({
        inputName,
        inputUuid,
        inputVolumeMul,
        inputVolumeDb,
    }: {
        inputName: string;
        inputUuid: string;
        inputVolumeMul: number;
        inputVolumeDb: number;
    }): void {
        this.audioInputs.get(inputUuid)?.emit('volumechange', inputVolumeDb);
    }

    async getCurrentProgramScene(): Promise<Scene> {
        const sceneConfig = await this.ws.call('GetCurrentProgramScene');
        return await Scene.create(this, sceneConfig);
    }

    private async getSceneList(): Promise<Scene[]> {
        const { scenes } = await this.ws.call('GetSceneList');
        return Promise.all(
            scenes.map((config: unknown) => Scene.create(this, config as SceneConfig))
        );
    }

    private async getAudioInputList(): Promise<AudioInput[]> {
        const batch: RequestBatchRequest[] = [
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

        const responses: ResponseMessage[] = await this.ws.callBatch(batch);
        return Promise.all(
            responses
                .flatMap(
                    ({ responseData }) => (responseData as OBSResponseTypes['GetInputList']).inputs
                )
                .map((config: unknown) => AudioInput.create(this, config as InputConfig))
        );
    }

    private async getHotkeylist(): Promise<Hotkey[]> {
        const { hotkeys } = await this.ws.call('GetHotkeyList');
        return hotkeys.map(name => new Hotkey(this, name));
    }
}
