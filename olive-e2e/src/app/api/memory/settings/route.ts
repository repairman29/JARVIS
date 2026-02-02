import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseServerConfigured } from '@/lib/supabaseServer'

export type ShoppingMode = 'budget' | 'splurge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const supabaseServer = await createClient()
  if (!isSupabaseServerConfigured || !supabaseServer) {
    return NextResponse.json({ shopping_mode: 'splurge' })
  }

  const { data, error } = await supabaseServer
    .from('olive_user_settings')
    .select('shopping_mode, kroger_location_id, kroger_location_name, quantity_strategy')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mode = (data?.shopping_mode === 'budget' ? 'budget' : 'splurge') as ShoppingMode
  return NextResponse.json({
    shopping_mode: mode,
    quantity_strategy: data?.quantity_strategy ?? 'exact',
    kroger_location_id: data?.kroger_location_id ?? null,
    kroger_location_name: data?.kroger_location_name ?? null,
  })
}

export async function PATCH(request: NextRequest) {
  const supabaseServer = await createClient()
  if (!isSupabaseServerConfigured || !supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured; settings cannot be saved' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const userId = body.userId
  const shopping_mode = body.shopping_mode === 'budget' ? 'budget' : 'splurge'
  const quantity_strategy = body.quantity_strategy === 'overshoot' ? 'overshoot' : 'exact'
  const kroger_location_id = typeof body.kroger_location_id === 'string' ? body.kroger_location_id : undefined
  const kroger_location_name = typeof body.kroger_location_name === 'string' ? body.kroger_location_name : undefined

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const row: Record<string, unknown> = {
    user_id: userId,
    shopping_mode,
    quantity_strategy,
    updated_at: new Date().toISOString(),
  }
  if (kroger_location_id !== undefined) row.kroger_location_id = kroger_location_id || null
  if (kroger_location_name !== undefined) row.kroger_location_name = kroger_location_name || null

  const { data, error } = await supabaseServer
    .from('olive_user_settings')
    .upsert(row, { onConflict: 'user_id' })
    .select('shopping_mode, kroger_location_id, kroger_location_name, quantity_strategy')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    shopping_mode: data?.shopping_mode ?? shopping_mode,
    quantity_strategy: data?.quantity_strategy ?? quantity_strategy,
    kroger_location_id: data?.kroger_location_id ?? null,
    kroger_location_name: data?.kroger_location_name ?? null,
  })
}
