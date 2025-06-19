// Gerenciador de modais
class ModalManager {
  constructor() {
    this.currentModal = null
    this.selectedMeter = null
    this.selectedOS = null
    this.initializeModals()
  }

  initializeModals() {
    this.createOSDetailsModal()
    this.createBindingsTableModal()
    this.createReportModal()

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
          <h3><i class="fas fa-file-invoice"></i> Detalhes da Ordem de Serviço</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <div class="os-details" id="os-details-content">
            <!-- Conteúdo será preenchido dinamicamente -->
          </div>
          <div class="modal-buttons" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button class="btn btn-secondary" onclick="modalManager.closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="modalManager.deleteOS()">Deletar OS</button>
            <button class="btn btn-primary" onclick="modalManager.showMeterSelection()">Vincular OS</button>
            <button class="btn btn-outline" onclick="modalManager.unbindOS()" id="unbind-btn" style="display: none;">Desvincular</button>
          </div>
          <div id="meter-selection" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <h4>Selecionar Medidor:</h4>
            <div id="meter-list" style="margin: 12px 0;">
              <!-- Lista de medidores será preenchida dinamicamente -->
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
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
          <h3><i class="fas fa-link"></i> Tabela de Vinculações</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Medidor</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">OS</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Cliente</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Veículo</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Óleo</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Quantidade</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Status</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Ações</th>
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
          <h3><i class="fas fa-chart-pie"></i> Relatório de Consumo de Óleo</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">
          <div id="report-content">
            <!-- Conteúdo será preenchido dinamicamente -->
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
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
      <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
        <h4>${os.id}</h4>
        <p><strong>Veículo:</strong> ${os.vehicle}</p>
        <p><strong>Cliente:</strong> ${os.client}</p>
        <p><strong>Tipo de Óleo:</strong> ${os.oilType}</p>
        <p><strong>Quantidade:</strong> ${os.quantity}L</p>
        <p><strong>Status:</strong> ${this.getStatusText(os.status)}</p>
        ${os.isCompleted ? "<p style='color: #dc2626;'><strong>⚠️ OS CONCLUÍDA - Não pode ser vinculada novamente</strong></p>" : ""}
        ${os.boundMeter ? `<p><strong>Medidor Vinculado:</strong> ${os.boundMeter}</p>` : ""}
        ${meterId ? `<p><strong>Medidor Selecionado:</strong> MEDIDOR ${meterId.toString().padStart(2, "0")}</p>` : ""}
      </div>
    `

    const deleteBtn = modal.querySelector(".btn-danger")
    const bindBtn = modal.querySelector(".btn-primary")

    if (os.isCompleted) {
      bindBtn.style.display = "none"
    } else {
      bindBtn.style.display = "inline-block"
    }

    if (os.status === "in-progress" || os.status === "paused") {
      deleteBtn.disabled = true
      deleteBtn.textContent = "Não é possível deletar (Em uso)"
    } else {
      deleteBtn.disabled = false
      deleteBtn.textContent = "Deletar OS"
    }

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

    const availableMeters = window.dataManager.getAllMeters().filter((meter) => meter.status !== "maintenance")

    if (availableMeters.length === 0) {
      meterList.innerHTML = '<p style="color: #ef4444; text-align: center;">Nenhum medidor disponível no momento</p>'
      return
    }

    meterList.innerHTML = availableMeters
      .map(
        (meter) => `
        <div style="margin-bottom: 8px; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; background-color: #f9fafb;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; width: 100%; margin: 0;">
            <input type="radio" name="selected-meter" value="${meter.id}" style="margin: 0;">
            <span style="font-size: 12px; color: #374151; font-weight: 500;">${meter.name} - ${meter.oilType} (${this.getStatusText(meter.status)})</span>
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
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${meter.name}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${os.id}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${os.client}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${os.vehicle}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${os.oilType}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${os.quantity}L</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;"><span class="os-status ${os.status}">${this.getStatusText(os.status)}</span></td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">
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
        this.showBindingsTable()
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
      <div style="margin-bottom: 20px;">
        <h4>Resumo Geral</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
            <span style="font-size: 12px; color: #64748b;">Total de Óleo Usado:</span>
            <div style="font-size: 18px; font-weight: 700; color: #1e293b;">${report.totalOilUsed.toFixed(2)}L</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
            <span style="font-size: 12px; color: #64748b;">OS Concluídas:</span>
            <div style="font-size: 18px; font-weight: 700; color: #1e293b;">${report.completedOrders}</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
            <span style="font-size: 12px; color: #64748b;">OS Ativas:</span>
            <div style="font-size: 18px; font-weight: 700; color: #1e293b;">${report.activeOrders}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4>Consumo por Tipo de Óleo</h4>
        <div style="margin-top: 8px;">
          ${Object.entries(report.oilByType)
            .map(
              ([type, amount]) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
              <span>${type}:</span>
              <span style="font-weight: 600;">${amount.toFixed(2)}L</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4>Uso por Medidor</h4>
        <div style="margin-top: 8px;">
          ${Object.entries(report.meterUsage)
            .map(
              ([meter, amount]) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
              <span>${meter}:</span>
              <span style="font-weight: 600;">${amount.toFixed(2)}L</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">Relatório gerado em: ${report.generatedAt.toLocaleString("pt-BR")}</p>
      </div>
    `

    this.openModal(modal)
  }

  exportReport() {
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
      paused: "Pausado",
    }
    return statusMap[status] || status
  }
}

window.ModalManager = ModalManager
