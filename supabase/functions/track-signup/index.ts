import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)

    const userId = claims.claims.sub as string
    const email = (claims.claims.email as string) ?? null

    const body = await req.json().catch(() => ({}))
    const eventType: 'signup' | 'login' = body.event_type === 'login' ? 'login' : 'signup'

    // IP from headers
    const xff = req.headers.get('x-forwarded-for') ?? ''
    const ip = xff.split(',')[0].trim() || req.headers.get('cf-connecting-ip') || null

    const ua = req.headers.get('user-agent') ?? null

    // Pull google identity if present
    const { data: userData } = await userClient.auth.getUser(token)
    const googleIdentity = userData?.user?.identities?.find((i: any) => i.provider === 'google')
    const googleSub = googleIdentity?.identity_data?.sub ?? null
    const provider = googleIdentity ? 'google' : (body.provider ?? 'email')

    const payload = {
      user_id: userId,
      email,
      provider,
      google_sub: googleSub,
      event_type: eventType,
      ip,
      user_agent: ua,
      os: body.os ?? null,
      device_type: body.device_type ?? null,
      screen: body.screen ?? null,
      language: body.language ?? null,
      timezone: body.timezone ?? null,
      fingerprint_hash: body.fingerprint_hash ?? null,
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await admin.rpc('record_signup_event', { p_payload: payload })
    if (error) return json({ error: error.message }, 500)

    return json({ ok: true, event_id: data })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
