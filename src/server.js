import express from "express";
import http from "http";
import SocketIO, { Server } from "socket.io";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));
const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const socketServer = SocketIO(httpServer);

socketServer.on("connection", (socket) => {
  console.log(socket);
});

/**
 * 
const sockets = [];
const wss = new WebSocket.Server({ httpServer });

wss.on("connection", (socket) => {
  console.log(`Connect to Browser🆗`, socket);
  sockets.push(socket);
  socket["nickname"] = "Anonymous";
  socket.on("close", () => console.log(`DisConnected from browser...❌`));
  socket.on("message", (message) => {
    const { type, payload } = JSON.parse(message.toString());
    console.log(`Received message from browser : `, type, payload);
    switch (type) {
      case "nick":
        socket["nickname"] = payload;
        break;
      case "message":
        sockets.forEach((s) => s.send(`${socket.nickname}: ${payload}`));
        break;
      default:
        break;
    }
  });
});
*/

httpServer.listen(3000, handleListen);
