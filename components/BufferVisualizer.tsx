import {
    applyFadeInSamples,
    applyFadeOutSamples,
    copyBuffer,
    downloadBuffer,
    trimBufferSamples,
} from "@/lib/utilities";
import { ReactNode, useEffect, useRef } from "react";

import { useState } from "react";
import { Button } from "./ui/button";
import AudioBufferInfo from "./AudioBufferInfo";
import {
    BookX,
    ChartColumnDecreasing,
    ChartColumnIncreasing,
    Download,
    MoveHorizontal,
    RotateCcw,
    ScanSearch,
} from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

enum Tool {
    Pan = "Pan",
    Zoom = "Zoom",
    TrimStart = "TrimStart",
    TrimEnd = "TrimEnd",
    FadeIn = "FadeIn",
    FadeOut = "FadeOut",
}

const getToolFromString = (tool: string): Tool => {
    switch (tool) {
        case "Pan":
            return Tool.Pan;
        case "Zoom":
            return Tool.Zoom;
        case "TrimStart":
            return Tool.TrimStart;
        case "TrimEnd":
            return Tool.TrimEnd;
        case "FadeIn":
            return Tool.FadeIn;
        case "FadeOut":
            return Tool.FadeOut;
        default:
            return Tool.Pan;
    }
};

const tools: { name: string; tool: Tool; icon?: ReactNode }[] = [
    { name: "Pan", tool: Tool.Pan, icon: <MoveHorizontal size={12} /> },
    { name: "Zoom", tool: Tool.Zoom, icon: <ScanSearch size={12} /> },
    {
        name: "Trim Start",
        tool: Tool.TrimStart,
        icon: <BookX className="rotate-90 -scale-y-100" size={12} />,
    },
    { name: "Trim End", tool: Tool.TrimEnd, icon: <BookX className="rotate-90" size={12} /> },
    { name: "Fade In", tool: Tool.FadeIn, icon: <ChartColumnIncreasing size={12} /> },
    { name: "Fade Out", tool: Tool.FadeOut, icon: <ChartColumnDecreasing size={12} /> },
];

const PADDING_LEFT = 80;
const PADDING_RIGHT = 50;
const PADDINT_TOP = 10;
const PADDING_BOTTOM = 30;

export default function BufferVisualizer({ original }: { original: AudioBuffer }) {
    const [buffer, setBuffer] = useState<AudioBuffer>(copyBuffer(original));

    useEffect(() => {
        setBuffer(copyBuffer(original));
    }, [original]);

    const [showDecibels, setShowDecibels] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const zoomRangeWhenStartedDragging = useRef<[number, number] | null>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);

    const [tool, setTool] = useState<Tool>(Tool.Pan);

    const clampToCanvas = (value: number) =>
        Math.min(
            canvasRef.current!.clientWidth - PADDING_RIGHT / window.devicePixelRatio,
            Math.max(PADDING_LEFT / window.devicePixelRatio, value),
        );

    const canvasToSample = (x: number) => {
        const width = canvasRef.current!.width - PADDING_LEFT - PADDING_RIGHT;

        const start = zoomRange ? zoomRange[0] : 0;
        const end = zoomRange ? zoomRange[1] : buffer.length;

        return Math.floor(start + ((x * window.devicePixelRatio - PADDING_LEFT) / width) * (end - start));
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const startTime = performance.now();

        ctx.resetTransform();
        let { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";

        const start = zoomRange ? zoomRange[0] : 0;
        const end = zoomRange ? zoomRange[1] : buffer.length;

        height -= PADDINT_TOP + PADDING_BOTTOM;
        width -= PADDING_LEFT + PADDING_RIGHT;

        ctx.translate(PADDING_LEFT, PADDINT_TOP);

        const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };

        const DYN_RANGE_IN_DECIBELS = 80;

        const decibelsToHeight = (dB: number) =>
            (-Math.max(-DYN_RANGE_IN_DECIBELS, Math.min(0, dB)) / DYN_RANGE_IN_DECIBELS) * height;

        [0, width].forEach((x) => drawLine(x, 0, x, height));
        [0, height].forEach((y) => drawLine(0, y, width, y));

        // Draw Y-axis labels
        const fontHeight = 12 * window.devicePixelRatio;
        ctx.font = `${fontHeight}px Arial`;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";

        const drawYTick = (value: string, y: number) => {
            ctx.fillText(value, -7, y);
            drawLine(-5, y, 0, y);
        };

        if (showDecibels) {
            [...Array(9).keys()]
                .map((x) => -10.0 * x)
                .forEach((value) => drawYTick(value.toFixed(1), decibelsToHeight(value)));
        } else {
            [1.0, 0.5, 0.0, -0.5, -1.0].forEach((value) =>
                drawYTick(value.toFixed(1), ((1.0 - value) / 2) * height),
            );
        }

        // Draw X-axis labels and ticks
        const tickCount = 10;
        const tickSpacing = width / tickCount;
        const sampleSpacing = (end - start) / tickCount;

        ctx.textAlign = "center";
        for (let i = 0; i <= tickCount; i++) {
            const x = i * tickSpacing;
            const sample = Math.floor(start + i * sampleSpacing);
            ctx.fillText(sample.toString(), x, height + 20);
            ctx.beginPath();
            ctx.moveTo(x, height);
            ctx.lineTo(x, height + 5);
            ctx.stroke();
        }

        ctx.strokeStyle = "black";

        const step = Math.max(1, Math.floor((end - start) / width));
        for (let ch = 0; ch < buffer.numberOfChannels; ++ch) {
            const bufferData = buffer.getChannelData(ch);
            ctx.beginPath();
            const sliceWidth = width / ((end - start) / step);
            let x = 0;

            for (let i = start; i < end; i += step) {
                let min = 1.0;
                let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const value = bufferData[i + j];
                    if (value < min) min = value;
                    if (value > max) max = value;
                }

                if (showDecibels) [min, max] = [min, max].map((x) => 20 * Math.log10(Math.abs(x)));

                const yMin = showDecibels ? decibelsToHeight(min) : (min * 0.5 + 0.5) * height;
                const yMax = showDecibels ? decibelsToHeight(max) : (max * 0.5 + 0.5) * height;

                if (i === start) {
                    ctx.moveTo(x, yMin);
                } else {
                    ctx.lineTo(x, yMin);
                }
                ctx.lineTo(x, yMax);

                x += sliceWidth;
            }

            ctx.stroke();
        }

        console.log(`Render finished - took ${(performance.now() - startTime).toFixed(1)} ms`);
    };

    useEffect(() => {
        draw();
    }, [buffer, zoomRange, showDecibels]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const debounce = (func: () => void, wait: number) => {
            let timeout: NodeJS.Timeout;
            return () => {
                clearTimeout(timeout);
                timeout = setTimeout(func, wait);
            };
        };

        const handleResize = debounce(() => {
            canvas.width = window.devicePixelRatio * canvas.clientWidth;
            canvas.height = window.devicePixelRatio * canvas.clientHeight;
            console.log(`Resized canvas to ${canvas.width}x${canvas.height}`);
            draw();
        }, 200);

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas);

        handleResize();

        return () => {
            resizeObserver.unobserve(canvas);
            resizeObserver.disconnect();
        };
    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.setPointerCapture(e.pointerId);

        if (tool === Tool.Zoom) {
            setIsDragging(true);
            setShowOverlay(true);
            setDragStart(clampToCanvas(e.nativeEvent.offsetX));
            setDragEnd(clampToCanvas(e.nativeEvent.offsetX));
        } else if (tool === Tool.Pan) {
            setIsDragging(true);
            zoomRangeWhenStartedDragging.current = [...(zoomRange || [0, buffer.length])];
            setDragStart(clampToCanvas(e.nativeEvent.offsetX));
        }
    };

    const handlePointerEnter = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (
            tool === Tool.TrimStart ||
            tool === Tool.TrimEnd ||
            tool === Tool.FadeIn ||
            tool === Tool.FadeOut
        ) {
            setShowOverlay(true);
        }
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (
            tool === Tool.TrimStart ||
            tool === Tool.TrimEnd ||
            tool === Tool.FadeIn ||
            tool === Tool.FadeOut
        ) {
            setShowOverlay(false);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (tool === Tool.Zoom) {
            if (!isDragging || dragStart === null) return;

            setDragEnd(clampToCanvas(e.nativeEvent.offsetX));

            const overlay = overlayRef.current;
            if (!overlay) return;

            const start = Math.min(dragStart, clampToCanvas(e.nativeEvent.offsetX));
            const end = Math.max(dragStart, clampToCanvas(e.nativeEvent.offsetX));

            overlay.style.left = `${start}px`;
            overlay.style.width = `${end - start}px`;
        } else if (tool === Tool.TrimEnd) {
            const start = clampToCanvas(e.nativeEvent.offsetX);
            const overlay = overlayRef.current;
            if (!overlay) return;

            overlay.style.left = `${start}px`;
            overlay.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            overlay.style.borderLeft = "1px solid red";
            overlay.style.width = `${canvasRef.current!.clientWidth - start}px`;
        } else if (tool === Tool.TrimStart) {
            const start = clampToCanvas(e.nativeEvent.offsetX);
            const overlay = overlayRef.current;
            if (!overlay) return;

            overlay.style.right = `${canvasRef.current!.clientWidth - start}px`;
            overlay.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            overlay.style.borderRight = "1px solid red";
            overlay.style.width = `${start}px`;
        } else if (tool === Tool.FadeOut) {
            const start = clampToCanvas(e.nativeEvent.offsetX);
            const overlay = overlayRef.current;
            if (!overlay) return;

            overlay.style.left = `${start}px`;
            overlay.style.backgroundColor = "rgba(0, 0, 255, 0.1)";
            overlay.style.borderLeft = "1px solid blue";
            overlay.style.width = `${canvasRef.current!.clientWidth - start}px`;
        } else if (tool === Tool.FadeIn) {
            const start = clampToCanvas(e.nativeEvent.offsetX);
            const overlay = overlayRef.current;
            if (!overlay) return;

            overlay.style.right = `${canvasRef.current!.clientWidth - start}px`;
            overlay.style.backgroundColor = "rgba(0, 0, 255, 0.1)";
            overlay.style.borderRight = "1px solid blue";
            overlay.style.width = `${start}px`;
        } else if (tool === Tool.Pan) {
            if (!isDragging || dragStart === null) return;

            const startSamples = canvasToSample(dragStart);
            const endSamples = canvasToSample(e.nativeEvent.offsetX);
            const delta = startSamples - endSamples;

            if (delta < 0) {
                const actualDelta = Math.min(Math.abs(delta), zoomRangeWhenStartedDragging.current![0]);
                setZoomRange([
                    zoomRangeWhenStartedDragging.current![0] - actualDelta,
                    zoomRangeWhenStartedDragging.current![1] - actualDelta,
                ]);
            } else {
                const actualDelta = Math.min(
                    Math.abs(delta),
                    buffer.length - zoomRangeWhenStartedDragging.current![1],
                );
                setZoomRange([
                    zoomRangeWhenStartedDragging.current![0] + actualDelta,
                    zoomRangeWhenStartedDragging.current![1] + actualDelta,
                ]);
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsDragging(false);

        canvas.releasePointerCapture(e.pointerId);

        if (tool === Tool.Zoom) {
            setShowOverlay(false);
            setIsDragging(false);
            if (dragStart !== null && dragEnd !== null) {
                const [zoomStart, zoomEnd] = [dragStart, dragEnd]
                    .map((x) => canvasToSample(clampToCanvas(x)))
                    .sort((a, b) => a - b);

                // TODO: min zoom range!
                if (zoomStart !== zoomEnd) {
                    console.log(`Zooming to ${zoomStart} - ${zoomEnd}`);

                    setZoomRange([zoomStart, zoomEnd]);
                } else {
                    let currentRange = zoomRange ? zoomRange[1] - zoomRange[0] : buffer.length;
                    let newRange = Math.floor(currentRange / 2);
                    let newRangeHalf = Math.floor(newRange / 2);
                    let newStart = Math.max(0, zoomStart - newRangeHalf);
                    let newEnd = Math.min(buffer.length, zoomStart + newRangeHalf);
                    setZoomRange([newStart, newEnd]);
                }
            }
            setDragStart(null);
            setDragEnd(null);
        } else if (tool === Tool.TrimStart) {
            const startSample = canvasToSample(clampToCanvas(e.nativeEvent.offsetX));
            const trimmed = trimBufferSamples(buffer, startSample, buffer.length);
            setBuffer(trimmed);
            setZoomRange([0, trimmed.length]);
        } else if (tool === Tool.TrimEnd) {
            const startSample = canvasToSample(clampToCanvas(e.nativeEvent.offsetX));
            const trimmed = trimBufferSamples(buffer, 0, startSample);
            setBuffer(trimmed);
            setZoomRange([0, trimmed.length]);
        } else if (tool === Tool.Pan) {
            setDragStart(null);
            setDragEnd(null);
        } else if (tool === Tool.FadeIn) {
            const sample = canvasToSample(clampToCanvas(e.nativeEvent.offsetX));
            const copy = copyBuffer(buffer);
            applyFadeInSamples(copy, sample);
            setBuffer(copy);
        } else if (tool === Tool.FadeOut) {
            const sample = canvasToSample(clampToCanvas(e.nativeEvent.offsetX));
            const copy = copyBuffer(buffer);
            applyFadeOutSamples(copy, copy.length - sample);
            setBuffer(copy);
        }
    };

    const handleDoubleClick = () => {
        if (tool === Tool.Zoom) {
            setZoomRange(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-row items-center gap-2">
                <Button
                    onClick={() => {
                        setBuffer(copyBuffer(original));
                        setZoomRange([0, original.length]);
                    }}
                >
                    <RotateCcw /> Restore Original
                </Button>
                <AudioBufferInfo buffer={buffer} />
                <Button
                    onClick={() => {
                        if (buffer) {
                            downloadBuffer(buffer, "ir.wav");
                        }
                    }}
                >
                    <Download /> Download Processed
                </Button>
            </div>

            <div className="flex flex-row gap-1">
                <ToggleGroup
                    value={tool}
                    onValueChange={(value) => setTool(getToolFromString(value))}
                    type="single"
                >
                    {tools.map((toolObj) => (
                        <ToggleGroupItem key={toolObj.tool} value={toolObj.tool}>
                            {toolObj.icon}
                            <div>{toolObj.name}</div>
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
                <div className="flex items-center space-x-2">
                    <Switch id="decibels" onCheckedChange={setShowDecibels} />
                    <Label htmlFor="decibels">Decibels</Label>
                </div>
            </div>

            <div className="relative w-full">
                <canvas
                    className={`h-96 w-full ${tool === Tool.Zoom ? "cursor-zoom-in" : tool === Tool.Pan ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onDoubleClick={handleDoubleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                />
                {showOverlay && (
                    <div
                        ref={overlayRef}
                        style={{
                            position: "absolute",
                            top: 0,
                            height: "100%",
                            pointerEvents: "none",
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                        }}
                    />
                )}
            </div>
        </div>
    );
}
