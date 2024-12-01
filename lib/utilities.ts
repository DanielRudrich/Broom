import { WAVFormat } from "./wavformat";

function getGlobalURL(): typeof URL {
    return window.URL || (<any>window).webkitURL;
}

declare var URL: {
    prototype: URL;
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
};

function downloadWav(wav: WAVFormat, fileName: string = "ir.wav") {
    const blob = new window.Blob([new DataView(wav.encodedBuffer)], {
        type: "audio/wav",
    });

    const anchor = document.createElement("a");
    document.body.appendChild(anchor);
    anchor.style.display = "none";

    const url = getGlobalURL().createObjectURL(blob);
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
}
export function downloadBuffer(buffer: AudioBuffer, fileName: string) {
    const wav = new WAVFormat(buffer);
    downloadWav(wav, fileName);
}

export function normalizeBuffer(buffer: AudioBuffer) {
    var maxAbs = 0;

    for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
        let chData = buffer.getChannelData(ch);
        for (var i = 0; i < buffer.length; ++i) {
            maxAbs = Math.max(Math.abs(chData[i]), maxAbs);
        }
    }

    const factor = 1 / maxAbs;

    for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
        let chData = buffer.getChannelData(ch);
        for (var i = 0; i < buffer.length; ++i) {
            chData[i] = factor * chData[i];
        }
    }
}

export function copyBuffer(buffer: AudioBuffer): AudioBuffer {
    const copy = new AudioBuffer({
        length: buffer.length,
        numberOfChannels: buffer.numberOfChannels,
        sampleRate: buffer.sampleRate,
    });
    for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
        copy.copyToChannel(buffer.getChannelData(ch), ch);
    }
    return copy;
}

export function trimBuffer(buffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.max(0, Math.round(startTime * sampleRate));
    const endSample = Math.min(buffer.length, Math.round(endTime * sampleRate));
    const numSamples = endSample - startSample;

    const trimmed = new AudioBuffer({
        length: numSamples,
        numberOfChannels: buffer.numberOfChannels,
        sampleRate,
    });

    for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
        let dataIn = buffer.getChannelData(ch);
        let dataOut = trimmed.getChannelData(ch);

        for (var i = 0; i < numSamples; ++i) dataOut[i] = dataIn[startSample + i];
    }

    return trimmed;
}

export function applyFadeIn(buffer: AudioBuffer, fadeTimeInMs: number) {
    const fadeInSamples = Math.min(buffer.length, (fadeTimeInMs * buffer.sampleRate) / 1000);
    for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
        let data = buffer.getChannelData(ch);
        for (var i = 0; i < fadeInSamples; ++i) {
            data[i] *= Math.sin(((i / fadeInSamples) * Math.PI) / 2) ** 2;
        }
    }
}

export function applyFadeOut(buffer: AudioBuffer, fadeTimeInMs: number) {
    const fadeOutSamples = Math.min(buffer.length, (fadeTimeInMs * buffer.sampleRate) / 1000);
    let lastSample = buffer.length - 1;
    for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
        let data = buffer.getChannelData(ch);
        for (var i = 0; i < fadeOutSamples; ++i) {
            data[lastSample - i] *= Math.sin(((i / fadeOutSamples) * Math.PI) / 2) ** 2;
        }
    }
}
