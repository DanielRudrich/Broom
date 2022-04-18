import Dygraph from "dygraphs";
import { WAVFormat } from "./wavformat";
import { downloadWav, normalizeBuffer } from "./utilities";
import {
    SweepUI,
    MeasurementUI,
    AudioDevices,
    refreshButton,
    startButton,
    measurementProgress,
    downloadButton,
    inputDeviceSelector,
    setInputLevel,
    normalizeButton,
} from "./ui";

import { engine } from "./audio";

engine.onInputLevelUpdate = (level: number) => {
    const dB = 20 * Math.log10(level);
    const value = Math.max(0, (dB / 60 + 1) * 100);
    setInputLevel(value);
};

const div = document.getElementById("gd");
let graph = new Dygraph(
    div,
    [
        [0, 0],
        [1, 0],
    ],
    { labels: ["time in seconds", "IR"] }
);

let currentImpulseResponse: AudioBuffer;
engine.onImpulseResponseReady = (ir: AudioBuffer) => {
    setMeasurementState(MeasurementState.Idle);
    currentImpulseResponse = ir;
    plotBuffer(ir);
};

function plotBuffer(buffer: AudioBuffer) {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    if (graph != null) graph.destroy();

    var datapoints = [];
    for (var i = 0; i < data.length; ++i)
        datapoints.push([i / sampleRate, data[i]]);

    var opts = { labels: ["time in seconds", "IR"] };
    const div = document.getElementById("gd");
    graph = new Dygraph(div, datapoints, opts);
}

inputDeviceSelector.oninput = async () => {
    openDeviceAndUpdateList();
};

async function openDeviceAndUpdateList() {
    const deviceID = AudioDevices.getSelectedDeviceIdentifier();
    console.log(deviceID);
    await engine.openDevice(deviceID);
    AudioDevices.updateList(
        engine.stream.getTracks()[0].getSettings().deviceId
    );
}
refreshButton.onclick = async () => {
    if (!engine.initialized) await engine.init();
    engine.resume();
    openDeviceAndUpdateList();
};

enum MeasurementState {
    Idle,
    Recording,
}
let measurementState = MeasurementState.Idle;

function setMeasurementState(state: MeasurementState) {
    if (measurementState == state) return;

    measurementState = state;
    if (state == MeasurementState.Recording) {
        measurementProgress.hidden = false;
        startButton.classList.add("secondary");
        startButton.innerHTML = "Measurement in progress... (click to abort)";
    } else {
        measurementProgress.hidden = true;
        startButton.classList.remove("secondary");
        startButton.innerHTML = "Start measurement";
    }
}
startButton.onclick = async () => {
    if (!engine.initialized) await engine.init();

    if (measurementState == MeasurementState.Idle) {
        const result = engine.startMeasurement(
            SweepUI.getSettings(),
            MeasurementUI.getSettings()
        );

        if (result) {
            setMeasurementState(MeasurementState.Recording);
        } else {
            window.alert("Please check audio settings!");
        }
    } else {
        engine.stopMeasurement();
        setMeasurementState(MeasurementState.Idle);
    }
};

normalizeButton.onclick = async () => {
    if (currentImpulseResponse) {
        normalizeBuffer(currentImpulseResponse);
        plotBuffer(currentImpulseResponse);
    }
};

downloadButton.onclick = async () => {
    if (currentImpulseResponse) {
        const wav = new WAVFormat(currentImpulseResponse);
        downloadWav(wav);
    }
};
