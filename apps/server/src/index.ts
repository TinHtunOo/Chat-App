import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import { setupSocket } from "./socket.js";

const PORT = Number(process.env.PORT ?? 3000);

const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
