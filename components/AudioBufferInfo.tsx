export default function AudioBufferInfo({ buffer }: { buffer: AudioBuffer }) {
    return (
        <div className="flex flex-row gap-2">
            <div className="flex flex-col items-center p-1">
                <div className="-mb-1 text-sm font-bold text-foreground">
                    {buffer.sampleRate} <span className="text-muted-foreground"></span>Hz
                </div>
                <div className="text-xs text-muted-foreground">Sample Rate</div>
            </div>
            <div className="flex flex-col items-center p-1">
                <div className="-mb-1 text-sm font-bold text-foreground">
                    {(buffer.length / buffer.sampleRate).toFixed(1)}{" "}
                    <span className="text-muted-foreground"></span>s
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
            </div>

            <div className="flex flex-col items-center p-1">
                <div className="-mb-1 text-sm font-bold text-foreground">{buffer.numberOfChannels}</div>
                <div className="text-xs text-muted-foreground">Channels</div>
            </div>
        </div>
    );
}
