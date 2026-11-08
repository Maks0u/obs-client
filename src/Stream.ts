import type { ObsClient } from './ObsClient.js';
import type { StreamStatus } from './types.js';
import { sleep, waitFor } from './utils.js';

export class Stream {
    inited = false;
    private readonly obs: ObsClient;
    isActive = false;

    constructor(obsClient: ObsClient) {
        this.obs = obsClient;

        this.init();
    }

    async init(): Promise<void> {
        this.isActive = await this.getActiveStatus();
        this.inited = true;
    }

    async getStatus(): Promise<StreamStatus> {
        return await this.obs.ws.call('GetStreamStatus');
    }

    async getActiveStatus(): Promise<boolean> {
        const { outputActive } = await this.getStatus();
        return outputActive;
    }

    async bandwidthTestActive(): Promise<boolean> {
        const { streamServiceSettings } = await this.obs.ws.call('GetStreamServiceSettings');
        return streamServiceSettings.bwtest as boolean;
    }

    async toggleBandwidthTest(): Promise<void> {
        const active = await this.bandwidthTestActive();
        await this.obs.ws.call('SetStreamServiceSettings', {
            streamServiceSettings: { bwtest: !active },
            streamServiceType: 'rtmp_common',
        });
    }

    async start(): Promise<void> {
        if (!this.inited) return;
        if (this.isActive) return;

        await this.obs.ws.call('StartStream');
        await this.waitForStreamON();
        this.isActive = true;
    }

    async stop(): Promise<void> {
        if (!this.inited) return;
        if (!this.isActive) return;

        await this.obs.ws.call('StopStream');
        await this.waitForStreamOFF();
        this.isActive = false;
    }

    async waitForStreamON(): Promise<void> {
        await this.waitForStreamActive(true);
    }

    async waitForStreamOFF(): Promise<void> {
        await this.waitForStreamActive(false);
    }

    async waitForStreamActive(active: boolean): Promise<void> {
        await sleep(800);
        await waitFor(async () => active === (await this.getActiveStatus()), {
            tick: 100,
            timeout: 10000,
        });
    }
}
