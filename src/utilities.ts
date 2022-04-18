import { WAVFormat } from "./wavformat";

function getGlobalURL(): typeof URL {
    return window.URL || (<any>window).webkitURL;
}

declare var URL: {
    prototype: URL;
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
};

export function downloadWav(wav: WAVFormat, fileName: string = "ir.wav") {
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
