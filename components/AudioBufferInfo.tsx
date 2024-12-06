import NamedValueDisplay from "./NamedValueDisplay";

export default function AudioBufferInfo({ buffer }: { buffer: AudioBuffer }) {
    return (
        <div className="ml-3 text-xs text-muted-foreground">
            <NamedValueDisplay name="Sample Rate" value={buffer.sampleRate} unit="Hz" />
            <NamedValueDisplay
                name="Duration"
                value={(buffer.length / buffer.sampleRate).toFixed(1)}
                unit="s"
            />
            <NamedValueDisplay name="Number of Channels" value={buffer.numberOfChannels} unit="" />
            <NamedValueDisplay name="Number of Samples" value={buffer.length} unit="" />
        </div>
    );
}
