"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sweep } from "@/lib/sweep";
import { downloadBuffer } from "@/lib/utilities";
import { useState } from "react";
import { Cog, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSweepCodeContext } from "@/lib/context/SweepCodeContext";
import NamedValueDisplay from "./NamedValueDisplay";
import { deconvolve } from "@/lib/deconvolution";
import Info from "./Info";
import { useImpulseResponseContext } from "@/lib/context/ImpulseResponseContext";
import AudioBufferInfo from "./AudioBufferInfo";

export default function ProcessSweepResponse() {
    const { impulseResponse, setImpulseResponse } = useImpulseResponseContext();
    const { sweepCode } = useSweepCodeContext();

    const [file, setFile] = useState<File | null>();
    const [code, setCode] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    let sweepSettings = Sweep.getSettingsFromCode(code || sweepCode);

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">Process Sweep Response</CardTitle>
                <CardDescription>Transform a sweep response to an impulse response.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="sweep-code" className="-mb-1 flex flex-row items-center gap-1">
                        <div>Sweep Code</div>{" "}
                        <Info content="Make sure to use the Sweep Code of the sweep used in the measurement. It is embedded in the sweep's filename." />
                    </Label>
                    <Input
                        className={`font-mono ${!sweepSettings && "border-red-400 focus-visible:ring-red-500"}`}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={sweepCode}
                        id="sweep-code"
                    />
                    <div className="h-10">
                        {sweepSettings ? (
                            <div className="ml-3 text-xs text-muted-foreground">
                                <NamedValueDisplay
                                    name="Sample Rate"
                                    value={sweepSettings.sampleRate}
                                    unit="Hz"
                                />
                                <NamedValueDisplay
                                    name="Sweep Duration"
                                    value={sweepSettings.lengthInSeconds}
                                    unit="s"
                                />
                                <NamedValueDisplay
                                    name="Start Frequency"
                                    value={sweepSettings.startFrequency}
                                    unit="Hz"
                                />
                            </div>
                        ) : (
                            <div className="tex text-sm text-destructive">Invalid sweep code.</div>
                        )}
                    </div>
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
                    <Button
                        disabled={!file || !sweepSettings || progress !== null}
                        onClick={() => {
                            setError("");
                            setImpulseResponse(undefined);
                            deconvolve(file, setProgress, sweepSettings)
                                .then((buffer) => {
                                    setImpulseResponse(buffer);
                                })
                                .catch((e) => {
                                    setError("Failed to load audio file, please try a different browser.");
                                    setProgress(null);
                                });
                        }}
                    >
                        <Cog className={`${progress !== null && "animate-spin"}`} />
                        {progress !== null ? "Processing..." : "Process Sweep Response"}
                    </Button>
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                {progress !== null && <Progress className="" value={progress} />}
                {impulseResponse && (
                    <div>
                        <Label htmlFor="sweep-code" className="flex flex-row items-center gap-1">
                            <div>Raw Impulse Response</div>
                            <Info content="The deconvolution result, normalized and with the noncausal part removed." />
                        </Label>
                        <div className="flex w-full flex-row items-center justify-between rounded p-1">
                            <AudioBufferInfo buffer={impulseResponse} />
                            <Button
                                size={"sm"}
                                onClick={() => {
                                    if (impulseResponse) {
                                        downloadBuffer(impulseResponse, "broom-ir.wav");
                                    }
                                }}
                            >
                                <Download /> Download
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
