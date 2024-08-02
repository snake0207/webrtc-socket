const socket = io();

const divJoin = document.getElementById("join");
const formJoin = divJoin.querySelector("form");
const divLocal = document.getElementById("local");
const localVideo = document.getElementById("local-video");
const divChat = document.getElementById("chat");
const peerVideo = document.getElementById("peer-video");

const btnMuteOnOff = document.getElementById("mute");
const btnCameraOnOff = document.getElementById("camera");
const selAvailCameras = document.getElementById("cameras");

const formChat = divChat.querySelector("form");

divJoin.hidden = false;
divLocal.hidden = true;
divChat.hidden = true;

let gRoomName;
let muteOn = false;
let cameraOn = true;

async function initMedia() {
  divJoin.hidden = true;
  divLocal.hidden = false;
  divChat.hidden = false;
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
async function handleChangeCamera(e) {
  e.preventDefault();
  const deviceId = selAvailCameras.value;
  console.log("Change Camera : ", deviceId);
  await openMediaDevices(deviceId);

  if (gPeerConnection) {
    const videoSender = gPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(mediaStream.getVideoTracks()[0]);
  }
}

function handleSubmitMessage(e) {
  e.preventDefault();
  const input = formChat.querySelector("input");
  console.log("Sent chat message : ", input.value);
  gDataChannel.send(input.value);
  handleRecvChatMessage(input.value, true);
  input.value = "";
}

formJoin.addEventListener("submit", handleJoinSubmit);
btnMuteOnOff.addEventListener("click", handleMuteClick);
btnCameraOnOff.addEventListener("click", handleCameraClick);
selAvailCameras.addEventListener("change", handleChangeCamera);
formChat.addEventListener("submit", handleSubmitMessage);

// Media
/** @type {MediaStream} */
let mediaStream;
let peerStream;
/** @type {RTCPeerConnection} */
let gPeerConnection;
/** @type {RTCDataChannel} */
let gDataChannel;

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
  gPeerConnection.addEventListener("icecandidate", handleIce);
  gPeerConnection.addEventListener("track", handleAddTrack);

  mediaStream
    .getTracks()
    .forEach((track) => gPeerConnection.addTrack(track, mediaStream));
}

navigator.mediaDevices.addEventListener("devicechange", (e) => {
  getAvailableCameras();
});

function handleRecvChatMessage(value, isLocal) {
  console.log("Received chat message");
  console.log(value);
  const msg = document.getElementById("message");
  const ul = msg.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = value;
  li.style.listStyle = "none";
  li.style.color = isLocal ? "black" : "green";
  ul.appendChild(li);
}

/** */
function handleIce(data) {
  console.log("Fire icecandidate");
  socket.emit("ice", data.candidate, gRoomName);
}

function handleAddTrack(data) {
  console.log("Received track");
  console.log("Peer stream : ", data.streams);
  console.log("Local stream : ", mediaStream);
  const peerStream = document.getElementById("peer-video");
  peerStream.srcObject = data.streams[0];
}

// Socket 처리
// Peer A
socket.on("welcome", async () => {
  console.log("Someone joined room");
  gDataChannel = gPeerConnection.createDataChannel("chat");
  gDataChannel.addEventListener("message", (e) => {
    handleRecvChatMessage(e.data, false);
  });
  const offer = await gPeerConnection.createOffer();
  gPeerConnection.setLocalDescription(offer);
  console.log("Sent offer");
  // Send Peer B
  socket.emit("offer", offer, gRoomName);
});

// Peer B
socket.on("offer", async (offer) => {
  gPeerConnection.addEventListener("datachannel", (e) => {
    console.log(e);
    gDataChannel = e.channel;
    gDataChannel.addEventListener("message", (e) => {
      handleRecvChatMessage(e.data, false);
    });
  });
  console.log("Received offer");
  // Peer A로부터 받은 정보를 Remote정보로 설정
  gPeerConnection.setRemoteDescription(offer);
  const answer = await gPeerConnection.createAnswer();
  gPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, gRoomName);
});

// Peer A
socket.on("answer", async (answer) => {
  console.log("Received answer");
  gPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (candidate) => {
  console.log("Received candidate");
  gPeerConnection.addIceCandidate(candidate);
});
