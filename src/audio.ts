import { SweepProcessorNode, MeasurementSettings } from "./sweepProcessorNode";
import { Sweep, SweepSettings } from "./sweep";

export const SAMPLERATE = 48000;

class AudioEngine {
    context: AudioContext;

    initialized = false;
    sweepProcessor: SweepProcessorNode;
    modulePromise: Promise<void>;

    stream: MediaStream;

    // callbacks
    onInputLevelUpdate: (level: number) => void;
    onImpulseResponseReady: (ir: AudioBuffer) => void;

    constructor() {
        this.context = new window.AudioContext({ sampleRate: SAMPLERATE });
        this.modulePromise =
            this.context.audioWorklet.addModule("sweepProcessor.js");
    }

    async init() {
        await this.modulePromise;

        this.sweepProcessor = new SweepProcessorNode(this.context);
        this.sweepProcessor.connect(this.context.destination, 0, 0);

        this.sweepProcessor.onImpulseResponseReady = (ir: AudioBuffer) => {
            if (this.onImpulseResponseReady) this.onImpulseResponseReady(ir);
        };
        this.sweepProcessor.onInputLevelUpdate = (level: number) => {
            if (this.onInputLevelUpdate) this.onInputLevelUpdate(level);
        };

        this.initialized = true;
    }

    resume() {
        if (this.context.state != "running") this.context.resume();
    }

    hasInput(): boolean {
        console.log("this stream");
        console.log(this.stream);
        if (this.stream) return true;

        return false;
    }

    async openDevice(devideIdentifier: any) {
        if (this.stream) {
            this.stream.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop();
            });
        }

        const constraints = {
            audio: {
                sampleRate: 48000,
                deviceId: devideIdentifier
                    ? { exact: devideIdentifier }
                    : undefined,
            },
        };
        await navigator.mediaDevices
            .getUserMedia(constraints)
            .then(this.gotStream.bind(this));
    }

    async gotStream(stream: MediaStream) {
        await stream.getTracks()[0].applyConstraints({
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
        });

        this.stream = stream;

        this.context
            .createMediaStreamSource(stream)
            .connect(this.sweepProcessor, 0, 0);
    }

    startMeasurement(
        SweepSettings: SweepSettings,
        measurementSettings: MeasurementSettings
    ) {
        if (!this.initialized) return false;
        if (!this.hasInput()) return false;

        let sweep = new Sweep(SweepSettings, SAMPLERATE);
        engine.sweepProcessor.setSweep(sweep);
        engine.sweepProcessor.startRecording(measurementSettings);

        return true;
    }

    stopMeasurement() {
        engine.sweepProcessor.stopRecording();
    }
}

export var engine = new AudioEngine();
