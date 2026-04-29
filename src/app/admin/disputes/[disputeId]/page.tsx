import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getDisputeById } from './_actions'
import DisputeActions from './DisputeActions'

type EvidenceJson = {
  generated_at?: string
  executive_summary?: string
  cover?: {
    dispute_id?: string
    stripe_charge_id?: string | null
    stripe_payment_intent_id?: string | null
    amount_dollars?: string
    currency?: string
    reason?: string
    stripe_status?: string
  }
  campaign_brief?: {
    title?: string
    objective?: string | null
    brand_name?: string | null
    product_name?: string | null
    platform?: string[]
    content_type?: string[]
    start_date?: string | null
    end_date?: string | null
    budget?: number | null
  } | null
  delivery_proof?: {
    creator_handle?: string
    proof_urls?: string[]
    screenshot_url?: string | null
    posted_at?: string | null
    submitted_at?: string | null
    disclosure_confirmed?: boolean
  }[]
  acceptance_proof?: {
    status?: string
    admin_notes?: string | null
    payout_status?: string | null
    stripe_transfer_id?: string | null
  }[]
  timeline?: {
    event?: string
    at?: string
    detail?: string | null
  }[]
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-[#00c8ff]/20 text-[#00c8ff]',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
}

function daysUntil(date: Date | null): { text: string; urgent: boolean } | null {
  if (!date) return null
  const ms = date.getTime() - Date.now()
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  if (days < 0) return { text: 'Past due', urgent: true }
  if (days === 0) return { text: 'Due today', urgent: true }
  return { text: `${days} day${days !== 1 ? 's' : ''} remaining`, urgent: days <= 3 }
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>
}) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { disputeId } = await params
  const dispute = await getDisputeById(disputeId)
  if (!dispute) notFound()

  const ev = (dispute.evidence_json ?? {}) as EvidenceJson
  const due = daysUntil(dispute.due_by)
  const amountDollars = (dispute.amount / 100).toFixed(2)
  const statusStyle = STATUS_STYLES[dispute.status] ?? 'bg-gray-500/20 text-gray-400'

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/admin/disputes"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#99f7ff]"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Disputes
        </Link>

        {/* Cover / Header */}
        <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">Dispute</span>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusStyle}`}>
                  {dispute.status}
                </span>
                {due && (
                  <span className={`text-xs px-2 py-0.5 rounded ${due.urgent ? 'bg-red-500/20 text-red-400' : 'bg-[#1e3a5f] dash-text-muted'}`}>
                    {due.text}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold dash-text-bright font-mono">{dispute.stripe_dispute_id}</h1>
              <p className="text-sm dash-text-muted mt-0.5">
                ${amountDollars} {dispute.currency.toUpperCase()}
                {' · '}
                <span className="capitalize">{dispute.reason.replace(/_/g, ' ')}</span>
                {dispute.campaign && (
                  <>
                    {' · '}
                    <Link href={`/admin/campaigns/${dispute.campaign.id}`} className="dash-accent hover:underline">
                      {dispute.campaign.title}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="text-right text-xs dash-text-muted space-y-0.5">
              {dispute.due_by && (
                <p>Evidence due: <span className="dash-text-bright">{new Date(dispute.due_by).toLocaleDateString()}</span></p>
              )}
              {dispute.submitted_at && (
                <p>Submitted: <span className="dash-text-bright">{new Date(dispute.submitted_at).toLocaleDateString()}</span></p>
              )}
              {dispute.stripe_submission_status && (
                <p>Stripe status: <span className="dash-text-bright">{dispute.stripe_submission_status}</span></p>
              )}
            </div>
          </div>

          {ev.executive_summary && (
            <p className="mt-4 border-t border-white/10 pt-4 text-sm dash-text leading-relaxed">
              {ev.executive_summary}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {dispute.stripe_charge_id && (
              <div><span className="dash-text-muted">Charge</span><br /><span className="dash-text-bright font-mono">{dispute.stripe_charge_id}</span></div>
            )}
            {dispute.stripe_payment_intent_id && (
              <div><span className="dash-text-muted">Payment Intent</span><br /><span className="dash-text-bright font-mono">{dispute.stripe_payment_intent_id}</span></div>
            )}
            {ev.cover?.stripe_status && (
              <div><span className="dash-text-muted">Stripe Dispute Status</span><br /><span className="dash-text-bright capitalize">{ev.cover.stripe_status.replace(/_/g, ' ')}</span></div>
            )}
          </div>
        </div>

        {/* Campaign Brief */}
        {ev.campaign_brief && (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
            <h2 className="dash-panel-title mb-4">Campaign Brief</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {ev.campaign_brief.brand_name && (
                <div><dt className="dash-text-muted text-xs uppercase tracking-wide mb-0.5">Brand</dt><dd className="dash-text-bright">{ev.campaign_brief.brand_name}</dd></div>
              )}
              {ev.campaign_brief.product_name && (
                <div><dt className="dash-text-muted text-xs uppercase tracking-wide mb-0.5">Product</dt><dd className="dash-text-bright">{ev.campaign_brief.product_name}</dd></div>
              )}
              {ev.campaign_brief.objective && (
                <div><dt className="dash-text-muted text-xs uppercase tracking-wide mb-0.5">Objective</dt><dd className="dash-text-bright">{ev.campaign_brief.objective}</dd></div>
              )}
              {ev.campaign_brief.start_date && (
                <div><dt className="dash-text-muted text-xs uppercase tracking-wide mb-0.5">Start</dt><dd className="dash-text-bright">{new Date(ev.campaign_brief.start_date).toLocaleDateString()}</dd></div>
              )}
              {ev.campaign_brief.end_date && (
                <div><dt className="dash-text-muted text-xs uppercase tracking-wide mb-0.5">End</dt><dd className="dash-text-bright">{new Date(ev.campaign_brief.end_date).toLocaleDateString()}</dd></div>
              )}
              {ev.campaign_brief.budget != null && (
                <div><dt className="dash-text-muted text-xs uppercase tracking-wide mb-0.5">Budget</dt><dd className="dash-text-bright">${ev.campaign_brief.budget.toLocaleString()}</dd></div>
              )}
            </dl>
            {(ev.campaign_brief.platform?.length || ev.campaign_brief.content_type?.length) ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ev.campaign_brief.platform?.map(p => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#7b4fff]/10 text-[#7b4fff]">{p}</span>
                ))}
                {ev.campaign_brief.content_type?.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Delivery Proof */}
        {ev.delivery_proof && ev.delivery_proof.length > 0 && (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
            <h2 className="dash-panel-title mb-4">Delivery Proof</h2>
            <div className="space-y-5">
              {ev.delivery_proof.map((d, i) => (
                <div key={i} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                  <p className="text-sm font-semibold dash-text-bright mb-2">{d.creator_handle}</p>
                  <dl className="space-y-2 text-sm">
                    {d.proof_urls && d.proof_urls.length > 0 && (
                      <div>
                        <dt className="text-xs dash-text-muted uppercase tracking-wide mb-1">
                          Proof URL{d.proof_urls.length !== 1 ? 's' : ''}
                        </dt>
                        <dd className="space-y-1">
                          {d.proof_urls.map((url, j) => (
                            <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                              className="block dash-accent hover:underline break-all">{url}</a>
                          ))}
                        </dd>
                      </div>
                    )}
                    {d.screenshot_url && (
                      <div>
                        <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Screenshot</dt>
                        <dd><a href={d.screenshot_url} target="_blank" rel="noopener noreferrer" className="dash-accent hover:underline break-all">{d.screenshot_url}</a></dd>
                      </div>
                    )}
                    {d.posted_at && (
                      <div>
                        <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Posted at</dt>
                        <dd className="dash-text-bright">{new Date(d.posted_at).toLocaleString()}</dd>
                      </div>
                    )}
                    {d.submitted_at && (
                      <div>
                        <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Submitted at</dt>
                        <dd className="dash-text-muted">{new Date(d.submitted_at).toLocaleString()}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Disclosure confirmed</dt>
                      <dd className={`font-medium ${d.disclosure_confirmed ? 'text-green-400' : 'text-red-400'}`}>
                        {d.disclosure_confirmed ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acceptance Proof */}
        {ev.acceptance_proof && ev.acceptance_proof.length > 0 && (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
            <h2 className="dash-panel-title mb-4">Acceptance Proof</h2>
            <div className="space-y-3">
              {ev.acceptance_proof.map((a, i) => (
                <dl key={i} className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm first:border-0 first:pt-0 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Review status</dt>
                    <dd className="dash-text-bright capitalize">{a.status?.replace(/_/g, ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Payout status</dt>
                    <dd className={a.payout_status === 'paid' ? 'text-green-400' : 'dash-text-muted'}>
                      {a.payout_status ?? 'pending'}
                    </dd>
                  </div>
                  {a.stripe_transfer_id && (
                    <div>
                      <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Transfer ID</dt>
                      <dd className="dash-text-bright font-mono text-xs">{a.stripe_transfer_id}</dd>
                    </div>
                  )}
                </dl>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {ev.timeline && ev.timeline.length > 0 && (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
            <h2 className="dash-panel-title mb-4">Timeline</h2>
            <ol className="space-y-2">
              {ev.timeline.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="dash-text-muted text-xs shrink-0 w-32">
                    {e.at ? new Date(e.at).toLocaleDateString() : ''}
                  </span>
                  <span className="dash-text-bright">{e.event}</span>
                  {e.detail && <span className="dash-text-muted">· {e.detail}</span>}
                </li>
              ))}
              {dispute.events.map(e => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="dash-text-muted text-xs shrink-0 w-32">
                    {new Date(e.occurred_at).toLocaleDateString()}
                  </span>
                  <span className="dash-accent capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Admin Review + Submit */}
        <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
          <h2 className="dash-panel-title mb-4">Admin Decision</h2>
          <DisputeActions
            disputeId={dispute.id}
            initialNotes={dispute.admin_notes ?? ''}
            status={dispute.status}
          />
          {dispute.status === 'submitted' && (
            <p className="mt-4 text-sm text-[#00c8ff]">Evidence submitted to Stripe. Monitor the dispute status in your Stripe dashboard.</p>
          )}
        </div>
      </div>
    </div>
  )
}
