// this class only handles mono buffers for now
// for multichannel, input data has to be interleaved first
export class WAVFormat {
    encodedBuffer: ArrayBuffer;
    readonly numChannels: number;
    readonly sampleRate: number;

    constructor(buffer: AudioBuffer) {
        if (buffer.numberOfChannels != 1)
            throw new Error("Number of channels has to be 1!");

        this.numChannels = buffer.numberOfChannels;
        this.sampleRate = buffer.sampleRate;

        this.encodedBuffer = WAVFormat.encode(
            buffer.getChannelData(0),
            1,
            buffer.sampleRate
        );
    }

    private static encode(
        data: Float32Array,
        numChannels: number,
        sampleRate: number
    ): ArrayBuffer {
        const headerSize = 44;
        const bitsPerSample = 32;
        const bytesPerSample = bitsPerSample / 8;
        const dataSize = data.length * bytesPerSample;
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
        view.setFloat32Array(headerSize, data);

        return buffer;
    }
}

class ExtendedView extends DataView {
    setString(byteOffset: number, stringToWrite: string) {
        for (var i = 0; i < stringToWrite.length; i++) {
            this.setUint8(byteOffset + i, stringToWrite.charCodeAt(i));
        }
    }

    setFloat32Array(byteOffset: number, data: Float32Array) {
        for (var i = 0; i < data.length; i++, byteOffset += 4) {
            this.setFloat32(byteOffset, data[i], true);
        }
    }
}
