import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { copyBufferStereo } from "@/lib/utilities";
import { LoaderCircle, Pause, Play } from "lucide-react";
import { setConfig } from "next/config";

export default function AudioPlayer({ buffer }: { buffer: AudioBuffer }) {
    const [initialized, setInitialized] = useState(false);

    const playback = useRef<{
        context: AudioContext;
        convolver: ConvolverNode;
        gain: GainNode;
        input?: AudioBuffer;
        player?: AudioBufferSourceNode;
    } | null>(null);

    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const context = new AudioContext();
        const convolver = context.createConvolver();
        convolver.connect(context.destination);
        convolver.normalize = false;
        const gain = context.createGain();
        gain.gain.value = 0.5;
        gain.connect(convolver);

        // fetch sample.mp3 and decode
        fetch("/sample.mp3")
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => {
                context.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                    playback.current!.input = decodedBuffer;
                    setInitialized(true);
                });
            });

        context.resume();
        playback.current = { context, convolver, gain };

        return () => {
            context.close();
        };
    }, []);

    useEffect(() => {
        console.log("Updating bufferf");
        playback.current!.convolver.buffer = copyBufferStereo(buffer);
    }, [buffer]);

    return (
        <div>
            {!initialized ? (
                <LoaderCircle className="animate-spin" />
            ) : (
                <Button
                    variant={"secondary"}
                    className="aspect-square rounded-full p-2"
                    onClick={() => {
                        setPlaying(!playing);
                        if (playing) {
                            playback.current!.player!.stop();
                            playback.current!.player!.disconnect();
                        } else {
                            const player = playback.current!.context.createBufferSource();
                            player.buffer = playback.current!.input!;
                            player.connect(playback.current!.gain);
                            player.loop = true;
                            player.start();
                            playback.current!.player = player;
                        }
                    }}
                >
                    {playing ? <Pause /> : <Play />}
                </Button>
            )}
        </div>
    );
}
