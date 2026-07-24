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
    screenshot_urls?: string[]
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
  draft:
    'rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fde047]',
  submitted:
    'rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#bffcff]',
  won:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  lost:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
}

function daysUntil(date: Date | null): { text: string; urgent: boolean } | null {
  if (!date) return null
  const ms = date.getTime() - Date.now()
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  if (days < 0) return { text: 'Past due', urgent: true }
  if (days === 0) return { text: 'Due today', urgent: true }
  return { text: `${days} day${days !== 1 ? 's' : ''} remaining`, urgent: days <= 3 }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="sp-app-stat-label mb-1">{label}</dt>
      <dd className="text-sm cr-text">{children}</dd>
    </div>
  )
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="sp-app-stat-label">{label}</span>
      <span className="sp-app-stat-value text-right">{children}</span>
    </div>
  )
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
  const statusStyle =
    STATUS_STYLES[dispute.status] ??
    'rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-200'

  return (
    <div className="admin-disputes admin-disputes-detail mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <Link
        href="/admin/disputes"
        className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
      >
        <span aria-hidden>&larr;</span>
        Back to disputes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#c084fc]/35 bg-[#c084fc]/10 px-2.5 py-0.5 text-xs font-semibold text-[#d8b4fe]">
              Dispute
            </span>
            <span className={statusStyle}>{dispute.status}</span>
            {due && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  due.urgent
                    ? 'border-[#f87171]/40 bg-[#f87171]/15 text-[#fca5a5]'
                    : 'border-white/12 bg-black/25 cr-stat-caption'
                }`}
              >
                {due.text}
              </span>
            )}
          </div>
          <p className="cr-field-label">Stripe chargeback</p>
          <h1 className="mt-1 font-mono font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
            {dispute.stripe_dispute_id}
          </h1>
          <p className="mt-2 text-sm cr-text-muted">
            <span className="font-semibold tabular-nums text-[#e8f4ff]">${amountDollars}</span>{' '}
            {dispute.currency.toUpperCase()}
            {' · '}
            <span className="capitalize">{dispute.reason.replace(/_/g, ' ')}</span>
            {dispute.campaign && (
              <>
                {' · '}
                <Link
                  href={`/admin/campaigns/${dispute.campaign.id}`}
                  className="text-[#bffcff] hover:text-[#99f7ff] hover:underline"
                >
                  {dispute.campaign.title}
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="sp-app-header-stat w-full shrink-0 space-y-2 rounded-lg px-4 py-3 sm:w-auto sm:min-w-[220px]">
          {dispute.due_by && (
            <SideRow label="Evidence due">
              {new Date(dispute.due_by).toLocaleDateString()}
            </SideRow>
          )}
          {dispute.submitted_at && (
            <SideRow label="Submitted">
              {new Date(dispute.submitted_at).toLocaleDateString()}
            </SideRow>
          )}
          {dispute.stripe_submission_status && (
            <SideRow label="Stripe status">{dispute.stripe_submission_status}</SideRow>
          )}
        </div>
      </div>

      {ev.executive_summary && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-3">Executive summary</h2>
          <p className="text-sm leading-relaxed cr-text">{ev.executive_summary}</p>
        </section>
      )}

      {(dispute.stripe_charge_id ||
        dispute.stripe_payment_intent_id ||
        ev.cover?.stripe_status) && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-4">Stripe identifiers</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dispute.stripe_charge_id && (
              <Field label="Charge">
                <span className="font-mono text-xs">{dispute.stripe_charge_id}</span>
              </Field>
            )}
            {dispute.stripe_payment_intent_id && (
              <Field label="Payment intent">
                <span className="font-mono text-xs">{dispute.stripe_payment_intent_id}</span>
              </Field>
            )}
            {ev.cover?.stripe_status && (
              <Field label="Dispute status">
                <span className="capitalize">{ev.cover.stripe_status.replace(/_/g, ' ')}</span>
              </Field>
            )}
          </dl>
        </section>
      )}

      {ev.campaign_brief && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-4">Campaign brief</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ev.campaign_brief.brand_name && (
              <Field label="Brand">{ev.campaign_brief.brand_name}</Field>
            )}
            {ev.campaign_brief.product_name && (
              <Field label="Product">{ev.campaign_brief.product_name}</Field>
            )}
            {ev.campaign_brief.objective && (
              <Field label="Objective">{ev.campaign_brief.objective}</Field>
            )}
            {ev.campaign_brief.start_date && (
              <Field label="Start">
                {new Date(ev.campaign_brief.start_date).toLocaleDateString()}
              </Field>
            )}
            {ev.campaign_brief.end_date && (
              <Field label="End">
                {new Date(ev.campaign_brief.end_date).toLocaleDateString()}
              </Field>
            )}
            {ev.campaign_brief.budget != null && (
              <Field label="Budget">${ev.campaign_brief.budget.toLocaleString()}</Field>
            )}
          </dl>
          {(ev.campaign_brief.platform?.length || ev.campaign_brief.content_type?.length) ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ev.campaign_brief.platform?.map(p => (
                <span
                  key={p}
                  className="rounded-full border border-[#c084fc]/35 bg-[#c084fc]/10 px-2.5 py-0.5 text-xs font-medium text-[#d8b4fe]"
                >
                  {p}
                </span>
              ))}
              {ev.campaign_brief.content_type?.map(t => (
                <span
                  key={t}
                  className="rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#bffcff]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {ev.delivery_proof && ev.delivery_proof.length > 0 && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-4">Delivery proof</h2>
          <div className="space-y-5">
            {ev.delivery_proof.map((d, i) => (
              <div key={i} className="border-t border-white/10 pt-4 first:border-0 first:pt-0">
                <p className="mb-3 text-sm font-semibold text-[#e8f4ff]">{d.creator_handle}</p>
                <dl className="space-y-3">
                  {d.proof_urls && d.proof_urls.length > 0 && (
                    <Field label={`Proof URL${d.proof_urls.length !== 1 ? 's' : ''}`}>
                      <div className="space-y-1">
                        {d.proof_urls.map((url, j) => (
                          <a
                            key={j}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block break-all text-[#bffcff] hover:text-[#99f7ff] hover:underline"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </Field>
                  )}
                  {d.screenshot_urls && d.screenshot_urls.length > 0 && (
                    <Field label={`Screenshot${d.screenshot_urls.length !== 1 ? 's' : ''}`}>
                      <div className="space-y-1">
                        {d.screenshot_urls.map((url, j) => (
                          <a
                            key={j}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block break-all text-[#bffcff] hover:text-[#99f7ff] hover:underline"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </Field>
                  )}
                  {d.posted_at && (
                    <Field label="Posted at">
                      {new Date(d.posted_at).toLocaleString()}
                    </Field>
                  )}
                  {d.submitted_at && (
                    <Field label="Submitted at">
                      <span className="cr-text-muted">
                        {new Date(d.submitted_at).toLocaleString()}
                      </span>
                    </Field>
                  )}
                  <Field label="Disclosure confirmed">
                    <span
                      className={`font-medium ${d.disclosure_confirmed ? 'text-[#86efac]' : 'text-[#fca5a5]'}`}
                    >
                      {d.disclosure_confirmed ? 'Yes' : 'No'}
                    </span>
                  </Field>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      {ev.acceptance_proof && ev.acceptance_proof.length > 0 && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-4">Acceptance proof</h2>
          <div className="space-y-4">
            {ev.acceptance_proof.map((a, i) => (
              <dl
                key={i}
                className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm first:border-0 first:pt-0 sm:grid-cols-3"
              >
                <Field label="Review status">
                  <span className="capitalize">{a.status?.replace(/_/g, ' ')}</span>
                </Field>
                <Field label="Payout status">
                  <span
                    className={
                      a.payout_status === 'paid' ? 'text-[#86efac]' : 'cr-text-muted'
                    }
                  >
                    {a.payout_status ?? 'pending'}
                  </span>
                </Field>
                {a.stripe_transfer_id && (
                  <Field label="Transfer ID">
                    <span className="font-mono text-xs">{a.stripe_transfer_id}</span>
                  </Field>
                )}
              </dl>
            ))}
          </div>
        </section>
      )}

      {((ev.timeline && ev.timeline.length > 0) || dispute.events.length > 0) && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-4">Timeline</h2>
          <ol className="space-y-2">
            {ev.timeline?.map((e, i) => (
              <li key={`ev-${i}`} className="flex gap-3 text-sm">
                <span className="w-32 shrink-0 text-xs tabular-nums cr-stat-caption">
                  {e.at ? new Date(e.at).toLocaleDateString() : ''}
                </span>
                <span className="text-[#e8f4ff]">{e.event}</span>
                {e.detail && <span className="cr-text-muted">· {e.detail}</span>}
              </li>
            ))}
            {dispute.events.map(e => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="w-32 shrink-0 text-xs tabular-nums cr-stat-caption">
                  {new Date(e.occurred_at).toLocaleDateString()}
                </span>
                <span className="capitalize text-[#bffcff]">
                  {e.event_type.replace(/_/g, ' ')}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
        <h2 className="cr-panel-title mb-4">Admin decision</h2>
        <DisputeActions
          disputeId={dispute.id}
          initialNotes={dispute.admin_notes ?? ''}
          status={dispute.status}
        />
        {dispute.status === 'submitted' && (
          <p className="mt-4 text-sm text-[#bffcff]">
            Evidence submitted to Stripe. Monitor the dispute status in your Stripe dashboard.
          </p>
        )}
      </section>
    </div>
  )
}
