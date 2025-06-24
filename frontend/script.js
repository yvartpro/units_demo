const apiURL = "http://localhost:3000"
let wallet = localStorage.getItem("wallet")
let showOnlyMine = true

if (!wallet) {
  wallet = "0x" + Math.random().toString(16).slice(2, 42)
  localStorage.setItem("wallet", wallet)

  fetch(apiURL + "/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "GENESIS",
      to: wallet,
      amount: 1000
    })
  }).then(() => {
    loadBalance()
    renderTransactions()
  })
}

document.getElementById("walletAddress").textContent = wallet

document.getElementById("toggleViewBtn").addEventListener("click", () => {
  showOnlyMine = !showOnlyMine
  document.getElementById("toggleViewBtn").textContent = showOnlyMine
    ? "Afficher tous"
    : "Afficher les miens"
  renderTransactions()
})

document.getElementById("txForm").addEventListener("submit", async (e) => {
  e.preventDefault()
  const to = document.getElementById("to").value.trim()
  const amount = parseInt(document.getElementById("amount").value)
  if (to && amount > 0) {
    await fetch(apiURL + "/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: wallet, to, amount })
    })
    document.getElementById("txMessage").textContent = "Transaction envoyée !"
    document.getElementById("to").value = ""
    document.getElementById("amount").value = ""
    loadBalance()
    renderTransactions()
    setTimeout(() => document.getElementById("txMessage").textContent = "", 3000)
  }
})

async function loadBalance() {
  const res = await fetch(apiURL + "/blocks")
  const blocks = await res.json()
  const allTxs = blocks.flatMap(b => b.transactions || [])
  const balance = allTxs.reduce((acc, tx) => {
    if (tx.to === wallet) acc += tx.amount
    if (tx.from === wallet) acc -= tx.amount
    return acc
  }, 0)
  document.getElementById("walletBalance").textContent = balance
}

async function renderTransactions() {
  const list = document.getElementById("transactionList")
  list.innerHTML = ""

  const res = await fetch(apiURL + "/blocks")
  const blocks = await res.json()
  if (!blocks) return

  const txs = blocks.flatMap(b => b.transactions || [])
  const filtered = showOnlyMine
    ? txs.filter(tx => tx.from === wallet || tx.to === wallet)
    : txs

  if (filtered.length === 0) {
    list.innerHTML = "<li>Aucune transaction.</li>"
    return
  }

  filtered.reverse().forEach(tx => {
    const li = document.createElement("li")
    li.textContent = `Tx: ${tx.amount} unités de ${tx.from.slice(0, 10)}... à ${tx.to.slice(0, 10)}... le ${new Date(tx.timestamp).toLocaleString()}`
    list.appendChild(li)
  })
}

loadBalance()
renderTransactions()
