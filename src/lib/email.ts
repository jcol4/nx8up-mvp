type SendEmailInput = {
  to: string
  subject: string
  title: string
  message: string
  link?: string
}

function buildEmailHtml({ title, message, link }: Pick<SendEmailInput, 'title' | 'message' | 'link'>): string {
  const ctaButton = link
    ? `<a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#00c8ff;color:#000;font-weight:bold;border-radius:6px;text-decoration:none;">View Details</a>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;background:#060d18;color:#c8dff0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#0d1d30;border-radius:12px;padding:24px;border:1px solid rgba(0,200,255,0.15);">
    <p style="color:#00c8ff;font-size:11px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">NX8UP Notification</p>
    <h2 style="color:#e8f4ff;margin:0 0 12px;font-size:18px;">${title}</h2>
    <p style="color:#8aa4bf;margin:0;line-height:1.6;">${message}</p>
    ${ctaButton}
  </div>
  <p style="text-align:center;margin-top:24px;font-size:11px;color:#4a6080;">
    You received this because you have notifications enabled.
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nx8up.com'}/creator/settings/notifications" style="color:#00c8ff;">Manage preferences</a>
  </p>
</body>
</html>`
}

export async function sendNotificationEmail(input: SendEmailInput): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email notification')
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'notifications@nx8up.com',
      to: input.to,
      subject: input.subject,
      html: buildEmailHtml(input),
    })
  } catch (err) {
    console.error('[sendNotificationEmail] failed silently:', err)
  }
}
