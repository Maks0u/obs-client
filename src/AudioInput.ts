import { EventEmitter } from 'node:events';
import type { ObsClient } from './ObsClient.js';
import type { InputConfig } from './types.js';

export class AudioInput extends EventEmitter {
    dB = 0;
    inputKind: string;
    inputName: string;
    inputUuid: string;
    mute = false;
    private readonly obs: ObsClient;
    unversionedInputKind: string;

    constructor(obsClient: ObsClient, config: InputConfig) {
        super();
        this.obs = obsClient;
        this.inputKind = config.inputKind;
        this.inputName = config.inputName;
        this.inputUuid = config.inputUuid;
        this.unversionedInputKind = config.unversionedInputKind;

        this.init();
    }

    async init(): Promise<void> {
        this.mute = await this.isMuted();
        this.dB = await this.getVolume();

        this.on('mute', this.onMute);
        this.on('unmute', this.onUnmute);
        this.on('volumechange', this.onVolumeChange);
    }

    onMute(): void {
        this.mute = true;
    }

    onUnmute(): void {
        this.mute = false;
    }

    onVolumeChange(inputVolumeDb: number): void {
        this.dB = inputVolumeDb;
    }

    async isMuted(): Promise<boolean> {
        const inputUuid = this.inputUuid;
        const response = await this.obs.ws.call('GetInputMute', { inputUuid });
        return response.inputMuted;
    }

    async toggleMute(): Promise<boolean> {
        const inputUuid = this.inputUuid;
        const response = await this.obs.ws.call('ToggleInputMute', { inputUuid });
        return response.inputMuted;
    }

    async getVolume(): Promise<number> {
        const inputUuid = this.inputUuid;
        const response = await this.obs.ws.call('GetInputVolume', { inputUuid });
        return response.inputVolumeDb;
    }

    async setVolume(inputVolumeDb: number): Promise<number> {
        const inputUuid = this.inputUuid;
        await this.obs.ws.call('SetInputVolume', { inputUuid, inputVolumeDb });
        return inputVolumeDb;
    }
}
