import { Sweep } from "./sweep";

export class MeasurementSettings {
    constructor(
        readonly startDelay: number,
        readonly length: number,
        readonly fadeIn: number
    ) {}
}

export class SweepProcessorNode extends AudioWorkletNode {
    sweep: Sweep;
    fadeSetting: number;

    onImpulseResponseReady: (ir: AudioBuffer) => void;
    onInputLevelUpdate: (level: number) => void;

    constructor(context: AudioContext) {
        super(context, "SweepProcessor");

        this.port.onmessage = (ev: MessageEvent<any>) => {
            if (ev.data["buffers"])
                this.deconvolveRecordedData(ev.data["buffers"]);
            else if (ev.data["inputLevel"] && this.onInputLevelUpdate)
                this.onInputLevelUpdate(ev.data["inputLevel"]);
        };
    }

    setSweep(sweep: Sweep) {
        this.sweep = sweep;

        // make copy of sweep buffer
        const sweepBuffer = new Float32Array(sweep.sweep.length);
        sweep.sweep.copyFromChannel(sweepBuffer, 0);

        // send
        this.port.postMessage({ action: "setSweep", sweep: sweepBuffer }, [
            sweepBuffer.buffer,
        ]);
    }

    startRecording(settings: MeasurementSettings) {
        this.fadeSetting = settings.fadeIn;
        this.port.postMessage({ action: "startRecording", settings });
    }

    stopRecording() {
        this.port.postMessage({ action: "stopRecording" });
    }

    private async deconvolveRecordedData(data: Array<Float32Array>) {
        const sampleRate = this.sweep.sweep.sampleRate;
        const sweepLength = this.sweep.sweep.length;

        var numSamples = 0;
        data.forEach((o) => (numSamples += o.length));
        if (numSamples <= sweepLength) return;

        const sweepResponse = new AudioBuffer({
            length: numSamples,
            numberOfChannels: 1,
            sampleRate,
        });
        const srData = sweepResponse.getChannelData(0);

        var index = 0;
        data.forEach((o) => {
            srData.set(o, index);
            index += o.length;
        });

        const offlineContext = new OfflineAudioContext(
            1,
            sweepLength + numSamples - 1,
            sampleRate
        );
        const convolver = offlineContext.createConvolver();
        const b = new AudioBuffer({
            length: sweepLength,
            numberOfChannels: 1,
            sampleRate,
        });

        b.copyToChannel(this.sweep.inverseSweep, 0);
        convolver.normalize = false;
        convolver.buffer = b;

        const bufferSource = offlineContext.createBufferSource();
        bufferSource.buffer = sweepResponse;

        bufferSource.connect(convolver, 0, 0);
        convolver.connect(offlineContext.destination, 0, 0);
        bufferSource.start();

        const impulseResponse = await offlineContext.startRendering();
        const cutImpulseResponse = new AudioBuffer({
            length: numSamples - sweepLength,
            numberOfChannels: 1,
            sampleRate,
        });

        const cutIrData = cutImpulseResponse.getChannelData(0);
        const irData = impulseResponse.getChannelData(0);
        for (var i = 0; i < cutImpulseResponse.length; ++i)
            cutIrData[i] = irData[sweepLength + i];

        // fade in
        const fadeInSamples = (this.fadeSetting * sampleRate) / 1000;
        for (var i = 0; i < fadeInSamples; ++i) {
            const w = Math.sin(((i / fadeInSamples) * Math.PI) / 2) ** 2;
            cutIrData[i] *= w;
        }

        if (this.onImpulseResponseReady)
            this.onImpulseResponseReady(cutImpulseResponse);
    }
}
