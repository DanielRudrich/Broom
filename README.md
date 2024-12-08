
![Logo](images/logo.svg#gh-dark-mode-only)
![Logo](images/logo_light.svg#gh-light-mode-only)

**Room impulse response measurement - made easy!**

Check it out on [broom.danielrudrich.de](https://broom.danielrudrich.de).


## About

**Broom** let's you easily create and download a sine sweep signal for room impulse response measurements. Once measured, it let's you deconvolve your recorded sweep response to obtain the room impulse response. It also provides tools to visualize and edit the impulse response, e.g. trimming and applying fade-in and fade-out. All in the browser, no installation required.

## Motivation

Measuring sweep responses is a common method to obtain room impulse responses. However, creating the sweep signal and deconvolving the recorded response usually requires some knowledge in signal processing and at least familiarity with software like MATLAB or Python. That's why I created Broom - to make this process as easy as possible for everyone.

## Privacy

Broom works completely in your browser. No data is sent to any server.

## Planned Features

- [ ] implementing an audio decoding library to support larger number of channels (currently browser dependent)
- [ ] playback of the impulse response in a convolution node with some sample signals
