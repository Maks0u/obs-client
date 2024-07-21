import assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'mocha';
import ObsClient, { waitFor } from '../index.js';

const host = process.env.OBS_WS_HOST;
const port = process.env.OBS_WS_PORT;
const password = process.env.OBS_WS_PASSWORD;

/** @type {ObsClient} */
let obs;

describe('Events', () => {
  before(async () => {
    obs = new ObsClient(port, host, password);
  });

  beforeEach(async () => {
    await obs.init();
  });

  after(() => {
    obs.destroy();
  });

  describe('General Events', () => {
    it('ExitStarted', async () => {
      assert.equal(obs.ws.listenerCount('ExitStarted'), 1);

      assert.ok(obs.isConnected());
      obs.ws.emit('ExitStarted');
      await waitFor(() => !obs.isConnected(), { tick: 5 });
      assert.ok(!obs.isConnected());

      assert.equal(obs.ws.listenerCount('ExitStarted'), 0);
    });
  });
});
