import "dotenv/config"
import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "exp"
const COLLECTION = "users"

let db

async function connect() {
  if (MONGODB_URI === "mongodb://localhost:27017") {
    console.error("MONGODB_URI not set. Add MONGODB_URI in Render Dashboard → Environment.")
    return
  }
  try {
    console.log("Connecting to MongoDB...")
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    await client.connect()
    db = client.db(DB_NAME)
    console.log("Connected to MongoDB")
  } catch (err) {
    console.error("MongoDB connection failed:", err.message)
    console.error(err)
  }
}

app.get("/", (req, res) => {
  res.json({ ok: true, db: !!db })
})

app.get("/api/data", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" })
  const deviceId = req.query.deviceId
  if (!deviceId) {
    return res.status(400).json({ error: "deviceId required" })
  }
  try {
    const col = db.collection(COLLECTION)
    const doc = await col.findOne({ deviceId })
    if (!doc) return res.json({})
    res.json({
      expenses: doc.expenses ?? {},
      monthlyBudget: doc.monthlyBudget ?? 3000,
      secretSavingsEntries: doc.secretSavingsEntries ?? [],
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to load data" })
  }
})

app.put("/api/data", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" })
  const { deviceId, expenses, monthlyBudget, secretSavingsEntries } = req.body
  if (!deviceId) {
    return res.status(400).json({ error: "deviceId required" })
  }
  try {
    const col = db.collection(COLLECTION)
    await col.updateOne(
      { deviceId },
      {
        $set: {
          deviceId,
          expenses: expenses ?? {},
          monthlyBudget: monthlyBudget ?? 3000,
          secretSavingsEntries: secretSavingsEntries ?? [],
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to save data" })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  connect()
})
