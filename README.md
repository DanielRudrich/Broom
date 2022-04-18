
![Logo](logo.svg#gh-dark-mode-only)
![Logo](logo_light.svg#gh-light-mode-only)

Room impulse response measurement - in the browser!



Check it out on [danielrudrich.github.io/Broom](https://danielrudrich.github.io/Broom/).


## Behind the scenes
**Broom** uses the WebAudioAPI to play out a sine sweep and record the room response with the microphone input.
Playback and recording is handled by a custom `AudioWorkletProcessor`, so that both are in sync.

The captured *sweep response* will then be deconvolved using a weighted inverse sweep to yield the impulse response of the room. This happens in an `OfflineAudioContext`. The result will be displayed and encoded into the Wav format for the user to download.

## Run it locally
In case you want to check out the project and run it locally:

```sh
npm install
npm run build  # or `npm run watch` for an auto-recompilation if a file changes
```
You will need to start a webserver serving the `dist/` folder e.g. with live-share, http-server, ...


## Planned Features
- Multi-channel capturing (afaik, browsers should be able to handle up to three input channels)

## Known Issues
- Seems that some browser still apply some auto-gain, first measurement could be affected by that.
- Not compatible with older browsers (needs [`AudioWorklet`](https://caniuse.com/?search=audioworklet), and no feedback to the user if unsupported
- Samplerate handling problematic on Firefox, as it doesn't support `sampleRate` constraint
