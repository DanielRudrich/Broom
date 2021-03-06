import { SweepSettings } from "./sweep";
import { MeasurementSettings } from "./sweepProcessorNode";

function gid(id: string) {
    return document.getElementById(id);
}

function setUpSlider(name: string): HTMLInputElement {
    const slider = (<HTMLInputElement>gid(name)) as HTMLInputElement;
    const value = <HTMLInputElement>gid(name + "Value");
    slider.oninput = () => {
        value.innerHTML = slider.value;
    };
    return slider;
}
export const inputDeviceSelector = <HTMLSelectElement>gid("inputDevices");
export const refreshButton = <HTMLButtonElement>gid("refreshDevices");
export const sweepLengthSlider = setUpSlider("sweepLength");
export const sweepStartFrequencySlider = setUpSlider("sweepStartFrequency");

export const startButton = gid("start");
export const downloadButton = gid("downloadButton");
export const measurementProgress = <HTMLProgressElement>(
    gid("measurementProgress")
);

const inputLevelMeter = <HTMLProgressElement>gid("inputLevelMeter");
const measurementLevelMeter = <HTMLProgressElement>gid("measurementLevelMeter");

export const fadeInTime = <HTMLInputElement>gid("fadeInTime");
export const fadeOutTime = <HTMLInputElement>gid("fadeOutTime");
export const fadeInButton = <HTMLButtonElement>gid("fadeInButton");
export const fadeOutButton = <HTMLButtonElement>gid("fadeOutButton");

export const decibelsSwitch = <HTMLInputElement>gid("decibelsSwitch");
export const normalizeButton = <HTMLAnchorElement>gid("normalizeButton");
export const cutToSelectionButton = <HTMLAnchorElement>(
    gid("cutToSelectionButton")
);
export const resetButton = <HTMLAnchorElement>gid("resetButton");

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

export namespace MeasurementUI {
    export function getSettings() {
        return new MeasurementSettings(
            parseInt(recordDelay.value),
            parseInt(irLength.value)
        );
    }
}
