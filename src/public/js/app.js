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
    video: { deviceId: { exact: deviceId } },
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
  await getMedia(event.target.value);
}

btnMute.addEventListener("click", handleMuteClick);
btnCamera.addEventListener("click", handleCameraClick);
selectCamera.addEventListener("change", handleCameraChange);

/**
 * Enter room
 */
const divWelcome = document.getElementById("welcome");
const formWelcome = divWelcome.querySelector("form");
const divCall = document.getElementById("call");

divCall.hidden = true;

async function startMedia() {
  divWelcome.hidden = true;
  divCall.hidden = false;
  await getMedia();
}

function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = formWelcome.querySelector("input");

  socket.emit("join_room", input.value, startMedia);
  gRoomName = input.value;
  input.value = "";
}

formWelcome.addEventListener("submit", handleWelcomeSubmit);

/**
 * Process Socket
 */
let gRoomName;

socket.on("welcome", () => {
  console.log("Anonymous Joined...");
});
