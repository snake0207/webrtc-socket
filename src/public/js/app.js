const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");
const ulSelector = document.querySelector("ul");

const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log(`Connect to Server...🆗`);
});
socket.addEventListener("close", () => {
  console.log(`DisConnected from Server...❌`);
});
socket.addEventListener("message", (message) => {
  console.log(`Received message(server): `, message.data);
  addMessageList(message.data);
});

const ulArr = [];
const USER = { nick: "" };

function addMessageList(data) {
  console.log("recv : ", data);
  const [nick, message] = data.split(":");
  if (nick === USER.nick) return;
  const li = document.createElement("li");
  li.innerText = data;
  ulSelector.append(li);
}

function makeSendData(type, payload) {
  return JSON.stringify({ type, payload });
}

nickForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = nickForm.querySelector("input");
  USER.nick = input.value;
  socket.send(makeSendData("nick", input.value));
  input.value = "";
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeSendData("message", input.value));
  const li = document.createElement("li");
  li.innerText = `본인: ${input.value}`;
  li.style.color = "red";
  ulSelector.append(li);
  input.value = "";
});
