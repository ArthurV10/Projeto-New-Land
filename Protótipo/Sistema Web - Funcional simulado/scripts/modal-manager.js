// Gerenciador de modais
class ModalManager {
  constructor() {
    this.currentModal = null
    this.selectedMeter = null
    this.selectedOS = null
    this.initializeModals()
  }

  initializeModals() {
    // Cria modal para detalhes da OS
    this.createOSDetailsModal()
    this.createBindingsTableModal()
    this.createReportModal()

    // Event listeners para fechar modais
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeModal()
      }
      if (e.target.classList.contains("close")) {
        this.closeModal()
      }
    })

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
      }
    })
  }

  createOSDetailsModal() {
    const modal = document.createElement("div")
    modal.id = "os-details-modal"
    modal.className = "modal"
    modal.style.display = "none"

    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalhes da Ordem de Serviço</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="os-details" id="os-details-content">
                        <!-- Conteúdo será preenchido dinamicamente -->
                    </div>
                    <div class="modal-buttons">
                        <button class="btn btn-secondary" onclick="modalManager.closeModal()">Cancelar</button>
                        <button class="btn btn-danger" onclick="modalManager.deleteOS()">Deletar OS</button>
                        <button class="btn btn-primary" onclick="modalManager.showMeterSelection()">Vincular OS</button>
                        <button class="btn btn-outline" onclick="modalManager.unbindOS()" id="unbind-btn" style="display: none;">Desvincular</button>
                    </div>
                    <div id="meter-selection" style="display: none;">
                        <h4>Selecionar Medidor:</h4>
                        <div id="meter-list">
                            <!-- Lista de medidores será preenchida dinamicamente -->
                        </div>
                        <div class="modal-buttons">
                            <button class="btn btn-secondary" onclick="modalManager.hideMeterSelection()">Cancelar</button>
                            <button class="btn btn-primary" onclick="modalManager.confirmBinding()">Confirmar Vinculação</button>
                        </div>
                    </div>
                </div>
            </div>
        `

    document.body.appendChild(modal)
  }

  createBindingsTableModal() {
    const modal = document.createElement("div")
    modal.id = "bindings-table-modal"
    modal.className = "modal"
    modal.style.display = "none"

    modal.innerHTML = `
            <div class="modal-content history-modal">
                <div class="modal-header">
                    <h3>
                        <span class="file-icon">📋</span>
                        Tabela de Vinculações
                    </h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="history-table-container">
                        <table class="history-table">
                            <thead>
                                <tr>
                                    <th>Medidor</th>
                                    <th>OS</th>
                                    <th>Cliente</th>
                                    <th>Veículo</th>
                                    <th>Óleo</th>
                                    <th>Quantidade</th>
                                    <th>Status</th>
                                    <th>Data Vinculação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="bindings-table-body">
                                <!-- Conteúdo será preenchido dinamicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `

    document.body.appendChild(modal)
  }

  createReportModal() {
    const modal = document.createElement("div")
    modal.id = "report-modal"
    modal.className = "modal"
    modal.style.display = "none"

    modal.innerHTML = `
            <div class="modal-content history-modal">
                <div class="modal-header">
                    <h3>
                        <span class="file-icon">📊</span>
                        Relatório de Consumo de Óleo
                    </h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div id="report-content">
                        <!-- Conteúdo será preenchido dinamicamente -->
                    </div>
                    <div class="modal-buttons">
                        <button class="btn btn-primary" onclick="modalManager.exportReport()">Exportar PDF</button>
                        <button class="btn btn-secondary" onclick="modalManager.closeModal()">Fechar</button>
                    </div>
                </div>
            </div>
        `

    document.body.appendChild(modal)
  }

  showOSDetails(osId, meterId = null) {
    const os = window.dataManager.getWorkOrder(osId)
    if (!os) return

    this.selectedOS = osId
    this.selectedMeter = meterId

    const modal = document.getElementById("os-details-modal")
    const content = document.getElementById("os-details-content")
    const unbindBtn = document.getElementById("unbind-btn")

    content.innerHTML = `
    <h4>${os.id}</h4>
    <p><strong>Veículo:</strong> ${os.vehicle}</p>
    <p><strong>Cliente:</strong> ${os.client}</p>
    <p><strong>Tipo de Óleo:</strong> ${os.oilType}</p>
    <p><strong>Quantidade:</strong> ${os.quantity}L</p>
    <p><strong>Status:</strong> ${this.getStatusText(os.status)}</p>
    ${os.isCompleted ? "<p><strong>⚠️ OS CONCLUÍDA - Não pode ser vinculada novamente</strong></p>" : ""}
    ${os.boundMeter ? `<p><strong>Medidor Vinculado:</strong> ${os.boundMeter}</p>` : ""}
    ${meterId ? `<p><strong>Medidor Selecionado:</strong> MEDIDOR ${meterId.toString().padStart(2, "0")}</p>` : ""}
  `

    // Controla visibilidade dos botões baseado no status
    const deleteBtn = modal.querySelector(".btn-danger")
    const bindBtn = modal.querySelector(".btn-primary")

    // Desabilita vinculação se OS estiver concluída
    if (os.isCompleted) {
      bindBtn.style.display = "none"
    } else {
      bindBtn.style.display = "inline-block"
    }

    // Desabilita deleção se OS estiver em andamento
    if (os.status === "in-progress" || os.status === "paused") {
      deleteBtn.disabled = true
      deleteBtn.textContent = "Não é possível deletar (Em uso)"
    } else {
      deleteBtn.disabled = false
      deleteBtn.textContent = "Deletar OS"
    }

    // Mostra botão de desvincular se a OS estiver vinculada e não concluída
    if (os.boundMeter && !os.isCompleted) {
      unbindBtn.style.display = "inline-block"
    } else {
      unbindBtn.style.display = "none"
    }

    this.openModal(modal)
  }

  showMeterSelection() {
    const meterSelection = document.getElementById("meter-selection")
    const meterList = document.getElementById("meter-list")

    const availableMeters = window.dataManager
      .getAllMeters()
      .filter((meter) => !meter.boundOS && meter.status !== "maintenance")

    if (availableMeters.length === 0) {
      meterList.innerHTML = '<p style="color: #ef4444; text-align: center;">Nenhum medidor disponível no momento</p>'
      return
    }

    meterList.innerHTML = availableMeters
      .map(
        (meter) => `
    <div class="meter-option">
      <label class="meter-option-label">
        <input type="radio" name="selected-meter" value="${meter.id}">
        <span class="meter-option-text">${meter.name} - ${meter.oilType} (${this.getStatusText(meter.status)})</span>
      </label>
    </div>
  `,
      )
      .join("")

    meterSelection.style.display = "block"
  }

  hideMeterSelection() {
    document.getElementById("meter-selection").style.display = "none"
  }

  confirmBinding() {
    const selectedMeterInput = document.querySelector('input[name="selected-meter"]:checked')
    if (!selectedMeterInput) {
      alert("Selecione um medidor")
      return
    }

    const meterId = Number.parseInt(selectedMeterInput.value)
    const result = window.dataManager.bindWorkOrder(meterId, this.selectedOS)

    if (result.success) {
      alert(result.message)
      this.closeModal()
      window.uiManager.updateUI()
    } else {
      alert(result.message)
    }
  }

  deleteOS() {
    const os = window.dataManager.getWorkOrder(this.selectedOS)
    if (!os) return

    if (os.status === "in-progress" || os.status === "paused") {
      alert("Não é possível deletar uma OS que está em andamento. Pause e desvincule primeiro.")
      return
    }

    if (confirm(`Tem certeza que deseja deletar a OS ${this.selectedOS}?`)) {
      const success = window.dataManager.deleteWorkOrder(this.selectedOS)
      if (success) {
        alert("OS deletada com sucesso")
        this.closeModal()
        window.uiManager.updateUI()
      } else {
        alert("Erro ao deletar OS")
      }
    }
  }

  unbindOS() {
    if (confirm(`Tem certeza que deseja desvincular a OS ${this.selectedOS}?`)) {
      const result = window.dataManager.unbindWorkOrder(this.selectedOS)
      if (result.success) {
        alert(result.message)
        this.closeModal()
        window.uiManager.updateUI()
      } else {
        alert(result.message)
      }
    }
  }

  showBindingsTable() {
    const modal = document.getElementById("bindings-table-modal")
    const tbody = document.getElementById("bindings-table-body")

    const bindings = window.dataManager.getActiveBindings()

    tbody.innerHTML = bindings
      .map((binding) => {
        const meter = window.dataManager.getMeter(binding.meterId)
        const os = window.dataManager.getWorkOrder(binding.osId)

        return `
                <tr>
                    <td>${meter.name}</td>
                    <td>${os.id}</td>
                    <td>${os.client}</td>
                    <td>${os.vehicle}</td>
                    <td>${os.oilType}</td>
                    <td>${os.quantity}L</td>
                    <td><span class="os-status ${os.status}">${this.getStatusText(os.status)}</span></td>
                    <td>${binding.bindDate.toLocaleString("pt-BR")}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="modalManager.unbindFromTable('${os.id}')">
                            Desvincular
                        </button>
                    </td>
                </tr>
            `
      })
      .join("")

    this.openModal(modal)
  }

  unbindFromTable(osId) {
    if (confirm(`Tem certeza que deseja desvincular a OS ${osId}?`)) {
      const result = window.dataManager.unbindWorkOrder(osId)
      if (result.success) {
        alert(result.message)
        this.showBindingsTable() // Atualiza a tabela
        window.uiManager.updateUI()
      } else {
        alert(result.message)
      }
    }
  }

  showReport() {
    const modal = document.getElementById("report-modal")
    const content = document.getElementById("report-content")

    const report = window.dataManager.generateOilConsumptionReport()

    content.innerHTML = `
            <div class="report-section">
                <h4>Resumo Geral</h4>
                <div class="report-grid">
                    <div class="report-item">
                        <span class="report-label">Total de Óleo Usado:</span>
                        <span class="report-value">${report.totalOilUsed.toFixed(2)}L</span>
                    </div>
                    <div class="report-item">
                        <span class="report-label">OS Concluídas:</span>
                        <span class="report-value">${report.completedOrders}</span>
                    </div>
                    <div class="report-item">
                        <span class="report-label">OS Ativas:</span>
                        <span class="report-value">${report.activeOrders}</span>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h4>Consumo por Tipo de Óleo</h4>
                <div class="report-table">
                    ${Object.entries(report.oilByType)
                      .map(
                        ([type, amount]) => `
                        <div class="report-row">
                            <span>${type}:</span>
                            <span>${amount.toFixed(2)}L</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="report-section">
                <h4>Uso por Medidor</h4>
                <div class="report-table">
                    ${Object.entries(report.meterUsage)
                      .map(
                        ([meter, amount]) => `
                        <div class="report-row">
                            <span>${meter}:</span>
                            <span>${amount.toFixed(2)}L</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="report-section">
                <h4>Consumo Diário (Últimos 7 dias)</h4>
                <div class="report-table">
                    ${Object.entries(report.dailyConsumption)
                      .map(
                        ([date, amount]) => `
                        <div class="report-row">
                            <span>${new Date(date).toLocaleDateString("pt-BR")}:</span>
                            <span>${amount.toFixed(2)}L</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="report-footer">
                <p><small>Relatório gerado em: ${report.generatedAt.toLocaleString("pt-BR")}</small></p>
            </div>
        `

    this.openModal(modal)
  }

  exportReport() {
    // Simula exportação de PDF
    alert("Funcionalidade de exportação PDF será implementada em breve")
  }

  openModal(modal) {
    this.currentModal = modal
    modal.style.display = "flex"
    document.body.style.overflow = "hidden"
  }

  closeModal() {
    if (this.currentModal) {
      this.currentModal.style.display = "none"
      document.body.style.overflow = "auto"
      this.currentModal = null
    }
    this.selectedMeter = null
    this.selectedOS = null
  }

  getStatusText(status) {
    const statusMap = {
      pending: "Pendente",
      "in-progress": "Em Andamento",
      completed: "Concluída",
      stopped: "Parado",
      dispensing: "Dispensando",
      maintenance: "Manutenção",
      operational: "Operacional",
    }
    return statusMap[status] || status
  }
}

// Instância global do gerenciador de modais
window.modalManager = new ModalManager()
