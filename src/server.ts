import { config } from "dotenv";
config();
import app from "./app";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { registerNoahSocket } from "./socket/noahSocket";
import cors from "cors";

const PORT = process.env.PORT || 8000;

const httpServer = createServer(app);
// allow any origin for dev; adjust in production
const io = new IOServer(httpServer, { cors: { origin: "*" } });

registerNoahSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server + Socket.io running on port ${PORT}`);
});
