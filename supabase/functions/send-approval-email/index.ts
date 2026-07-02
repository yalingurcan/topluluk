import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not set in Supabase Secrets')
    }

    const { email, full_name } = await req.json()
    if (!email) {
      throw new Error('Email parameter is required')
    }

    console.log(`Sending approval email to: ${email} (${full_name || 'No Name'})`)

    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Alamancı',
          email: 'info@eylaconsulting.com'
        },
        to: [
          {
            email: email,
            name: full_name || email
          }
        ],
        subject: 'Alamancı Üyeliğiniz Onaylandı! 🎉',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; rounded: 12px;">
            <h2 style="color: #C8432B;">Merhaba ${full_name || ''},</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Alamancı topluluğuna yaptığınız üyelik başvurusu incelenmiş ve <strong>onaylanmıştır</strong>! 🎉
            </p>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Artık sisteme giriş yaparak profili güncelleyebilir, etkinliklere katılabilir ve diğer üyelerle iletişime geçebilirsiniz.
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="https://alamanci.netlify.app" style="background-color: #C8432B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Giriş Yap ve Keşfet
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Bu e-posta Alamancı Topluluk Yönetimi tarafından otomatik olarak gönderilmiştir.
            </p>
          </div>
        `
      })
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Brevo API Error:', responseData)
      throw new Error(`Brevo API responded with status ${response.status}: ${JSON.stringify(responseData)}`)
    }

    console.log('Email sent successfully via Brevo:', responseData)

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
