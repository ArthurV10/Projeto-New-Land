// Script principal - inicialização do sistema
document.addEventListener("DOMContentLoaded", () => {
  console.log("Toyota New Land - Sistema de Combustível iniciado")

  // Aguarda todos os scripts carregarem
  setTimeout(() => {
    // Inicializa os gerenciadores
    window.dataManager = new DataManager()
    window.modalManager = new ModalManager()
    window.uiManager = new UIManager()

    console.log("Todos os gerenciadores inicializados")

    // Adiciona event listeners globais
    setupGlobalEventListeners()

    // Configura atalhos de teclado
    setupKeyboardShortcuts()

    console.log("Sistema totalmente inicializado")
  }, 100)
})

function setupGlobalEventListeners() {
  // Event listener para cliques em OS
  document.addEventListener("click", (e) => {
    if (e.target.closest(".os-item")) {
      const osItem = e.target.closest(".os-item")
      const osNumber = osItem.querySelector(".os-number").textContent
      window.modalManager.showOSDetails(osNumber)
    }
  })
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl + B para mostrar tabela de vinculações
    if (e.ctrlKey && e.key === "b") {
      e.preventDefault()
      window.modalManager.showBindingsTable()
    }

    // Ctrl + R para mostrar relatório
    if (e.ctrlKey && e.key === "r") {
      e.preventDefault()
      window.modalManager.showReport()
    }

    // Ctrl + H para mostrar histórico
    if (e.ctrlKey && e.key === "h") {
      e.preventDefault()
      window.uiManager.showHistoryModal()
    }

    // Números 1-7 para selecionar medidores
    if (e.key >= "1" && e.key <= "7" && !e.ctrlKey && !e.altKey) {
      const meterNumber = Number.parseInt(e.key)
      window.uiManager.selectMeter(meterNumber)
    }
  })
}

// Funções utilitárias globais
window.utils = {
  formatDate: (date) => new Date(date).toLocaleString("pt-BR"),

  formatAmount: (amount) => `${amount.toFixed(2)}L`,

  exportToCSV: function (data, filename) {
    const csv = this.convertToCSV(data)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("hidden", "")
    a.setAttribute("href", url)
    a.setAttribute("download", filename)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  },

  convertToCSV: (data) => {
    if (!data || !data.length) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(",")),
    ].join("\n")

    return csvContent
  },
}
