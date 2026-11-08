export interface StreamStatus {
    outputActive: boolean;
    outputBytes: number;
    outputCongestion: number;
    outputDuration: number;
    outputReconnecting: boolean;
    outputSkippedFrames: number;
    outputTimecode: string;
    outputTotalFrames: number;
}

export interface InputConfig {
    inputKind: string;
    inputName: string;
    inputUuid: string;
    unversionedInputKind: string;
}

export interface SceneConfig {
    sceneName: string;
    sceneUuid: string;
}

export interface SceneItemConfig {
    sceneItemEnabled: boolean;
    sceneItemId: number;
    sourceName: string;
    sourceUuid: string;
}
