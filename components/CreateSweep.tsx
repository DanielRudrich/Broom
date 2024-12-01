"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Sweep, SweepSettings } from "@/lib/sweep";
import { downloadBuffer } from "@/lib/utilities";
import { useState } from "react";
import { Download } from "lucide-react";

export default function CreateSweep() {
    const [sampleRate, setSampleRate] = useState<string>("48000");
    const [duration, setDuration] = useState<number>(5);
    const [startFrequency, setStartFrequency] = useState<number>(20);

    const settings = {
        sampleRate: parseInt(sampleRate),
        lengthInSeconds: duration,
        startFrequency,
    };
    const code = Sweep.getCode(settings);

    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    Create Sweep
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="sample-rate">Sample Rate</Label>
                    <Select value={sampleRate} onValueChange={setSampleRate}>
                        <SelectTrigger id="sample-rate" className="w-full">
                            <SelectValue placeholder="Select sample rate" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="44100">44100 Hz</SelectItem>
                            <SelectItem value="48000">48000 Hz</SelectItem>
                            <SelectItem value="96000">96000 Hz</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Slider
                        id="duration"
                        min={1}
                        max={60}
                        step={1}
                        value={[duration]}
                        onValueChange={(value) => setDuration(value[0])}
                        className="w-full"
                    />
                    <p className="text-right text-sm">{duration} seconds</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="start-frequency">Start Frequency</Label>
                    <Slider
                        id="start-frequency"
                        min={10}
                        max={50}
                        step={1}
                        value={[startFrequency]}
                        onValueChange={(value) => setStartFrequency(value[0])}
                        className="w-full"
                    />
                    <p className="text-right text-sm">{startFrequency} Hz</p>
                </div>

                <div className="flex items-center justify-between">
                    <Button onClick={() => createSweepAndDownload(settings)}>
                        <Download /> Download
                    </Button>

                    <div className="font-mono text-xs text-muted-foreground">
                        {code}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

async function createSweepAndDownload(settings: SweepSettings) {
    const sweep = new Sweep(settings);
    downloadBuffer(sweep.sweep, sweep.code + ".wav");
}
