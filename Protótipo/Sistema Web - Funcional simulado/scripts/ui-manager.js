// Gerenciador da interface do usuário
class UIManager {
  constructor() {
    this.selectedMeter = 1
    this.currentFilter = "all"
    this.initializeEventListeners()
    this.updateUI()
    this.startRealTimeUpdates()
  }

  initializeEventListeners() {
    // Event listeners para medidores na sidebar
    document.querySelectorAll(".meter-item").forEach((item) => {
      item.addEventListener("click", () => {
        const meterId = Number.parseInt(item.dataset.meter)
        this.selectMeter(meterId)
      })
    })

    // Event listener para filtro de OS
    const filterSelect = document.getElementById("os-filter")
    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        this.currentFilter = e.target.value
        this.filterOSByStatus(e.target.value)
      })
    }
  }

  selectMeter(meterId) {
    this.selectedMeter = meterId

    document.querySelectorAll(".meter-item").forEach((item) => {
      const itemMeterId = Number.parseInt(item.dataset.meter)
      if (itemMeterId === meterId) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    this.updateMeterDetails(meterId)
  }

  updateMeterDetails(meterId) {
    const meter = window.dataManager.getMeter(meterId)
    if (!meter) return

    const cardTitle = document.querySelector(".meter-card .card-title")
    cardTitle.innerHTML = `
      <i class="fas fa-tachometer-alt"></i>
      ${meter.name} - ${meter.oilType}
    `

    const amountValue = document.querySelector(".amount-value")
    const statusBadge = document.querySelector(".status-badge")

    amountValue.textContent = meter.currentAmount.toFixed(2)
    amountValue.className = `amount-value ${meter.status}`

    statusBadge.textContent = this.getStatusText(meter.status)
    statusBadge.className = `status-badge ${meter.status}`

    this.updateMeterInfo(meter)
    this.updateControlButtons(meter)
  }

  updateMeterInfo(meter) {
    const infoRows = document.querySelectorAll(".info-row")

    infoRows[0].querySelector(".info-value").textContent = this.getStatusDescription(meter.status)

    if (meter.activeOS) {
      const os = window.dataManager.getWorkOrder(meter.activeOS)
      infoRows[1].querySelector(".info-value").textContent = `${os.id} - ${os.client}`

      const progress = ((meter.currentAmount / os.quantity) * 100).toFixed(1)
      infoRows[2].querySelector(".info-value").textContent = `${progress}%`
      infoRows[2].querySelector(".info-value").className = "info-value progress"
    } else {
      infoRows[1].querySelector(".info-value").textContent = "Nenhuma OS vinculada"
      infoRows[2].querySelector(".info-value").textContent = "0.0%"
    }
  }

  updateControlButtons(meter) {
    const controlButtons = document.querySelector(".control-buttons")

    // Se o medidor está em manutenção
    if (meter.status === "maintenance") {
      controlButtons.innerHTML = `
        <button class="btn btn-secondary" disabled>
          <i class="fas fa-wrench"></i>
          Em Manutenção
        </button>
      `
      return
    }

    // Se não há nenhuma OS vinculada
    if (meter.boundOSList.length === 0) {
      controlButtons.innerHTML = `
        <button class="btn btn-primary" onclick="uiManager.showOSSelectionForMeter(${meter.id})">
          <i class="fas fa-link"></i>
          Vincular OS
        </button>
        <button class="btn btn-outline" onclick="uiManager.createTestOS(${meter.id})">
          <i class="fas fa-flask"></i>
          Modo Teste
        </button>
      `
      return
    }

    // Se há OS vinculadas
    const activeOS = window.dataManager.getWorkOrder(meter.activeOS)
    if (!activeOS) return

    let buttonsHTML = ""

    // Se há múltiplas OS vinculadas E não está dispensando
    if (meter.boundOSList.length > 1 && meter.status === "stopped") {
      buttonsHTML += `
        <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600; color: #475569;">
            <i class="fas fa-list"></i> Selecionar OS para Dispensar:
          </label>
          <select onchange="uiManager.switchActiveOS(${meter.id}, this.value)" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; font-size: 12px;">
            ${meter.boundOSList
              .map((osId) => {
                const os = window.dataManager.getWorkOrder(osId)
                return `<option value="${osId}" ${meter.activeOS === osId ? "selected" : ""}>
                ${osId} - ${os.client} (${os.quantity}L)
              </option>`
              })
              .join("")}
          </select>
        </div>
      `
    }

    // Botões de controle baseados no status
    switch (meter.status) {
      case "stopped":
        if (meter.currentAmount >= activeOS.quantity) {
          // OS já foi completamente dispensada
          buttonsHTML += `
            <button class="btn btn-success" onclick="uiManager.completeAndReset(${meter.id})">
              <i class="fas fa-check"></i>
              Finalizar OS
            </button>
          `
        } else {
          // Pronto para iniciar dispensação
          buttonsHTML += `
            <button class="btn btn-primary" onclick="uiManager.startDispensing(${meter.id})">
              <i class="fas fa-play"></i>
              Iniciar Dispensação
            </button>
          `
        }
        break

      case "dispensing":
        // Durante dispensação - apenas pausar ou parar
        buttonsHTML += `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button class="btn btn-warning" onclick="uiManager.pauseDispensing(${meter.id})">
              <i class="fas fa-pause"></i>
              Pausar
            </button>
            <button class="btn btn-danger" onclick="uiManager.stopDispensing(${meter.id})">
              <i class="fas fa-stop"></i>
              Parar
            </button>
          </div>
        `
        break

      case "paused":
        // Pausado - pode retomar ou parar
        buttonsHTML += `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button class="btn btn-primary" onclick="uiManager.resumeDispensing(${meter.id})">
              <i class="fas fa-play"></i>
              Retomar
            </button>
            <button class="btn btn-danger" onclick="uiManager.stopDispensing(${meter.id})">
              <i class="fas fa-stop"></i>
              Parar
            </button>
          </div>
        `
        break
    }

    // Botões adicionais apenas quando parado
    if (meter.status === "stopped") {
      buttonsHTML += `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button class="btn btn-outline btn-sm" onclick="uiManager.unbindCurrentOS(${meter.id})">
              <i class="fas fa-unlink"></i>
              Desvincular
            </button>
            <button class="btn btn-outline btn-sm" onclick="uiManager.showOSSelectionForMeter(${meter.id})">
              <i class="fas fa-plus"></i>
              + OS
            </button>
          </div>
        </div>
      `
    }

    // Aviso quando está dispensando e há múltiplas OS
    if (meter.boundOSList.length > 1 && (meter.status === "dispensing" || meter.status === "paused")) {
      buttonsHTML += `
        <div style="margin-top: 8px; padding: 6px 8px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;">
          <div style="font-size: 11px; color: #92400e; font-weight: 500;">
            <i class="fas fa-info-circle"></i> 
            Para trocar de OS, pare a dispensação atual
          </div>
        </div>
      `
    }

    controlButtons.innerHTML = buttonsHTML
  }

  switchActiveOS(meterId, osId) {
    const meter = window.dataManager.getMeter(meterId)

    // Só permite trocar se estiver parado
    if (meter.status !== "stopped") {
      alert("Não é possível trocar de OS durante dispensação. Pare a dispensação primeiro.")
      // Restaura a seleção anterior
      this.updateControlButtons(meter)
      return
    }

    const result = window.dataManager.switchActiveOS(meterId, osId)
    if (result.success) {
      this.updateUI()
      this.showNotification(`OS ativa alterada para ${osId}`, "success")
    } else {
      alert(result.message)
    }
  }

  startDispensing(meterId) {
    const result = window.dataManager.startDispensing(meterId)
    if (result.success) {
      this.updateUI()
      this.showNotification("Dispensação iniciada!", "success")
    } else {
      alert(result.message)
    }
  }

  pauseDispensing(meterId) {
    const result = window.dataManager.pauseDispensing(meterId)
    if (result.success) {
      this.updateUI()
      this.showNotification("Dispensação pausada", "warning")
    } else {
      alert(result.message)
    }
  }

  resumeDispensing(meterId) {
    const result = window.dataManager.resumeDispensing(meterId)
    if (result.success) {
      this.updateUI()
      this.showNotification("Dispensação retomada!", "success")
    } else {
      alert(result.message)
    }
  }

  stopDispensing(meterId) {
    if (confirm("Tem certeza que deseja parar a dispensação? Isso irá finalizar a OS atual.")) {
      const meter = window.dataManager.getMeter(meterId)
      if (meter && meter.activeOS) {
        const os = window.dataManager.getWorkOrder(meter.activeOS)
        if (os) {
          meter.currentAmount = os.quantity
          const result = window.dataManager.completeDispensing(meterId)
          if (result.success) {
            this.showNotification("Dispensação finalizada com sucesso!", "success")
            this.updateUI()
          }
        }
      }
    }
  }

  updateUI() {
    this.updateMeterDetails(this.selectedMeter)
    this.updateRealtimePanel()
    this.filterOSByStatus(this.currentFilter)
    this.updateSidebar()
  }

  updateRealtimePanel() {
    const realtimeList = document.getElementById("realtime-list")
    const meters = window.dataManager.getAllMeters()

    realtimeList.innerHTML = meters
      .map((meter) => {
        let osInfoHTML = ""
        let progressHTML = ""

        if (meter.activeOS) {
          const os = window.dataManager.getWorkOrder(meter.activeOS)
          osInfoHTML = `
            <div class="realtime-os-info">
              <div class="os-line">${os.id} - ${os.client}</div>
              <div class="os-oil">${os.oilType}</div>
            </div>
          `

          const progress = (meter.currentAmount / os.quantity) * 100
          progressHTML = `
            <div class="realtime-progress">
              <div class="progress-info">
                <span>Progresso:</span>
                <span>${meter.currentAmount.toFixed(2)}L / ${os.quantity}L</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${meter.status}" style="width: ${progress}%"></div>
              </div>
            </div>
          `
        } else {
          osInfoHTML = `<div class="no-os">Nenhuma OS vinculada</div>`
        }

        return `
          <div class="realtime-item">
            <div class="realtime-header">
              <div class="realtime-meter-name">
                <div class="status-dot ${meter.status}"></div>
                <span>${meter.name}</span>
              </div>
              <div class="realtime-status ${meter.status}">${this.getStatusText(meter.status)}</div>
            </div>
            ${osInfoHTML}
            ${progressHTML}
            <div class="realtime-amount">
              <div class="realtime-amount-value ${meter.status}">${meter.currentAmount.toFixed(2)} L</div>
              <div class="realtime-amount-status">${meter.status === "dispensing" ? "Dispensando..." : "Aguardando"}</div>
            </div>
          </div>
        `
      })
      .join("")
  }

  filterOSByStatus(status) {
    const workOrders = window.dataManager.getAllWorkOrders()
    const osContainer = document.getElementById("os-list")

    let filteredOrders = workOrders
    if (status !== "all") {
      filteredOrders = workOrders.filter((os) => os.status === status)
    }

    if (status === "all") {
      this.updateOSPanel()
    } else {
      osContainer.innerHTML = filteredOrders.map((os) => this.createOSElementHTML(os)).join("")
    }

    this.updateOSCounter(status)
  }

  updateOSPanel() {
    const osContainer = document.getElementById("os-list")
    const workOrders = window.dataManager.getAllWorkOrders()

    const statusOrder = ["in-progress", "paused", "pending", "completed"]
    const organizedOS = {}

    statusOrder.forEach((status) => {
      organizedOS[status] = workOrders.filter((os) => os.status === status)
    })

    let html = ""

    statusOrder.forEach((status) => {
      const orders = organizedOS[status]
      if (orders.length > 0) {
        html += `
          <div style="margin: 12px 0 6px 0; padding: 6px 8px; background: #f3f4f6; border-radius: 4px; border-left: 3px solid ${this.getStatusColor(status)};">
            <h4 style="margin: 0; font-size: 12px; font-weight: 600; color: #374151;">
              ${this.getStatusIcon(status)} 
              ${this.getStatusText(status)} 
              <span style="font-weight: 400; opacity: 0.8;">(${orders.length})</span>
            </h4>
          </div>
        `

        orders.forEach((os) => {
          html += this.createOSElementHTML(os)
        })
      }
    })

    osContainer.innerHTML = html
    this.updateOSCounter("all")
  }

  createOSElementHTML(os) {
    return `
      <div class="os-item ${os.status}" onclick="modalManager.showOSDetails('${os.id}', ${this.selectedMeter})">
        <div class="os-header">
          <span class="os-number">${os.id}</span>
          <span class="os-status ${os.status}">${this.getStatusText(os.status)}</span>
        </div>
        <div class="os-info">
          <div><strong>Veículo:</strong> ${os.vehicle}</div>
          <div><strong>Cliente:</strong> ${os.client}</div>
          <div><strong>Óleo:</strong> ${os.oilType}</div>
          <div class="os-amount"><strong>Quantidade:</strong> ${os.quantity}L</div>
          ${os.boundMeter ? `<div><strong>Medidor:</strong> ${os.boundMeter}</div>` : ""}
          ${os.isCompleted ? '<div style="color: #10b981; font-weight: 600; margin-top: 4px;"><strong>✅ Concluída</strong></div>' : ""}
        </div>
      </div>
    `
  }

  updateOSCounter(currentFilter) {
    const workOrders = window.dataManager.getAllWorkOrders()
    const counts = {
      all: workOrders.length,
      pending: workOrders.filter((os) => os.status === "pending").length,
      "in-progress": workOrders.filter((os) => os.status === "in-progress").length,
      paused: workOrders.filter((os) => os.status === "paused").length,
      completed: workOrders.filter((os) => os.status === "completed").length,
    }

    const filterSelect = document.getElementById("os-filter")
    if (filterSelect) {
      filterSelect.innerHTML = `
        <option value="all">Todas as OS (${counts.all})</option>
        <option value="pending">Pendentes (${counts.pending})</option>
        <option value="in-progress">Em Andamento (${counts["in-progress"]})</option>
        <option value="paused">Pausadas (${counts.paused})</option>
        <option value="completed">Concluídas (${counts.completed})</option>
      `
      filterSelect.value = currentFilter
    }
  }

  updateSidebar() {
    const meterItems = document.querySelectorAll(".meter-item")
    const meters = window.dataManager.getAllMeters()

    meterItems.forEach((item, index) => {
      const meter = meters[index]
      if (!meter) return

      const statusDot = item.querySelector(".status-dot")
      const statusText = item.querySelector(".meter-status-text")

      statusDot.className = `status-dot ${meter.status}`
      statusText.textContent = this.getStatusText(meter.status)
    })
  }

  showHistoryModal() {
    // Create history modal if it doesn't exist
    let modal = document.getElementById("history-modal")
    if (!modal) {
      modal = document.createElement("div")
      modal.id = "history-modal"
      modal.className = "modal"
      modal.style.display = "none"

      modal.innerHTML = `
        <div class="modal-content history-modal">
          <div class="modal-header">
            <h3><i class="fas fa-clock-rotate-left"></i> Histórico Completo de Dispensas</h3>
            <span class="close">&times;</span>
          </div>
          <div class="modal-body">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Timestamp</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Event</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Detail</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Device</th>
                  </tr>
                </thead>
                <tbody id="history-table-body">
                  <!-- Conteúdo será preenchido dinamicamente -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)
    }

    const tbody = modal.querySelector("#history-table-body")
    const history = window.dataManager.getHistory()

    tbody.innerHTML = history
      .map(
        (entry, index) => `
          <tr ${index % 2 === 1 ? 'style="background: #f8fafc;"' : ""}>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${entry.timestamp.toLocaleString("pt-BR")}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;"><span style="color: ${this.getEventColor(entry.event)}; font-weight: 500;">${entry.event}</span></td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${entry.detail}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f3f4f6;">${entry.device}</td>
          </tr>
        `,
      )
      .join("")

    window.modalManager.openModal(modal)
  }

  showNotification(message, type = "success") {
    const existingNotification = document.querySelector(".notification")
    if (existingNotification) {
      existingNotification.remove()
    }

    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === "success" ? "✅" : "⚠️"}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)
  }

  simulateRealTimeData() {
    const meters = window.dataManager.getAllMeters()

    meters.forEach((meter) => {
      if (meter.status === "dispensing" && meter.activeOS && !meter.isPaused) {
        const os = window.dataManager.getWorkOrder(meter.activeOS)
        if (os && meter.currentAmount < os.quantity && !os.isCompleted) {
          const dispensingSpeed = 0.05 + Math.random() * 0.05
          meter.currentAmount += dispensingSpeed

          if (meter.currentAmount >= os.quantity) {
            meter.currentAmount = os.quantity
            const result = window.dataManager.completeDispensing(meter.id)

            if (result.success) {
              this.showNotification(
                `🎉 Abastecimento concluído! ${meter.name} - OS ${os.id} (${os.quantity}L)`,
                "success",
              )
            }
          }
        }
      }
    })
  }

  startRealTimeUpdates() {
    setInterval(() => {
      this.simulateRealTimeData()
      this.updateUI()
    }, 2000)

    setInterval(() => {
      const timeElement = document.getElementById("current-time")
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleString("pt-BR")
      }
    }, 1000)
  }

  getStatusText(status) {
    const statusMap = {
      pending: "Pendente",
      "in-progress": "Em Andamento",
      completed: "Concluída",
      stopped: "Parado",
      dispensing: "Dispensando",
      paused: "Pausado",
      maintenance: "Manutenção",
      operational: "Operacional",
    }
    return statusMap[status] || status
  }

  getStatusDescription(status) {
    const descriptions = {
      stopped: "Stopped; Ready for operation",
      dispensing: "Dispensing; Operation in progress",
      paused: "Paused; Operation suspended",
      maintenance: "Under maintenance; Not available",
      operational: "Operational; Ready for use",
    }
    return descriptions[status] || "Unknown status"
  }

  getStatusIcon(status) {
    const icons = {
      "in-progress": "🔄",
      paused: "⏸️",
      pending: "⏳",
      completed: "✅",
    }
    return icons[status] || "📄"
  }

  getStatusColor(status) {
    const colors = {
      "in-progress": "#f59e0b",
      paused: "#f59e0b",
      pending: "#2563eb",
      completed: "#10b981",
    }
    return colors[status] || "#6b7280"
  }

  getEventColor(event) {
    if (event.includes("Started")) return "#2563eb"
    if (event.includes("Completed")) return "#10b981"
    if (event.includes("Assigned")) return "#f59e0b"
    return "#6b7280"
  }

  // Método para mostrar seleção de OS para um medidor específico
  showOSSelectionForMeter(meterId) {
    const availableOS = window.dataManager.getAllWorkOrders().filter((os) => os.status === "pending" && !os.isCompleted)

    if (availableOS.length === 0) {
      alert("Não há OS pendentes disponíveis para vinculação")
      return
    }

    const osOptions = availableOS.map((os) => `${os.id} - ${os.client} (${os.vehicle}) - ${os.quantity}L`).join("\n")

    const selectedOS = prompt(
      `Selecione uma OS para vincular ao MEDIDOR ${meterId.toString().padStart(2, "0")}:\n\n${osOptions}\n\nDigite o número da OS (ex: OS487759):`,
    )

    if (selectedOS) {
      const result = window.dataManager.bindWorkOrder(meterId, selectedOS)
      if (result.success) {
        this.showNotification(`OS ${selectedOS} vinculada ao MEDIDOR ${meterId.toString().padStart(2, "0")}`, "success")
        this.updateUI()
      } else {
        alert(result.message)
      }
    }
  }

  // Método para criar OS de teste
  createTestOS(meterId) {
    const meter = window.dataManager.getMeter(meterId)
    if (!meter) return

    if (confirm(`Criar OS de teste para ${meter.name}?\n\nIsso criará uma OS temporária para simulação.`)) {
      // Criar OS de teste temporária
      const testOS = {
        id: `TEST${Date.now()}`,
        vehicle: "Veículo de Teste",
        client: "Cliente Teste",
        oilType: "5w30",
        quantity: 5.0,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      }

      window.dataManager.workOrders.push(testOS)

      // Vincular ao medidor
      const result = window.dataManager.bindWorkOrder(meterId, testOS.id)
      if (result.success) {
        this.showNotification(`OS de teste criada e vinculada a ${meter.name}`, "success")
        this.updateUI()
      }
    }
  }

  // Método para desvincular OS atual
  unbindCurrentOS(meterId) {
    const meter = window.dataManager.getMeter(meterId)
    if (!meter || !meter.activeOS) return

    if (meter.status === "dispensing" || meter.status === "paused") {
      alert("Não é possível desvincular durante a dispensação. Pare a dispensação primeiro.")
      return
    }

    if (confirm(`Desvincular OS ${meter.activeOS} do ${meter.name}?`)) {
      const result = window.dataManager.unbindWorkOrder(meter.activeOS)
      if (result.success) {
        this.showNotification(`OS desvinculada de ${meter.name}`, "success")
        this.updateUI()
      } else {
        alert(result.message)
      }
    }
  }

  // Método para finalizar e resetar
  completeAndReset(meterId) {
    if (confirm("Finalizar a OS atual e resetar o medidor?")) {
      const result = window.dataManager.completeDispensing(meterId)
      if (result.success) {
        this.showNotification("OS finalizada e medidor resetado!", "success")
        this.updateUI()
      } else {
        alert(result.message)
      }
    }
  }
}

window.UIManager = UIManager
