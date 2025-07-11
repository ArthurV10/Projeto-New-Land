// Gerenciador de dados do sistema
class DataManager {
  constructor() {
    this.meters = this.initializeMeters()
    this.workOrders = this.initializeWorkOrders()
    this.bindings = this.initializeBindings()
    this.history = this.initializeHistory()
    this.reports = []
  }

  initializeMeters() {
    return [
      {
        id: 1,
        name: "MEDIDOR 01",
        status: "stopped",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
      {
        id: 2,
        name: "MEDIDOR 02",
        status: "stopped",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
      {
        id: 3,
        name: "MEDIDOR 03",
        status: "stopped",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
      {
        id: 4,
        name: "MEDIDOR 04",
        status: "stopped",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
      {
        id: 5,
        name: "MEDIDOR 05",
        status: "stopped",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
      {
        id: 6,
        name: "MEDIDOR 06",
        status: "stopped",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
      {
        id: 7,
        name: "MEDIDOR 07",
        status: "maintenance",
        oilType: "5w30",
        currentAmount: 0.0,
        boundOSList: [],
        activeOS: null,
        isPaused: false,
      },
    ]
  }

  initializeWorkOrders() {
    return [
      {
        id: "OS487759",
        vehicle: "Corolla XEI 2023",
        client: "João Silva",
        oilType: "5w30",
        quantity: 4.5,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      },
      {
        id: "OS487760",
        vehicle: "Hilux SR 2022",
        client: "Maria Santos",
        oilType: "5w30",
        quantity: 6.0,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      },
      {
        id: "OS487761",
        vehicle: "Etios HB 2021",
        client: "Pedro Costa",
        oilType: "5w30",
        quantity: 3.8,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      },
      {
        id: "OS487762",
        vehicle: "Camry XLE 2023",
        client: "Ana Lima",
        oilType: "5w30",
        quantity: 4.2,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      },
      {
        id: "OS487763",
        vehicle: "RAV4 Hybrid 2024",
        client: "Carlos Mendes",
        oilType: "5w30",
        quantity: 4.8,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      },
      {
        id: "OS487764",
        vehicle: "Prius 2023",
        client: "Fernanda Oliveira",
        oilType: "5w30",
        quantity: 3.9,
        status: "pending",
        boundMeter: null,
        isCompleted: false,
        isActive: false,
      },
    ]
  }

  initializeBindings() {
    return []
  }

  initializeHistory() {
    return [
      {
        timestamp: new Date("2025-06-19T09:15:33"),
        event: "System Started",
        detail: "Fuel management system initialized",
        device: "System",
      },
    ]
  }

  // Métodos para gerenciar OS
  getWorkOrder(osId) {
    return this.workOrders.find((os) => os.id === osId)
  }

  getAllWorkOrders() {
    return this.workOrders
  }

  deleteWorkOrder(osId) {
    const index = this.workOrders.findIndex((os) => os.id === osId)
    if (index !== -1) {
      this.unbindWorkOrder(osId)
      this.workOrders.splice(index, 1)
      this.addToHistory("OS Deleted", `OS ${osId} deleted from system`, "System")
      return true
    }
    return false
  }

  // Métodos para gerenciar medidores
  getMeter(meterId) {
    return this.meters.find((meter) => meter.id === meterId)
  }

  getAllMeters() {
    return this.meters
  }

  // Métodos para gerenciar vinculações
  bindWorkOrder(meterId, osId) {
    const workOrder = this.getWorkOrder(osId)
    if (!workOrder) {
      return { success: false, message: "OS não encontrada" }
    }

    if (workOrder.isCompleted) {
      return { success: false, message: "OS já foi concluída" }
    }

    const existingBinding = this.bindings.find((b) => b.osId === osId && b.status === "active")
    if (existingBinding) {
      return { success: false, message: "OS já está vinculada a outro medidor" }
    }

    const meter = this.getMeter(meterId)
    if (meter && meter.status === "maintenance") {
      return { success: false, message: "Medidor está em manutenção" }
    }

    const binding = {
      meterId: meterId,
      osId: osId,
      bindDate: new Date(),
      status: "active",
    }

    this.bindings.push(binding)

    if (meter) {
      if (!meter.boundOSList.includes(osId)) {
        meter.boundOSList.push(osId)
      }
      if (!meter.activeOS) {
        meter.activeOS = osId
        workOrder.isActive = true
      }
    }

    if (workOrder) {
      workOrder.boundMeter = `MEDIDOR ${meterId.toString().padStart(2, "0")}`
      workOrder.status = "in-progress"
    }

    this.addToHistory("OS Assigned", `OS ${osId} assigned to MEDIDOR_${meterId.toString().padStart(2, "0")}`, "System")

    return { success: true, message: "OS vinculada com sucesso" }
  }

  unbindWorkOrder(osId) {
    const binding = this.bindings.find((b) => b.osId === osId && b.status === "active")
    if (binding) {
      binding.status = "inactive"
      binding.unbindDate = new Date()

      const meter = this.getMeter(binding.meterId)
      if (meter) {
        meter.boundOSList = meter.boundOSList.filter((id) => id !== osId)
        if (meter.activeOS === osId) {
          meter.activeOS = meter.boundOSList.length > 0 ? meter.boundOSList[0] : null
        }
      }

      const workOrder = this.getWorkOrder(osId)
      if (workOrder) {
        workOrder.boundMeter = null
        workOrder.status = "pending"
        workOrder.isActive = false
      }

      this.addToHistory(
        "OS Unbound",
        `OS ${osId} unbound from MEDIDOR_${binding.meterId.toString().padStart(2, "0")}`,
        "System",
      )

      return { success: true, message: "OS desvinculada com sucesso" }
    }
    return { success: false, message: "Vinculação não encontrada" }
  }

  switchActiveOS(meterId, osId) {
    const meter = this.getMeter(meterId)
    if (!meter) {
      return { success: false, message: "Medidor não encontrado" }
    }

    if (!meter.boundOSList.includes(osId)) {
      return { success: false, message: "OS não está vinculada a este medidor" }
    }

    if (meter.status === "dispensing") {
      return { success: false, message: "Não é possível trocar OS durante dispensação" }
    }

    if (meter.activeOS) {
      const currentOS = this.getWorkOrder(meter.activeOS)
      if (currentOS) {
        currentOS.isActive = false
      }
    }

    meter.activeOS = osId
    const newOS = this.getWorkOrder(osId)
    if (newOS) {
      newOS.isActive = true
    }

    this.addToHistory("OS Switched", `Active OS changed to ${osId} on ${meter.name}`, "System")

    return { success: true, message: "OS ativa alterada com sucesso" }
  }

  getActiveBindings() {
    return this.bindings.filter((b) => b.status === "active")
  }

  // Métodos para controle de dispensas
  startDispensing(meterId) {
    const meter = this.getMeter(meterId)
    if (!meter || !meter.activeOS) {
      return { success: false, message: "Medidor não possui OS ativa" }
    }

    const workOrder = this.getWorkOrder(meter.activeOS)
    if (!workOrder || workOrder.isCompleted) {
      return { success: false, message: "OS não encontrada ou já concluída" }
    }

    if (meter.currentAmount >= workOrder.quantity) {
      return { success: false, message: "Quantidade já foi dispensada completamente" }
    }

    meter.status = "dispensing"
    meter.isPaused = false
    workOrder.status = "in-progress"

    this.addToHistory("Dispense Started", `Started dispensing OS ${workOrder.id}`, meter.name)
    return { success: true, message: "Dispensação iniciada" }
  }

  pauseDispensing(meterId) {
    const meter = this.getMeter(meterId)
    if (!meter || meter.status !== "dispensing") {
      return { success: false, message: "Medidor não está dispensando" }
    }

    const workOrder = this.getWorkOrder(meter.activeOS)
    if (!workOrder) {
      return { success: false, message: "OS não encontrada" }
    }

    meter.status = "paused"
    meter.isPaused = true
    workOrder.status = "paused"

    this.addToHistory(
      "Dispense Paused",
      `Paused dispensing OS ${workOrder.id} at ${meter.currentAmount.toFixed(2)}L`,
      meter.name,
    )
    return { success: true, message: "Dispensação pausada" }
  }

  resumeDispensing(meterId) {
    const meter = this.getMeter(meterId)
    if (!meter || meter.status !== "paused") {
      return { success: false, message: "Medidor não está pausado" }
    }

    const workOrder = this.getWorkOrder(meter.activeOS)
    if (!workOrder) {
      return { success: false, message: "OS não encontrada" }
    }

    meter.status = "dispensing"
    meter.isPaused = false
    workOrder.status = "in-progress"

    this.addToHistory(
      "Dispense Resumed",
      `Resumed dispensing OS ${workOrder.id} from ${meter.currentAmount.toFixed(2)}L`,
      meter.name,
    )
    return { success: true, message: "Dispensação retomada" }
  }

  completeDispensing(meterId) {
    const meter = this.getMeter(meterId)
    if (!meter || !meter.activeOS) {
      return { success: false, message: "Medidor não possui OS ativa" }
    }

    const workOrder = this.getWorkOrder(meter.activeOS)
    if (!workOrder) {
      return { success: false, message: "OS não encontrada" }
    }

    workOrder.status = "completed"
    workOrder.isCompleted = true
    workOrder.isActive = false

    this.addToHistory(
      "Dispense Completed",
      `Completed OS ${workOrder.id}, ${workOrder.quantity}L dispensed`,
      meter.name,
    )

    const binding = this.bindings.find((b) => b.osId === meter.activeOS && b.status === "active")
    if (binding) {
      binding.status = "inactive"
      binding.unbindDate = new Date()
    }

    meter.boundOSList = meter.boundOSList.filter((id) => id !== meter.activeOS)
    meter.activeOS = meter.boundOSList.length > 0 ? meter.boundOSList[0] : null

    if (meter.activeOS) {
      const nextOS = this.getWorkOrder(meter.activeOS)
      if (nextOS) {
        nextOS.isActive = true
      }
    }

    meter.status = "stopped"
    meter.isPaused = false
    meter.currentAmount = 0.0
    workOrder.boundMeter = null

    this.addToHistory("Meter Reset", `${meter.name} reset and ready for new operation`, meter.name)

    return { success: true, message: "Dispensação concluída e medidor reiniciado" }
  }

  // Métodos para histórico
  addToHistory(event, detail, device) {
    this.history.unshift({
      timestamp: new Date(),
      event: event,
      detail: detail,
      device: device,
    })
  }

  getHistory() {
    return this.history
  }

  // Métodos para relatórios
  generateOilConsumptionReport() {
    const report = {
      generatedAt: new Date(),
      totalOilUsed: 0,
      oilByType: {},
      completedOrders: 0,
      activeOrders: 0,
      meterUsage: {},
      dailyConsumption: {},
    }

    this.workOrders.forEach((os) => {
      if (os.status === "completed" || os.status === "in-progress") {
        report.totalOilUsed += os.quantity

        if (!report.oilByType[os.oilType]) {
          report.oilByType[os.oilType] = 0
        }
        report.oilByType[os.oilType] += os.quantity

        if (os.status === "completed") {
          report.completedOrders++
        } else {
          report.activeOrders++
        }

        if (os.boundMeter) {
          if (!report.meterUsage[os.boundMeter]) {
            report.meterUsage[os.boundMeter] = 0
          }
          report.meterUsage[os.boundMeter] += os.quantity
        }
      }
    })

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      report.dailyConsumption[dateStr] = Math.random() * 50 + 10
    }

    this.reports.push(report)
    return report
  }

  getLatestReport() {
    return this.reports[this.reports.length - 1] || null
  }

  // Método para criar e vincular OS de teste rapidamente
  createTestOS(meterId) {
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

    this.workOrders.push(testOS)
    return this.bindWorkOrder(meterId, testOS.id)
  }

  // Método para vincular primeira OS disponível a um medidor
  bindFirstAvailableOS(meterId) {
    const availableOS = this.workOrders.find((os) => os.status === "pending" && !os.isCompleted && !os.boundMeter)

    if (availableOS) {
      return this.bindWorkOrder(meterId, availableOS.id)
    }

    return { success: false, message: "Nenhuma OS disponível" }
  }
}

window.DataManager = DataManager
