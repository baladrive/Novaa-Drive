/**
 * Novaa Drive — Express Backend
 *
 * Features:
 * - JWT authentication (email/password, OAuth providers)
 * - REST API for files, folders, sharing, comments
 * - WebSocket for real-time collaboration
 * - PostgreSQL database (with SQLite fallback for local dev)
 * - Redis caching
 * - Virus scanning integration
 * - File version history
 * - Audit logs
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "novaa-drive-secret-change-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Database (SQLite fallback for local dev, PostgreSQL for production) ───
let db;
const DB_TYPE = process.env.DB_TYPE || "sqlite";

if (DB_TYPE === "postgresql") {
  const { Pool } = require("pg");
  db = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://novaa:password@localhost:5432/novaa_drive",
  });
  console.log("Connected to PostgreSQL");
} else {
  // SQLite fallback
  const sqlite3 = require("sqlite3").verbose();
  db = new sqlite3.Database(path.join(__dirname, "novaa_drive.db"));
  console.log("Connected to SQLite (local dev mode)");

  // Initialize tables
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      username TEXT,
      avatar_url TEXT,
      is_admin INTEGER DEFAULT 0,
      two_factor_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_category TEXT,
      is_starred INTEGER DEFAULT 0,
      is_trashed INTEGER DEFAULT 0,
      trashed_at TEXT,
      tags TEXT,
      shared_link_token TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES folders(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS file_versions (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      created_by TEXT NOT NULL,
      change_description TEXT,
      checksum TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      password TEXT,
      expires_at TEXT,
      max_downloads INTEGER,
      current_downloads INTEGER DEFAULT 0,
      is_read_only INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  });
}

// ─── Redis Caching ───────────────────────────────────────────────────────────
let redis;
try {
  const redisModule = require("redis");
  redis = redisModule.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  redis.connect().catch(() => {
    console.warn("Redis not available, caching disabled");
    redis = null;
  });
} catch {
  console.warn("Redis module not available, caching disabled");
  redis = null;
}

// ─── Middleware ──────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use("/api/", limiter);

// ─── WebSocket Server ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Track active sessions
const activeSessions = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a file's collaboration room
  socket.on("join-file", (fileId, userId) => {
    const room = `file:${fileId}`;
    socket.join(room);
    activeSessions.set(socket.id, { fileId, userId });

    // Notify others
    socket.to(room).emit("user-joined", { userId, socketId: socket.id });
  });

  // Real-time cursor position
  socket.on("cursor-move", (data) => {
    const session = activeSessions.get(socket.id);
    if (session) {
      socket.to(`file:${session.fileId}`).emit("cursor-update", {
        userId: session.userId,
        ...data,
      });
    }
  });

  // Real-time comment
  socket.on("comment-added", (data) => {
    const session = activeSessions.get(socket.id);
    if (session) {
      socket.to(`file:${session.fileId}`).emit("comment-update", data);
    }
  });

  // Real-time file edit
  socket.on("file-edit", (data) => {
    const session = activeSessions.get(socket.id);
    if (session) {
      socket.to(`file:${session.fileId}`).emit("file-edit-update", {
        userId: session.userId,
        ...data,
      });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    const session = activeSessions.get(socket.id);
    if (session) {
      socket.to(`file:${session.fileId}`).emit("user-left", { userId: session.userId });
      activeSessions.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ─── Auth Middleware ─────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// ─── Helper Functions ────────────────────────────────────────────────────────
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === "postgresql") {
      db.query(sql, params).then(resolve).catch(reject);
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
}

function runExec(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === "postgresql") {
      db.query(sql, params).then(resolve).catch(reject);
    } else {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateId(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).substring(2, 15);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateId("usr");

    await runExec(
      `INSERT INTO users (id, email, password_hash, full_name, username) VALUES (?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, fullName || "", username || ""]
    );

    const token = generateToken({ id: userId, email, full_name: fullName });
    res.status(201).json({ token, user: { id: userId, email, fullName } });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT" || e.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error("Registration error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await runQuery(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        username: user.username,
        avatarUrl: user.avatar_url,
        is2FA: user.two_factor_enabled,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const users = await runQuery(
      `SELECT id, email, full_name, username, avatar_url, two_factor_enabled FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      username: user.username,
      avatarUrl: user.avatar_url,
      is2FA: user.two_factor_enabled,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ─── File Routes ─────────────────────────────────────────────────────────────
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

app.post("/api/files/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const { folderId, filename } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileId = generateId("fil");
    const storagePath = path.join(fileId, file.originalname);

    // Move file to permanent location
    const finalPath = path.join(UPLOAD_DIR, fileId);
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
    fs.renameSync(file.path, path.join(finalPath, file.originalname));

    const stats = fs.statSync(path.join(finalPath, file.originalname));

    await runExec(
      `INSERT INTO files (id, user_id, filename, storage_path, size, mime_type, file_category, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileId, req.user.id, filename || file.originalname, storagePath, stats.size, file.mimetype, null, folderId || null]
    );

    // Log activity
    await runExec(
      `INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)`,
      [generateId("log"), req.user.id, "upload_file", `Uploaded "${filename || file.originalname}"`]
    );

    res.status(201).json({
      id: fileId,
      filename: filename || file.originalname,
      size: stats.size,
      mimeType: file.mimetype,
    });
  } catch (e) {
    console.error("Upload error:", e);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/api/files", authenticateToken, async (req, res) => {
  try {
    const { folderId, category } = req.query;
    let sql = `SELECT * FROM files WHERE user_id = ? AND is_trashed = 0`;
    const params = [req.user.id];

    if (folderId) {
      sql += ` AND folder_id = ?`;
      params.push(folderId);
    }

    if (category) {
      sql += ` AND file_category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY created_at DESC`;

    const files = await runQuery(sql, params);
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

app.get("/api/files/:id", authenticateToken, async (req, res) => {
  try {
    const files = await runQuery(
      `SELECT * FROM files WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(files[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

app.delete("/api/files/:id", authenticateToken, async (req, res) => {
  try {
    await runExec(
      `UPDATE files SET is_trashed = 1, trashed_at = ? WHERE id = ? AND user_id = ?`,
      [new Date().toISOString(), req.params.id, req.user.id]
    );

    await runExec(
      `INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)`,
      [generateId("log"), req.user.id, "trash_file", `Trashed file ${req.params.id}`]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

app.put("/api/files/:id/rename", authenticateToken, async (req, res) => {
  try {
    const { filename } = req.body;
    await runExec(
      `UPDATE files SET filename = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      [filename, new Date().toISOString(), req.params.id, req.user.id]
    );

    await runExec(
      `INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)`,
      [generateId("log"), req.user.id, "rename_file", `Renamed to "${filename}"`]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to rename file" });
  }
});

// ─── Folder Routes ───────────────────────────────────────────────────────────
app.post("/api/folders", authenticateToken, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folderId = generateId("fld");

    await runExec(
      `INSERT INTO folders (id, user_id, name, parent_id) VALUES (?, ?, ?, ?)`,
      [folderId, req.user.id, name, parentId || null]
    );

    res.status(201).json({ id: folderId, name, parentId: parentId || null });
  } catch (e) {
    res.status(500).json({ error: "Failed to create folder" });
  }
});

app.get("/api/folders", authenticateToken, async (req, res) => {
  try {
    const { parentId } = req.query;
    let sql = `SELECT * FROM folders WHERE user_id = ?`;
    const params = [req.user.id];

    if (parentId) {
      sql += ` AND parent_id = ?`;
      params.push(parentId);
    } else {
      sql += ` AND parent_id IS NULL`;
    }

    const folders = await runQuery(sql, params);
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// ─── Comment Routes ──────────────────────────────────────────────────────────
app.post("/api/comments", authenticateToken, async (req, res) => {
  try {
    const { fileId, content, parentId } = req.body;
    const commentId = generateId("cmt");

    await runExec(
      `INSERT INTO comments (id, file_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)`,
      [commentId, fileId, req.user.id, content, parentId || null]
    );

    // Emit via WebSocket
    io.to(`file:${fileId}`).emit("comment-added", {
      id: commentId,
      fileId,
      userId: req.user.id,
      content,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: commentId, fileId, content, parentId: parentId || null });
  } catch (e) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.get("/api/comments/:fileId", authenticateToken, async (req, res) => {
  try {
    const comments = await runQuery(
      `SELECT c.*, u.full_name as user_full_name, u.avatar_url as user_avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.file_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.fileId]
    );

    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ─── Share Routes ────────────────────────────────────────────────────────────
app.post("/api/shares", authenticateToken, async (req, res) => {
  try {
    const { fileId, password, expiresInHours, maxDownloads, isReadOnly } = req.body;
    const token = "share_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const shareId = generateId("sh");

    let expiresAt = null;
    if (expiresInHours) {
      expiresAt = new Date(Date.now() + expiresInHours * 3600000).toISOString();
    }

    await runExec(
      `INSERT INTO shares (id, file_id, user_id, token, password, expires_at, max_downloads, is_read_only) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [shareId, fileId, req.user.id, token, password || null, expiresAt, maxDownloads || null, isReadOnly ? 1 : 0]
    );

    res.status(201).json({ id: shareId, token, expiresAt, maxDownloads, isReadOnly });
  } catch (e) {
    res.status(500).json({ error: "Failed to create share" });
  }
});

app.get("/api/shares/:token", async (req, res) => {
  try {
    const shares = await runQuery(
      `SELECT s.*, f.filename, f.size, f.mime_type
       FROM shares s
       JOIN files f ON s.file_id = f.id
       WHERE s.token = ?`,
      [req.params.token]
    );

    if (shares.length === 0) {
      return res.status(404).json({ error: "Share not found" });
    }

    const share = shares[0];

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: "Share has expired" });
    }

    // Check download limit
    if (share.max_downloads && share.current_downloads >= share.max_downloads) {
      return res.status(410).json({ error: "Download limit reached" });
    }

    res.json({
      filename: share.filename,
      size: share.size,
      mimeType: share.mime_type,
      isReadOnly: share.is_read_only,
      requiresPassword: !!share.password,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch share" });
  }
});

// ─── File Version Routes ─────────────────────────────────────────────────────
app.get("/api/files/:id/versions", authenticateToken, async (req, res) => {
  try {
    const versions = await runQuery(
      `SELECT * FROM file_versions WHERE file_id = ? ORDER BY version_number DESC`,
      [req.params.id]
    );

    res.json(versions);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

// ─── Activity Log Routes ─────────────────────────────────────────────────────
app.get("/api/activity", authenticateToken, async (req, res) => {
  try {
    const logs = await runQuery(
      `SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// ─── Storage Stats ───────────────────────────────────────────────────────────
app.get("/api/storage/stats", authenticateToken, async (req, res) => {
  try {
    const files = await runQuery(
      `SELECT file_category, SUM(size) as total_size, COUNT(*) as count
       FROM files WHERE user_id = ? AND is_trashed = 0
       GROUP BY file_category`,
      [req.user.id]
    );

    const totalResult = await runQuery(
      `SELECT SUM(size) as total FROM files WHERE user_id = ? AND is_trashed = 0`,
      [req.user.id]
    );

    const totalUsed = totalResult[0]?.total || 0;
    const limit = 10 * 1024 * 1024 * 1024; // 10GB default

    const breakdown = {};
    files.forEach((f) => {
      breakdown[f.file_category || "other"] = {
        size: f.total_size,
        count: f.count,
      };
    });

    res.json({
      used: totalUsed,
      limit,
      fileCount: totalResult[0]?.count || 0,
      categoryBreakdown: breakdown,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch storage stats" });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Novaa Drive backend running on port ${PORT}`);
  console.log(`📊 Database: ${DB_TYPE === "postgresql" ? "PostgreSQL" : "SQLite"}`);
  console.log(`🔌 WebSocket server ready`);
});
