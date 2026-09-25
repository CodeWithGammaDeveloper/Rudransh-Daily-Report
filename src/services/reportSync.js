export async function syncReportToGoogleSheets(report) {
  const endpoint = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL
  if (!endpoint) return { synced: false, reason: 'missing-endpoint' }

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(report),
    })
    return { synced: true }
  } catch {
    return { synced: false, reason: 'network-error' }
  }
}

export async function fetchReportsFromGoogleSheets() {
  const endpoint = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL
  if (!endpoint) return []

  try {
    const response = await fetch(endpoint)
    if (!response.ok) return []
    const payload = await response.json()
    return Array.isArray(payload.reports) ? payload.reports : []
  } catch {
    return []
  }
}

export async function deleteReportsFromGoogleSheets(serialNumbers) {
  const endpoint = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL
  if (!endpoint || serialNumbers.length === 0) return { deleted: false }

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', serialNumbers }),
    })
    return { deleted: true }
  } catch {
    return { deleted: false }
  }
}
