import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));
const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const socketServer = new Server(httpServer, {});

function getPublicRooms() {
  const { rooms, sids } = socketServer.sockets.adapter;
  const publicRooms = [];

  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoomMembers(room) {
  return socketServer.sockets.adapter.rooms.get(room)?.size;
}

socketServer.on("connection", (socket) => {
  socket.on("join_room", (roomName, callbackFn) => {
    socket.to(roomName).emit("welcome", () => {});
    callbackFn();
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
});

// socketServer.on("connection", (socket) => {
//   socket["nickname"] = "Anonymous";
//   socket.onAny((event) => {
//     console.log(`Socket event : ${event}`);
//   });
//   socket.on("enter_room", (roomName, cliFunc) => {
//     socket.join(roomName);
//     cliFunc();
//     socket
//       .to(roomName)
//       .emit("welcome", socket.nickname, countRoomMembers(roomName));
//     socketServer.sockets.emit("room_change", getPublicRooms());
//   });
//   // nickname 처리
//   socket.on("nickname", (roomName, nickname) => {
//     socket["nickname"] = nickname;
//     socket.to(roomName).emit("nickname_update", nickname);
//   });
//   // 신규 메시지 처리
//   socket.on("new_message", (msg, room, doneFunc) => {
//     socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
//     doneFunc();
//   });

//   socket.on("disconnecting", () => {
//     socket.rooms.forEach((room) => {
//       socket.to(room).emit("bye", socket.nickname, countRoomMembers(room));
//     });
//   });
//   socket.on("disconnect", () => {
//     socketServer.sockets.emit("room_change", getPublicRooms());
//   });
// });

httpServer.listen(3000, handleListen);
