# OBS Client

Wrapper around [`obs-websocket-js`](https://github.com/obs-websocket-community-projects/obs-websocket-js) providing a structured, object-oriented interface to interact with OBS Studio (scenes, scene items, audio inputs, hotkeys, and streaming status).

## Installation

Install via npm:

```bash
npm install @maks0u/obs-client
```

## Usage

### Connecting and Initialization

Import `ObsClient` (available as default export or named export `ObsClient`) and call `init()` to connect to OBS WebSocket and populate initial states.

```typescript
import ObsClient from '@maks0u/obs-client';

const port = '4455';
const host = '127.0.0.1';
const password = 'your_obs_websocket_password';

// Constructor default values: (port = '4455', host = '127.0.0.1', password = '')
const obs = new ObsClient(port, host, password);

await obs.init();
console.log('Connected to OBS:', obs.isConnected());
```

> **Note:** `init()` connects to OBS via WebSocket and automatically loads scenes, audio inputs, hotkeys, and stream state.

### Working with Scenes and Scene Items

Scenes are stored in `obs.scenes` as a `Map<string, Scene>` keyed by `sceneUuid`. Each scene contains `items`, a `Map<string, SceneItem>` keyed by `sourceUuid`.

```typescript
// Switch to a scene
const scene = [...obs.scenes.values()].find(s => s.sceneName === 'Main');
if (scene) {
    await scene.setScene();
}

// Get the current active scene
const currentScene = await obs.getCurrentProgramScene();
console.log('Current scene:', currentScene.sceneName);

// Toggle visibility of a scene item (source) within a scene
const item = [...scene.items.values()].find(i => i.sourceName === 'Webcam');
if (item) {
    await item.toggle();
    const isVisible = await item.isEnabled();
    console.log(`Webcam enabled: ${isVisible}`);
}
```

### Managing Audio Inputs

Audio inputs are loaded into `obs.audioInputs` as a `Map<string, AudioInput>` keyed by `inputUuid`. `AudioInput` instances extend Node's `EventEmitter` and automatically reflect volume and mute changes from OBS.

```typescript
const mic = [...obs.audioInputs.values()].find(i => i.inputName === 'Mic/Aux');

if (mic) {
    // Current mute and volume values
    console.log(`Muted: ${mic.mute}, Volume: ${mic.dB} dB`);

    // Toggle mute
    const isMuted = await mic.toggleMute();

    // Adjust volume (in dB)
    await mic.setVolume(-6.0);

    // Listen to real-time events
    mic.on('mute', () => console.log('Mic muted'));
    mic.on('unmute', () => console.log('Mic unmuted'));
    mic.on('volumechange', dB => console.log(`Mic volume changed: ${dB} dB`));
}
```

### Triggering Hotkeys

Hotkeys discovered from OBS are stored in `obs.hotkeys` as a `Map<string, Hotkey>` keyed by `name`.

```typescript
const hotkey = obs.hotkeys.get('OBSBasic.SelectScene');
if (hotkey) {
    await hotkey.trigger();
}
```

### Controlling the Stream

The `obs.stream` property exposes stream controls and status queries:

```typescript
// Check stream status
const isStreaming = await obs.stream.getActiveStatus();

// Start or stop streaming (waits for confirmation)
if (!isStreaming) {
    await obs.stream.start();
} else {
    await obs.stream.stop();
}
```

### Direct Access to `obs-websocket-js`

If you need to make arbitrary OBS WebSocket requests not covered by helper classes, you can access the underlying `OBSWebSocket` instance via `obs.ws`:

```typescript
const response = await obs.ws.call('GetVersion');
console.log(response.obsVersion);
```

### Disconnecting & Cleanup

```typescript
// Disconnect and remove all listeners
await obs.destroy();

// Or re-initialize the connection:
await obs.reinit();
```

## Environment Variables (for testing)

These environment variables can be placed in a `.env` file when running tests:

| Variable          | Description            | Default value |
| ----------------- | ---------------------- | ------------- |
| `OBS_WS_HOST`     | Host running OBS       | `127.0.0.1`   |
| `OBS_WS_PORT`     | OBS WebSocket port     | `4455`        |
| `OBS_WS_PASSWORD` | OBS WebSocket password | _(empty)_     |

Run tests with:

```bash
npm test
```

## License

MIT
