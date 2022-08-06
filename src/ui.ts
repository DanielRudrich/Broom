import { SweepSettings } from "./sweep";
import { MeasurementSettings } from "./sweepProcessorNode";
import { MeasurementState } from "./index";
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

class GraphControls {
    fadeInTime = <HTMLInputElement>gid("fadeInTime");
    fadeOutTime = <HTMLInputElement>gid("fadeOutTime");
    fadeInButton = <HTMLButtonElement>gid("fadeInButton");
    fadeOutButton = <HTMLButtonElement>gid("fadeOutButton");

    decibelsSwitch = <HTMLInputElement>gid("decibelsSwitch");
    normalizeButton = <HTMLAnchorElement>gid("normalizeButton");
    cutToSelectionButton = <HTMLAnchorElement>gid("cutToSelectionButton");
    resetButton = <HTMLAnchorElement>gid("resetButton");

    isSetToDecibels(): boolean {
        return this.decibelsSwitch.checked;
    }

    getFadeInTime(): number {
        return parseInt(this.fadeInTime.value);
    }

    getFadeOutTime(): number {
        return parseInt(this.fadeOutTime.value);
    }
}
class GUI {
    inputDeviceSelector = <HTMLSelectElement>gid("inputDevices");
    refreshButton = <HTMLButtonElement>gid("refreshDevices");
    sampleRateInfo = gid("sampleRateInfo");
    sweepLengthSlider = setUpSlider("sweepLength");
    sweepStartFrequencySlider = setUpSlider("sweepStartFrequency");

    // measurement settings
    recordDelay = <HTMLInputElement>document.getElementById("recordDelay");
    irLength = <HTMLInputElement>document.getElementById("irLength");

    startButton = gid("start");
    measurementProgress = <HTMLProgressElement>gid("measurementProgress");

    // level meters
    inputLevelMeter = <HTMLProgressElement>gid("inputLevelMeter");
    measurementLevelMeter = <HTMLProgressElement>gid("measurementLevelMeter");

    graphControls = new GraphControls();

    downloadButton = gid("downloadButton");

    constructor() {}

    setMeasurementState(state: MeasurementState) {
        if (state == MeasurementState.Recording) {
            this.measurementProgress.hidden = false;
            this.startButton.classList.add("secondary");
            this.startButton.innerHTML =
                "Measurement in progress... (click to abort)";
        } else {
            this.measurementProgress.hidden = true;
            this.startButton.classList.remove("secondary");
            this.startButton.innerHTML = "Start measurement";
        }
    }

    setInputLevel(level: number) {
        this.inputLevelMeter.value = level;
        this.measurementLevelMeter.value = level;
    }

    getMeasurementSettings() {
        return new MeasurementSettings(
            Math.max(0, parseFloat(this.recordDelay.value)),
            Math.max(0.1, parseFloat(this.irLength.value))
        );
    }

    getSweepSettings() {
        return new SweepSettings(
            parseInt(userInterface.sweepLengthSlider.value),
            parseInt(userInterface.sweepStartFrequencySlider.value)
        );
    }

    getSelectedDeviceIdentifier() {
        return this.inputDeviceSelector.value;
    }

    updateDeviceList(deviceId: string) {
        navigator.mediaDevices
            .enumerateDevices()
            .then(gotDevices.bind(this, deviceId));
    }
}

export const userInterface = new GUI();

function gotDevices(
    selectedDevice: string,
    deviceInfos: Array<MediaDeviceInfo>
) {
    while (userInterface.inputDeviceSelector.firstChild)
        userInterface.inputDeviceSelector.removeChild(
            userInterface.inputDeviceSelector.firstChild
        );

    const option = <HTMLOptionElement>document.createElement("option");
    option.value = "";
    option.text = "Select input device";
    option.disabled = true;
    userInterface.inputDeviceSelector.appendChild(option);

    deviceInfos.forEach((info: MediaDeviceInfo) => {
        const option = document.createElement("option");
        option.value = info.deviceId;
        if (info.kind === "audioinput") {
            option.text =
                info.label ||
                `microphone ${userInterface.inputDeviceSelector.length + 1}`;
            userInterface.inputDeviceSelector.appendChild(option);
        }
    });

    userInterface.inputDeviceSelector.childNodes.forEach((element: any) => {
        console.log(element);
    });

    if (
        Array.prototype.slice
            .call(userInterface.inputDeviceSelector.childNodes)
            .some((n: any) => n.value === selectedDevice)
    ) {
        userInterface.inputDeviceSelector.value = selectedDevice;
    }
}
