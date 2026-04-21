'use client'

/**
 * NXStepper — themed increment/decrement numeric input.
 * Matches the nx8up dashboard aesthetic.
 */

type Props = {
  /** Current value as a string — controlled component. */
  value: string
  onChange: (v: string) => void
  /** Amount to increment/decrement per button click (default 1). */
  step?: number
  min?: number
  max?: number
  /** Text displayed before the number (e.g. "$"). */
  prefix?: string
  /** Text displayed after the number (e.g. "hrs"). */
  suffix?: string
  placeholder?: string
  /** When true, allows decimal input; uses parseFloat instead of parseInt. */
  allowDecimal?: boolean
  className?: string
}

const CSS = `
  .nxs-wrap {
    display: flex; align-items: stretch;
    background: rgba(0,200,255,0.03);
    border: 1px solid rgba(0,200,255,0.12);
    border-radius: 6px; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .nxs-wrap:focus-within {
    border-color: rgba(0,200,255,0.35);
    box-shadow: 0 0 18px rgba(0,200,255,0.07);
  }
  .nxs-btn {
    width: 36px; display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; font-weight: 600;
    color: #3a5570; background: rgba(0,200,255,0.04);
    border: none; cursor: pointer;
    transition: color 0.15s, background 0.15s; flex-shrink: 0;
    border-right: 1px solid rgba(0,200,255,0.08); user-select: none;
  }
  .nxs-btn:last-child { border-right: none; border-left: 1px solid rgba(0,200,255,0.08); }
  .nxs-btn:hover { color: #00c8ff; background: rgba(0,200,255,0.1); }
  .nxs-input {
    flex: 1; background: transparent; border: none; outline: none;
    text-align: center; font-family: 'Rajdhani', sans-serif;
    font-size: 1rem; font-weight: 600; letter-spacing: 0.03em;
    color: #c8dff0; padding: 0.55rem 0.25rem; min-width: 0;
    -moz-appearance: textfield;
  }
  .nxs-input::-webkit-outer-spin-button,
  .nxs-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .nxs-input::placeholder { color: #2a3f55; font-weight: 400; }
  .nxs-affix {
    display: flex; align-items: center; padding: 0 0.5rem;
    font-family: 'Rajdhani', sans-serif; font-size: 0.95rem; font-weight: 600;
    color: #3a5570; flex-shrink: 0;
  }
  .nxs-prefix { padding-left: 0.75rem; padding-right: 0; }
`

export default function NXStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  prefix,
  suffix,
  placeholder = '0',
  allowDecimal = false,
  className = '',
}: Props) {
  const parse = (v: string) => (allowDecimal ? parseFloat(v) : parseInt(v, 10)) || 0

  const adjust = (delta: number) => {
    const next = parse(value) + delta
    const clamped = max != null ? Math.min(max, Math.max(min, next)) : Math.max(min, next)
    onChange(allowDecimal ? String(parseFloat(clamped.toFixed(2))) : String(clamped))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pattern = allowDecimal ? /[^\d.]/g : /[^\d]/g
    onChange(e.target.value.replace(pattern, ''))
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`nxs-wrap ${className}`}>
        <button type="button" className="nxs-btn" onClick={() => adjust(-step)} aria-label="Decrease">−</button>
        {prefix && <span className="nxs-affix nxs-prefix">{prefix}</span>}
        <input
          className="nxs-input"
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          value={value}
          onChange={handleChange}
          onBlur={() => {
            const n = (allowDecimal ? parseFloat(value) : parseInt(value, 10)) || min
            const clamped = max != null ? Math.min(max, Math.max(min, n)) : Math.max(min, n)
            onChange(allowDecimal ? String(parseFloat(clamped.toFixed(2))) : String(clamped))
          }}
          placeholder={placeholder}
        />
        {suffix && <span className="nxs-affix">{suffix}</span>}
        <button type="button" className="nxs-btn" onClick={() => adjust(step)} aria-label="Increase">+</button>
      </div>
    </>
  )
}
