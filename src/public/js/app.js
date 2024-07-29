const socket = io();

const myFace = document.getElementById("face");
const btnMute = document.getElementById("mute");
const btnCamera = document.getElementById("camera");
const selectCamera = document.getElementById("cameras");

let mediaStream;
let mute = false;
let cameraOn = true;

function getConnectionDevices(devices, type) {
  return devices.filter((device) => device.kind === type);
}

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    const cameras = getConnectionDevices(devices, "videoinput");
    const currentCamera = mediaStream.getVideoTracks()[0];
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
    mediaStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? deviceIdConstraints : initConstraints
    );
    myFace.srcObject = mediaStream;
    if (!deviceId) {
      getCameras();
    }
  } catch (error) {
    console.log(error);
  }
}

function handleMuteClick() {
  mediaStream
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
  mediaStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOn) {
    btnCamera.innerText = "Turn on Camera";
    cameraOn = false;
  } else {
    btnCamera.innerText = "Turn Off Camera";
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
  makeConnection();
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
/** @type {RTCPeerConnection} */
let gPeerConnection;

socket.on("welcome", async () => {
  console.log("welcome message received...");
  const offer = await gPeerConnection.createOffer();
  gPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, gRoomName);
});

socket.on("offer", (offer) => {
  console.log("recv: ", offer);
  gPeerConnection.setRemoteDescription(offer);
});

/**
 * RTC Code
 */
function makeConnection() {
  gPeerConnection = new RTCPeerConnection();
  mediaStream
    .getTracks()
    .forEach((track) => gPeerConnection.addTrack(track, mediaStream));
}
