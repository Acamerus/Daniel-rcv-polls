const { Server } = require("socket.io");

let io;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ["GET", "POST"],
  credentials: true,
};

const initSocketServer = (server) => {
  try {
    io = new Server(server, corsOptions);

    io.on("connection", (socket) => {
      console.log(`🔗 User ${socket.id} connected to sockets`);

      // Join a poll room when user opens a poll
      socket.on("join-poll", (pollId) => {
        socket.join(`poll-${pollId}`);
        console.log(`📊 User ${socket.id} joined poll ${pollId}`);
      });

      // Leave a poll room when user closes poll
      socket.on("leave-poll", (pollId) => {
        socket.leave(`poll-${pollId}`);
        console.log(`� User ${socket.id} left poll ${pollId}`);
      });

      socket.on("disconnect", () => {
        console.log(`�🔗 User ${socket.id} disconnected from sockets`);
      });

      // Define event handlers here...
    });
  } catch (error) {
    console.error("❌ Error initializing socket server:");
    console.error(error);
  }
};

// Export a function to emit poll events
const emitPollEvent = (pollId, eventName, data) => {
  if (io) {
    const roomName = `poll-${pollId}`;
    const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
    const numClients = clientsInRoom ? clientsInRoom.size : 0;
    console.log(`Broadcasting "${eventName}" to ${numClients} clients in room ${roomName}`);
    io.to(roomName).emit(eventName, data);
  } else {
    console.error("Socket.IO not initialized yet!");
  }
};

module.exports = initSocketServer;
module.exports.emitPollEvent = emitPollEvent;
