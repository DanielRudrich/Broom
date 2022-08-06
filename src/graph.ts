import Dygraph from "dygraphs";
import { userInterface } from "./ui";

export class Graph {
    div: HTMLDivElement;
    graph: Dygraph;
    constructor() {
        this.div = document.getElementById("gd") as HTMLDivElement;
        this.graph = new Dygraph(
            this.div,
            [
                [0, 0],
                [1, 0],
            ],
            { labels: ["time in seconds", "IR"] }
        );
    }

    plotBuffer(buffer: AudioBuffer) {
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;

        if (this.graph != null) this.graph.destroy();

        var datapoints = [];
        if (userInterface.graphControls.isSetToDecibels()) {
            for (var i = 0; i < data.length; ++i)
                datapoints.push([
                    i / sampleRate,
                    20 * Math.log10(0.0000001 + Math.abs(data[i])),
                ]);
        } else {
            for (var i = 0; i < data.length; ++i)
                datapoints.push([i / sampleRate, data[i]]);
        }

        var opts = { labels: ["time in seconds", "IR"], color: "#1F96BF" };

        this.graph = new Dygraph(this.div, datapoints, opts);
    }

    getVisibleXRange() {
        return this.graph.xAxisRange();
    }
}
