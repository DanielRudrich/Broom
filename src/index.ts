import Dygraph from "dygraphs";
import { WAVFormat } from "./wavformat";
import { downloadWav } from "./utilities";
import { SweepProcessorNode } from "./sweepProcessorNode";
import {
    SweepUI,
    MeasurementUI,
    AudioDevices,
    refreshButton,
    startButton,
    measurementProgress,
    downloadButton,
    inputDeviceSelector,
    inputLevelMeter,
} from "./ui";

import { engine, SAMPLERATE } from "./audio";

engine.onInputLevelUpdate = (level: number) => {
    inputLevelMeter.value = level * 100;
};

const div = document.getElementById("gd");
const g = new Dygraph(div, [
    [0, 0],
    [1, 0],
]);

let currentImpulseResponse: AudioBuffer;
engine.onImpulseResponseReady = (ir: AudioBuffer) => {
    setMeasurementState(MeasurementState.Idle);
    currentImpulseResponse = ir;
    const irData = ir.getChannelData(0);
    const sampleRate = ir.sampleRate;

    var datapoints = [];
    for (var i = 0; i < irData.length; ++i)
        datapoints.push([i / sampleRate, irData[i]]);

    const div = document.getElementById("gd");
    const g = new Dygraph(div, datapoints);
};

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

downloadButton.onclick = async () => {
    if (currentImpulseResponse) {
        const wav = new WAVFormat(currentImpulseResponse);
        downloadWav(wav);
    }
};
