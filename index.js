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
    // 1. Database theke random 1-ti pattern neya
    const randomDocs = await predictionCollection.aggregate([
      { $sample: { size: 1 } }
    ]).toArray();

    if (!randomDocs || randomDocs.length === 0) {
      return res.status(404).json({ error: "Data not found in DB!" });
    }

    const selected = randomDocs[0];

    // 2. Sudhu history documents gulo fetch kora
    const history = await predictionCollection.find({ isHistory: true })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // 3. Response map kora (Tomar DB-r 'size' field onujayi)
    const response = {
      prediction: (selected.size || "Small").toUpperCase(), // "Small" -> "SMALL"
      period: new Date().getTime().toString().slice(-8),
      confidence: Math.floor(Math.random() * (98 - 82 + 1) + 82),
      resultNumber: selected.number !== undefined ? selected.number : "0",
      color: selected.color || "Green",
      // History mapping fix: prediction na thakle size theke charAt nibo
      lastUpdates: history.length > 0 
        ? history.map(h => `${h.resultNumber}${ (h.prediction || h.size || "S").charAt(0).toUpperCase() }`) 
        : ["1S", "9B", "0S", "5B", "3S"]
    };

    // 4. History save kora (isHistory: true diye mark kora)
    await predictionCollection.insertOne({
        period: response.period,
        prediction: response.prediction,
        confidence: response.confidence,
        resultNumber: response.resultNumber, 
        size: response.prediction, // Compatibility-r jonno
        timestamp: new Date(),
        isHistory: true 
    });

    res.json(response);

  } catch (error) {
    console.error("Backend Error:", error.message);
    res.status(500).json({ error: "Sync Failed", details: error.message });
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