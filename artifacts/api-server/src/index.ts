import { onRequest } from "firebase-functions/v2/https";
import app from "./app";
import { logger } from "./lib/logger";

export const api = onRequest({ cors: true }, app);

if (process.env.FUNCTIONS_EMULATOR !== "true" && !process.env.FIREBASE_CONFIG) {
  const rawPort = process.env["PORT"] || 3002;
  const port = Number(rawPort);
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

