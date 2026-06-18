const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("aiPromptify");
    const promptCollection = database.collection("prompts");

    // prompts related -----------------------------------------------------------------------------------------
    app.get("/api/prompts", async (req, res) => {
      const query = {};

      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      const cursor = await promptCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });

    app.post("/api/prompts", async (req, res) => {
      const promptData = req.body;
      const newPromptData = {
        ...promptData,
        createdAt: new Date(),
      };

      const result = await promptCollection.insertOne(newPromptData);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.listen(port, (req, res) => {
  console.log(`Ai Promptify server is running on port ${port}`);
});
