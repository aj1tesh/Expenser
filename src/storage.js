const STORAGE_KEY = "exp-app-data"
const DEVICE_ID_KEY = "exp-device-id"
export const USER_KEY = "exp-user"

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36)
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function getUserId() {
  const user = localStorage.getItem(USER_KEY)
  return user || getDeviceId()
}

function getDefaultData() {
  return {
    expenses: {},
    monthlyBudget: 3000,
    secretSavingsEntries: [],
  }
}

export function load() {
  const apiUrl = import.meta.env.VITE_API_URL
  const defaultData = getDefaultData()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const local = raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData

    if (!apiUrl) return Promise.resolve(local)

    return fetch(`${apiUrl}/api/data?deviceId=${encodeURIComponent(getUserId())}`)
      .then((res) => (res.ok ? res.json() : local))
      .then((api) => ({ ...defaultData, ...api }))
      .catch(() => local)
  } catch {
    return Promise.resolve(defaultData)
  }
}

export function save(data) {
  const payload = {
    expenses: data.expenses ?? {},
    monthlyBudget: data.monthlyBudget ?? 3000,
    secretSavingsEntries: data.secretSavingsEntries ?? [],
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn("Failed to save to localStorage", e)
  }

  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    fetch(`${apiUrl}/api/data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getUserId(), ...payload }),
    }).catch(() => {})
  }
}
