const socket = io();

const divJoin = document.getElementById("join");
const formJoin = divJoin.querySelector("form");
const divStream = document.getElementById("stream");
const localVideo = document.getElementById("local-video");

const btnMuteOnOff = document.getElementById("mute");
const btnCameraOnOff = document.getElementById("camera");
const selAvailCameras = document.getElementById("cameras");

divJoin.hidden = false;
divStream.hidden = true;

/** @type {MediaStream} */
let mediaStream;
let muteOn = false;
let cameraOn = true;

async function startMedia() {
  divJoin.hidden = true;
  divStream.hidden = false;
  openMediaDevices();
}

/**
 * Form submit 이벤트 핸들러 함수
 * @param e event handler
 *
 * @returns void
 */
function handleJoinSubmit(e) {
  e.preventDefault();
  const input = formJoin.querySelector("input");
  socket.emit("join_room", input.value, startMedia);
  gRoomName = input.value;
  input.value = "";
}

/**
 * button mute 이벤트 핸들러 함수
 * @param void
 *
 * @returns void
 */
function handleMuteClick() {
  mediaStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (muteOn) {
    muteOn = false;
    btnMuteOnOff.innerText = "Mute";
  } else {
    muteOn = true;
    btnMuteOnOff.innerText = "UnMute";
  }
}

/**
 * * button camera 이벤트 핸들러 함수
 * @param void
 *
 * @returns void
 */
function handleCameraClick() {
  mediaStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOn) {
    cameraOn = false;
    btnCameraOnOff.innerText = "Turn on Camera";
  } else {
    cameraOn = true;
    btnCameraOnOff.innerText = "Turn off Camera";
  }
}

/**
 *
 * @param e event handle
 *
 * @returns void 0
 */
function handleAvailCamerasClick(e) {
  e.preventDefault();
  const deviceId = selAvailCameras.value;
  console.log("Change Camera : ", deviceId);
  openMediaDevices(deviceId);
}

formJoin.addEventListener("submit", handleJoinSubmit);
btnMuteOnOff.addEventListener("click", handleMuteClick);
btnCameraOnOff.addEventListener("click", handleCameraClick);
selAvailCameras.addEventListener("change", handleAvailCamerasClick);

// Media
/**
 *
 * @param string deviceId
 */
async function openMediaDevices(deviceId) {
  const initConstraints = { autio: true, video: true };
  const deviceIdConstraints = {
    autio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? deviceIdConstraints : initConstraints
    );
    localVideo.srcObject = mediaStream;
    getAvailableCameras();
  } catch (error) {
    console.log(error);
  }
}

/**
 * device에서 arg 타입의 MidiaDeviceInfo Array 정보를 획득
 *
 * @param string mediatrack의 type
 *
 * @returns Array<Object>
 * */
async function getConnectedDevices(type) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === type);
}

/**
 * 'videoinput' 종류인 device 정보를 획득. select box에 넣음
 * @param void
 *
 * @returns void
 */
async function getAvailableCameras() {
  const videoCameras = await getConnectedDevices("videoinput");
  const currentCamera = mediaStream.getVideoTracks()[0];

  selAvailCameras.innerHTML = "";

  videoCameras.forEach((camera) => {
    const option = document.createElement("option");
    option.value = camera.deviceId;
    option.innerText = camera.label;
    if (currentCamera.label === camera.label) {
      option.selected = true;
    }
    selAvailCameras.appendChild(option);
  });
}

navigator.mediaDevices.addEventListener("devicechange", (e) => {
  getAvailableCameras();
});

// Socket 처리
socket.on("welcome", () => {
  console.log("received welcome ...");
});
