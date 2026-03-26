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
      const result = await predictionLogic.findOne({}); // Database theke data ana
      res.send(result);
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