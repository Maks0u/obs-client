# OBS Client

## Installation

```bash
npm i git+https://github.com/Maks0u/obs-client
```

## Usage

```js
import ObsClient from 'obs-client';

const host = '127.0.0.1';
const port = '4455';
const password = 'secretpassword';

const obs = new ObsClient(port, host, password);
await obs.init(); // connect and load scenes, sources, inputs
```

## Environment variables (only required for testing)

| Variable        | Description            | Default value |
| --------------- | ---------------------- | ------------- |
| OBS_WS_HOST     | Host running OBS       | 127.0.0.1     |
| OBS_WS_PORT     | OBS WebSocket port     | 4455          |
| OBS_WS_PASSWORD | OBS WebSocket password | -             |
