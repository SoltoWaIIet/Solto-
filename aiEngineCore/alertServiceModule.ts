interface Alert {
  timestamp: string
  level: "low" | "moderate" | "high" | "critical"
  title: string
  message: string
  wallet?: string
  token?: string
}

const alertQueue: Alert[] = []

export function pushAlert(alert: Alert) {
  alertQueue.push({ ...alert, timestamp: new Date().toISOString() })
}

export function getLatestAlerts(limit = 10): Alert[] {
  return alertQueue.slice(-limit).reverse()
}
