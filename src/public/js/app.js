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

let gRoomName;
let muteOn = false;
let cameraOn = true;

async function initMedia() {
  divJoin.hidden = true;
  divStream.hidden = false;
  await openMediaDevices();
  makePeerConnection();
}

/**
 * Form submit 이벤트 핸들러 함수
 * @param e event handler
 *
 * @returns void
 */
async function handleJoinSubmit(e) {
  e.preventDefault();
  const input = formJoin.querySelector("input");
  gRoomName = input.value;
  await initMedia();
  socket.emit("join_room", input.value);
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
    btnCameraOnOff.innerText = "Turn Camera On";
  } else {
    cameraOn = true;
    btnCameraOnOff.innerText = "Turn Camera Off";
  }
}

/**
 *
 * @param e event handle
 *
 * @returns void 0
 */
function handleChangeCamera(e) {
  e.preventDefault();
  const deviceId = selAvailCameras.value;
  console.log("Change Camera : ", deviceId);
  openMediaDevices(deviceId);
}

formJoin.addEventListener("submit", handleJoinSubmit);
btnMuteOnOff.addEventListener("click", handleMuteClick);
btnCameraOnOff.addEventListener("click", handleCameraClick);
selAvailCameras.addEventListener("change", handleChangeCamera);

// Media
/** @type {MediaStream} */
let mediaStream;
/** @type {RTCPeerConnection} */
let gPeerConnection;

/**
 *
 * @param string deviceId
 */
async function openMediaDevices(deviceId) {
  const initConstraints = { autio: true, video: { facingMode: "user" } };
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
 * @returns MediaDeviceInfo[]
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

/**
 * 원격 피어에 연결
 * @param void
 *
 * @returns void
 */
function makePeerConnection() {
  gPeerConnection = new RTCPeerConnection();
  mediaStream
    .getTracks()
    .forEach((track) => gPeerConnection.addTrack(track, mediaStream));
}

navigator.mediaDevices.addEventListener("devicechange", (e) => {
  getAvailableCameras();
});

// Socket 처리
// Peer A
socket.on("welcome", async () => {
  console.log("Someone joined room...");
  const offer = await gPeerConnection.createOffer();
  gPeerConnection.setLocalDescription(offer);
  console.log("Sent offer : ", offer);
  // Send Peer B
  socket.emit("offer", offer, gRoomName);
});

// Peer B
socket.on("offer", async (offer) => {
  console.log("Received offer...");
  // Peer A로부터 받은 정보를 Remote정보로 설정
  gPeerConnection.setRemoteDescription(offer);
  const answer = await gPeerConnection.createAnswer();
  console.log(answer);
  gPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, gRoomName);
});

// Peer A
socket.on("answer", async (answer) => {
  console.log("Received answer...");
  gPeerConnection.setRemoteDescription(answer);
});
