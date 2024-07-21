import assert from 'node:assert';
import { after, before, describe, it } from 'mocha';
import ObsClient, { Scene, Stream } from '../index.js';

const host = process.env.OBS_WS_HOST;
const port = process.env.OBS_WS_PORT;
const password = process.env.OBS_WS_PASSWORD;

/** @type {ObsClient} */
let obs;
/** @type {Input} */
let testInput;
/** @type {Scene} */
let testScene;
/** @type {SceneItem} */
let testSceneItem;

describe('ObsClient', () => {
  before(async () => {
    obs = new ObsClient(port, host, password);
    await obs.init();
  });

  after(() => {
    obs.destroy();
  });

  it('has stream property', () => {
    assert.ok(obs.stream instanceof Stream);
  });

  it('has scene collection', () => {
    assert.ok(obs.scenes instanceof Map);
    assert.ok(obs.scenes.size);
  });

  it('has audio input collection', () => {
    assert.ok(obs.audioInputs instanceof Map);
    assert.ok(obs.audioInputs.size);
  });

  it('get active scene', async () => {
    assert.ok((await obs.getCurrentProgramScene()) instanceof Scene);
  });

  it('change scene', async () => {
    const currentScene = await obs.getCurrentProgramScene();

    const sceneIterator = obs.scenes.values();
    let scene = sceneIterator.next().value;
    await scene.setScene();
    const scene1 = await obs.getCurrentProgramScene();
    assert.equal(scene1.sceneUuid, scene.sceneUuid);

    scene = sceneIterator.next().value;
    await scene.setScene();
    const scene2 = await obs.getCurrentProgramScene();
    assert.equal(scene2.sceneUuid, scene.sceneUuid);

    // reset
    await currentScene.setScene();
  });

  describe('Scene', () => {
    before(() => {
      // Game scene
      testScene = obs.scenes.get('6d3b79ab-07fd-4f09-b94e-bd69f5553a25');
    });

    it('has item collection', () => {
      assert.ok(testScene.items instanceof Map);
      assert.ok(testScene.items.size);
    });

    describe('Item', () => {
      before(() => {
        // Game
        testSceneItem = testScene.items.get('c5750cf7-f683-4871-bac8-3fc4d9281a9d');
      });

      it('check if enabled', async () => {
        const enabled = await testSceneItem.isEnabled();
        assert.equal(typeof enabled, 'boolean');
      });

      it('toggle', async () => {
        const enabledBefore = await testSceneItem.isEnabled();
        await testSceneItem.toggle();
        const enabledAfter = await testSceneItem.isEnabled();
        assert.equal(enabledAfter, !enabledBefore);

        // reset
        await testSceneItem.toggle();
      });
    });
  });

  describe('AudioInput', () => {
    before(() => {
      // Game
      testInput = obs.audioInputs.get('c5750cf7-f683-4871-bac8-3fc4d9281a9d');
    });

    it('check if muted', async () => {
      const isMuted = await testInput.isMuted();
      assert.equal(typeof isMuted, 'boolean');
    });

    it('toggle mute', async () => {
      const isMutedBefore = await testInput.isMuted();
      const isMutedReturn = await testInput.toggleMute();
      const isMutedAfter = await testInput.isMuted();
      assert.equal(isMutedReturn, isMutedAfter);
      assert.equal(isMutedAfter, !isMutedBefore);

      // reset
      await testInput.toggleMute();
    });

    it('get volume', async () => {
      const volume = await testInput.getVolume();
      assert.equal(typeof volume, 'number');
    });

    it('set volume', async () => {
      const volume1 = await testInput.getVolume();

      const volume2 = -10;
      await testInput.setVolume(volume2);
      assert.equal(await testInput.getVolume(), volume2);

      const volume3 = -40;
      await testInput.setVolume(volume3);
      assert.equal(await testInput.getVolume(), volume3);

      // reset
      await testInput.setVolume(volume1);
    });
  });
});
