import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "medical-platform-secret";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "medical_user",
  password: process.env.DB_PASSWORD || "medical_pass",
  database: process.env.DB_NAME || "medical_platform",
  connectionLimit: 10
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_, __, callback) => callback(null, uploadsDir),
  filename: (_, file, callback) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-");
    callback(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new Error("只允许上传图片文件"));
  }
});

async function verifyDatabaseConnection(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function ensureDemoUsers() {
  await pool.query(
    `INSERT INTO users (username, password, role, full_name, department)
     VALUES
       ('admin', 'admin123', 'admin', '系统管理员', '信息中心'),
       ('doctor', 'doctor123', 'doctor', '演示医生', '影像科')
     ON DUPLICATE KEY UPDATE
       password = VALUES(password),
       role = VALUES(role),
       full_name = VALUES(full_name),
       department = VALUES(department)`
  );
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未登录或令牌无效" });
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "登录已过期，请重新登录" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "仅管理员可访问" });
  }

  return next();
}

app.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password, fullName, department = "" } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ message: "请填写用户名、密码和姓名" });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: "用户名至少需要 3 个字符" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "密码至少需要 6 个字符" });
  }

  try {
    const [existingRows] = await pool.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (existingRows.length) {
      return res.status(409).json({ message: "用户名已存在，请更换后重试" });
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, password, role, full_name, department)
       VALUES (?, ?, 'doctor', ?, ?)`,
      [username, password, fullName, department]
    );

    return res.status(201).json({
      id: result.insertId,
      message: "注册成功，请使用新账号登录"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "请输入用户名和密码" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, username, password, role, full_name, department FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    const user = rows[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        department: user.department
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, role, full_name, department, created_at FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "用户不存在" });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/users", authenticate, requireAdmin, async (_, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, role, full_name, department, created_at FROM users ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/images", authenticate, async (req, res) => {
  const { patientId = "", studyDate = "" } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (patientId) {
      conditions.push("mi.patient_id LIKE ?");
      params.push(`%${patientId}%`);
    }

    if (studyDate) {
      conditions.push("mi.study_date = ?");
      params.push(studyDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT
        mi.id,
        mi.patient_name,
        mi.patient_id,
        mi.study_date,
        mi.modality,
        mi.description,
        mi.file_name,
        mi.file_path,
        mi.mime_type,
        mi.created_at,
        u.full_name AS uploader_name,
        u.role AS uploader_role
      FROM medical_images mi
      LEFT JOIN users u ON mi.uploaded_by = u.id
      ${whereClause}
      ORDER BY mi.created_at DESC`,
      params
    );

    const payload = rows.map((item) => ({
      ...item,
      previewUrl: `${req.protocol}://${req.get("host")}${item.file_path}`
    }));

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/images", authenticate, upload.single("image"), async (req, res) => {
  const { patientName, patientId, studyDate, modality, description = "" } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "请上传图片文件" });
  }

  if (!patientName || !patientId || !studyDate || !modality) {
    return res.status(400).json({ message: "请填写完整的影像信息" });
  }

  try {
    const relativePath = `/uploads/${req.file.filename}`;
    const [result] = await pool.query(
      `INSERT INTO medical_images
        (patient_name, patient_id, study_date, modality, description, file_name, file_path, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientName,
        patientId,
        studyDate,
        modality,
        description,
        req.file.originalname,
        relativePath,
        req.file.mimetype,
        req.user.id
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      message: "影像上传成功"
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/images/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, uploaded_by, file_path FROM medical_images WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    const image = rows[0];

    if (!image) {
      return res.status(404).json({ message: "影像不存在" });
    }

    const canDelete = req.user.role === "admin" || Number(image.uploaded_by) === Number(req.user.id);

    if (!canDelete) {
      return res.status(403).json({ message: "无权删除该影像" });
    }

    await pool.query("DELETE FROM medical_images WHERE id = ?", [req.params.id]);

    const filePath = path.join(__dirname, image.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ message: "影像已删除" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.use((error, _, res, __) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: error.message || "服务器内部错误" });
});

verifyDatabaseConnection()
  .then(async () => {
    await ensureDemoUsers();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
