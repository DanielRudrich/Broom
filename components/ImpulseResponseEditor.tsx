"use client";
import { useImpulseResponseContext } from "@/lib/context/ImpulseResponseContext";
import BufferVisualizer from "./BufferVisualizer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function ImpulseResponseEditor() {
    const { impulseResponse } = useImpulseResponseContext();

    if (!impulseResponse) {
        return <></>;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    Impulse Response Post-processing
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <BufferVisualizer original={impulseResponse} />
            </CardContent>
        </Card>
    );
}
