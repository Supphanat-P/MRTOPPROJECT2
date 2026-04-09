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
import userRoleRouter from "./src/role/userRoleRouter.js";
import adminRoleRouter from "./src/routers/adminRoleRouter.js"; // Jo: นำเข้า adminRoleRouter สำหรับ API ของ Admin

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/packets", packetsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRoleRouter); // Jo: เพิ่ม Route Prefix /admin สำหรับจัดการข้อมูลส่วนของ Admin
app.use("/user-role", userRoleRouter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PROTOCOL = decoders.PROTOCOL;

app.get("/api/devices", (req, res) => {
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
      if (paused) return;

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

        let src = ip.info.srcaddr;
        let dst = ip.info.dstaddr;
        let protocol = "OTHER";
        let encrypted = false;
        let srcPort, dstPort;

        if (ip.info.protocol === 6) {
          const tcp = decoders.TCP(buffer, ip.offset);
          srcPort = tcp.info.srcport;
          dstPort = tcp.info.dstport;
          if (srcPort === 443 || dstPort === 443) {
            protocol = "HTTPS";
            encrypted = true;
          } else if (srcPort === 80 || dstPort === 80) protocol = "HTTP";
          else protocol = "TCP";
        } else if (ip.info.protocol === 17) {
          const udp = decoders.UDP(buffer, ip.offset);
          srcPort = udp.info.srcport;
          dstPort = udp.info.dstport;
          protocol = "UDP";
        }

        if (!paused) {
          packetBuffer.push({
            src,
            dst,
            protocol,
            length: ip.info.totallen,
            encrypted,
            timestamp: Date.now(),
            srcPort,
            dstPort,
            payload: buffer.slice(ip.offset).toString("hex").slice(0, 200),
          });
          ipSet.add(src);
          ipSet.add(dst);
        }
      }
    });
  });

  socket.on(
    "pauseCapture",
    () => (console.log(socket.id, "Pause"), (paused = true)),
  );
  socket.on(
    "resumeCapture",
    () => (console.log(socket.id, "Resume"), (paused = false)),
  );

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
  }, 0.5);

  const monitor = setInterval(() => {
    const now = Date.now();
    const seconds = (now - lastCheck) / 1000;
    const rate = packetCount / seconds;

    if (rate > MAX_PACKET_PER_SEC) {
      socket.emit("securityAlert", {
        message: "Packet ถูกส่งมามากเกินไป",
        rate: rate.toFixed(0),
      });
    }

    packetCount = 0;
    lastCheck = now;
  }, 100);

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    clearInterval(interval);
    clearInterval(monitor);
    if (c) c.close();
  });
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
);
