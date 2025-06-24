import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import crypto from "crypto"

const app = express()
const PORT = 3000
app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BLOCKS_PATH = path.join(__dirname, "blocks.json")

if (!fs.existsSync(BLOCKS_PATH)) {
  fs.writeFileSync(BLOCKS_PATH, JSON.stringify([]))
}

const loadBlocks = () => JSON.parse(fs.readFileSync(BLOCKS_PATH))
const saveBlocks = (data) => fs.writeFileSync(BLOCKS_PATH, JSON.stringify(data, null, 2))

function hashBlock(block) {
  const clone = { ...block }
  delete clone.hash
  const json = JSON.stringify(clone, Object.keys(clone).sort())
  return crypto.createHash('sha256').update(json).digest('hex')
}

app.post("/transaction", (req, res) => {
  const { from, to, amount } = req.body
  if (!from || !to || typeof amount !== "number") {
    return res.status(400).json({ error: "Invalid transaction" })
  }

  const chain = loadBlocks()
  const lastBlock = chain[chain.length - 1] || { hash: "GENESIS" }

  const newBlock = {
    index: chain.length,
    timestamp: new Date().toISOString(),
    transactions: [{ from, to, amount, timestamp: Date.now() }],
    prevHash: lastBlock.hash,
  }

  newBlock.hash = hashBlock(newBlock)
  chain.push(newBlock)
  saveBlocks(chain)

  res.status(201).json({ message: "Transaction enregistrée", block: newBlock })
})

app.get("/blocks", (req, res) => {
  const chain = loadBlocks()
  res.json(chain)
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running at http://0.0.0.0:${PORT}`)
})
