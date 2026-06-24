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
    const planCollection = database.collection("plan");
    const userCollection = database.collection("user");
    const promptCollection = database.collection("prompts");
    const bookmarkCollection = database.collection("bookmarks");
    const reportCollection = database.collection("reports");
    const commentCollection = database.collection("comments");
    const featureCollection = database.collection("features");
    const warningCollection = database.collection("warnings");
    const paymentCollection = database.collection("payments");

    // prompts related -----------------------------------------------------------------------------------------
    // app.get("/api/prompts", async (req, res) => {
    //   const query = {};

    //   if (req.query.userId) {
    //     query.userId = req.query.userId;
    //   }

    //   const cursor = await promptCollection.find(query);
    //   const result = await cursor.toArray();

    //   res.send(result);
    // });

    // get prompts method by query for search filter
    app.get("/api/prompts", async (req, res) => {
      const query = {};

      // user filter
      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      // search on 3 fields
      if (req.query.search) {
        query.$or = [
          {
            prompt_title: {
              $regex: req.query.search,
              $options: "i",
            },
          },
          {
            tags: {
              $regex: req.query.search,
              $options: "i",
            },
          },
          {
            ai_tool: {
              $regex: req.query.search,
              $options: "i",
            },
          },
        ];
      }

      // category filter
      if (req.query.category) {
        query.category = req.query.category;
      }

      // difficulty filter
      if (req.query.difficulty_level) {
        query.difficulty_level = req.query.difficulty_level;
      }

      // ai tool filter
      if (req.query.ai_tool) {
        query.ai_tool = req.query.ai_tool;
      }

      let cursor = promptCollection.find(query);

      // sorting
      if (req.query.sortBy === "most_copied") {
        cursor = cursor.sort({ copyCount: -1 });
      }

      if (req.query.sortBy === "latest") {
        cursor = cursor.sort({ createdAt: -1 });
      }

      // pagination related
      const page = Number(req.query.page);
      const perPage = Number(req.query.perPage) || 12;

      const skipItems = (page - 1) * perPage;

      // total data
      const totalPrompts = await promptCollection.countDocuments(query);

      cursor = cursor.skip(skipItems).limit(perPage);

      const prompts = await cursor.toArray();
      res.send({ totalPrompts, prompts });
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

    // prompt update
    app.patch("/api/prompts/:id", async (req, res) => {
      const { id } = req.params;
      const { increment, ...updateFields } = req.body;

      const filter = {
        _id: new ObjectId(id),
      };

      const updateDoc = {};

      if (increment) {
        updateDoc.$inc = {
          copyCount: increment,
        };
      }

      if (Object.keys(updateFields).length > 0) {
        updateDoc.$set = updateFields;
      }

      const result = await promptCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // prompt delete
    app.delete("/api/prompts/:id", async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };

      const result = await promptCollection.deleteOne(query);

      res.send(result);
    });

    // user related ------------------------------------------------------------------------------------------------
    app.get("/api/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();

      res.send(result);
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

      const result = await bookmarkCollection.find(query).toArray();
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

    // report get method
    app.get("/api/reports", async (req, res) => {
      const cursor = reportCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // report post method
    app.post("/api/reports", async (req, res) => {
      const data = req.body;

      const reportData = {
        ...data,
        createdAt: new Date(),
      };

      const isExistReport = await reportCollection.findOne({
        PromptId: data?.PromptId,
        userId: data?.userId,
      });

      if (isExistReport) {
        return res.status(409).send({ message: "Already reported" });
      }

      const result = await reportCollection.insertOne(reportData);
      res.send(result);
    });

    // report delete method
    app.delete("/api/reports/:id", async (req, res) => {
      const { id } = req.params;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await reportCollection.deleteOne(query);

      res.send(result);
    });

    // comment related ----------------------------------------------------------------------------------------------------------
    // comment get method
    app.get("/api/comments", async (req, res) => {
      const query = {};

      if (req.query.promptId) {
        query.promptId = req.query.promptId;
      }

      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      const result = await commentCollection.find(query).toArray();
      res.send(result);
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

    // plan related
    app.get("/api/plan", async (req, res) => {
      const query = {};

      if (req.query.plan_id) {
        query.plan_id = req.query.plan_id;
      }

      const result = await planCollection.findOne(query);

      res.send(result);
    });

    // feature related -------------------------------------------------------------------------------------------------------------
    // feature get
    app.get("/api/features", async (req, res) => {
      const result = await featureCollection
        .aggregate([
          {
            $addFields: {
              promptObjectId: {
                $toObjectId: "$promptId",
              },
            },
          },
          {
            $lookup: {
              from: "prompts",
              localField: "promptObjectId",
              foreignField: "_id",
              as: "promptData",
            },
          },
          {
            $unwind: "$promptData",
          },
          {
            $limit: 6,
          },
        ])
        .toArray();

      res.send(result);
    });

    // feature post
    app.post("/api/features", async (req, res) => {
      const featureData = req.body;

      const isExitFeature = await featureCollection.findOne({
        promptId: req.body.promptId,
      });

      if (isExitFeature) {
        return res.status(409).send({ message: "This is already featured " });
      }

      // update prompt collection also
      await promptCollection.updateOne(
        {
          _id: new ObjectId(req.body.promptId),
        },
        {
          $set: {
            featured: true,
          },
        },
      );

      const result = await featureCollection.insertOne(featureData);

      res.send(result);
    });

    // warning related
    app.post("/api/warnings", async (req, res) => {
      const warningData = req.body;
      const result = await warningCollection.insertOne(warningData);
      res.send(result);
    });

    // payment related --------------------------------------------------------------------------------------------------------------
    // payment get for admin
    app.get("/api/payments", async (req, res) => {
      const cursor = paymentCollection.find();
      const payments = await cursor.toArray();

      for (let payment of payments) {
        const userId = payment.userId;

        const user = await userCollection.findOne({
          _id: new ObjectId(userId),
        });

        payment.userNama = user.name;
        payment.userEmail = user.email;
        payment.userRole = user.role;
      }

      res.send(payments);
    });

    // payment post method
    app.post("/api/payments", async (req, res) => {
      const { sessionId, userId, priceId, payAmount } = req.body;

      const userData = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { plan: "premium" } },
      );

      const isExistingPayment = await paymentCollection.findOne({
        sessionId: sessionId,
      });

      if (isExistingPayment) {
        return res.send({ message: "Already exist" });
      }

      const result = await paymentCollection.insertOne({
        sessionId,
        userId,
        priceId,
        payAmount,
      });

      res.send({ result, userData });
    });

    // top creator section ---------------------------------------------------------------------------------------------------------
    app.get("/api/top-creators", async (req, res) => {
      const result = await promptCollection
        .aggregate([
          {
            $group: {
              _id: "$userId",
              totalPrompts: { $sum: 1 },
            },
          },
          {
            $sort: {
              totalPrompts: -1,
            },
          },
          {
            $limit: 4,
          },
          {
            $lookup: {
              from: "user",
              let: { userIdString: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [{ $toString: "$_id" }, "$$userIdString"],
                    },
                  },
                },
              ],
              as: "creator",
            },
          },
          {
            $unwind: "$creator",
          },
          {
            $project: {
              _id: 0,
              totalPrompts: 1,
              name: "$creator.name",
              image: "$creator.image",
            },
          },
        ])
        .toArray();

      res.send(result);
    });

    // ----------------------------------------------------------------------------------------------------------------------
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
