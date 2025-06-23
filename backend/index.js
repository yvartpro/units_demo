import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LEDGER_PATH = path.join(__dirname, "ledger.json")

// Ensure ledger file exists
if (!fs.existsSync(LEDGER_PATH)) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify([]))
}

const loadLedger = () => JSON.parse(fs.readFileSync(LEDGER_PATH))
const saveLedger = (data) => fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2))

app.get("/ledger", (req, res) => {
  const ledger = loadLedger()
  res.json(ledger)
})

app.post("/transaction", (req, res) => {
  const { from, to, amount } = req.body
  if (!from || !to || typeof amount !== "number") {
    return res.status(400).json({ error: "Invalid transaction" })
  }

  const newTx = {
    from,
    to,
    amount,
    timestamp: Date.now(),
    txHash: "0x" + Math.random().toString(16).substr(2, 64),
  }

  const ledger = loadLedger()
  ledger.push(newTx)
  saveLedger(ledger)

  res.status(201).json({ message: "Transaction added", tx: newTx })
})

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000')
})
