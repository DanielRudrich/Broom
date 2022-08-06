import { WAVFormat } from "./wavformat";
import {
    applyFadeIn,
    applyFadeOut,
    copyBuffer,
    downloadBuffer,
    normalizeBuffer,
    trimBuffer,
} from "./utilities";
import { userInterface } from "./ui";
import { Graph } from "./graph";
import { MeasurementState } from "./types";
import { engine } from "./audio";

const graph = new Graph();

engine.onInputLevelUpdate = userInterface.setInputLevel.bind(userInterface);

let originalImpulseResponse: AudioBuffer;
let processedImpulseResponse: AudioBuffer;
engine.onImpulseResponseReady = (ir: AudioBuffer) => {
    setMeasurementState(MeasurementState.Idle);
    originalImpulseResponse = ir;
    processedImpulseResponse = copyBuffer(originalImpulseResponse);
    graph.plotBuffer(processedImpulseResponse);
};

userInterface.inputDeviceSelector.oninput = async () => {
    openDeviceAndUpdateList();
};

async function openDeviceAndUpdateList() {
    const deviceID = userInterface.getSelectedDeviceIdentifier();
    console.log(deviceID);
    await engine.openDevice(deviceID);
    userInterface.updateDeviceList(
        engine.stream.getTracks()[0].getSettings().deviceId
    );

    userInterface.sampleRateInfo.innerHTML = `Input ${
        engine.stream.getAudioTracks()[0].getSettings().sampleRate
    } Hz - Output ${engine.context.sampleRate} Hz `;
}

userInterface.refreshButton.onclick = async () => {
    if (!engine.initialized) await engine.init();
    engine.resume();
    openDeviceAndUpdateList();
};

let measurementState = MeasurementState.Idle;

function setMeasurementState(state: MeasurementState) {
    if (measurementState == state) return;

    measurementState = state;
    userInterface.setMeasurementState(state);
}

userInterface.startButton.onclick = async () => {
    if (!engine.initialized) await engine.init();

    if (measurementState == MeasurementState.Idle) {
        const started = engine.startMeasurement(
            userInterface.getSweepSettings(),
            userInterface.getMeasurementSettings()
        );

        if (started) {
            setMeasurementState(MeasurementState.Recording);
        } else {
            window.alert("Please check audio settings!");
        }
    } else {
        engine.stopMeasurement();
        setMeasurementState(MeasurementState.Idle);
    }
};

userInterface.graphControls.decibelsSwitch.oninput = async () => {
    if (processedImpulseResponse) graph.plotBuffer(processedImpulseResponse);
};

userInterface.graphControls.normalizeButton.onclick = () => {
    if (processedImpulseResponse) {
        normalizeBuffer(processedImpulseResponse);
        graph.plotBuffer(processedImpulseResponse);
    }
    return false;
};

userInterface.downloadButton.onclick = async () => {
    if (processedImpulseResponse) downloadBuffer(processedImpulseResponse);
};

userInterface.graphControls.cutToSelectionButton.onclick = () => {
    if (processedImpulseResponse) {
        const visibleRange = graph.getVisibleXRange();
        processedImpulseResponse = trimBuffer(
            processedImpulseResponse,
            visibleRange[0],
            visibleRange[1]
        );
        graph.plotBuffer(processedImpulseResponse);
    }
    return false;
};

userInterface.graphControls.resetButton.onclick = () => {
    if (processedImpulseResponse) {
        processedImpulseResponse = copyBuffer(originalImpulseResponse);
        graph.plotBuffer(processedImpulseResponse);
    }
    return false;
};

userInterface.graphControls.fadeInButton.onclick = () => {
    if (processedImpulseResponse) {
        applyFadeIn(
            processedImpulseResponse,
            userInterface.graphControls.getFadeInTime()
        );
        graph.plotBuffer(processedImpulseResponse);
    }
};

userInterface.graphControls.fadeOutButton.onclick = () => {
    if (processedImpulseResponse) {
        applyFadeOut(
            processedImpulseResponse,
            userInterface.graphControls.getFadeOutTime()
        );
        graph.plotBuffer(processedImpulseResponse);
    }
};
