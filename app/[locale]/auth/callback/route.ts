// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isPasswordRecovery } from '@/lib/auth/password-reset'

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { searchParams, origin } = new URL(request.url)
  const locale = (await params).locale === 'en' ? 'en' : 'ar'
  const prefix = locale === 'en' ? '/en' : ''
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const recovery = isPasswordRecovery(searchParams)

  if (code || (tokenHash && searchParams.get('type') === 'recovery')) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    // تحويل الكود إلى جلسة صالحة
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: 'recovery' })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${prefix}${recovery ? '/auth/reset-password' : '/'}`)
    }
  }

  // في حال فشل التأكيد
  return NextResponse.redirect(`${origin}${prefix}${recovery ? '/auth/forgot-password?result=expired' : '/auth/login?error=true'}`)
}
