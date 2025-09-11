import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post("/inform", (req, res) => {
  const { location, disaster, severe, photo } = req.body;
  console.log("Received data:");
  console.log("Location:", location);
  console.log("Disaster:", disaster);
  console.log("Severity:", severe);
  console.log("Photo:", photo);

  res.status(200).json({ message: "Form data received successfully" });
});

  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
