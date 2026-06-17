import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Setup Postgres connection pool to share with Next.js DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token against Better Auth session table
    const result = await pool.query(
      `SELECT s."userId", u."companyId", u."role"
       FROM "session" s 
       JOIN "user" u ON s."userId" = u.id 
       WHERE s.token = $1 AND s."expiresAt" > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }

    const { userId, companyId, role } = result.rows[0];

    // Attach user data to socket
    socket.data.userId = userId;
    socket.data.companyId = companyId;
    socket.data.role = role;

    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.userId} (Company: ${socket.data.companyId})`);

  // Join personal room and company room
  socket.join(`user:${socket.data.userId}`);
  if (socket.data.companyId) {
    socket.join(`company:${socket.data.companyId}`);
    
    // Optionally join role-specific company room (e.g., admin broadcast)
    if (socket.data.role) {
      socket.join(`company:${socket.data.companyId}:role:${socket.data.role}`);
    }
  }

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
  });
});

// Express route for internal/admin event publishing (Optional/For future use if Next.js wants to trigger events via HTTP instead of direct DB)
app.use(express.json());
app.post("/api/events", async (req, res) => {
  // Add simple API key protection
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.SOCKET_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { target, event, payload } = req.body;
  // target could be `user:{id}` or `company:{id}`
  if (target && event) {
    io.to(target).emit(event, payload);
    return res.json({ success: true });
  }
  
  res.status(400).json({ error: "Bad request" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
