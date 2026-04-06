'use client'

import { useState } from 'react'
import NXStepper from '@/components/ui/NXStepper'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle, CREATOR_TYPES, CREATOR_SIZES } from '../_shared'

export type AvailableCreator = {
  id: string
  twitch_username: string | null
  youtube_handle: string | null
  youtube_channel_name: string | null
  platform: string[]
  subs_followers: number | null
  youtube_subscribers: number | null
  creator_size: string | null
}

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  onNext: () => void
  onBack: () => void
  availableCreators: AvailableCreator[]
}

const SIZE_LABEL: Record<string, string> = {
  large: 'Large', mid: 'Mid', micro: 'Micro', nano: 'Nano',
}

export default function Step3Creators({ draft, setDraft, onNext, onBack, availableCreators }: Props) {
  const [search, setSearch] = useState('')

  const toggleArr = (key: 'creator_types' | 'creator_sizes', val: string) =>
    setDraft(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(val)
        ? (prev[key] as string[]).filter(x => x !== val)
        : [...(prev[key] as string[]), val],
    }))

  const selectedCreator = availableCreators.find(c => c.id === draft.invited_creator_id) ?? null

  const filteredCreators = search.trim()
    ? availableCreators.filter(c => {
        const q = search.toLowerCase()
        return (
          c.twitch_username?.toLowerCase().includes(q) ||
          c.youtube_handle?.toLowerCase().includes(q) ||
          c.youtube_channel_name?.toLowerCase().includes(q)
        )
      })
    : availableCreators

  const getHandle = (c: AvailableCreator) =>
    c.twitch_username ?? c.youtube_handle ?? c.youtube_channel_name ?? 'Unknown'

  const getTotalFollowers = (c: AvailableCreator) =>
    (c.subs_followers ?? 0) + (c.youtube_subscribers ?? 0)

  return (
    <div className="space-y-6">
      {/* Campaign mode */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Campaign Mode</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDraft(prev => ({ ...prev, is_direct_invite: false, invited_creator_id: '' }))}
            className={`flex flex-col gap-1.5 p-4 rounded-lg border text-left transition-all duration-150 ${
              !draft.is_direct_invite
                ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_18px_rgba(0,200,255,0.12)]'
                : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
            }`}
          >
            <p className={`text-sm font-semibold ${!draft.is_direct_invite ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
              Open Applications
            </p>
            <p className="text-xs dash-text-muted leading-relaxed">
              Creators browse and apply. You review and accept.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setDraft(prev => ({ ...prev, is_direct_invite: true }))}
            className={`flex flex-col gap-1.5 p-4 rounded-lg border text-left transition-all duration-150 ${
              draft.is_direct_invite
                ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_18px_rgba(0,200,255,0.12)]'
                : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
            }`}
          >
            <p className={`text-sm font-semibold ${draft.is_direct_invite ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
              Direct Invite
            </p>
            <p className="text-xs dash-text-muted leading-relaxed">
              Pick one creator directly. They accept or decline.
            </p>
          </button>
        </div>
      </div>

      {draft.is_direct_invite ? (
        /* ── Direct Invite: creator picker ── */
        <div className="space-y-4">
          <p className={sectionTitle}>Select a Creator</p>

          {selectedCreator && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#00c8ff]/40 bg-[rgba(0,200,255,0.05)]">
              <div>
                <p className="text-sm font-semibold text-[#00c8ff]">{getHandle(selectedCreator)}</p>
                <p className="text-xs dash-text-muted">
                  {selectedCreator.platform.join(' · ')}
                  {getTotalFollowers(selectedCreator) > 0 && (
                    <> · {getTotalFollowers(selectedCreator).toLocaleString()} followers</>
                  )}
                  {selectedCreator.creator_size && (
                    <> · {SIZE_LABEL[selectedCreator.creator_size] ?? selectedCreator.creator_size}</>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, invited_creator_id: '' }))}
                className="text-xs dash-text-muted hover:text-[#f87171] transition-colors ml-3"
              >
                Remove
              </button>
            </div>
          )}

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by handle or name..."
            className="w-full px-3 py-2 rounded-lg border dash-border bg-transparent text-sm dash-text-bright placeholder:dash-text-muted focus:outline-none focus:border-[rgba(0,200,255,0.5)]"
          />

          {availableCreators.length === 0 ? (
            <p className="text-sm dash-text-muted text-center py-6">No creators available.</p>
          ) : filteredCreators.length === 0 ? (
            <p className="text-sm dash-text-muted text-center py-4">No creators match your search.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredCreators.map(c => {
                const isSelected = draft.invited_creator_id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, invited_creator_id: c.id }))}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-150 ${
                      isSelected
                        ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)]'
                        : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                        {getHandle(c)}
                      </p>
                      <p className="text-xs dash-text-muted mt-0.5">
                        {c.platform.join(' · ')}
                        {getTotalFollowers(c) > 0 && (
                          <> · {getTotalFollowers(c).toLocaleString()} followers</>
                        )}
                      </p>
                    </div>
                    {c.creator_size && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 dash-text-muted shrink-0 ml-3">
                        {SIZE_LABEL[c.creator_size] ?? c.creator_size}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Open Applications: existing creator criteria ── */
        <>
          {/* Creator type */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Who should promote this?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CREATOR_TYPES.map(ct => {
                const active = draft.creator_types.includes(ct.value)
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => toggleArr('creator_types', ct.value)}
                    className={`flex flex-col gap-1.5 p-4 rounded-lg border text-left transition-all duration-150 ${
                      active
                        ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_18px_rgba(0,200,255,0.12)]'
                        : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${active ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                      {ct.label}
                    </p>
                    <p className="text-xs dash-text-muted leading-relaxed">{ct.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Creator size */}
          <div className={sectionClass}>
            <p className={sectionTitle}>Creator Size</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CREATOR_SIZES.map(cs => {
                const active = draft.creator_sizes.includes(cs.value)
                return (
                  <button
                    key={cs.value}
                    type="button"
                    onClick={() => toggleArr('creator_sizes', cs.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all duration-150 ${
                      active
                        ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_14px_rgba(0,200,255,0.2)]'
                        : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${active ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                      {cs.label}
                    </p>
                    <p className="text-xs dash-text-muted mt-0.5">{cs.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <p className={sectionTitle}>Requirements <span className="normal-case font-normal">(optional)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Minimum followers / subscribers</label>
                <NXStepper
                  value={draft.min_subs_followers}
                  onChange={v => setDraft(prev => ({ ...prev, min_subs_followers: v }))}
                  step={1000}
                  min={0}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Minimum engagement rate (%)</label>
                <NXStepper
                  value={draft.min_engagement_rate}
                  onChange={v => setDraft(prev => ({ ...prev, min_engagement_rate: v }))}
                  step={0.5}
                  min={0}
                  max={100}
                  suffix="%"
                  placeholder="0"
                  allowDecimal
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          Next →
        </button>
      </div>
    </div>
  )
}
