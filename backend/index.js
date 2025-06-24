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
const TX_POOL_PATH = path.join(__dirname, "transactions.json")

// Initialisation
if (!fs.existsSync(BLOCKS_PATH)) fs.writeFileSync(BLOCKS_PATH, JSON.stringify([]))
if (!fs.existsSync(TX_POOL_PATH)) fs.writeFileSync(TX_POOL_PATH, JSON.stringify([]))

const loadBlocks = () => JSON.parse(fs.readFileSync(BLOCKS_PATH))
const saveBlocks = (data) => fs.writeFileSync(BLOCKS_PATH, JSON.stringify(data, null, 2))
const loadPool = () => JSON.parse(fs.readFileSync(TX_POOL_PATH))
const savePool = (data) => fs.writeFileSync(TX_POOL_PATH, JSON.stringify(data, null, 2))

function hashBlock(block) {
  const clone = { ...block }
  delete clone.hash
  const json = JSON.stringify(clone, Object.keys(clone).sort())
  return crypto.createHash('sha256').update(json).digest('hex')
}

function mineBlock(block, difficulty = "0000") {
  let nonce = 0
  while (true) {
    block.nonce = nonce
    const hash = hashBlock(block)
    if (hash.startsWith(difficulty)) {
      block.hash = hash
      return block
    }
    nonce++
  }
}

// 🔄 Ajouter une transaction au pool
app.post("/new-transaction", (req, res) => {
  const { from, to, amount } = req.body
  if (!from || !to || typeof amount !== "number") {
    return res.status(400).json({ error: "Invalid transaction" })
  }

  const pool = loadPool()
  pool.push({ from, to, amount, timestamp: Date.now() })
  savePool(pool)

  res.status(201).json({ message: "Transaction ajoutée au pool" })
})

// 🧱 Miner un bloc entier à partir du pool
app.post("/mine", (req, res) => {
  const txPool = loadPool()
  if (txPool.length === 0) {
    return res.status(400).json({ error: "Aucune transaction à miner" })
  }

  const chain = loadBlocks()
  const lastBlock = chain[chain.length - 1] || { hash: "0xGENESIS" }

  const newBlock = {
    index: chain.length,
    timestamp: new Date().toISOString(),
    transactions: txPool,
    nonce: 0,
    prevHash: lastBlock.hash,
  }

  const mined = mineBlock(newBlock)
  chain.push(mined)
  saveBlocks(chain)

  // Vider le pool
  savePool([])

  res.status(201).json({ message: "Bloc miné", block: mined })
})

// 🔎 Récupérer la chaîne complète
app.get("/blocks", (req, res) => {
  const chain = loadBlocks()
  res.json(chain)
})

// 🔎 Voir le pool de transactions
app.get("/pending", (req, res) => {
  const pool = loadPool()
  res.json(pool)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⛏️ Blockchain backend running at http://0.0.0.0:${PORT}`)
})
