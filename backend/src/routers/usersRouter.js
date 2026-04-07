import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
import {
  createUser,
  getRoleNamebyUserId,
  getUserByEmail,
  getAllUsers,
  deleteUser,
} from "../controllers/usersControllers.js";

const usersRouter = Router();

usersRouter.get("/check", async (req, res) => {
  res.send("usersRouter");
});

usersRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const result = await createUser({ email, password });

    return res.status(200).json({ message: "Success", ip: clientIp });
  } catch (error) {
    return res.status(500).json({ message: error.message, code: error.code });
  }
});

usersRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(403).json({ message: "Unauthorized" });

  const token = jwt.sign({ id: user.user_id }, JWT_SECRET, { expiresIn: "1h" });

  return res.status(200).json({ message: "Success", token, ip: clientIp });
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
    }
    next();
  });
};

usersRouter.get("/verify", jwtMiddleware, async (req, res) => {
  if (req.jwtexpired) return res.status(403).json({ message: "Unauthorized" });
  try {
    const role = await getRoleNamebyUserId(req.user_id);
    res.status(200).json({ message: "Success", role: role || "Unknown Role" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch role" });
  }
});

usersRouter.get("/getEmailById/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const email = await getEmailById(userId);
    res.json(email);
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

export default usersRouter;
