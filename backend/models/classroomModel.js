const pool = require("./db");

const getClassroomHistory = async (classroom) => {
  const res = await pool.query("SELECT * FROM chat_history WHERE classroom = $1", [classroom]);
  return res.rows;
};

const saveChatMessage = async (classroom, username, message, role, event) => {
  await pool.query(
    "INSERT INTO chat_history (classroom, username, message, role, event) VALUES ($1, $2, $3, $4, $5)",
    [classroom, username, message, role, event]
  );
};

const getAllChatHistory = async () => {
  const res = await pool.query("SELECT * FROM chat_history ORDER BY timestamp DESC");
  return res.rows;
};

module.exports = { getClassroomHistory, saveChatMessage, getAllChatHistory };
