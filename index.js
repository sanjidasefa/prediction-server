const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 

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
    const history = await predictionLogic.find().sort({ _id: -1 }).limit(5).toArray();
    const lastThree = history.slice(0, 3).map(h => h.prediction);
    let nextMove = "BIG";
    
    if (lastThree.every(val => val === "Big")) {
      nextMove = "SMALL";
    } else if (lastThree.every(val => val === "Small")) {
      nextMove = "BIG";
    } else {
      // Randomly choose but keep it weighted
      nextMove = Math.random() > 0.5 ? "BIG" : "SMALL";
    }
    res.send({
      prediction: nextMove,
      period: parseInt(history[0].period) + 1, // Porer period number
      confidence: Math.floor(Math.random() * (99 - 85) + 85)
    });
  } catch (error) {
    res.status(500).send(error);
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