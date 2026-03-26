const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json()); 
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
}));

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const predictionDB = client.db("prediction");
    const predictionLogic = predictionDB.collection("prediction-logic");

app.get('/prediction', async (req, res) => {
  try {
    const history = await predictionLogic.find().sort({ _id: -1 }).limit(10).toArray();
    
    const randomIndex = Math.floor(Math.random() * 100);
    const selected = predictionData[randomIndex]; // 00-99 array

    const response = {
      period: new Date().getTime().toString().slice(-8),
      prediction: selected.type, // BIG or SMALL
      confidence: Math.floor(Math.random() * (98 - 82 + 1) + 82),
      resultNumber: selected.value, // Added this to root for easier mapping
      lastUpdates: history.length > 0 
        ? history.map(h => `${h.resultNumber}${h.prediction.charAt(0)}`) 
        : ["07B", "02S", "09B", "01S", "06B"]
    };
    await predictionLogic.insertOne({
        period: response.period,
        prediction: response.prediction,
        confidence: response.confidence,
        resultNumber: response.resultNumber, // Must match history.map
        timestamp: new Date()
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Sync Failed" });
  }
});
    app.get('/', (req, res) => {
      res.send("Server is running perfectly!");
    });

    console.log("MongoDB Connected!");
  } catch (error) {
    console.error(error);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Vercel-er jonno export kora dorkar
module.exports = app;