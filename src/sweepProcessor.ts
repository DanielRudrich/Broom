enum State {
    Idle,
    Countdown,
    Recording,
}

class SweepProcessor extends AudioWorkletProcessor {
    state: State = State.Idle;
    delayCountDown: number = 0;
    recordingCountDown: number = 0;

    sweep: Float32Array;
    currentPlaybackIndex: number;

    response: Array<Float32Array>;

    inputLevel: number = 0;
    inputLevelUpdateInterval: number;
    inputLevelSamplesUntilUpdate: number;
    constructor() {
        super();

        this.inputLevelUpdateInterval = Math.round(sampleRate / 30);
        this.inputLevelSamplesUntilUpdate = this.inputLevelUpdateInterval;

        this.port.onmessage = (ev: MessageEvent<any>) => {
            const data = ev.data;
            if (data.action == "setSweep") {
                this.sweep = data.sweep;
                this.response = new Array<Float32Array>();
            } else if (data.action == "startRecording") {
                this.startRecording(data.settings);
            } else if (data.action == "stopRecording") {
                this.stopRecording();
            }
        };
    }

    private startRecording(settings: any) {
        this.response = new Array<Float32Array>();
        this.delayCountDown = settings.startDelay * sampleRate;
        this.recordingCountDown =
            settings.length * sampleRate + this.sweep.length;

        this.currentPlaybackIndex = 0;
        this.state = State.Countdown;
    }

    private stopRecording() {
        this.state = State.Idle;

        this.port.postMessage(
            { buffers: [...this.response] },
            this.response.map((o) => o.buffer)
        );

        this.response = new Array<Float32Array>();
    }

    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean {
        const inputData = inputs[0][0];
        if (!inputData) return true;

        const numInputSamples = inputData.length;

        // --------------- INPUT LEVEL ------------------------//
        for (let index = 0; index < numInputSamples; ++index) {
            const sample = Math.abs(inputData[index]);
            if (sample > this.inputLevel) this.inputLevel = sample;
            else this.inputLevel = 0.9995 * this.inputLevel + 0.0005 * sample;
        }

        this.inputLevelSamplesUntilUpdate -= numInputSamples;
        if (this.inputLevelSamplesUntilUpdate <= 0) {
            this.port.postMessage({
                inputLevel: this.inputLevel,
            });
            this.inputLevelSamplesUntilUpdate = this.inputLevelUpdateInterval;
        }

        // --------------- MEASUREMENT ------------------------//
        if (this.state == State.Countdown) {
            this.delayCountDown -= numInputSamples;
            if (this.delayCountDown <= 0) this.state = State.Recording;
        } else if (this.state == State.Recording) {
            if (inputs[0][0])
                this.response.push(new Float32Array(inputs[0][0]));

            if (this.currentPlaybackIndex < this.sweep.length) {
                const output = outputs[0][0];
                const numSamples = Math.min(
                    this.sweep.length - this.currentPlaybackIndex,
                    output.length
                );
                for (var i = 0; i < numSamples; ++i) {
                    output[i] = this.sweep[this.currentPlaybackIndex];
                    this.currentPlaybackIndex += 1;
                }
            }

            this.recordingCountDown -= numInputSamples;
            if (this.recordingCountDown <= 0) this.stopRecording();
        }

        return true;
    }
}

registerProcessor("SweepProcessor", SweepProcessor);
