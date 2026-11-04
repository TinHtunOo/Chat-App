import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setupSocket } from "./socket.js";
import { initRealtime } from "./helper/realtime.js";

const httpServer = createServer(app);
const io = setupSocket(httpServer);
initRealtime(io);

httpServer.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
