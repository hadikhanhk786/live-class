const express = require("express");
const { getAllChatHistory } = require("../models/classroomModel");

const router = express.Router();

router.get("/", (req, res) => res.send("Server is running"));
router.get("/classroom-history", async (req, res) => {
  const history = await getAllChatHistory();
  res.json(history);
});

module.exports = router;
