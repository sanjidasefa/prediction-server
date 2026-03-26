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

async function run() {
  try {
    const predictionDB = client.db("prediction");
    const predictionCollection = predictionDB.collection("prediction-logic");

    console.log("Connected to prediction-logic collection!");

 app.get('/prediction', async (req, res) => {
  try {
    // 1. Database theke random data fetch kora
    const randomDocs = await predictionCollection.aggregate([
      { $sample: { size: 1 } }
    ]).toArray();

    // Data check: Jodi database khali thake
    if (!randomDocs || randomDocs.length === 0) {
      console.error("Database is empty!");
      return res.status(404).json({ error: "No data in prediction-logic collection" });
    }

    const selected = randomDocs[0];

    // 2. History fetch (Last 10 updates)
    const history = await predictionCollection.find({ isHistory: true })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // 3. Response Structure (Strictly based on your data)
    // selected.number jodi integer hoy tobe eita string-e convert hobe
    const resultNum = selected.number !== undefined ? selected.number.toString().padStart(2, '0') : "00";
    const resultSize = (selected.size || "Small").toUpperCase();

    const response = {
      prediction: resultSize, 
      period: new Date().getTime().toString().slice(-8),
      confidence: Math.floor(Math.random() * (98 - 82 + 1) + 82),
      resultNumber: resultNum,
      color: selected.color || "Green",
      // History mapping fix: safely handle possible undefined values
      lastUpdates: history.length > 0 
        ? history.map(h => {
            const num = h.resultNumber || "0";
            const pred = (h.prediction || h.size || "S").charAt(0).toUpperCase();
            return `${num}${pred}`;
          }) 
        : ["1S", "9B", "0S", "5B", "3S"]
    };

    // 4. History save kora (Eita crash korar chance kom kintu safe rakha bhalo)
    await predictionCollection.insertOne({
        period: response.period,
        prediction: response.prediction,
        confidence: response.confidence,
        resultNumber: response.resultNumber, 
        timestamp: new Date(),
        isHistory: true 
    });

    res.json(response);

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
});

    app.get('/', (req, res) => res.send("RS ALGO Server Running..."));

  } catch (error) {
    console.error("Startup Error:", error);
  }
}

run().catch(console.dir);

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server on ${port}`));
}

module.exports = app;