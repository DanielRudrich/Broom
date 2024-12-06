export default function NamedValueDisplay({
    name,
    value,
    unit,
}: {
    name: string;
    value: number | string;
    unit: string;
}) {
    return (
        <div>
            {name}:&nbsp;
            <span style={{ wordSpacing: "-0.2em" }}>
                {value} {unit}
            </span>
        </div>
    );
}
