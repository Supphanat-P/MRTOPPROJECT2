import { Router } from "express";
import { savePackets } from "../controllers/packetsController.js";

const packetsRouter = Router();

packetsRouter.post("/save", async (req, res) => {
  try {
    const { packets, userId } = req.body;

    await savePackets(packets, userId);

    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save packets" });
  }
});

export default packetsRouter;