const socket = io();

const video = document.querySelector("video");

let myStream;

function getMedia() {
  try {
    myStream = navigator.mediaDevices.getUserMedia({
      autio: true,
      video: true,
    });
    video.srcObject = myStream;
  } catch (error) {
    console.log(error);
  }
}

getMedia();
