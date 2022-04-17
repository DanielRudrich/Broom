class SweepSettings {
    constructor(
        readonly lengthInSeconds: number,
        readonly startFrequency: number
    ) {}
}

class Sweep {
    sweep: AudioBuffer;
    inverseSweep: Float32Array;
    constructor(specs: SweepSettings, sampleRate: number) {
        const numSamples = Math.ceil(specs.lengthInSeconds * sampleRate);
        let w0 = (2 * Math.PI * specs.startFrequency) / sampleRate;
        const w1 = Math.PI; // sweeping up to Nyquist

        // find optimal starting Frequency to start and end sweep with
        // zero-phase -> zero-ampltide

        w0 = Sweep.findOptimalW0(numSamples, w0, w1);
        const newStartFrequency = (w0 * sampleRate) / (2 * Math.PI);
        console.log(`Start frequency adjusted to ${newStartFrequency} Hz.`);

        this.sweep = new AudioBuffer({
            numberOfChannels: 1,
            sampleRate: sampleRate,
            length: numSamples,
        });

        let sweepData = this.sweep.getChannelData(0);

        this.inverseSweep = new Float32Array(numSamples);

        const b = w1 / w0;
        const c = ((numSamples - 1) * w0) / Math.log(b);

        let wSum = 0;
        for (var i = 0; i < numSamples; ++i) {
            const br = b ** (i / (numSamples - 1));
            sweepData[i] = Math.sin(c * (br - 1));
            this.inverseSweep[numSamples - i - 1] = sweepData[i] * w0 * br;
            wSum += w0 * br;
        }

        for (var i = 0; i < numSamples; ++i) this.inverseSweep[i] *= 2 / wSum;
    }

    static findOptimalW0(N: number, w0: number, w1: number) {
        // find optimal start frequency via gradient descent
        // shoutout to Franz Zotter!

        for (var i = 0; i < 15; ++i) {
            const a = w0;
            const b = w1 / w0;
            const c = ((N - 1) * a) / Math.log(b);

            const phi1 = c * (b - 1);
            const deltaphi = phi1 - Math.round(phi1 / Math.PI) * Math.PI;
            const dphidw0 =
                ((N - 1) * (w0 * Math.log(w1 / w0) + w0 - w1)) /
                (w0 * Math.log(w1 / w0) ** 2);
            const dw0 = deltaphi / dphidw0;
            w0 = w0 + dw0;
        }

        return w0;
    }
}

export { Sweep, SweepSettings };
