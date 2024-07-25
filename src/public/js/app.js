const socket = io();

const welcome = document.getElementById("welcome");
const formWelcome = welcome.querySelector("form");

const room = document.getElementById("room");
const formNick = room.querySelector("#nick");
const formMsg = room.querySelector("#msg");
room.hidden = true;

let gRoomName;

function addMessage(msg) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.appendChild(li);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `방제 : [${gRoomName}]`;
}

formWelcome.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = formWelcome.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  gRoomName = input.value;
  input.value = "";
});

formNick.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = formNick.querySelector("input");
  socket.emit("nickname", gRoomName, input.value);
});

formMsg.addEventListener("submit", (event) => {
  event.preventDefault();
  // const input = room.querySelector("#msg input");
  const input = formMsg.querySelector("input");
  const value = input.value;
  socket.emit("new_message", input.value, gRoomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
});

socket.on("welcome", (user, countMembers) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${gRoomName} (${countMembers})`;
  addMessage(`${user} joined.`);
});

socket.on("nickname_update", (user) => {
  addMessage(`${user} up-joined.`);
});

socket.on("bye", (user, countMembers) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room : ${gRoomName} (${countMembers})`;
  addMessage(`${user} left.`);
});

socket.on("new_message", (msg) => {
  addMessage(msg);
});

socket.on("room_change", (rooms) => {
  const ul = welcome.querySelector("ul");

  if (rooms.length === 0) {
    ul.innerHTML = "";
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    ul.append(li);
  });
});
