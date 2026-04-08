import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
import {
  createUser,
  getRoleNamebyUserId,
  getUserByusername,
  getAllUsers,
  deleteUser,
  updateUserRole,
} from "../controllers/usersControllers.js";

const usersRouter = Router();

usersRouter.get("/check", async (req, res) => {
  res.send("usersRouter");
});

usersRouter.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const result = await createUser({ username, password });

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    return res.status(500).json({ message: error.message, code: error.code });
  }
});

usersRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await getUserByusername(username);
  if (!user) return res.status(404).json({ message: "User not found" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(403).json({ message: "Unauthorized" });

  const role = await getRoleNamebyUserId(user.user_id);

  const token = jwt.sign(
    { id: user.user_id, role: role, username: user.username },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  return res.status(200).json({ message: "Success", token });
});

// --- JWT Middleware ---
const jwtMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    req.jwtexpired = true;
    req.user_id = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      req.jwtexpired = true;
      req.user_id = null;
    } else {
      req.jwtexpired = false;
      req.user_id = payload.id;
      req.role = payload.role;
      req.username = payload.username;
    }
    next();
  });
};

usersRouter.get("/verify", jwtMiddleware, async (req, res) => {
  if (req.jwtexpired) return res.status(403).json({ message: "Unauthorized" });
  try {
    const user_id = req.user_id;
    const role = await getRoleNamebyUserId(req.user_id);
    const username = req.username;
    res.status(200).json({
      message: "Success",
      role: role,
      username: username,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch role" });
  }
});

usersRouter.get("/getusernameById/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const username = await getusernameById(userId);
    res.json(username);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

usersRouter.get("/getAllUsers", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

usersRouter.delete("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId))
      return res.status(400).json({ message: "Invalid user ID" });

    await deleteUser(userId);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

usersRouter.get("/getRoleNameByUserId", async (req, res) => {
  const userId = Number(req.query.userId);
  if (isNaN(userId))
    return res.status(400).json({ message: "Invalid user ID" });

  try {
    const role = await getRoleNamebyUserId(userId);
    res.json({ role: role || "Unknown Role" });
  } catch (err) {
    console.error("Router error:", err);
    res.status(500).json({ message: "Failed to fetch role" });
  }
});
usersRouter.put("/update-role/:id", jwtMiddleware, async (req, res) => {
  try {
    // เช็คว่าเป็น admin
    if (req.jwtexpired || req.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const userId = Number(req.params.id);
    const { role_id } = req.body; // เปลี่ยนตรงนี้

    // 🔎 เช็คค่า
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (![1, 2].includes(role_id)) { // เช็คเป็นเลข
      return res.status(400).json({ message: "Invalid role_id" });
    }

    // update ด้วย role_id
    await updateUserRole(userId, role_id);

    res.json({ message: "Role updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default usersRouter;
