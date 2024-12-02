"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sweep, SweepSettings } from "@/lib/sweep";
import { downloadBuffer } from "@/lib/utilities";
import { useState } from "react";
import { Cog } from "lucide-react";

export default function ProcessSweepResponse() {
    const [file, setFile] = useState<File | null>();
    const [code, setCode] = useState<string>("");

    let sweepSettings = Sweep.getSettingsFromCode(code);

    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    Process Sweep Response
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="sweep-code">Sweep Code</Label>
                    <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    {sweepSettings ? (
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Sample Rate: {sweepSettings.sampleRate} Hz
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Duration: {sweepSettings.lengthInSeconds} s
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Start Frequency: {sweepSettings.startFrequency}{" "}
                                Hz
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Invalid sweep code.
                        </div>
                    )}
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="sweep-response">Sweep Resonse</Label>
                    <Input
                        id="sweep-response"
                        type="file"
                        accept="audio/wav"
                        onChange={(e) => setFile(e.target.files?.item(0))}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Button onClick={() => deconvolve(file, sweepSettings)}>
                        <Cog /> Deconvolve
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

async function deconvolve(
    file: File | undefined | null,
    settings?: SweepSettings,
) {
    if (!file) return;
    if (!settings) return;

    console.log(file);
    console.log(settings);

    // temporary one just to retrieve num channels and num samples
    let context = new OfflineAudioContext({
        numberOfChannels: 1,
        length: 128,
        sampleRate: settings.sampleRate,
    });

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

    let resultBuffer = await context.startRendering();
    console.log(resultBuffer);

    let cut = new AudioBuffer({
        numberOfChannels: numChannels,
        length: numSamples - sweepLength,
        sampleRate: settings.sampleRate,
    });

    for (let i = 0; i < numChannels; ++i) {
        resultBuffer.copyFromChannel(cut.getChannelData(i), i, sweepLength);
    }

    downloadBuffer(cut, "ir.wav");
}
