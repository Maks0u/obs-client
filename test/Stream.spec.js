import assert from 'node:assert';
import { after, before, describe, it } from 'mocha';
import ObsClient, { Stream } from '../index.js';

const host = process.env.OBS_WS_HOST;
const port = process.env.OBS_WS_PORT;
const password = process.env.OBS_WS_PASSWORD;

/** @type {ObsClient} */
let obs;
/** @type {Stream} */
let stream;

describe('Stream', () => {
  before(async () => {
    obs = new ObsClient(port, host, password);
    await obs.init();
    stream = obs.stream;
  });

  beforeEach(async () => {
    if (!(await stream.bandwidthTestActive())) {
      throw new Error('Please activate bandwidth test in OBS settings');
    }
  });

  after(() => {
    obs.destroy();
  });

  it('getStatus', async () => {
    const status = await stream.getStatus();
    assert.equal(typeof status.outputActive, 'boolean');
    assert.equal(typeof status.outputBytes, 'number');
    assert.equal(typeof status.outputCongestion, 'number');
    assert.equal(typeof status.outputDuration, 'number');
    assert.equal(typeof status.outputReconnecting, 'boolean');
    assert.equal(typeof status.outputSkippedFrames, 'number');
    assert.equal(typeof status.outputTimecode, 'string');
    assert.equal(typeof status.outputTotalFrames, 'number');
  });

  it('getActiveStatus', async () => {
    const active = await stream.getActiveStatus();
    assert.equal(typeof active, 'boolean');
  });

  it('bandwidthTestActive', async () => {
    const bwtest = await stream.bandwidthTestActive();
    assert.equal(typeof bwtest, 'boolean');
  });

  it('toggleBandwidthTest', async () => {
    const bwtestBefore = await stream.bandwidthTestActive();
    await stream.toggleBandwidthTest();
    const bwtestAfter = await stream.bandwidthTestActive();
    assert.equal(bwtestAfter, !bwtestBefore);

    // reset
    await stream.toggleBandwidthTest();
  });

  it('startStream', async () => {
    assert.ok(!(await stream.getActiveStatus()));
    await stream.start();
    assert.ok(await stream.getActiveStatus());
  });

  it('stopStream', async () => {
    assert.ok(await stream.getActiveStatus());
    await stream.stop();
    assert.ok(!(await stream.getActiveStatus()));
  });
});
