const socket = io();

const myFace = document.getElementById("face");
const btnMute = document.getElementById("mute");
const btnCamera = document.getElementById("camera");

let myStream;

async function getMedia() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      autio: true,
      video: true,
    });
    console.log(myStream);
    myFace.srcObject = myStream;
  } catch (error) {
    console.log(error);
  }
}

getMedia();
