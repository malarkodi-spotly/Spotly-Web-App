import './env-loader';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Prevent process crashes due to unhandled promise rejections or uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("🛡️ [SECURITY] Uncaught Exception (prevented crash):", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🛡️ [SECURITY] Unhandled Rejection (prevented crash):", reason);
});
// Trigger backend route re-registration for /api/auth/verify

const app = express();

// Comprehensive CORS setup for Web, Mobile APK/AAB (Capacitor, Ionic, WebView, localhost, HTTPS)
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, native curl, Postman, file://, capacitor://)
    if (!origin || origin === "null" || origin.startsWith("capacitor://") || origin.startsWith("ionic://") || origin.startsWith("file://") || origin.startsWith("http://localhost") || origin.startsWith("https://localhost")) {
      return callback(null, true);
    }
    // Allow all web origins dynamically while preserving credentials
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-Session-Token",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range", "Authorization"],
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Security & Data Protection Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ 1. REGISTER API ROUTES FIRST
  await registerRoutes(httpServer, app);

  // ✅ 2. SECURE ERROR HANDLER (Preserves CORS headers on errors)
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 GLOBAL API ERROR:", err);

    const reqOrigin = req.headers.origin;
    if (reqOrigin) {
      res.setHeader("Access-Control-Allow-Origin", reqOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    return res.status(500).json({
      error: "Internal server error",
      details: err?.message || err
    });
  });

  // ✅ 3. API 404 FALLBACK (Prevents unmatched /api/* calls from serving HTML index.html)
  app.all("/api/*", (_req, res) => {
    return res.status(404).json({ error: "API endpoint not found" });
  });

  // ✅ Serve attached_assets (videos, images) at /attached_assets in both dev & prod
  const attachedAssetsPath = fs.existsSync(path.resolve(process.cwd(), "attached_assets"))
    ? path.resolve(process.cwd(), "attached_assets")
    : typeof __dirname !== "undefined"
      ? path.resolve(__dirname, "..", "attached_assets")
      : path.resolve(process.cwd(), "attached_assets");
  app.use("/attached_assets", express.static(attachedAssetsPath));

  // ✅ 4. STATIC SERVING
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ✅ 4. START SERVER
  const port = parseInt(process.env.PORT || "5001", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();