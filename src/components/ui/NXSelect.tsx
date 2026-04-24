/**
 * NXSelect — custom branded dropdown replacing native <select>.
 * Supports optional per-option descriptions and close-on-outside-click.
 */
'use client'

import * as React from 'react'

export interface NXSelectOption {
  value: string
  label: string
  /** Optional secondary line shown beneath the label in the dropdown. */
  description?: string
}

interface NXSelectProps {
  options: NXSelectOption[]
  /** Currently selected value — controlled component. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Marks the trigger button as aria-required for assistive technology. */
  required?: boolean
  id?: string
}

export default function NXSelect({ options, value, onChange, placeholder = 'Select…', required, id }: NXSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value) ?? null

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (opt: NXSelectOption) => {
    onChange(opt.value)
    setIsOpen(false)
  }

  return (
    <>
      <style>{`
        .nx-sel-wrap { position: relative; width: 100%; }

        .nx-sel-trigger {
          width: 100%;
          background: rgba(0,200,255,0.03);
          border: 1px solid rgba(0,200,255,0.12);
          border-radius: 6px;
          padding: 0.65rem 1rem;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.875rem;
          color: #c8dff0;
          cursor: pointer;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .nx-sel-trigger:hover, .nx-sel-trigger--open {
          border-color: rgba(0,200,255,0.3);
          background: rgba(0,200,255,0.05);
          box-shadow: 0 0 20px rgba(0,200,255,0.06);
        }
        .nx-sel-trigger--placeholder { color: #2a3f55; }

        .nx-sel-arrow {
          color: #3a5570;
          flex-shrink: 0;
          transition: color 0.2s, transform 0.2s;
        }
        .nx-sel-trigger--open .nx-sel-arrow {
          color: #00c8ff;
          transform: rotate(180deg);
        }

        .nx-sel-popup {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: rgba(8,16,32,0.98);
          border: 1px solid rgba(0,200,255,0.18);
          border-radius: 10px;
          z-index: 200;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.6),
            0 0 0 1px rgba(0,200,255,0.05),
            inset 0 1px 0 rgba(0,200,255,0.08);
          animation: nxSelIn 0.15s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes nxSelIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nx-sel-popup::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
        }

        .nx-sel-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 1rem;
          cursor: pointer;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.875rem;
          color: #4a6080;
          border-bottom: 1px solid rgba(0,200,255,0.04);
          transition: background 0.12s, color 0.12s;
          gap: 8px;
        }
        .nx-sel-option:last-child { border-bottom: none; }
        .nx-sel-option:hover {
          background: rgba(0,200,255,0.06);
          color: #c8dff0;
        }
        .nx-sel-option--selected {
          color: #00c8ff;
          background: rgba(0,200,255,0.08);
        }
        .nx-sel-option--selected:hover {
          background: rgba(0,200,255,0.12);
          color: #00c8ff;
        }
        .nx-sel-option-text { flex: 1; min-width: 0; }
        .nx-sel-option-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .nx-sel-option-desc {
          font-size: 0.75rem;
          color: #2a3f55;
          margin-top: 1px;
          font-family: 'Exo 2', sans-serif;
        }
        .nx-sel-option--selected .nx-sel-option-desc { color: rgba(0,200,255,0.5); }
        .nx-sel-check {
          color: #00c8ff;
          flex-shrink: 0;
          filter: drop-shadow(0 0 4px rgba(0,200,255,0.6));
        }
      `}</style>

      <div className="nx-sel-wrap" ref={ref} id={id}>
        <button
          type="button"
          aria-required={required}
          className={`nx-sel-trigger${isOpen ? ' nx-sel-trigger--open' : ''}${!selected ? ' nx-sel-trigger--placeholder' : ''}`}
          onClick={() => setIsOpen(o => !o)}
        >
          <span className="nx-sel-option-label">{selected ? selected.label : placeholder}</span>
          <svg className="nx-sel-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {isOpen && (
          <div className="nx-sel-popup">
            {options.map(opt => (
              <div
                key={opt.value}
                className={`nx-sel-option${value === opt.value ? ' nx-sel-option--selected' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <div className="nx-sel-option-text">
                  <div className="nx-sel-option-label">{opt.label}</div>
                  {opt.description && <div className="nx-sel-option-desc">{opt.description}</div>}
                </div>
                {value === opt.value && (
                  <svg className="nx-sel-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
