const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const userCollection = database.collection("user");
    const promptCollection = database.collection("prompts");
    const bookmarkCollection = database.collection("bookmarks");
    const reportCollection = database.collection("reports");
    const commentCollection = database.collection("comments");

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

    // get prompts single by id
    app.get("/api/prompts/:id", async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };
      const prompt = await promptCollection.findOne(query);

      if (!prompt) {
        return res.status(404).send({ message: "prompt not found" });
      }

      // find user
      const user = await userCollection.findOne({
        _id: new ObjectId(prompt.userId),
      });

      // find book mark count
      const bookmarkCount = await bookmarkCollection.countDocuments({
        promptId: id,
      });

      const result = {
        ...prompt,
        bookmarkCount: bookmarkCount,
        creatorName: user?.name,
        creatorEmail: user?.email,
        creatorImage: user?.image,
      };

      res.send(result);
    });

    // prompt post method
    app.post("/api/prompts", async (req, res) => {
      const promptData = req.body;
      const newPromptData = {
        ...promptData,
        createdAt: new Date(),
      };

      const result = await promptCollection.insertOne(newPromptData);
      res.send(result);
    });

    app.patch("/api/prompts/:id", async (req, res) => {
      const { id } = req.params;
      const { increment } = req.body;

      const filter = {
        _id: new ObjectId(id),
      };

      const updateCopyCount = {
        $inc: {
          copyCount: increment,
        },
      };

      const result = await promptCollection.updateOne(filter, updateCopyCount);

      res.send(result);
    });

    // user related ------------------------------------------------------------------------------------------------
    app.get("/api/users", async (req, res) => {
      const query = {};

      if (req.query.userId) {
        query._id = new ObjectId(req.query.userId);
      }
    });

    // bookmark related-----------------------------------------------------------------------------------------------------
    // get bookmark method
    app.get("/api/bookmarks", async (req, res) => {
      const query = {};

      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      if (req.query.promptId) {
        query.promptId = req.query.promptId;
      }

      const result = await bookmarkCollection.findOne(query);
      res.send(result || {});
    });

    // bookmark post method
    app.post("/api/bookmarks", async (req, res) => {
      const bookmarkData = req.body;

      const isExist = await bookmarkCollection.findOne({
        userId: bookmarkData.userId,
        promptId: bookmarkData.promptId,
      });

      if (isExist) {
        return res.status(409).send({ message: "already data exist" });
      }

      const result = await bookmarkCollection.insertOne(bookmarkData);
      console.log(result, "from result bookmark");
      res.send(result);
    });

    // bookmark delete method
    app.delete("/api/bookmarks/:id", async (req, res) => {
      const { id } = req.params;
      const { userId } = req.query;

      const query = { promptId: id, userId: userId };

      const result = await bookmarkCollection.deleteOne(query);

      res.send(result);
    });

    // report related -----------------------------------------------------------------------------------------
    app.post("/api/reports", async (req, res) => {
      const data = req.body;

      const reportData = {
        ...data,
        createdAt: new Date(),
      };

      const isExistReport = await reportCollection.findOne({
        promptId: data?.promptId,
        userId: data?.userId,
      });

      if (isExistReport) {
        return res.status(409).send({ message: "Already reported" });
      }

      const result = await reportCollection.insertOne(reportData);
      res.send(result);
    });

    /**
     promptId: prompt?._id,
      promptTitle: prompt?.prompt_title,
      rating: rating,
      comment: comment,
      userId: user?.id,
     */

    // comment related ----------------------------------------------------------------------------------------------------------
    // comment get method
    app.get("/api/comments", async (req, res) => {
      const query ={}

      if()
    });

    // comment post method
    app.post("/api/comments", async (req, res) => {
      const data = req.body;

      const commentData = {
        ...data,
        createAt: new Date(),
      };

      const isExistComment = await commentCollection.findOne({
        promptId: data?.promptId,
        userId: data?.userId,
      });

      if (isExistComment) {
        return res.status(409).send({ message: "Already you commented" });
      }

      const result = await commentCollection.insertOne(commentData);
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
