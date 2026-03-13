import { useState, useEffect } from "react"
import "./App.css"
import { load, save, USER_KEY } from "./storage"

const DEFAULT_BUDGET = 3000
const CATEGORIES = ["Food", "Transport", "Bruh", "Cars"]

const LOGIN_USER = "ajitesh"
const LOGIN_PASS = "password"

function getDaysInMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

function getTodayDate() {
  return new Date().getDate()
}

function getDayKey(day) {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${day}`
}

function getMonthLabel() {
  return new Date().toLocaleString("default", { month: "long", year: "numeric" })
}

function getFirstWeekday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getDay()
}

function buildCalendarWeeks(daysInMonth, firstWeekdaySunday) {
  const firstWeekday = (firstWeekdaySunday + 6) % 7
  const leading = Array(firstWeekday).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const flat = [...leading, ...days]
  const remainder = flat.length % 7
  const padding = remainder === 0 ? 0 : 7 - remainder
  const padded = [...flat, ...Array(padding).fill(null)]
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
  return weeks
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (username.trim() === LOGIN_USER && password === LOGIN_PASS) {
      localStorage.setItem(USER_KEY, LOGIN_USER)
      onLogin()
    } else {
      setError("Invalid username or password")
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="login-title">Exp</h1>
        <p className="login-subtitle">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input login-input"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input login-input"
            autoComplete="current-password"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="add-btn login-btn">Sign in</button>
        </form>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(() => localStorage.getItem(USER_KEY))
  const [expenses, setExpenses] = useState({})
  const [monthlyBudget, setMonthlyBudget] = useState(DEFAULT_BUDGET)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState("")
  const [selectedDay, setSelectedDay] = useState(getTodayDate())
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [category, setCategory] = useState("Food")
  const [tab, setTab] = useState("log")
  const [secretSavingsEntries, setSecretSavingsEntries] = useState([])
  const [savingsAmount, setSavingsAmount] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    load().then((data) => {
      if (data.expenses && Object.keys(data.expenses).length) setExpenses(data.expenses)
      if (typeof data.monthlyBudget === "number") setMonthlyBudget(data.monthlyBudget)
      if (Array.isArray(data.secretSavingsEntries)) setSecretSavingsEntries(data.secretSavingsEntries)
      setReady(true)
    })
  }, [user])

  useEffect(() => {
    if (!ready || !user) return
    save({ expenses, monthlyBudget, secretSavingsEntries })
  }, [ready, user, expenses, monthlyBudget, secretSavingsEntries])

  function handleLogout() {
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setReady(false)
  }

  if (!user) {
    return <LoginScreen onLogin={() => setUser(LOGIN_USER)} />
  }

  const daysInMonth = getDaysInMonth()
  const today = getTodayDate()
  const dailyIdeal = daysInMonth > 0 ? monthlyBudget / daysInMonth : 0
  const calendarWeeks = buildCalendarWeeks(daysInMonth, getFirstWeekday())
  const monthLabel = getMonthLabel()

  function getDayEntries(day) {
    return expenses[getDayKey(day)] || []
  }

  function getDayTotal(day) {
    return getDayEntries(day).reduce((sum, e) => sum + e.amount, 0)
  }

  const DAILY_IDEAL = dailyIdeal

  const totalSpent = Array.from({ length: daysInMonth }, (_, i) => getDayTotal(i + 1))
    .reduce((a, b) => a + b, 0)

  const remaining = monthlyBudget - totalSpent
  const daysLeft = daysInMonth - today + 1
  const smartDaily = daysLeft > 0 ? remaining / daysLeft : 0

  const secretSavingsTotal = secretSavingsEntries.reduce((sum, e) => sum + e.amount, 0)

  function saveBudget() {
    const parsed = parseFloat(budgetInput)
    if (parsed != null && !isNaN(parsed) && parsed > 0) {
      setMonthlyBudget(parsed)
    }
    setEditingBudget(false)
    setBudgetInput("")
  }

  function addToSecretSavings(amt) {
    const parsed = parseFloat(amt)
    if (!parsed || parsed <= 0) return
    setSecretSavingsEntries(prev => [...prev, { id: Date.now(), amount: parsed, date: new Date().toISOString().slice(0, 10) }])
    setSavingsAmount("")
  }

  function removeSecretEntry(id) {
    setSecretSavingsEntries(prev => prev.filter(e => e.id !== id))
  }

  function addExpense() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return

    const key = getDayKey(selectedDay)
    const entry = {
      id: Date.now(),
      amount: parsed,
      note: note || category,
      category,
    }

    setExpenses(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), entry]
    }))

    setAmount("")
    setNote("")
  }

  function removeExpense(day, id) {
    const key = getDayKey(day)
    setExpenses(prev => ({
      ...prev,
      [key]: prev[key].filter(e => e.id !== id)
    }))
  }

  return (
    <div className="app">
      <div className="header">
        <button type="button" className="header-logout" onClick={handleLogout} title="Sign out">Sign out</button>
        <p className="header-label">Monthly Budget</p>
        {editingBudget ? (
          <div className="header-budget-edit">
            <span className="header-currency">₹</span>
            <input
              type="number"
              className="header-budget-input"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              onBlur={saveBudget}
              onKeyDown={e => e.key === "Enter" && saveBudget()}
              autoFocus
              min={1}
            />
            <button type="button" className="header-budget-save" onClick={saveBudget}>Save</button>
          </div>
        ) : (
          <button type="button" className="header-amount-btn" onClick={() => { setEditingBudget(true); setBudgetInput(String(monthlyBudget)) }}>
            <h1 className="header-amount">₹{monthlyBudget.toLocaleString()}</h1>
            <span className="header-edit-hint">tap to change</span>
          </button>
        )}
        <div className="smart-daily-block">
          <span className="smart-daily-label">Aim to spend per day</span>
          <p className="smart-daily-amount">₹{smartDaily.toFixed(0)}</p>
          <span className="smart-daily-days">for the next {daysLeft} days</span>
        </div>
        <div className="budget-bar-track">
          <div
            className="budget-bar-fill"
            style={{ width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%` }}
          />
        </div>
        <div className="header-stats">
          <span>Spent: ₹{totalSpent.toFixed(0)}</span>
          <span>Left: ₹{remaining.toFixed(0)}</span>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "log" ? "tab active" : "tab"} onClick={() => setTab("log")}>Log</button>
        <button className={tab === "overview" ? "tab active" : "tab"} onClick={() => setTab("overview")}>Overview</button>
        <button className={tab === "savings" ? "tab active tab-savings" : "tab tab-savings"} onClick={() => setTab("savings")} title="Secret savings">🔒</button>
      </div>

      {tab === "log" && (
        <div className="tab-content">
          <div className="calendar-wrap">
            <h2 className="calendar-month">{monthLabel}</h2>
            <div className="calendar-weekdays">
              {WEEKDAY_LABELS.map((label, index) => {
                const weekdayClass =
                  index === 0 || index === 1 || index === 2 || index === 4
                    ? "weekday-safe"
                    : index === 3
                    ? "weekday-thu"
                    : index === 5 || index === 6
                    ? "weekday-weekend"
                    : ""
                return (
                  <span
                    key={label}
                    className={`calendar-weekday ${weekdayClass}`}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
            <div className="day-grid calendar-grid">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="calendar-week">
                  {week.map((d, i) => {
                    const columnClass =
                      i === 0 || i === 1 || i === 2 || i === 4
                        ? "day-col-safe"
                        : i === 3
                        ? "day-col-thu"
                        : i === 5 || i === 6
                        ? "day-col-weekend"
                        : ""

                    if (d === null) {
                      return (
                        <div
                          key={`empty-${wi}-${i}`}
                          className={`day-cell day-cell-empty ${columnClass}`}
                        />
                      )
                    }

                    const total = getDayTotal(d)
                    const isOver = total > DAILY_IDEAL
                    const hasData = total > 0
                    const isPast = d < today

                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={`day-btn day-cell ${columnClass} ${
                          selectedDay === d ? "selected" : ""
                        } ${isOver ? "over" : hasData ? "under" : ""} ${
                          isPast ? "past" : ""
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="day-summary">
            <div>
              <p className="day-label">Day {selectedDay}</p>
              <h2 className="day-total">₹{getDayTotal(selectedDay).toFixed(0)}</h2>
            </div>
            <p className="day-diff">
              {getDayTotal(selectedDay) > DAILY_IDEAL
                ? `₹${(getDayTotal(selectedDay) - DAILY_IDEAL).toFixed(0)} over`
                : getDayTotal(selectedDay) > 0
                ? `₹${(DAILY_IDEAL - getDayTotal(selectedDay)).toFixed(0)} saved`
                : "No entries"}
            </p>
          </div>

          {getDayEntries(selectedDay).map(e => (
            <div key={e.id} className="entry-row">
              <span>{e.note}</span>
              <span>₹{e.amount}</span>
              <button onClick={() => removeExpense(selectedDay, e.id)} className="remove-btn">×</button>
            </div>
          ))}

          <div className="form">
            <div className="category-pills">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`pill ${category === cat ? "active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addExpense()}
              className="input"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addExpense()}
              className="input"
            />
            <button onClick={addExpense} className="add-btn">+ Add Expense</button>
          </div>

        </div>
      )}

      {tab === "overview" && (
        <div className="tab-content">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const total = getDayTotal(d)
            const isOver = total > DAILY_IDEAL
            const isPast = d < today
            return (
              <div key={d} className={`overview-row ${isPast ? "past" : ""}`} onClick={() => { setSelectedDay(d); setTab("log") }}>
                <span className="overview-day">{d}</span>
                <div className="overview-bar-track">
                  <div
                    className="overview-bar-fill"
                    style={{
                      width: `${Math.min((total / DAILY_IDEAL) * 100, 100)}%`,
                      background: isOver ? "#e74c3c" : "#27ae60"
                    }}
                  />
                </div>
                <span className={`overview-amount ${isOver ? "over" : ""}`}>
                  {total > 0 ? `₹${total}` : "—"}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {tab === "savings" && (
        <div className="tab-content tab-content-savings">
          <div className="savings-summary">
            <p className="savings-label">Secret savings</p>
            <h2 className="savings-total">₹{secretSavingsTotal.toLocaleString()}</h2>
          </div>
          {secretSavingsEntries.map(e => (
            <div key={e.id} className="entry-row savings-entry">
              <span>{e.date}</span>
              <span>₹{e.amount}</span>
              <button onClick={() => removeSecretEntry(e.id)} className="remove-btn">×</button>
            </div>
          ))}
          <div className="form savings-form">
            <input
              type="number"
              placeholder="Amount to add (₹)"
              className="input"
              value={savingsAmount}
              onChange={e => setSavingsAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addToSecretSavings(savingsAmount)}
            />
            <button
              type="button"
              className="add-btn"
              onClick={() => addToSecretSavings(savingsAmount)}
            >
              + Add to savings
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App