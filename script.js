import 'babel-polyfill'
import Vue from 'vue'
var AudioContext = window.AudioContext || window.webkitAudioContext;
const view = {
  data: function () {
    return {
      stack: []
    }
  },
  methods: {
    record: async function () {
      const self = this
      self.stack = []
      const audioContext = new AudioContext();
      const constraints = { audio: true, video: false }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      const source = audioContext.createMediaStreamSource(stream);
      const bufferSize = 256
      const numberOfInputChannels = 1
      const numberOfOutputChannels = 1
      const scriptNode = audioContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
      scriptNode.onaudioprocess = function (e) {
        let inputBuffer = e.inputBuffer;
        let inputData = inputBuffer.getChannelData(0);
        self.stack.push(Float32Array.from(inputData))
      }
      source.connect(scriptNode);
      scriptNode.connect(audioContext.destination)
      setTimeout(function () {
        scriptNode.disconnect(audioContext.destination);
      }, 3000)
    },
    play: function () {
      const self = this
      const audioContext = new AudioContext();

      const bufferSize = 256
      const numberOfInputChannels = 1
      const numberOfOutputChannels = 1
      const scriptNode = audioContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels)
      let index = 0
      scriptNode.onaudioprocess = function (e) {
        let outputBuffer = e.outputBuffer;
        let outputData = outputBuffer.getChannelData(0);
        if (index >= self.stack.length) {
          for (let sample = 0; sample < outputData.length; sample++) {
            outputData[sample] = 0
          }
          scriptNode.disconnect(audioContext.destination);
          return
        }

        let inputData = self.stack[index++];
        for (let sample = 0; sample < outputBuffer.length; sample++) {
          outputData[sample] = inputData[sample];
        }
      }
      scriptNode.connect(audioContext.destination)
    }
  },
  render: function (h) {
    return h("div", undefined, [
      h("button", {
        on: {
          click: this.record
        }
      }, "record"),
      h("button", {
        on: {
          click: this.play
        }
      }, "play")
    ])
  }
}



document.addEventListener("DOMContentLoaded", function () {
  const div = document.createElement("div")
  const h1 = new Vue(view)
  document.body.append(div)
  h1.$mount(div)
});