import express from "express";
import http from "http";
import { Server } from "socket.io";
import pkg from "cap";
const { Cap, decoders } = pkg;
import cors from "cors";
import jwt from "jsonwebtoken";
import { savePackets } from "./src/controllers/packetsController.js";
import packetsRouter from "./src/routers/packetsRouter.js";
import usersRouter from "./src/routers/usersRouter.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/packets", packetsRouter);
app.use("/users", usersRouter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PROTOCOL = decoders.PROTOCOL;

app.get("/devices", (req, res) => {
  const devices = Cap.deviceList().map((d) => ({
    name: d.name,
    desc: d.description,
  }));
  res.json(devices);
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  let c;
  let linkType;
  let ipSet = new Set();
  let packetBuffer = [];
  let paused = false;
  let currentUserId = null;

  //  security monitor
  let packetCount = 0;
  let totalPackets = 0;
  let lastCheck = Date.now();
  const MAX_PACKET_PER_SEC = 500;
  const token = socket.handshake.auth?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.id;
      console.log("User ID:", currentUserId);
    } catch (err) {
      console.log("Invalid token");
    }
  }

  socket.on("startCapture", ({ deviceName }) => {
    console.log("Start:", deviceName);

    if (!currentUserId) return;

    if (c) c.close();
    paused = false;

    const buffer = Buffer.alloc(65535);
    c = new Cap();

    try {
      linkType = c.open(deviceName, "ip", 10 * 1024 * 1024, buffer);
    } catch (err) {
      console.error("Open error:", err.message);
      return;
    }

    ipSet = new Set();
    packetBuffer = [];

    c.on("packet", () => {
      packetCount++;
      totalPackets++;

      //  แจ้งเตือนทุก 1000 packet
      if (totalPackets % 1000 === 0) {
        console.log("⚠️ Packet ครบ:", totalPackets);

        socket.emit("securityAlert", {
          message: "Packet ถึงแล้ว",
          total: totalPackets,
        });
        console.log(" ส่ง alert ไป frontend แล้ว");
      }

      if (linkType !== "ETHERNET") return;

      const ret = decoders.Ethernet(buffer);

      if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
        const ip = decoders.IPV4(buffer, ret.offset);

        const src = ip.info.srcaddr;
        const dst = ip.info.dstaddr;

        packetBuffer.push({
          src,
          dst,
          protocol: "IP",
          length: ip.info.totallen,
          timestamp: Date.now(),
        });

        ipSet.add(src);
        ipSet.add(dst);
      }
    });
  });

  socket.on("pauseCapture", () => (paused = true));
  socket.on("resumeCapture", () => (paused = false));

  const interval = setInterval(async () => {
    if (!paused && packetBuffer.length > 0) {
      const batch = packetBuffer;

      socket.emit("packetBatch", batch);
      socket.emit("ipList", Array.from(ipSet));

      if (currentUserId) {
        try {
          await savePackets(batch, currentUserId);
        } catch (err) {
          console.error("DB Save error:", err);
        }
      }

      packetBuffer = [];
    }
  }, 100);

  const monitor = setInterval(() => {
    const now = Date.now();
    const seconds = (now - lastCheck) / 1000;
    const rate = packetCount / seconds;

    if (rate > MAX_PACKET_PER_SEC) {
      console.log("⚠️ Packet เยอะเกิน:", rate.toFixed(0));

      socket.emit("securityAlert", {
        message: "Packet ถูกส่งมามากเกินไป",
        rate: rate.toFixed(0),
      });
    }

    packetCount = 0;
    lastCheck = now;
  }, 1000);

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    clearInterval(interval);
    clearInterval(monitor);
    if (c) c.close();
  });
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
);