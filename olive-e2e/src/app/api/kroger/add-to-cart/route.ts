import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabaseServer'

const KROGER_SERVICE = process.env.NEXT_PUBLIC_KROGER_SERVICE_URL
const SERVICE_SECRET = process.env.KROGER_SERVICE_SECRET
const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID || 'jarvisshopping-bbccng3h'
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET || ''
const DEFAULT_LOCATION_ID = process.env.KROGER_LOCATION_ID || '62000006'
const CART_DOMAIN = process.env.NEXT_PUBLIC_KROGER_CART_DOMAIN || 'www.kroger.com'

type ShoppingMode = 'budget' | 'splurge'
type QuantityStrategy = 'exact' | 'overshoot'

async function getKrogerToken() {
  const auth = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64')
  const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) throw new Error('Failed to get Kroger token')
  return tokenData.access_token as string
}

// Kroger item price shape (from API)
interface KrogerPrice {
  regular?: number
  promo?: number
  regularPerUnitEstimate?: number
  promoPerUnitEstimate?: number
}

// Normalized product for comparison and cart
interface ProductPick {
  upc: string
  description: string
  price: number
  regularPrice: number
  promoPrice?: number
  onSale: boolean
  size?: string
  perUnitPrice?: number
  /** Normalized size in oz for comparison (unit normalization: 16 oz = 1 lb, etc.) */
  normalizedSizeOz?: number
}

function parseSize(sizeStr?: string): { amount: number; unit: string } | null {
  if (!sizeStr) return null
  const m = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/)
  if (!m) return null
  return { amount: parseFloat(m[1]), unit: m[2].toLowerCase() }
}

function normalizeToOz(amount: number, unit: string): number | null {
  const units: Record<string, number> = {
    oz: 1,
    ounce: 1,
    ounces: 1,
    lb: 16,
    pound: 16,
    pounds: 16,
    g: 0.035274,
    kg: 35.274,
    ml: 0.033814,
    l: 33.814,
  }
  const factor = units[unit]
  return factor ? amount * factor : null
}

// Search products: budget = best value (sale first, then best per-unit price); splurge = prefer preferred_upc if set
async function searchProduct(
  term: string,
  locationId: string,
  token: string,
  options: { mode: ShoppingMode; preferredUpc?: string | null; strategy?: QuantityStrategy } = { mode: 'splurge' }
): Promise<ProductPick | null> {
  const limit = options.mode === 'budget' ? 25 : options.preferredUpc ? 15 : 10
  const searchRes = await fetch(
    `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(term)}&filter.limit=${limit}&filter.locationId=${locationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )
  const searchData = await searchRes.json()
  if (!searchRes.ok || !searchData.data?.length) return null

  const products: ProductPick[] = searchData.data.map((p: any) => {
    const item = p.items?.[0]
    const priceObj: KrogerPrice = item?.price ?? {}
    const regular = priceObj.regular ?? 999999
    const promo = priceObj.promo
    const effectivePrice = promo != null ? promo : regular
    const regularPerUnit = priceObj.regularPerUnitEstimate ?? regular
    const promoPerUnit = priceObj.promoPerUnitEstimate ?? promo ?? regularPerUnit
    const perUnitPrice = promo != null ? promoPerUnit : regularPerUnit
    const sizeStr = item?.size
    const parsed = parseSize(sizeStr)
    const normalizedSizeOz = parsed ? normalizeToOz(parsed.amount, parsed.unit) ?? undefined : undefined
    return {
      upc: p.upc || p.productId,
      description: p.description,
      price: effectivePrice,
      regularPrice: regular,
      promoPrice: promo,
      onSale: promo != null,
      size: sizeStr,
      perUnitPrice: perUnitPrice < 999999 ? perUnitPrice : undefined,
      normalizedSizeOz: normalizedSizeOz != null && normalizedSizeOz > 0 ? normalizedSizeOz : undefined,
    }
  })

  if (options.mode === 'splurge' && options.preferredUpc) {
    const preferred = products.find((p) => String(p.upc) === String(options.preferredUpc))
    if (preferred) return preferred
  }

  // Granny logic: Sale Trap = best per-unit first (only then prefer sale). Overshoot = prefer larger size when per-unit tied.
  const sorted = [...products].sort((a, b) => {
    // 1) Cost-to-satisfy: best per-unit price first (Sale Trap — we don't pick sale over better per-unit)
    const perA = a.perUnitPrice ?? a.price
    const perB = b.perUnitPrice ?? b.price
    if (perA !== perB) return perA - perB

    // 2) Tiebreaker in budget mode: prefer sale
    if (options.mode === 'budget' && a.onSale !== b.onSale) {
      return a.onSale ? -1 : 1
    }

    // 3) Overshoot: prefer larger size (unit-normalized) so user doesn't run out
    if (options.strategy === 'overshoot' && a.normalizedSizeOz != null && b.normalizedSizeOz != null) {
      return b.normalizedSizeOz - a.normalizedSizeOz
    }

    // 4) Cheaper total price
    return a.price - b.price
  })

  return sorted[0] ?? null
}

export async function POST(request: NextRequest) {
  if (!KROGER_SERVICE || !SERVICE_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Kroger service not configured (missing NEXT_PUBLIC_KROGER_SERVICE_URL or KROGER_SERVICE_SECRET)' },
      { status: 503 }
    )
  }

  if (!KROGER_CLIENT_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: 'Kroger product search unavailable: set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in Vercel (Settings → Environment Variables), then redeploy.',
      },
      { status: 503 }
    )
  }

  try {
    const { userId, items, shopping_mode: bodyMode, quantity_strategy: bodyStrategy } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    let mode: ShoppingMode = bodyMode === 'budget' ? 'budget' : 'splurge'
    let strategy: QuantityStrategy = bodyStrategy === 'overshoot' ? 'overshoot' : 'exact'
    let preferencesByTerm: Record<string, string | null> = {}
    let locationId = DEFAULT_LOCATION_ID

    if (isSupabaseServerConfigured() && supabaseServer && userId) {
      const { data: settings } = await supabaseServer
        .from('olive_user_settings')
        .select('shopping_mode, kroger_location_id, quantity_strategy')
        .eq('user_id', userId)
        .maybeSingle()
      if (settings?.shopping_mode === 'budget') mode = 'budget'
      if (settings?.quantity_strategy === 'overshoot') strategy = 'overshoot'
      if (settings?.kroger_location_id) locationId = settings.kroger_location_id

      const terms = items.map((item: string | { term: string }) =>
        typeof item === 'string' ? item : item.term
      )
      const { data: prefs } = await supabaseServer
        .from('olive_preferences')
        .select('term, preferred_upc')
        .eq('user_id', userId)
        .in('term', terms)
      if (Array.isArray(prefs)) {
        prefs.forEach((p: { term: string; preferred_upc: string | null }) => {
          preferencesByTerm[p.term] = p.preferred_upc ?? null
        })
      }
    }

    let token: string
    try {
      token = await getKrogerToken()
    } catch (e: unknown) {
      return NextResponse.json(
        { success: false, error: 'Kroger product search unavailable (check KROGER_CLIENT_ID / KROGER_CLIENT_SECRET)' },
        { status: 503 }
      )
    }
    const cartItems: { upc: string; quantity: number; modality: string }[] = []
    const results: { term: string; found: boolean; upc?: string; description?: string; price?: number; regularPrice?: number; onSale?: boolean; size?: string; addedToCart?: boolean; cartError?: string; outOfStock?: boolean }[] = []
    let totalSavings = 0

    for (const item of items) {
      const term = typeof item === 'string' ? item : item.term
      const quantityRequested = typeof item === 'object' ? item.quantity || 1 : 1
      const preferredUpc = preferencesByTerm[term] ?? null

      const product = await searchProduct(term, locationId, token, {
        mode,
        preferredUpc: mode === 'splurge' ? preferredUpc : undefined,
        strategy,
      })

      if (product) {
        // Overshoot: round quantity up so we meet or exceed volume requested
        const finalQuantity = strategy === 'overshoot'
          ? Math.max(1, Math.ceil(quantityRequested))
          : quantityRequested

        if (product.onSale && product.promoPrice != null) {
          totalSavings += (product.regularPrice - product.promoPrice) * finalQuantity
        }

        cartItems.push({
          upc: product.upc,
          quantity: Math.max(1, Math.round(finalQuantity)),
          modality: 'PICKUP',
        })
        results.push({
          term,
          found: true,
          upc: product.upc,
          description: product.description,
          price: product.price,
          regularPrice: product.regularPrice,
          onSale: product.onSale,
          size: product.size,
        })
      } else {
        results.push({ term, found: false })
      }
    }

    if (cartItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products found for your items',
        results,
      })
    }

    // Add to cart via our service (items added one-by-one for per-item success/failure, e.g. out of stock)
    const addRes = await fetch(`${KROGER_SERVICE}/api/cart/${userId}/add`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': SERVICE_SECRET!,
      },
      body: JSON.stringify({ items: cartItems }),
    })

    const addData = await addRes.json()

    if (addRes.status === 401 && addData.needsAuth) {
      return NextResponse.json({
        success: false,
        needsAuth: true,
        authUrl: addData.authUrl,
        error: 'Please connect your Kroger account first',
      })
    }

    // Merge per-item cart results (added / error) into our search results by index
    if (addRes.ok && Array.isArray(addData.itemResults) && addData.itemResults.length > 0) {
      const itemResults: { added: boolean; error?: string; status?: number }[] = addData.itemResults
      for (let i = 0; i < results.length && i < itemResults.length; i++) {
        if (results[i].found) {
          results[i].addedToCart = itemResults[i].added
          if (itemResults[i].error) {
            results[i].cartError = itemResults[i].error
            if (itemResults[i].status === 404 || /not found|out of stock|unavailable/i.test(String(itemResults[i].error))) {
              results[i].outOfStock = true
            }
          }
        }
      }
    } else if (addRes.ok && addData.success) {
      // Legacy response (no itemResults): treat all found items as added
      results.forEach((r) => { if (r.found) r.addedToCart = true })
    }

    // Store memory (events + preferences) if configured — non-fatal so cart success is preserved
    if (isSupabaseServerConfigured() && supabaseServer && userId) {
      try {
        const now = new Date().toISOString()
        const events = results.map((result: any) => ({
          user_id: userId,
          event_type: 'add_to_cart',
          term: result.term,
          upc: result.found ? result.upc : null,
          description: result.description || null,
          price: result.price || null,
          store_location_id: locationId,
          created_at: now,
        }))

        if (events.length > 0) {
          await supabaseServer.from('olive_events').insert(events)
        }

        const foundItems = results.filter((result: any) => result.found)
        for (const result of foundItems) {
          const { data: existing } = await supabaseServer
            .from('olive_preferences')
            .select('times_used')
            .eq('user_id', userId)
            .eq('term', result.term)
            .maybeSingle()

          if (existing) {
            await supabaseServer
              .from('olive_preferences')
              .update({
                preferred_upc: result.upc || null,
                last_used_at: now,
                times_used: (existing.times_used || 0) + 1,
              })
              .eq('user_id', userId)
              .eq('term', result.term)
          } else {
            await supabaseServer.from('olive_preferences').insert({
              user_id: userId,
              term: result.term,
              preferred_upc: result.upc || null,
              preferred_brand: null,
              preferred_size: null,
              notes: null,
              last_used_at: now,
              times_used: 1,
            })
          }
        }
      } catch (_) {
        // Memory write failed; cart still succeeded — don't fail the request
      }
    }

    return NextResponse.json({
      success: addData.success || addRes.ok,
      results,
      totalSavings: Number(totalSavings.toFixed(2)),
      cartUrl: `https://${CART_DOMAIN}/shopping/cart`,
      shopping_mode_used: mode,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Add to cart failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
