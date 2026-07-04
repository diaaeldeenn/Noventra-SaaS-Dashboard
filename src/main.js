import "dotenv/config";
import app from "./app.controller.js";
import connectionDB from "./DB/connectionDB.js";
import { seedAdmin } from "./DB/seeds/admin.seed.js";

connectionDB();
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
