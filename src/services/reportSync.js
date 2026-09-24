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
