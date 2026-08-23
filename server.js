require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/players", require("./routes/players"));
app.use("/api/slots", require("./routes/slots"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/reviews", require("./routes/reviews"));

app.use(express.static(path.join(__dirname, "public")));
// Fallback to index.html for any non-API route (SPA-style routing).
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ServeUp running at http://localhost:${PORT}`);
});
