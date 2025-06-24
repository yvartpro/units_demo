    const apiURL = "http://192.168.0.116:3000" // adapte selon ton IP
    let wallet = localStorage.getItem("wallet")
    let showOnlyMine = true

    if (!wallet) {
      wallet = "0x" + Math.random().toString(16).slice(2, 42)
      localStorage.setItem("wallet", wallet)

      fetch(apiURL + "/mine-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "0xGENESIS",
          to: wallet,
          amount: 1000,
        }),
      }).then(() => {
        loadBalance()
        displayTransactions()
      })
    }

    document.getElementById("walletAddress").textContent = wallet

    document.getElementById("toggleViewBtn").addEventListener("click", () => {
      showOnlyMine = !showOnlyMine
      document.getElementById("toggleViewBtn").textContent = showOnlyMine
        ? "Afficher tous les transferts"
        : "Afficher uniquement les miens"
      displayTransactions()
    })

    document.getElementById("txForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      const to = document.getElementById("to").value.trim()
      const amount = parseInt(document.getElementById("amount").value)
      if (to && amount > 0) {
        const res = await fetch(apiURL + "/mine-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: wallet, to, amount }),
        })
        const data = await res.json()
        document.getElementById("txMessage").textContent = "Transaction envoyée!"
        document.getElementById("to").value = ""
        document.getElementById("amount").value = ""
        loadBalance()
        displayTransactions()
        setTimeout(() => (document.getElementById("txMessage").textContent = ""), 3000)
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

    async function displayTransactions() {
      const list = document.getElementById("transactionList")
      list.innerHTML = ""

      const res = await fetch(apiURL + "/blocks")
      const blocks = await res.json()
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
        li.textContent = `Tx: ${tx.amount} Units de ${tx.from.slice(0, 10)}... à ${tx.to.slice(0, 10)}... le ${new Date(tx.timestamp).toLocaleString()}`
        list.appendChild(li)
      })
    }

    loadBalance()
    displayTransactions()