import { useState } from 'react'

const SCHOOL_YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Other']

const INITIAL = {
  name: '',
  school_year: '',
  working_style: '',
}

const REQUIRED = [
  { key: 'name', label: 'Your name' },
  { key: 'school_year', label: 'What year are you?' },
  { key: 'working_style', label: 'Describe your working style in 1–2 sentences' },
]

export default function Survey({ students }) {
  const [answers, setAnswers] = useState(INITIAL)
  const [missing, setMissing] = useState([])
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    const missingFields = REQUIRED.filter((field) => {
      const value = answers[field.key]
      return typeof value === 'string' ? value.trim() === '' : !value
    }).map((field) => field.label)

    if (missingFields.length) {
      setMissing(missingFields)
      setError(null)
      return
    }

    setMissing([])
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name,
          school_year: answers.school_year,
          working_style: answers.working_style.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Backend responded ${res.status}`)
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="survey">
        <h2>Thanks — you're all set</h2>
        <p>Your responses were saved.</p>
        <button
          type="button"
          className="randomize"
          onClick={() => {
            setAnswers(INITIAL)
            setSubmitted(false)
            setMissing([])
            setError(null)
          }}
        >
          Submit another response
        </button>
      </section>
    )
  }

  return (
    <section className="survey">
      <h2>Survey</h2>
      <p className="subtitle">Answer every question, then submit. Names come from the class roster.</p>

      {missing.length > 0 && (
        <div className="form-error" role="alert">
          Please fill in the required fields:
          <ul>
            {missing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          Could not save your responses: {error}
        </p>
      )}

      <form className="survey-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          Your name
          <select value={answers.name} onChange={(e) => update('name', e.target.value)} disabled={submitting}>
            <option value="">Select your name</option>
            {students.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          What year are you?
          <select
            value={answers.school_year}
            onChange={(e) => update('school_year', e.target.value)}
            disabled={submitting}
          >
            <option value="">Select a year</option>
            {SCHOOL_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Describe your working style in 1–2 sentences
          <textarea
            rows={4}
            value={answers.working_style}
            onChange={(e) => update('working_style', e.target.value)}
            disabled={submitting}
          />
        </label>

        <button className="randomize" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </section>
  )
}
