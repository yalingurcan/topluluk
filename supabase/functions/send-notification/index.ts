import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-notification-secret',
}

interface NotificationPayload {
  type: 'pending' | 'approved' | 'event_update' | 'comment' | 'reply';
  email: string;
  full_name?: string;
  data?: {
    title?: string;
    sender_name?: string;
    body?: string;
    link?: string;
    details?: string;
  };
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestSecret = req.headers.get('x-notification-secret')
    const systemSecret = Deno.env.get('NOTIFICATION_SECRET')

    // Secure validation of incoming webhook calls
    if (systemSecret && requestSecret !== systemSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized secret' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    const payload: NotificationPayload = await req.json()
    const { type, email, full_name, data } = payload

    if (!email) {
      throw new Error('Recipient email is required')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')

    if (!resendApiKey && !brevoApiKey) {
      throw new Error('Neither RESEND_API_KEY nor BREVO_API_KEY is configured in Supabase Secrets')
    }

    const ADMIN_EMAIL = 'yalingurcanmd@gmail.com'

    async function dispatchEmail(toEmail: string, toName: string | undefined, subject: string, htmlContent: string) {
      if (resendApiKey) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Alamancı <info@alamanci.eu>',
            to: toEmail,
            subject,
            html: htmlContent
          })
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(`Resend Error: ${JSON.stringify(result)}`)
        }
        console.log('Email sent successfully via Resend:', result)
        return result
      } else {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey!,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Alamancı', email: 'info@eylaconsulting.com' },
            to: [{ email: toEmail, name: toName || toEmail }],
            subject,
            htmlContent
          })
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(`Brevo Error: ${JSON.stringify(result)}`)
        }
        console.log('Email sent successfully via Brevo:', result)
        return result
      }
    }

    let subject = ''
    let htmlContent = ''

    const appUrl = 'https://alamanci.netlify.app'
    const brandColor = '#C8432B' // primary color (terracotta)

    // Generate Beautiful HTML Templates
    switch (type) {
      case 'pending':
        subject = 'Alamancı Üyelik Başvurunuz Alındı ⌛'
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: ${brandColor};">Merhaba ${full_name || ''},</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Alamancı topluluğuna yaptığınız üyelik başvurusu başarıyla alınmıştır! 🎉
            </p>
            <p style="font-size: 16px; color: #374151; line-height: 1.6; background-color: #f3f4f6; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>Başvurunuz Değerlendiriliyor:</strong> Yönetim ekibimiz başvurunuzu en kısa sürede inceleyecektir. Üyeliğiniz onaylandığında size tekrar bilgilendirme e-postası göndereceğiz.
            </p>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Bu süreçte herhangi bir işlem yapmanıza gerek yoktur, sekmeyi kapatıp bekleyebilirsiniz.
            </p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Bu e-posta Alamancı Topluluğu tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        `
        break

      case 'approved':
        subject = 'Alamancı Üyeliğiniz Onaylandı! 🎉'
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: ${brandColor};">Tebrikler ${full_name || ''}!</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Alamancı topluluğuna yaptığınız üyelik başvurusu onaylanmıştır! Aramıza hoş geldiniz. 😊
            </p>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Artık topluluğumuzdaki diğer üyeleri keşfedebilir, etkinliklere katılabilir, forum konularında paylaşım yapabilir ve mesajlaşabilirsiniz.
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${appUrl}" style="background-color: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Giriş Yap ve Keşfet ➔
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Bu e-posta Alamancı Topluluğu tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        `
        break

      case 'event_update':
        subject = `Etkinlik Güncellendi: ${data?.title || 'Etkinlik'}`
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: #d97706;">Etkinlik Bilgileri Güncellendi! 📍</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Merhaba ${full_name || ''}, katılacağınızı belirttiğiniz <strong>"${data?.title || ''}"</strong> isimli etkinlikte güncellemeler yapılmıştır.
            </p>
            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 10px; margin: 20px 0;">
              <h4 style="margin: 0 0 8px 0; color: #92400e;">Güncel Bilgiler:</h4>
              <p style="font-size: 14px; margin: 0; color: #78350f; white-space: pre-wrap;">${data?.details || 'Detaylar güncellendi.'}</p>
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${appUrl}${data?.link || '/etkinlikler'}" style="background-color: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Etkinlik Detayına Git ➔
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Bu e-posta Alamancı Topluluğu tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        `
        break

      case 'comment':
        subject = `Gönderinize Yeni Yorum: "${data?.title || 'Gönderi'}"`
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: ${brandColor};">Yeni Yorum Geldi! 💬</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Merhaba ${full_name || ''}, <strong>"${data?.title || ''}"</strong> başlıklı gönderinize <strong>${data?.sender_name || 'Bir üye'}</strong> tarafından yeni bir yorum yapıldı:
            </p>
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 10px; margin: 20px 0; font-style: italic;">
              "${data?.body || ''}"
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${appUrl}${data?.link || '/'}" style="background-color: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Yorumu Görüntüle ➔
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Bu e-posta Alamancı Topluluğu tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        `
        break

      case 'reply':
        subject = `Yorumunuza Yanıt Geldi ↩️`
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: ${brandColor};">Yorumunuza Cevap Yazıldı! 💬</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Merhaba ${full_name || ''}, Alamancı'da yaptığınız yoruma <strong>${data?.sender_name || 'Bir üye'}</strong> yanıt verdi:
            </p>
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 10px; margin: 20px 0; font-style: italic;">
              "${data?.body || ''}"
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${appUrl}${data?.link || '/'}" style="background-color: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Yanıtı Görüntüle ➔
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Bu e-posta Alamancı Topluluğu tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        `
        break

      default:
        throw new Error(`Unsupported notification type: ${type}`)
    }

    const emailSentResult = await dispatchEmail(email, full_name, subject, htmlContent)

    // Also notify the admin whenever a new membership application comes in
    if (type === 'pending') {
      const adminSubject = `Yeni Üyelik Başvurusu: ${full_name || email} ⌛`
      const adminHtmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h2 style="color: ${brandColor};">Yeni Bir Üyelik Başvurusu Var 📥</h2>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            <strong>${full_name || 'Bir kullanıcı'}</strong> (${email}) Alamancı topluluğuna üyelik için başvurdu ve onayınızı bekliyor.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${appUrl}/admin" style="background-color: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Başvuruyu İncele ➔
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Bu e-posta Alamancı Topluluğu tarafından otomatik olarak gönderilmiştir.
          </p>
        </div>
      `
      try {
        await dispatchEmail(ADMIN_EMAIL, 'Admin', adminSubject, adminHtmlContent)
      } catch (adminEmailError) {
        // Don't fail the whole request if only the admin copy fails to send
        console.error('Failed to send admin notification email:', adminEmailError.message)
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: emailSentResult }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function execution failed:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
