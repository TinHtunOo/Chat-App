import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setupSocket } from "./socket.js";

const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
