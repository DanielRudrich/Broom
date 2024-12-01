export class WAVFormat {
    encodedBuffer: ArrayBuffer;
    readonly numChannels: number;
    readonly sampleRate: number;

    constructor(buffer: AudioBuffer) {
        this.numChannels = buffer.numberOfChannels;
        this.sampleRate = buffer.sampleRate;

        this.encodedBuffer = WAVFormat.encode(buffer);
    }

    private static encode(audioBuffer: AudioBuffer): ArrayBuffer {
        const sampleRate = audioBuffer.sampleRate;
        const numChannels = audioBuffer.numberOfChannels;
        const numSamples = audioBuffer.getChannelData(0).length;

        const headerSize = 44;
        const bitsPerSample = 32;
        const bytesPerSample = bitsPerSample / 8;
        const dataSize = numSamples * bytesPerSample;
        const blockAlign = numChannels * bytesPerSample;
        const buffer = new ArrayBuffer(headerSize + dataSize);
        const view = new ExtendedView(buffer);

        // create header: https://docs.fileformat.com/audio/wav/
        // RIFF chunk
        view.setString(0, "RIFF");
        view.setUint32(4, 36 + dataSize, true);
        view.setString(8, "WAVE");

        // fmt chunk
        view.setString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 3, true); // 32bit float
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);

        // data chunk
        view.setString(36, "data");
        view.setUint32(40, dataSize, true);
        view.setAudioBuffer(44, audioBuffer);

        return buffer;
    }
}

class ExtendedView<
    TArrayBuffer extends ArrayBufferLike,
> extends DataView<TArrayBuffer> {
    setString(byteOffset: number, stringToWrite: string) {
        for (let i = 0; i < stringToWrite.length; ++i) {
            this.setUint8(byteOffset + i, stringToWrite.charCodeAt(i));
        }
    }

    setFloat32Array(byteOffset: number, data: Float32Array) {
        for (let i = 0; i < data.length; ++i, byteOffset += 4) {
            this.setFloat32(byteOffset, data[i], true);
        }
    }

    setAudioBuffer(byteOffset: number, data: AudioBuffer) {
        const numChannels = data.numberOfChannels;
        const numSamples = data.getChannelData(0).length;

        for (let i = 0; i < numSamples; ++i)
            for (let ch = 0; ch < numChannels; ++ch) {
                this.setFloat32(byteOffset, data.getChannelData(ch)[i], true);
                byteOffset += 4;
            }
    }
}
