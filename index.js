const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); 
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let predictionCollection;

async function run() {
  try {
    // 1. Database Connection
    await client.connect(); // Explicitly connect
    const predictionDB = client.db("prediction");
    predictionCollection = predictionDB.collection("prediction-logic");
    console.log("✅ Connected to MongoDB: prediction-logic");

    // --- GET PREDICTION ---
    app.get('/prediction', async (req, res) => {
      try {
        // Database theke 1ti random logic fetch
        const randomDocs = await predictionCollection.aggregate([
          { $match: { isHistory: { $ne: true } } }, // History documentation chara shudhu main logic gulo nibe
          { $sample: { size: 1 } }
        ]).toArray();

        if (!randomDocs || randomDocs.length === 0) {
          return res.status(404).json({ error: "No logic data found" });
        }

        const selected = randomDocs[0];

        // Last 10 history updates
        const history = await predictionCollection.find({ isHistory: true })
          .sort({ timestamp: -1 })
          .limit(10)
          .toArray();

        const resultNum = selected.number !== undefined ? selected.number.toString().padStart(2, '0') : "00";
        const resultSize = (selected.size || selected.prediction || "Small").toUpperCase();

        const response = {
          prediction: resultSize, 
          period: new Date().getTime().toString().slice(-8),
          confidence: Math.floor(Math.random() * (98 - 82 + 1) + 82),
          resultNumber: resultNum,
          color: selected.color || "Green",
          lastUpdates: history.length > 0 
            ? history.map(h => `${h.resultNumber || "0"}${(h.prediction || h.size || "S").charAt(0).toUpperCase()}`) 
            : ["1S", "9B", "0S", "5B", "3S"]
        };

        // Auto-save history after generation
        await predictionCollection.insertOne({
            ...response,
            timestamp: new Date(),
            isHistory: true 
        });

        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // --- POST NEW LOGIC (Admin Control) ---
    app.post('/prediction', async (req, res) => {
      try {
        const { prediction, size, number, color, confidence, isHistory } = req.body;

        const newEntry = {
          prediction: (prediction || size || "BIG").toUpperCase(),
          number: number !== undefined ? number : 0,
          color: color || "Green",
          confidence: confidence || 90,
          timestamp: new Date(),
          isHistory: isHistory || false // Admin jodi shudhu logic add kore tobe false, history hole true
        };

        const result = await predictionCollection.insertOne(newEntry);
        res.status(201).json({ success: true, id: result.insertedId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/', (req, res) => res.send("RS ALGO Server is Active 🚀"));

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

run().catch(console.dir);

// Local development er jonno listener
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
}

module.exports = app;