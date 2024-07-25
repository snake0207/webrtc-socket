const socket = io();

const myFace = document.getElementById("face");
const btnMute = document.getElementById("mute");
const btnCamera = document.getElementById("camera");
const selectCamera = document.getElementById("cameras");

let myStream;
let mute = false;
let cameraOn = true;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    console.log(cameras);
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      selectCamera.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}

async function getMedia(deviceId) {
  const initConstraints = {
    autio: true,
    video: { facingMode: "user" },
  };
  const deviceIdConstraints = {
    autio: true,
    video: { deviceId },
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? deviceIdConstraints : initConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (error) {
    console.log(error);
  }
}

getMedia();

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (mute) {
    btnMute.innerText = "Mute";
    mute = false;
  } else {
    btnMute.innerText = "UnMute";
    mute = true;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOn) {
    btnCamera.innerText = "Turn Camera On";
    cameraOn = false;
  } else {
    btnCamera.innerText = "Turn Camera Off";
    cameraOn = true;
  }
}

async function handleCameraChange(event) {
  console.log("SELECT : ", event.target.value);
  await getMedia(event.target.value);
}

btnMute.addEventListener("click", handleMuteClick);
btnCamera.addEventListener("click", handleCameraClick);
selectCamera.addEventListener("change", handleCameraChange);
