import Dygraph from "dygraphs";
import { WAVFormat } from "./wavformat";
import {
    applyFadeIn,
    applyFadeOut,
    copyBuffer,
    downloadWav,
    normalizeBuffer,
    trimBuffer,
} from "./utilities";
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
    decibelsSwitch,
    normalizeButton,
    cutToSelectionButton,
    resetButton,
    fadeInTime,
    fadeInButton,
    fadeOutTime,
    fadeOutButton,
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

let originalImpulseResponse: AudioBuffer;
let processedImpulseResponse: AudioBuffer;
engine.onImpulseResponseReady = (ir: AudioBuffer) => {
    setMeasurementState(MeasurementState.Idle);
    originalImpulseResponse = ir;
    processedImpulseResponse = copyBuffer(originalImpulseResponse);
    plotBuffer(processedImpulseResponse);
};

function plotBuffer(buffer: AudioBuffer) {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    if (graph != null) graph.destroy();

    var datapoints = [];
    if (decibelsSwitch.checked) {
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

decibelsSwitch.oninput = async () => {
    if (processedImpulseResponse) plotBuffer(processedImpulseResponse);
};

normalizeButton.onclick = () => {
    if (processedImpulseResponse) {
        normalizeBuffer(processedImpulseResponse);
        plotBuffer(processedImpulseResponse);
    }
    return false;
};

downloadButton.onclick = async () => {
    if (processedImpulseResponse) {
        const wav = new WAVFormat(processedImpulseResponse);
        downloadWav(wav);
    }
};

cutToSelectionButton.onclick = () => {
    if (processedImpulseResponse) {
        const visibleRange = graph.xAxisRange();
        processedImpulseResponse = trimBuffer(
            processedImpulseResponse,
            visibleRange[0],
            visibleRange[1]
        );
        plotBuffer(processedImpulseResponse);
    }
    return false;
};

resetButton.onclick = () => {
    if (processedImpulseResponse) {
        processedImpulseResponse = copyBuffer(originalImpulseResponse);
        plotBuffer(processedImpulseResponse);
    }
    return false;
};

fadeInButton.onclick = () => {
    if (processedImpulseResponse) {
        applyFadeIn(processedImpulseResponse, parseInt(fadeInTime.value));
        plotBuffer(processedImpulseResponse);
    }
};

fadeOutButton.onclick = () => {
    if (processedImpulseResponse) {
        applyFadeOut(processedImpulseResponse, parseInt(fadeOutTime.value));
        plotBuffer(processedImpulseResponse);
    }
};
