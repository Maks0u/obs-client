import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import ObsClient, { waitFor } from '../index.js';

const host = process.env.OBS_WS_HOST;
const port = process.env.OBS_WS_PORT;
const password = process.env.OBS_WS_PASSWORD;

/** @type {ObsClient} */
let obs;

describe('Connection', () => {
  beforeEach(async () => {
    obs = new ObsClient(port, host, password);
    await obs.init();
  });

  afterEach(async () => {
    await obs.destroy();
  });

  after(() => {
    obs.destroy();
  });

  it('can connect', async () => {
    assert.ok(obs.isConnected());
  });

  it('can disconnect', async () => {
    await obs.destroy();
    assert.ok(!obs.isConnected());
  });

  it('calling init() mutliple times will not create new connection', async () => {
    await obs.init();
    await obs.init();
    assert.ok(obs.isConnected());
  });

  it('calling destroy() multiple times will have no effect', async () => {
    assert.ok(obs.isConnected());
    await obs.destroy();
    await obs.destroy();
    assert.ok(!obs.isConnected());
  });

  it('disconnect on error', async () => {
    assert.ok(obs.isConnected());
    obs.ws.emit('ConnectionError');
    await waitFor(() => !obs.isConnected());
    assert.ok(!obs.isConnected());
  });
});
