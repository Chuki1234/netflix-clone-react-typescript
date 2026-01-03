import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import preferencesRoutes from "./routes/preferencesRoutes.js";
import watchHistoryRoutes from "./routes/watchHistoryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import publicMovieRoutes from "./routes/publicMovieRoutes.js";
import { startOutboxWorker } from "./utils/outboxProcessor.js";
import { startSagaWorker } from "./utils/sagaProcessor.js";
import swaggerSpec from "./swaggerSpec.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/watch-history", watchHistoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/movies", movieRoutes);
app.use("/api/movies", publicMovieRoutes);

// Swagger JSON + minimal UI via CDN (no extra deps)
app.get("/api/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

app.get("/api/docs", (_req, res) => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <title>Swagger UI</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>body { margin: 0; padding: 0; }</style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/api/swagger.json',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
  </html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  startOutboxWorker();
  startSagaWorker();
});

