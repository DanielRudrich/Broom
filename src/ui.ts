import { SweepSettings } from "./sweep";
import { MeasurementSettings } from "./sweepProcessorNode";

function gid(id: string) {
    return document.getElementById(id);
}

export const startButton = gid("start");
export const downloadButton = gid("downloadButton");
export const measurementProgress = <HTMLProgressElement>(
    gid("measurementProgress")
);

function setUpSlider(name: string): HTMLInputElement {
    const slider = (<HTMLInputElement>gid(name)) as HTMLInputElement;
    const value = <HTMLInputElement>gid(name + "Value");
    slider.oninput = () => {
        value.innerHTML = slider.value;
    };
    return slider;
}

export const sweepLengthSlider = setUpSlider("sweepLength");
export const sweepStartFrequencySlider = setUpSlider("sweepStartFrequency");

const inputLevelMeter = <HTMLProgressElement>gid("inputLevelMeter");
const measurementLevelMeter = <HTMLProgressElement>gid("measurementLevelMeter");

export const inputDeviceSelector = <HTMLSelectElement>gid("inputDevices");

export function setInputLevel(level: number) {
    inputLevelMeter.value = level;
    measurementLevelMeter.value = level;
}

function gotDevices(
    selectedDevice: string,
    deviceInfos: Array<MediaDeviceInfo>
) {
    while (inputDeviceSelector.firstChild)
        inputDeviceSelector.removeChild(inputDeviceSelector.firstChild);

    const option = <HTMLOptionElement>document.createElement("option");
    option.value = "";
    option.text = "Select input device";
    option.disabled = true;
    inputDeviceSelector.appendChild(option);

    deviceInfos.forEach((info: MediaDeviceInfo) => {
        const option = document.createElement("option");
        option.value = info.deviceId;
        if (info.kind === "audioinput") {
            option.text =
                info.label || `microphone ${inputDeviceSelector.length + 1}`;
            inputDeviceSelector.appendChild(option);
        }
    });

    inputDeviceSelector.childNodes.forEach((element: any) => {
        console.log(element);
    });

    if (
        Array.prototype.slice
            .call(inputDeviceSelector.childNodes)
            .some((n: any) => n.value === selectedDevice)
    ) {
        inputDeviceSelector.value = selectedDevice;
    }
}

export namespace AudioDevices {
    export function getSelectedDeviceIdentifier() {
        return inputDeviceSelector.value;
    }

    export function updateList(deviceId: any) {
        navigator.mediaDevices
            .enumerateDevices()
            .then(gotDevices.bind(this, deviceId));
    }
}

// ==== SWEEP SETTINGS ============ //
export namespace SweepUI {
    export function getSettings() {
        return new SweepSettings(
            parseInt(sweepLengthSlider.value),
            parseInt(sweepStartFrequencySlider.value)
        );
    }

    export function updateList(deviceId: any) {
        navigator.mediaDevices
            .enumerateDevices()
            .then(gotDevices.bind(this, deviceId));
    }
}

// ==== MEASUREMENT SETTINGS ============ //
const recordDelay = <HTMLInputElement>document.getElementById("recordDelay");
const irLength = <HTMLInputElement>document.getElementById("irLength");
const fadeInTime = <HTMLInputElement>document.getElementById("fadeInTime");
export namespace MeasurementUI {
    export function getSettings() {
        return new MeasurementSettings(
            parseInt(recordDelay.value),
            parseInt(irLength.value),
            parseInt(fadeInTime.value)
        );
    }
}

export var onNewInputStream: (stream: MediaStream) => void;

function gotStream(receivedStream: MediaStream) {
    stream = receivedStream;
    if (onNewInputStream) onNewInputStream(receivedStream);
    return navigator.mediaDevices.enumerateDevices();
}

export let stream: MediaStream;

export const refreshButton = <HTMLButtonElement>(
    document.getElementById("refreshDevices")
);
