import { Sweep, SweepSettings } from "./sweep";
import { normalizeBuffer } from "./utilities";

export async function deconvolve(
    file: File | undefined | null,
    setProgress?: (progress: number | null) => void,
    settings?: SweepSettings,
) {
    if (!file) return;
    if (!settings) return;

    console.log(file);
    console.log(settings);

    const startTime = Date.now();

    // temporary one just to retrieve num channels and num samples
    let context = new OfflineAudioContext({
        numberOfChannels: 1,
        length: 128,
        sampleRate: settings.sampleRate,
    });

    setProgress?.(0);

    let buffer = await context.decodeAudioData(await file.arrayBuffer());

    const sweep = new Sweep(settings);
    const inverseSweep = new AudioBuffer({
        numberOfChannels: 1,
        length: sweep.inverseSweep.length,
        sampleRate: settings.sampleRate,
    });
    inverseSweep.copyToChannel(sweep.inverseSweep, 0);

    const sweepLength = inverseSweep.length;

    let numSamples = buffer.length + sweepLength - 1;
    let numChannels = buffer.numberOfChannels;

    context = new OfflineAudioContext({
        numberOfChannels: numChannels,
        length: numSamples,
        sampleRate: settings.sampleRate,
    });

    let source = context.createBufferSource();
    source.buffer = buffer;
    source.start();

    // split into channels

    let split = context.createChannelSplitter(numChannels);
    let merge = context.createChannelMerger(numChannels);

    source.connect(split);

    for (let i = 0; i < numChannels; ++i) {
        let convolver = context.createConvolver();
        convolver.normalize = false;
        convolver.buffer = inverseSweep;
        split.connect(convolver, i);
        convolver.connect(merge, 0, i);
    }

    merge.connect(context.destination);

    const promise = context.startRendering();

    let timer: NodeJS.Timeout | undefined;
    if (setProgress) {
        timer = setInterval(() => {
            const progress = ((context.currentTime * context.sampleRate) / numSamples) * 100;
            setProgress(progress);
        }, 100);
    }

    let resultBuffer = await promise;

    clearInterval(timer);

    let cut = new AudioBuffer({
        numberOfChannels: numChannels,
        length: numSamples - sweepLength,
        sampleRate: settings.sampleRate,
    });

    for (let i = 0; i < numChannels; ++i) {
        resultBuffer.copyFromChannel(cut.getChannelData(i), i, sweepLength);
    }

    normalizeBuffer(cut);

    setProgress?.(null);

    console.log(`Finished deconvolution - took ${Date.now() - startTime} ms`);

    return cut;
}
