const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); 
app.use(cors({ origin: '*' }));

const uri = process.env.MONGO_URI;
// Connection pool optimization
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  connectTimeoutMS: 10000, // 10s timeout
});

let cachedDb = null;

// Improved Connection Helper
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  // Jodi client connected na thake, connect koro
  await client.connect();
  cachedDb = client.db("prediction");
  return cachedDb;
}

// 1. Root Route
app.get('/', (req, res) => {
  res.send("RS ALGO Server is Active 🚀");
});

// 2. GET PREDICTION
app.get('/prediction', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const col = db.collection("prediction-logic");
    
    // Check for random logic
    const randomDocs = await col.aggregate([
      { $match: { isHistory: { $ne: true } } }, 
      { $sample: { size: 1 } }
    ]).toArray();

    // Jodi DB te kono data-i na thake, tahole response blank asbe
    if (!randomDocs || randomDocs.length === 0) {
      return res.status(404).json({ error: "No logic data found in DB. Please POST data first." });
    }

    const selected = randomDocs[0];

    // Last 10 history
    const history = await col.find({ isHistory: true })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const response = {
      prediction: (selected.size || selected.prediction || "Small").toUpperCase(),
      period: new Date().getTime().toString().slice(-8),
      confidence: Math.floor(Math.random() * (98 - 82 + 1) + 82),
      resultNumber: selected.number !== undefined ? selected.number.toString().padStart(2, '0') : "00",
      color: selected.color || "Green",
      lastUpdates: history.length > 0 
        ? history.map(h => `${h.resultNumber || "0"}${(h.prediction || h.size || "S").charAt(0).toUpperCase()}`) 
        : ["1S", "9B", "0S", "5B", "3S"]
    };

    // Auto-save history
    await col.insertOne({ ...response, timestamp: new Date(), isHistory: true });

    res.json(response);
  } catch (error) {
    console.error("GET Error:", error);
    res.status(500).json({ error: "Database Connection Failed" });
  }
});

// 3. POST NEW LOGIC 
app.post('/prediction', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const col = db.collection("prediction-logic");
    const { prediction, size, number, color, confidence } = req.body;

    const newEntry = {
      prediction: (prediction || size || "BIG").toUpperCase(),
      number: number !== undefined ? number : 0,
      color: color || "Green",
      confidence: confidence || 90,
      timestamp: new Date(),
      isHistory: false 
    };

    const result = await col.insertOne(newEntry);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listener for local
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`🚀 Server on http://localhost:${port}`));
}

module.exports = app;