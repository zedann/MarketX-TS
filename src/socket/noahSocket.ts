import { Server as IOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import NoahService from "../services/noahService";

export const registerNoahSocket = (io: IOServer) => {
  io.on("connection", (socket: Socket) => {
    console.log("🔌 New socket connected", socket.id);

    socket.on("noah_chat", async (data) => {
      try {
        const { token, message } = data || {};
        if (!token || !message) {
          return socket.emit("noah_error", { error: "token and message required" });
        }

        let userId: string;
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
          userId = decoded.id;
        } catch (err) {
          return socket.emit("noah_error", { error: "invalid_token" });
        }

        // Emit typing indicator
        socket.emit("noah_typing");
        const { reply } = await NoahService.chat(userId, message);
        socket.emit("noah_reply", { reply });
      } catch (err) {
        console.error("Noah socket error", err);
        socket.emit("noah_error", { error: "internal_error" });
      }
    });
  });
}; 