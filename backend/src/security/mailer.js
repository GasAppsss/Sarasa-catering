/**
 * Optional transactional email sender for Password Reset OTP.
 * Uses Resend REST API when RESEND_API_KEY is configured, otherwise safely falls back to preview mode.
 */

export async function sendPasswordResetEmail({ config, toEmail, displayName, otpCode, ttlMinutes = 10 }) {
  const apiKey = config?.resendApiKey;
  const fromAddress = config?.mailFrom || 'Sajian Catering Security <onboarding@resend.dev>';

  if (!apiKey) {
    return {
      delivered: false,
      provider: 'preview-local',
      previewCode: config?.isProd ? undefined : otpCode,
    };
  }

  try {
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden;">
        <div style="background: #043927; color: #ffffff; padding: 24px;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #fbbf24; font-weight: 700;">Sajian Catering Security</p>
          <h1 style="margin: 8px 0 0; font-size: 20px;">Kode Verifikasi Reset Password</h1>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #1c1917;">
          <p style="margin: 0 0 12px; font-size: 14px;">Halo <strong>${displayName}</strong>,</p>
          <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6;">
            Kami menerima permintaan pengaturan ulang password untuk akun internal Anda. Gunakan kode OTP 6-digit berikut:
          </p>
          <div style="background: #faf8f5; border: 1px dashed #d97706; border-radius: 12px; padding: 16px; text-align: center; font-size: 28px; letter-spacing: 8px; font-weight: 800; color: #043927; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="margin: 18px 0 0; font-size: 12px; color: #57534e;">
            Kode ini berlaku selama <strong>${ttlMinutes} menit</strong> dan hanya dapat digunakan satu kali. Jika Anda tidak merasa meminta reset password, abaikan email ini.
          </p>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: `[Sajian Catering] Kode OTP Reset Password: ${otpCode}`,
        html,
      }),
    });

    if (!res.ok) {
      return {
        delivered: false,
        provider: 'resend-error',
        previewCode: config?.isProd ? undefined : otpCode,
      };
    }

    return {
      delivered: true,
      provider: 'resend',
      previewCode: config?.isProd ? undefined : otpCode,
    };
  } catch {
    return {
      delivered: false,
      provider: 'network-error',
      previewCode: config?.isProd ? undefined : otpCode,
    };
  }
}
