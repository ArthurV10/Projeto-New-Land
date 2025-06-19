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
    document.querySelectorAll(".meter-item").forEach((item, index) => {
      item.addEventListener("click", () => {
        this.selectMeter(index + 1)
      })
    })

    // Event listeners para OS
    document.querySelectorAll(".os-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const osNumber = item.querySelector(".os-number").textContent
        window.modalManager.showOSDetails(osNumber, this.selectedMeter)
      })
    })

    // Event listener para filtro de OS - CORRIGIDO
    setTimeout(() => {
      const filterSelect = document.querySelector(".filter-select")
      if (filterSelect) {
        filterSelect.addEventListener("change", (e) => {
          this.currentFilter = e.target.value
          this.filterOSByStatus(e.target.value)
        })
      }
    }, 100)

    // Event listener para botão de histórico
    const historyBtn = document.querySelector(".btn-outline")
    if (historyBtn) {
      historyBtn.addEventListener("click", () => {
        this.showHistoryModal()
      })
    }

    this.addControlButtons()
  }

  // Método para filtrar OS por status - CORRIGIDO
  filterOSByStatus(status) {
    const workOrders = window.dataManager.getAllWorkOrders()
    const osContainer = document.querySelector(".os-list")

    // Limpa container
    osContainer.innerHTML = ""

    // Filtra OS baseado no status
    let filteredOrders = workOrders
    if (status !== "all") {
      filteredOrders = workOrders.filter((os) => os.status === status)
    }

    // Organiza por status se "all" estiver selecionado
    if (status === "all") {
      this.updateOSPanel()
    } else {
      // Mostra apenas OS do status selecionado
      if (filteredOrders.length > 0) {
        const statusHeader = document.createElement("div")
        statusHeader.className = `os-status-header status-${status}`
        statusHeader.innerHTML = `
          <h4>
            ${this.getStatusIcon(status)} 
            ${this.getStatusText(status)} 
            <span class="status-count">(${filteredOrders.length})</span>
          </h4>
        `
        osContainer.appendChild(statusHeader)

        filteredOrders.forEach((os) => {
          const osItem = this.createOSElement(os)
          osContainer.appendChild(osItem)
        })
      } else {
        osContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #6b7280;">
            Nenhuma OS encontrada para o status "${this.getStatusText(status)}"
          </div>
        `
      }
    }

    // Atualiza contador no filtro
    this.updateOSCounter(status)
  }

  // Método para contar OS por status
  updateOSCounter(currentFilter) {
    const workOrders = window.dataManager.getAllWorkOrders()
    const counts = {
      all: workOrders.length,
      pending: workOrders.filter((os) => os.status === "pending").length,
      "in-progress": workOrders.filter((os) => os.status === "in-progress").length,
      paused: workOrders.filter((os) => os.status === "paused").length,
      completed: workOrders.filter((os) => os.status === "completed").length,
    }

    const filterSelect = document.querySelector(".filter-select")
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

  addControlButtons() {
    const header = document.querySelector(".header-content")
    const controlsDiv = document.createElement("div")
    controlsDiv.className = "header-controls"
    controlsDiv.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="modalManager.showBindingsTable()">
        📋 Vinculações
      </button>
      <button class="btn btn-outline btn-sm" onclick="modalManager.showReport()">
        📊 Relatório
      </button>
    `

    const style = document.createElement("style")
    style.textContent = `
      .header-controls {
        display: flex;
        gap: 8px;
      }
      .header-controls .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
        border-color: rgba(255,255,255,0.5);
        color: rgba(255,255,255,0.9);
      }
      .header-controls .btn-sm:hover {
        background-color: rgba(255,255,255,0.1);
        border-color: white;
        color: white;
      }
      .os-selector {
        margin-bottom: 12px;
        padding: 8px;
        background: #f3f4f6;
        border-radius: 6px;
      }
      .os-selector select {
        width: 100%;
        padding: 6px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
      }
      .os-selector label {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #374151;
      }
    `
    document.head.appendChild(style)

    header.appendChild(controlsDiv)
  }

  selectMeter(meterId) {
    this.selectedMeter = meterId

    document.querySelectorAll(".meter-item").forEach((item, index) => {
      if (index + 1 === meterId) {
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
      <span class="gauge-icon">⚡</span>
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

  updateControlButtons(meter) {
    const controlButtons = document.querySelector(".control-buttons")

    if (meter.boundOSList.length === 0) {
      controlButtons.innerHTML = `
      <button class="btn btn-secondary" disabled>
        <span class="btn-icon">⚠️</span>
        Nenhuma OS Vinculada
      </button>
    `
      return
    }

    const activeOS = window.dataManager.getWorkOrder(meter.activeOS)
    if (!activeOS) return

    let buttonsHTML = ""

    // Seletor de OS ativa mais compacto
    if (meter.boundOSList.length > 1) {
      buttonsHTML += `
      <div class="os-selector-compact">
        <label>OS Ativa:</label>
        <select onchange="uiManager.switchActiveOS(${meter.id}, this.value)">
          ${meter.boundOSList
            .map((osId) => {
              const os = window.dataManager.getWorkOrder(osId)
              return `<option value="${osId}" ${meter.activeOS === osId ? "selected" : ""}>
              ${osId} - ${os.client}
            </option>`
            })
            .join("")}
        </select>
      </div>
    `
    }

    // Botões organizados em grid compacto
    buttonsHTML += `<div class="control-buttons-grid">`

    switch (meter.status) {
      case "stopped":
        if (meter.currentAmount >= activeOS.quantity) {
          buttonsHTML += `
          <button class="btn btn-success" disabled>
            <span class="btn-icon">✅</span>
            Concluída
          </button>
        `
        } else {
          buttonsHTML += `
          <button class="btn btn-primary" onclick="uiManager.startDispensing(${meter.id})">
            <span class="btn-icon">▶</span>
            Iniciar
          </button>
        `
        }
        break

      case "dispensing":
        buttonsHTML += `
        <button class="btn btn-warning" onclick="uiManager.pauseDispensing(${meter.id})">
          <span class="btn-icon">⏸</span>
          Pausar
        </button>
        <button class="btn btn-danger" onclick="uiManager.stopDispensing(${meter.id})">
          <span class="btn-icon">⏹</span>
          Parar
        </button>
      `
        break

      case "paused":
        buttonsHTML += `
        <button class="btn btn-primary" onclick="uiManager.resumeDispensing(${meter.id})">
          <span class="btn-icon">▶</span>
          Retomar
        </button>
        <button class="btn btn-danger" onclick="uiManager.stopDispensing(${meter.id})">
          <span class="btn-icon">⏹</span>
          Parar
        </button>
      `
        break

      case "maintenance":
        buttonsHTML += `
        <button class="btn btn-secondary" disabled>
          <span class="btn-icon">🔧</span>
          Manutenção
        </button>
      `
        break
    }

    buttonsHTML += `</div>`
    controlButtons.innerHTML = buttonsHTML
  }

  // Método para trocar OS ativa
  switchActiveOS(meterId, osId) {
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
    } else {
      alert(result.message)
    }
  }

  pauseDispensing(meterId) {
    const result = window.dataManager.pauseDispensing(meterId)
    if (result.success) {
      this.updateUI()
    } else {
      alert(result.message)
    }
  }

  resumeDispensing(meterId) {
    const result = window.dataManager.resumeDispensing(meterId)
    if (result.success) {
      this.updateUI()
    } else {
      alert(result.message)
    }
  }

  stopDispensing(meterId) {
    if (confirm("Tem certeza que deseja parar a dispensação? Isso irá finalizar a OS.")) {
      const meter = window.dataManager.getMeter(meterId)
      if (meter && meter.activeOS) {
        const os = window.dataManager.getWorkOrder(meter.activeOS)
        if (os) {
          meter.currentAmount = os.quantity
          const result = window.dataManager.completeDispensing(meterId)
          if (result.success) {
            alert("Dispensação finalizada com sucesso!")
            this.updateUI()
          }
        }
      }
    }
  }

  updateMeterInfo(meter) {
    const infoRows = document.querySelectorAll(".info-row")

    infoRows[0].querySelector(".info-value").textContent = this.getStatusDescription(meter.status)
    infoRows[1].querySelector(".info-value").textContent = "1 Liters"

    if (meter.activeOS) {
      const os = window.dataManager.getWorkOrder(meter.activeOS)
      infoRows[2].querySelector(".info-value").textContent = `${os.id} - ${os.client}`
      infoRows[3].querySelector(".info-value").textContent = `${os.vehicle} - ${os.oilType}`
      infoRows[4].querySelector(".info-value").textContent = `${os.quantity}L necessários`

      const progress = ((meter.currentAmount / os.quantity) * 100).toFixed(1)
      infoRows[5].querySelector(".info-value").textContent = `${progress}%`
      infoRows[5].querySelector(".info-value").className = "info-value progress"
    } else {
      infoRows[2].querySelector(".info-value").textContent = "Nenhuma OS vinculada"
      infoRows[3].querySelector(".info-value").textContent = "-"
      infoRows[4].querySelector(".info-value").textContent = "-"
      infoRows[5].querySelector(".info-value").textContent = "0.0%"
    }
  }

  updateUI() {
    this.updateMeterDetails(this.selectedMeter)
    this.updateRealtimePanel()
    this.filterOSByStatus(this.currentFilter) // Mantém filtro atual
    this.updateSidebar()
  }

  updateRealtimePanel() {
    const realtimeItems = document.querySelectorAll(".realtime-item")
    const meters = window.dataManager.getAllMeters()

    realtimeItems.forEach((item, index) => {
      const meter = meters[index]
      if (!meter) return

      const statusDot = item.querySelector(".status-dot")
      const statusText = item.querySelector(".realtime-status")
      const amountValue = item.querySelector(".realtime-amount-value")
      const amountStatus = item.querySelector(".realtime-amount-status")

      statusDot.className = `status-dot ${meter.status}`
      statusText.textContent = this.getStatusText(meter.status)
      statusText.className = `realtime-status ${meter.status}`

      amountValue.textContent = `${meter.currentAmount.toFixed(2)} L`
      amountValue.className = `realtime-amount-value ${meter.status}`

      // Limpa conteúdo anterior
      const existingOSInfo = item.querySelector(".realtime-os-info")
      const existingProgress = item.querySelector(".realtime-progress")
      const existingNoOS = item.querySelector(".no-os")

      if (existingOSInfo) existingOSInfo.remove()
      if (existingProgress) existingProgress.remove()
      if (existingNoOS) existingNoOS.remove()

      if (meter.activeOS) {
        const os = window.dataManager.getWorkOrder(meter.activeOS)

        // Adiciona informações da OS
        const osInfo = document.createElement("div")
        osInfo.className = "realtime-os-info"
        osInfo.innerHTML = `
          <div class="os-line">${os.id} - ${os.client}</div>
          <div class="os-oil">${os.oilType}</div>
        `
        item.insertBefore(osInfo, item.querySelector(".realtime-amount"))

        // Adiciona progress bar
        const progress = (meter.currentAmount / os.quantity) * 100
        const progressDiv = document.createElement("div")
        progressDiv.className = "realtime-progress"
        progressDiv.innerHTML = `
          <div class="progress-info">
            <span>Progresso:</span>
            <span>${meter.currentAmount.toFixed(2)}L / ${os.quantity}L</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        `
        item.insertBefore(progressDiv, item.querySelector(".realtime-amount"))

        amountStatus.textContent = meter.status === "dispensing" ? "Dispensando..." : "Aguardando"
      } else {
        // Sem OS vinculada
        const noOS = document.createElement("div")
        noOS.className = "no-os"
        noOS.textContent = "Nenhuma OS vinculada"
        item.insertBefore(noOS, item.querySelector(".realtime-amount"))

        amountStatus.textContent = "Aguardando"
      }
    })
  }

  updateOSPanel() {
    const osContainer = document.querySelector(".os-list")
    const workOrders = window.dataManager.getAllWorkOrders()

    const statusOrder = ["in-progress", "paused", "pending", "completed"]
    const organizedOS = {}

    statusOrder.forEach((status) => {
      organizedOS[status] = workOrders.filter((os) => os.status === status)
    })

    osContainer.innerHTML = ""

    statusOrder.forEach((status) => {
      const orders = organizedOS[status]
      if (orders.length > 0) {
        const statusHeader = document.createElement("div")
        statusHeader.className = `os-status-header status-${status}`
        statusHeader.innerHTML = `
          <h4>
            ${this.getStatusIcon(status)} 
            ${this.getStatusText(status)} 
            <span class="status-count">(${orders.length})</span>
          </h4>
        `
        osContainer.appendChild(statusHeader)

        orders.forEach((os) => {
          const osItem = this.createOSElement(os)
          osContainer.appendChild(osItem)
        })
      }
    })

    this.updateOSCounter("all")
  }

  createOSElement(os) {
    const osItem = document.createElement("div")
    osItem.className = `os-item ${os.status}`

    const timeAgo = this.getTimeAgo(os)

    osItem.innerHTML = `
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
        ${os.isCompleted ? '<div class="completion-time"><strong>✅ Concluída</strong></div>' : ""}
        <div class="os-time"><small>${timeAgo}</small></div>
      </div>
    `

    osItem.addEventListener("click", () => {
      window.modalManager.showOSDetails(os.id, this.selectedMeter)
    })

    return osItem
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

  getTimeAgo(os) {
    const osNumber = Number.parseInt(os.id.replace("OS", ""))
    const minutesAgo = (Date.now() - osNumber * 60000) / 60000

    if (minutesAgo < 60) {
      return `Há ${Math.floor(minutesAgo)} minutos`
    } else if (minutesAgo < 1440) {
      return `Há ${Math.floor(minutesAgo / 60)} horas`
    } else {
      return `Há ${Math.floor(minutesAgo / 1440)} dias`
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
    const existingModal = document.getElementById("history-modal")
    if (existingModal) {
      const tbody = existingModal.querySelector("tbody")
      const history = window.dataManager.getHistory()

      tbody.innerHTML = history
        .map(
          (entry, index) => `
            <tr ${index % 2 === 1 ? 'class="even"' : ""}>
              <td>${entry.timestamp.toLocaleString("pt-BR")}</td>
              <td><span class="event-${entry.event.toLowerCase().replace(" ", "-")}">${entry.event}</span></td>
              <td>${entry.detail}</td>
              <td>${entry.device}</td>
            </tr>
          `,
        )
        .join("")

      window.modalManager.openModal(existingModal)
    }
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
                `🎉 Abastecimento concluído! ${meter.name} - OS ${os.id} (${os.quantity}L) - ${meter.name} reiniciado e disponível`,
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
}

// Instância global do gerenciador de UI
window.uiManager = new UIManager()
