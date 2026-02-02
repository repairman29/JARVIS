'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  BentoTile,
  CommandInput,
  ConfidenceBadge,
  HaulItemCard,
  ModeToggle,
  QuantityToggle,
  NarrativeProgress,
  PredictiveChip,
  RecipeBottomSheet,
  SageAdviceButton,
  SuccessInterstitial,
  ThemeToggle,
} from '@/components/ui'

interface KrogerStatus {
  connected: boolean
  authUrl?: string
}

interface CartItem {
  term: string
  found: boolean
  description?: string
  price?: number
}

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [krogerStatus, setKrogerStatus] = useState<KrogerStatus | null>(null)
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartResult, setCartResult] = useState<any>(null)
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null)
  const [addToCartStep, setAddToCartStep] = useState(0)
  const [showCartInterstitial, setShowCartInterstitial] = useState(false)
  const [cartUrlToOpen, setCartUrlToOpen] = useState<string | null>(null)
  const [feedbackPromptVisible, setFeedbackPromptVisible] = useState(false)
  const [feedbackResponse, setFeedbackResponse] = useState<'nailed' | 'not_quite' | null>(null)
  const [feedbackItemCount, setFeedbackItemCount] = useState<number | null>(null)
  const [oliveMessage, setOliveMessage] = useState("What's missing from the kitchen?")
  const [statusLoading, setStatusLoading] = useState(true)
  const [usuals, setUsuals] = useState<string[]>([])
  const [usualsLoading, setUsualsLoading] = useState(false)
  const [shoppingMode, setShoppingMode] = useState<'budget' | 'splurge'>('splurge')
  const [quantityStrategy, setQuantityStrategy] = useState<'exact' | 'overshoot'>('exact')
  const [modeLoading, setModeLoading] = useState(false)
  const [storeLocationId, setStoreLocationId] = useState<string | null>(null)
  const [storeLocationName, setStoreLocationName] = useState<string | null>(null)
  const [storeLoading, setStoreLoading] = useState(false)
  const [storePickerOpen, setStorePickerOpen] = useState(false)
  const [storeZip, setStoreZip] = useState('80904')
  const [storeLocations, setStoreLocations] = useState<Array<{ locationId: string; name?: string; address?: { addressLine1?: string; city?: string; state?: string; zipCode?: string } }>>([])
  const [storeLocationsLoading, setStoreLocationsLoading] = useState(false)
  const [storeLocationError, setStoreLocationError] = useState<string | null>(null)
  const [storeSaveError, setStoreSaveError] = useState<string | null>(null)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [recipeList, setRecipeList] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [recipeListLoading, setRecipeListLoading] = useState(false)
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('')
  const [recipeSearchResults, setRecipeSearchResults] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [recipeSearchLoading, setRecipeSearchLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<{ name: string; slug: string; variants: Array<{ key: string; label: string; options: Array<{ value: string; label: string }> }> } | null>(null)
  const [recipeServings, setRecipeServings] = useState(4)
  const [recipeChoices, setRecipeChoices] = useState<Record<string, string>>({})
  const [recipeIngredientsLoading, setRecipeIngredientsLoading] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [blacklist, setBlacklist] = useState<string[]>([])
  const [newBlacklistItem, setNewBlacklistItem] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [blobModalOpen, setBlobModalOpen] = useState(false)
  const [blobText, setBlobText] = useState('')
  const [blobItems, setBlobItems] = useState<Array<{ name: string; quantity: number; unit: string | null; notes: string | null; checked: boolean; confidence: number }>>([])
  const [blobParsing, setBlobParsing] = useState(false)
  const [blobParseStep, setBlobParseStep] = useState(0)
  const [pasteUrl, setPasteUrl] = useState('')
  const [pasteLoading, setPasteLoading] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [extractedRecipe, setExtractedRecipe] = useState<{ name: string; servings: number; ingredients: Array<{ name: string; amount: number; unit: string }> } | null>(null)
  const [firstRunStep, setFirstRunStep] = useState(0)
  const [firstRunDone, setFirstRunDone] = useState(false)
  const recipeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedItems = localStorage.getItem('olive_haul_items')
    if (storedItems && items.length === 0) {
      try {
        const parsed = JSON.parse(storedItems)
        if (Array.isArray(parsed)) setItems(parsed)
      } catch {
        // ignore
      }
    }
    const storedZen = localStorage.getItem('olive_zen_mode')
    if (storedZen) setZenMode(storedZen === 'true')
    const storedBlacklist = localStorage.getItem('olive_blacklist_items')
    if (storedBlacklist) {
      try {
        const parsed = JSON.parse(storedBlacklist)
        if (Array.isArray(parsed)) setBlacklist(parsed)
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('olive_haul_items', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (selectedItems.size > 0) {
      setSelectedItems(new Set())
    }
  }, [items])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('olive_zen_mode', zenMode ? 'true' : 'false')
  }, [zenMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('olive_blacklist_items', JSON.stringify(blacklist))
  }, [blacklist])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const openedAt = localStorage.getItem('olive_cart_opened_at')
    const feedbackDone = localStorage.getItem('olive_feedback_response')
    const count = localStorage.getItem('olive_cart_item_count')
    if (count && !Number.isNaN(Number(count))) {
      setFeedbackItemCount(Number(count))
    }
    if (!openedAt || feedbackDone) {
      setFeedbackPromptVisible(false)
      return
    }
    const lastHaulSavings = localStorage.getItem('olive_last_haul_savings')
    const isFirstHaul = !localStorage.getItem('olive_first_haul_done')
    
    const elapsed = Date.now() - new Date(openedAt).getTime()
    if (isFirstHaul && elapsed < 30 * 60 * 1000) {
      // If first haul opened in last 30 mins, redirect to celebration
      localStorage.setItem('olive_first_haul_done', 'true')
      router.push('/haul/celebration')
      return
    }

    if (elapsed >= 24 * 60 * 60 * 1000) {
      setFeedbackPromptVisible(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedStep = localStorage.getItem('olive_first_run_step')
    const storedDone = localStorage.getItem('olive_first_run_done')
    if (storedStep && !Number.isNaN(Number(storedStep))) {
      setFirstRunStep(Number(storedStep))
    }
    if (storedDone === 'true') {
      setFirstRunDone(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('olive_first_run_step', String(firstRunStep))
    localStorage.setItem('olive_first_run_done', firstRunDone ? 'true' : 'false')
  }, [firstRunStep, firstRunDone])

  useEffect(() => {
    if (firstRunDone) return
    if (items.length > 0 && firstRunStep === 0) {
      setFirstRunStep(1)
      return
    }
    if (firstRunStep === 1) {
      const timer = setTimeout(() => setFirstRunStep(2), 1500)
      return () => clearTimeout(timer)
    }
    if (firstRunStep === 2 && krogerStatus?.connected) {
      setFirstRunStep(3)
      return
    }
    if (firstRunStep === 3 && cartResult?.success) {
      setFirstRunDone(true)
      setFirstRunStep(4)
    }
  }, [items.length, firstRunStep, firstRunDone, krogerStatus?.connected, cartResult?.success])

  useEffect(() => {
    if (!addingToCart) {
      setAddToCartMessage(null)
      setAddToCartStep(0)
      return
    }
    const storeLabel = storeLocationName ? ` at ${storeLocationName}` : ''
    const steps = [
      'Searching for the best price on your items…',
      'Found some matches. Clipping coupons where we can…',
      `Tucking items into your cart${storeLabel}…`,
    ]
    setAddToCartMessage(steps[0])
    setAddToCartStep(0)
    const interval = setInterval(() => {
      setAddToCartStep((prev) => {
        const next = Math.min(prev + 1, steps.length - 1)
        setAddToCartMessage(steps[next])
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [addingToCart, storeLocationName])
  useEffect(() => {
    if (searchParams.get('connectKroger') === '1' && !krogerStatus?.connected) {
      setOliveMessage("Connect your Kroger account to start adding items to your cart.")
    }
    const action = searchParams.get('action')
    if (action === 'paste') {
      setBlobModalOpen(true)
    } else if (action === 'staples') {
      const staples = ['milk', 'eggs', 'bread']
      setItems((prev) => {
        let next = [...prev]
        staples.forEach(s => {
          next = mergeListItem(next, { term: s, quantity: 1, unit: null })
        })
        return next
      })
      setOliveMessage("Added the basics! What else?")
    }
  }, [searchParams, krogerStatus?.connected])

  const checkUser = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    checkKrogerConnection(user.id)
    fetchUsuals(user.id)
    fetchSettings(user.id)
    setLoading(false)
  }

  const checkKrogerConnection = async (userId: string) => {
    try {
      setStatusLoading(true)
      const res = await fetch(`/api/kroger/status?userId=${userId}`)
      const data = await res.json()
      setKrogerStatus(data)
      if (!data.connected) {
        setOliveMessage("Let's connect your Kroger account first — just takes a moment.")
      }
    } catch (e) {
      console.error('Failed to check Kroger status:', e)
    } finally {
      setStatusLoading(false)
    }
  }

  const fetchUsuals = async (userId: string) => {
    try {
      setUsualsLoading(true)
      const res = await fetch(`/api/memory/usuals?userId=${userId}`)
      const data = await res.json()
      if (Array.isArray(data.usuals)) {
        setUsuals(data.usuals.map((u: any) => u.term))
      }
    } catch (e) {
      console.error('Failed to fetch usuals:', e)
    } finally {
      setUsualsLoading(false)
    }
  }

  const fetchSettings = async (userId: string) => {
    try {
      const res = await fetch(`/api/memory/settings?userId=${userId}`)
      const data = await res.json()
      if (data.shopping_mode === 'budget' || data.shopping_mode === 'splurge') {
        setShoppingMode(data.shopping_mode)
      }
      if (data.quantity_strategy === 'exact' || data.quantity_strategy === 'overshoot') {
        setQuantityStrategy(data.quantity_strategy)
      }
      if (data.kroger_location_id) setStoreLocationId(data.kroger_location_id)
      if (data.kroger_location_name) {
        setStoreLocationName(data.kroger_location_name)
        const zipMatch = String(data.kroger_location_name).match(/\b\d{5}(?:-\d{4})?\b/)
        if (zipMatch?.[0]) setStoreZip(zipMatch[0].slice(0, 5))
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e)
    }
  }

  const setMode = async (mode: 'budget' | 'splurge') => {
    if (!user) return
    setModeLoading(true)
    try {
      const res = await fetch('/api/memory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, shopping_mode: mode, quantity_strategy: quantityStrategy }),
      })
      const data = await res.json()
      if (data.shopping_mode) setShoppingMode(data.shopping_mode)
    } catch (e) {
      console.error('Failed to update mode:', e)
    } finally {
      setModeLoading(false)
    }
  }

  const updateQuantityStrategy = async (strategy: 'exact' | 'overshoot') => {
    if (!user) return
    setModeLoading(true)
    try {
      const res = await fetch('/api/memory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, shopping_mode: shoppingMode, quantity_strategy: strategy }),
      })
      const data = await res.json()
      if (data.quantity_strategy) setQuantityStrategy(data.quantity_strategy)
    } catch (e) {
      console.error('Failed to update quantity strategy:', e)
    } finally {
      setModeLoading(false)
    }
  }

  const fetchStoreLocations = async () => {
    setStoreLocationError(null)
    setStoreLocationsLoading(true)
    try {
      const res = await fetch(`/api/kroger/locations?zip=${encodeURIComponent(storeZip)}&chain=King Soopers`)
      const data = await res.json()
      if (!res.ok) {
        setStoreLocationError((data as { error?: string }).error || 'Location search failed. Check Kroger credentials or try another ZIP.')
        setStoreLocations([])
        return
      }
      if (Array.isArray(data.locations)) setStoreLocations(data.locations)
      else setStoreLocations([])
      if (!data.locations?.length) setStoreLocationError('No stores found for that ZIP. Try a different ZIP or chain.')
    } catch (e) {
      console.error('Failed to fetch locations:', e)
      setStoreLocationError('Network error. Try again.')
      setStoreLocations([])
    } finally {
      setStoreLocationsLoading(false)
    }
  }

  const openRecipeModal = async () => {
    setRecipeModalOpen(true)
    setSelectedRecipe(null)
    setExtractedRecipe(null)
    setPasteUrl('')
    setPasteError(null)
    setRecipeSearchQuery('')
    setRecipeSearchResults([])
    setRecipeServings(4)
    setRecipeChoices({})
    setRecipeListLoading(true)
    try {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      setRecipeList(Array.isArray(data.recipes) ? data.recipes : [])
    } catch (e) {
      console.error('Failed to fetch recipes:', e)
      setRecipeList([])
    } finally {
      setRecipeListLoading(false)
    }
  }

  const openBlobModal = () => {
    setBlobModalOpen(true)
    setBlobText('')
    setBlobItems([])
    setBlobParsing(false)
    setBlobParseStep(0)
  }

  const parseNumber = (value: string): number | null => {
    const cleaned = value.toLowerCase().trim()
    if (!cleaned) return null
    const wordMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      dozen: 12,
    }
    if (wordMap[cleaned] != null) return wordMap[cleaned]
    if (/^\d+\/\d+$/.test(cleaned)) {
      const [num, den] = cleaned.split('/').map(Number)
      if (den) return num / den
    }
    if (/^\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned)
    if (/^\d+\s*x$/.test(cleaned)) return Number(cleaned.replace(/\D/g, ''))
    if (/^x\s*\d+$/.test(cleaned)) return Number(cleaned.replace(/\D/g, ''))
    return null
  }

  const unitMap: Record<string, string> = {
    lb: 'lb',
    lbs: 'lb',
    pound: 'lb',
    pounds: 'lb',
    oz: 'oz',
    ounce: 'oz',
    ounces: 'oz',
    cup: 'cup',
    cups: 'cup',
    tbsp: 'tbsp',
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    tsp: 'tsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    clove: 'clove',
    cloves: 'clove',
    bunch: 'bunch',
    bunches: 'bunch',
    can: 'can',
    cans: 'can',
    bag: 'bag',
    bags: 'bag',
    pack: 'pack',
    packs: 'pack',
  }
  const countUnits = new Set(['clove', 'bunch', 'can', 'bag', 'pack'])
  const sizeUnits = new Set(['lb', 'oz', 'cup', 'tbsp', 'tsp'])

  const normalizeTerm = (value: string) => {
    let cleaned = value.toLowerCase()
    cleaned = cleaned.replace(/\([^)]*\)/g, ' ')
    cleaned = cleaned.replace(/\b\d+(\.\d+)?\s*(oz|lb|lbs|cup|cups|tbsp|tsp|teaspoon|tablespoon|ounce|ounces|pound|pounds)\b/g, ' ')
    cleaned = cleaned.replace(/\b\d+\s*(x|×)\b/g, ' ')
    cleaned = cleaned.replace(/\b(x|×)\s*\d+\b/g, ' ')
    cleaned = cleaned.replace(/\b\d+\s+(can|cans|bag|bags|pack|packs|bunch|bunches|clove|cloves)\b/g, ' ')
    cleaned = cleaned.replace(/^[x×]\s+/i, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return cleaned
  }

  const parseListItemDisplay = (value: string) => {
    let term = value.trim()
    let quantity = 1
    let unit: string | null = null
    let notes: string | null = null

    const parenMatch = term.match(/^(.*)\(([^)]+)\)\s*$/)
    if (parenMatch) {
      term = parenMatch[1].trim()
      const inside = parenMatch[2].trim()
      const parts = inside.split(/\s+/)
      const qty = parseNumber(parts[0] || '')
      const maybeUnit = parts[1]?.toLowerCase() || ''
      if (qty != null) {
        quantity = qty
        if (unitMap[maybeUnit]) unit = unitMap[maybeUnit]
        else notes = inside
      } else {
        notes = inside
      }
    }

    const xMatch = term.match(/^(.*?)(?:\s*[x×]\s*(\d+(?:\.\d+)?))$/i)
    if (xMatch) {
      term = xMatch[1].trim()
      quantity = Number(xMatch[2])
    }

    return {
      term: term.trim(),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit,
      notes,
    }
  }

  const formatListItem = (item: { term: string; quantity: number; unit: string | null; notes?: string | null }) => {
    const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1
    const base = item.term.trim()
    if (item.unit) {
      const suffix = `${qty} ${item.unit}${item.notes ? `, ${item.notes}` : ''}`
      return `${base} (${suffix})`
    }
    if (qty > 1) {
      return `${base} ×${qty}${item.notes ? ` (${item.notes})` : ''}`
    }
    return item.notes ? `${base} (${item.notes})` : base
  }

  const mergeListItem = (prev: string[], nextItem: { term: string; quantity: number; unit: string | null; notes?: string | null }) => {
    const next = [...prev]
    const normalized = normalizeTerm(nextItem.term)
    const unitKey = nextItem.unit ?? ''
    const index = next.findIndex((entry) => {
      const parsed = parseListItemDisplay(entry)
      return normalizeTerm(parsed.term) === normalized && (parsed.unit ?? '') === unitKey
    })
    if (index >= 0) {
      const parsed = parseListItemDisplay(next[index])
      const merged = {
        term: nextItem.term,
        quantity: (parsed.quantity || 1) + (nextItem.quantity || 1),
        unit: nextItem.unit,
        notes: parsed.notes ?? nextItem.notes ?? null,
      }
      next[index] = formatListItem(merged)
      return next
    }
    next.push(formatListItem(nextItem))
    return next
  }

  const parseLineToItem = (line: string) => {
    let cleaned = line.replace(/^[-*•\d.]+\s*/, '').trim()
    if (!cleaned) return null

    const notesMatch = cleaned.match(/\(([^)]+)\)/)
    const notes = notesMatch ? notesMatch[1].trim() : null
    if (notesMatch) cleaned = cleaned.replace(notesMatch[0], '').trim()

    const tokens = cleaned.split(/\s+/)
    let quantity = 1
    let unit: string | null = null
    let startIndex = 0

    const firstQty = parseNumber(tokens[0] || '')
    if (firstQty != null) {
      quantity = firstQty
      startIndex = 1
      const maybeUnit = tokens[1]?.toLowerCase() || ''
      if (unitMap[maybeUnit]) {
        unit = unitMap[maybeUnit]
        startIndex = 2
      }
    }

    let name = tokens.slice(startIndex).join(' ').replace(/^of\s+/i, '').trim()
    name = name.replace(/^[x×]\s*/i, '').trim()
    name = name.replace(/!+/g, '').trim()
    if (!name) return null

    return {
      term: name,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit,
      notes,
    }
  }

  const parseBlobText = (text: string) => {
    const fluff = [/dont forget/i, /please/i, /remember/i, /also/i, /asap/i]
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const items = lines.flatMap((line) => {
      if (fluff.some((r) => r.test(line)) && line.split(' ').length < 4) return []
      const parsed = parseLineToItem(line)
      if (!parsed) return []
      const confidence = parsed.unit || parsed.quantity > 1 ? 0.85 : 0.6
      return [{
        name: parsed.term,
        quantity: parsed.quantity,
        unit: parsed.unit,
        notes: parsed.notes,
        checked: true,
        confidence,
      }]
    })
    return items
  }

  const itemDisplayCount = (value: string) => {
    const parsed = parseListItemDisplay(value)
    if (parsed.unit && sizeUnits.has(parsed.unit)) return 1
    if (!parsed.unit && parsed.quantity > 1) return Math.round(parsed.quantity)
    if (parsed.unit && countUnits.has(parsed.unit)) return Math.round(parsed.quantity)
    return 1
  }

  const runBlobParse = async () => {
    if (!blobText.trim()) return
    setBlobParsing(true)
    setBlobParseStep(0)
    const steps = ['Reading your list…', 'Identifying items…', 'Removing extra fluff…']
    setOliveMessage(steps[0])
    const timer = setInterval(() => {
      setBlobParseStep((prev) => Math.min(prev + 1, steps.length - 1))
    }, 800)
    try {
      const parsed = parseBlobText(blobText)
      setBlobItems(parsed)
    } finally {
      clearInterval(timer)
      setBlobParsing(false)
      setOliveMessage("What else is missing from the kitchen?")
    }
  }

  const applyBlobItems = () => {
    let addedCount = 0
    setItems((prev) => {
      let next = [...prev]
      blobItems.filter((item) => item.checked).forEach((item) => {
        if (isBlacklisted(item.name)) return
        const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1
        next = mergeListItem(next, {
          term: item.name,
          quantity: qty,
          unit: item.unit,
          notes: item.notes,
        })
        addedCount += itemDisplayCount(formatListItem({
          term: item.name,
          quantity: qty,
          unit: item.unit,
          notes: item.notes,
        }))
      })
      return next
    })
    if (addedCount > 0) {
      setOliveMessage(`Added ${addedCount} item${addedCount > 1 ? 's' : ''}. What else?`)
    }
    setBlobModalOpen(false)
    setBlobText('')
    setBlobItems([])
  }

  const onRecipeSearchChange = (value: string) => {
    setRecipeSearchQuery(value)
    if (recipeSearchTimeoutRef.current) clearTimeout(recipeSearchTimeoutRef.current)
    if (!value.trim()) {
      setRecipeSearchResults([])
      return
    }
    recipeSearchTimeoutRef.current = setTimeout(async () => {
      setRecipeSearchLoading(true)
      try {
        const res = await fetch(`/api/recipes?source=spoonacular&q=${encodeURIComponent(value.trim())}`)
        const data = await res.json()
        setRecipeSearchResults(Array.isArray(data.recipes) ? data.recipes : [])
      } catch {
        setRecipeSearchResults([])
      } finally {
        setRecipeSearchLoading(false)
      }
    }, 350)
  }

  const selectRecipe = async (slug: string) => {
    try {
      const res = await fetch(`/api/recipes/${slug}`)
      const data = await res.json()
      if (data.error) return
      setSelectedRecipe({ name: data.name, slug: data.slug, variants: data.variants ?? [] })
      if (Number(data.servings)) {
        setRecipeServings(Math.max(1, Math.min(50, Number(data.servings) || 4)))
      } else {
        setRecipeServings(4)
      }
      const choices: Record<string, string> = {}
      for (const v of data.variants ?? []) {
        if (v.options?.length) choices[v.key] = v.options[0].value
      }
      setRecipeChoices(choices)
    } catch (e) {
      console.error('Failed to fetch recipe:', e)
    }
  }

  const addRecipeIngredients = async () => {
    if (!selectedRecipe) return
    setRecipeIngredientsLoading(true)
    try {
      const res = await fetch(`/api/recipes/${selectedRecipe.slug}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servings: recipeServings, choices: recipeChoices }),
      })
      const data = await res.json()
      if (!Array.isArray(data.items)) return
      setItems((prev) => {
        let next = [...prev]
        for (const it of data.items) {
          const term = String(it.term || '').trim()
          if (!term || isBlacklisted(term)) continue
          const qty = Number(it.quantity) || 1
          next = mergeListItem(next, { term, quantity: qty, unit: null })
        }
        return next
      })
      setOliveMessage(`Added ingredients for ${selectedRecipe.name} for ${recipeServings}. What else?`)
      setRecipeModalOpen(false)
      setSelectedRecipe(null)
    } catch (e) {
      console.error('Failed to add recipe ingredients:', e)
    } finally {
      setRecipeIngredientsLoading(false)
    }
  }

  const extractRecipeFromUrl = async (urlOverride?: string) => {
    const url = (urlOverride ?? pasteUrl).trim()
    if (!url) return
    setPasteError(null)
    setPasteLoading(true)
    try {
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPasteError((data as { error?: string }).error || 'Could not extract recipe from that URL.')
        return
      }
      setExtractedRecipe({
        name: data.name || 'Untitled recipe',
        servings: Math.max(1, Number(data.servings) || 4),
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      })
      setRecipeServings(Math.max(1, Number(data.servings) || 4))
    } catch (e) {
      console.error('Failed to extract recipe:', e)
      setPasteError('Network error. Try again.')
    } finally {
      setPasteLoading(false)
    }
  }

  const openRecipeFromUrl = async (url: string) => {
    setRecipeModalOpen(true)
    setSelectedRecipe(null)
    setExtractedRecipe(null)
    setPasteUrl(url)
    setPasteError(null)
    setRecipeSearchQuery('')
    setRecipeSearchResults([])
    setRecipeServings(4)
    setRecipeChoices({})
    await extractRecipeFromUrl(url)
  }

  const addExtractedRecipeIngredients = () => {
    if (!extractedRecipe) return
    const desiredServings = Math.max(1, Math.min(50, recipeServings))
    const multiplier = desiredServings / Math.max(1, extractedRecipe.servings)
    setItems((prev) => {
      let next = [...prev]
      for (const ing of extractedRecipe.ingredients) {
        const term = String(ing.name || 'ingredient').trim()
        if (!term || isBlacklisted(term)) continue
        const qty = Math.max(0.25, Math.round((Number(ing.amount) || 0) * multiplier * 4) / 4)
        const unit = ing.unit ? unitMap[String(ing.unit).toLowerCase()] || String(ing.unit).toLowerCase() : null
        next = mergeListItem(next, { term, quantity: qty || 1, unit })
      }
      return next
    })
    setOliveMessage(`Added ingredients for ${extractedRecipe.name} for ${desiredServings}. What else?`)
    setRecipeModalOpen(false)
    setExtractedRecipe(null)
  }

  const setStore = async (locationId: string, displayName: string) => {
    if (!user) return
    setStoreSaveError(null)
    setStoreLoading(true)
    try {
      const res = await fetch('/api/memory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          shopping_mode: shoppingMode,
          kroger_location_id: locationId,
          kroger_location_name: displayName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStoreSaveError((data as { error?: string }).error || 'Could not save store. Run store-preference.sql in Supabase if you haven’t.')
        return
      }
      if (data.kroger_location_id) setStoreLocationId(data.kroger_location_id)
      if (data.kroger_location_name) setStoreLocationName(data.kroger_location_name)
      setStorePickerOpen(false)
    } catch (e) {
      console.error('Failed to save store:', e)
      setStoreSaveError('Network error. Try again.')
    } finally {
      setStoreLoading(false)
    }
  }

  const connectKroger = async () => {
    if (!user) return
    const storeParam = storeLocationName ? `&store=${encodeURIComponent(storeLocationName)}` : ''
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/connect/success?userId=${encodeURIComponent(user.id)}${storeParam}` : ''
    const res = await fetch(`/api/kroger/auth-url?userId=${encodeURIComponent(user.id)}&returnUrl=${encodeURIComponent(returnUrl)}`)
    const data = await res.json()
    if (data.url) {
      // Open in new tab so dashboard stays open; callback page has "Return to Olive" link
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  const isBlacklisted = (term: string) => {
    const normalized = normalizeTerm(term)
    return blacklist.some((item) => normalizeTerm(item) === normalized)
  }

  const addBlacklistItem = () => {
    const value = newBlacklistItem.trim()
    if (!value) return
    if (!blacklist.includes(value)) {
      setBlacklist((prev) => [...prev, value])
    }
    setNewBlacklistItem('')
  }

  const removeBlacklistItem = (value: string) => {
    setBlacklist((prev) => prev.filter((item) => item !== value))
  }

  const toggleItemSelection = (index: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const removeSelectedItems = () => {
    if (selectedItems.size === 0) return
    setItems(items.filter((_, idx) => !selectedItems.has(idx)))
    setSelectedItems(new Set())
  }

  const addItem = () => {
    const trimmed = newItem.trim()
    if (trimmed) {
      const isUrl = /^https?:\/\//i.test(trimmed)
      if (isUrl) {
        setNewItem('')
        setOliveMessage("Got it — let me pull that recipe.")
        void openRecipeFromUrl(trimmed)
        return
      }
      const parsed = parseLineToItem(trimmed)
      if (parsed && !isBlacklisted(parsed.term)) {
        setItems((prev) => mergeListItem(prev, parsed))
      }
      setNewItem('')
      setOliveMessage(`Got it — ${trimmed}. What else?`)
    }
  }

  const addQuickItem = (term: string, message?: string) => {
    if (!term.trim() || isBlacklisted(term)) return
    setItems((prev) => mergeListItem(prev, { term, quantity: 1, unit: null }))
    setOliveMessage(message || `Added ${term}. Anything else?`)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    if (items.length === 1) {
      setOliveMessage("List is empty. What do we need?")
    }
  }

  const addToKrogerCart = async () => {
    if (!user || items.length === 0) return
    setAddingToCart(true)
    setCartResult(null)
    setOliveMessage("Finding your items and adding them to the cart...")

    try {
      const cartItems = items.reduce<Array<{ term: string; quantity: number }>>((acc, item) => {
        const parsed = parseListItemDisplay(item)
        const termBase = parsed.term
        const quantity = Number.isFinite(parsed.quantity) && parsed.quantity > 0 ? parsed.quantity : 1
        const unit = parsed.unit
        let searchTerm = termBase
        let cartQty = 1
        if (unit) {
          if (countUnits.has(unit)) {
            cartQty = Math.max(1, Math.round(quantity))
            searchTerm = `${termBase} ${unit}`
          } else if (sizeUnits.has(unit)) {
            searchTerm = `${termBase} ${quantity} ${unit}`
          } else {
            searchTerm = `${termBase} ${quantity} ${unit}`
          }
        } else if (quantity > 1) {
          cartQty = Math.max(1, Math.round(quantity))
        }
        const key = normalizeTerm(searchTerm)
        const existing = acc.find((entry) => normalizeTerm(entry.term) === key)
        if (existing) {
          existing.quantity += cartQty
        } else {
          acc.push({ term: searchTerm, quantity: cartQty })
        }
        return acc
      }, [])

      const res = await fetch('/api/kroger/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, items: cartItems, shopping_mode: shoppingMode, quantity_strategy: quantityStrategy }),
      })
      const raw = await res.text()
      let data: { success?: boolean; error?: string; needsAuth?: boolean; results?: unknown[]; [k: string]: unknown } = { success: false, error: 'Something went wrong.' }
      try {
        data = raw ? JSON.parse(raw) : data
      } catch {
        data = { success: false, error: res.status === 503 ? 'Kroger is temporarily unavailable. Please try again in a moment.' : `Request failed (${res.status}).` }
      }
      setCartResult(data)
      if (data.success) {
        const failed = Array.isArray(data.results) ? data.results.filter((r: any) => r.found && r.addedToCart === false).length : 0
        const added = Array.isArray(data.results) ? data.results.filter((r: any) => r.addedToCart === true).length : 0
        if (data.totalSavings && Number(data.totalSavings) > 0) {
          setOliveMessage(failed > 0 ? `Added ${added} item(s). I saved you $${data.totalSavings} today. ${failed} couldn't be added (e.g. out of stock). 🫒` : `All done! I saved you $${data.totalSavings} today. Your cart is ready. 🫒`)
          localStorage.setItem('olive_last_haul_savings', String(data.totalSavings))
        } else {
          setOliveMessage(failed > 0 ? `Added ${added} item(s). ${failed} couldn't be added (e.g. out of stock). Check your cart. 🫒` : "All done! Your cart is ready for checkout. 🫒")
          if (data.totalSavings) localStorage.setItem('olive_last_haul_savings', String(data.totalSavings))
          else localStorage.removeItem('olive_last_haul_savings')
        }
        fetchUsuals(user.id)
        setFeedbackPromptVisible(false)
      } else if (data.needsAuth) {
        setOliveMessage('Please connect your Kroger account to continue.')
      } else {
        setOliveMessage(typeof data.error === 'string' ? data.error : "Something went wrong. Let's try again.")
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Request failed.'
      setCartResult({ success: false, error: msg })
      setOliveMessage("I couldn't reach Kroger. Let's try again in a moment.")
    } finally {
      setAddingToCart(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const openCartInterstitial = (url: string) => {
    setCartUrlToOpen(url)
    setShowCartInterstitial(true)
  }

  const confirmOpenCart = () => {
    if (!cartUrlToOpen) return
    window.open(cartUrlToOpen, '_blank', 'noopener,noreferrer')
    try {
      localStorage.setItem('olive_cart_opened_at', new Date().toISOString())
      localStorage.removeItem('olive_feedback_response')
      if (Array.isArray(cartResult?.results)) {
        localStorage.setItem('olive_cart_item_count', String(cartResult.results.length))
      }
    } catch {
      // no-op
    }
    setItems([])
    setShowCartInterstitial(false)
  }

  const respondToFeedback = (response: 'nailed' | 'not_quite') => {
    setFeedbackResponse(response)
    try {
      localStorage.setItem('olive_feedback_response', response)
    } catch {
      // no-op
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-12 h-12 bg-[var(--sage)] rounded-full flex items-center justify-center olive-pulse">
          <span className="text-white text-xl">🫒</span>
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)] shadow-sm text-center">
          <div className="w-14 h-14 bg-[var(--sage)] rounded-full flex items-center justify-center mx-auto mb-4 olive-pulse">
            <span className="text-white text-2xl">🫒</span>
          </div>
          <h2 className="text-xl font-medium text-[var(--cast-iron)] mb-2">Olive isn&apos;t configured yet</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-5">
            Add Supabase keys to finish setup, then refresh this page.
          </p>
          <div className="bg-[var(--input)] rounded-2xl p-4 text-left text-xs text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--cast-iron)] mb-2">Required env vars</p>
            <p>NEXT_PUBLIC_SUPABASE_URL</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-[var(--muted)] hover:text-[var(--sage-advice)] text-sm"
          >
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  const cartStatusByTerm = Array.isArray(cartResult?.results)
    ? cartResult.results.reduce((acc: Record<string, 'found' | 'not_found' | 'cart_failed'>, result: any) => {
      const key = normalizeTerm(result.term || '')
      if (!key) return acc
      if (!result.found) acc[key] = 'not_found'
      else if (result.addedToCart === false) acc[key] = 'cart_failed'
      else acc[key] = 'found'
      return acc
    }, {})
    : {}

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card)]/80 backdrop-blur-sm border-b border-[var(--border)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--sage)] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🫒</span>
            </div>
            <span className="text-lg font-medium text-[var(--sage-advice)]">Olive</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/help" className="text-[var(--muted)] hover:text-[var(--sage-advice)] text-sm flex items-center gap-1">
              <span className="w-5 h-5 rounded-full border border-[var(--muted)] flex items-center justify-center text-[10px] font-bold">?</span>
              Help
            </Link>
            <button
              onClick={signOut}
              className="text-[var(--muted)] hover:text-[var(--sage-advice)] text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Olive Pulse - The Conversation Center */}
        <div className="text-center mb-8 fade-in">
          <div className="w-16 h-16 bg-[var(--sage)] rounded-full flex items-center justify-center mx-auto mb-4 olive-pulse">
            <span className="text-white text-2xl">🫒</span>
          </div>
          <p className="text-[var(--cast-iron)] text-lg">{oliveMessage}</p>
        </div>

        {!firstRunDone && (
          <BentoTile className="mb-6">
            {firstRunStep === 0 && (
              <>
                <h3 className="text-[var(--cast-iron)] font-medium mb-2">Hi, I&apos;m Olive</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  I&apos;ll handle your Kroger cart. What&apos;s one thing you need from the store?
                </p>
                <div className="flex flex-wrap gap-2">
                  <SageAdviceButton onClick={() => addQuickItem('Bananas', 'Got it — bananas. What else?')} className="px-4 py-2 text-sm">
                    Add bananas
                  </SageAdviceButton>
                  <PredictiveChip onClick={() => addQuickItem('Milk')}>+ Add milk?</PredictiveChip>
                </div>
              </>
            )}

            {firstRunStep === 1 && (
              <>
                <h3 className="text-[var(--cast-iron)] font-medium mb-2">Found your first item</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">Olive is checking the aisles for your usuals.</p>
                <PredictiveChip onClick={() => addQuickItem('Milk')}>Usually people need milk with that. Add?</PredictiveChip>
              </>
            )}

            {firstRunStep === 2 && !krogerStatus?.connected && (
              <>
                <h3 className="text-[var(--cast-iron)] font-medium mb-2">Let&apos;s link your Kroger account</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  I&apos;ve got your list ready. Connect Kroger so I can tuck items into your cart.
                </p>
                <SageAdviceButton onClick={connectKroger} className="px-4 py-2 text-sm">
                  Connect to Kroger
                </SageAdviceButton>
              </>
            )}

            {firstRunStep >= 3 && (
              <>
                <h3 className="text-[var(--cast-iron)] font-medium mb-2">Ready to finish the loop</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  Tap below and I&apos;ll fill your Kroger cart. You&apos;ll review it there.
                </p>
                <SageAdviceButton onClick={addToKrogerCart} className="px-4 py-2 text-sm">
                  Add to Kroger Cart
                </SageAdviceButton>
              </>
            )}
          </BentoTile>
        )}

        {feedbackPromptVisible && (
          <div className="bg-[#fffdd0] border border-[#efe9bf] rounded-3xl p-4 mb-6 shadow-sm">
            <p className="text-[var(--cast-iron)] text-sm font-medium mb-2">
              Olive: “I tucked {feedbackItemCount ? `${feedbackItemCount} items` : 'your items'} into your cart yesterday. Did I find the right brands for you?”
            </p>
            {feedbackResponse ? (
              <p className={`text-sm ${feedbackResponse === 'nailed' ? 'text-[var(--olive-600)]' : 'text-[var(--muted-foreground)]'}`}>
                {feedbackResponse === 'nailed'
                  ? "Perfect. I've noted those as your favorites. We're getting good at this!"
                  : "Thanks for telling me. Which one should I have picked instead? I'll remember for next time."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => respondToFeedback('nailed')}
                  className="bg-[var(--basil)] text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                  Nailed it
                </button>
                <button
                  type="button"
                  onClick={() => respondToFeedback('not_quite')}
                  className="bg-[var(--input)] text-[var(--cast-iron)] px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)]"
                >
                  Not quite
                </button>
              </div>
            )}
          </div>
        )}

        {/* Budget vs Splurge */}
        <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm mb-6">
          <h3 className="text-[var(--cast-iron)] font-medium mb-3 text-sm">How should Olive pick items?</h3>
          <ModeToggle value={shoppingMode} onChange={setMode} disabled={modeLoading} />
          <p className="text-[var(--muted)] text-xs mt-3">
            Olive picks sale items first, then best price per unit. Kroger&apos;s API doesn&apos;t expose digital coupon data, so we can&apos;t show coupon-adjusted cost — clip coupons on King Soopers / Kroger before checkout for extra savings.
          </p>
        </div>

        {/* Quantity Strategy */}
        <div data-testid="quantity-strategy-card" className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm mb-6">
          <h3 className="text-[var(--cast-iron)] font-medium mb-3 text-sm">How much should Olive buy?</h3>
          <QuantityToggle value={quantityStrategy} onChange={updateQuantityStrategy} disabled={modeLoading} />
          <p className="text-[var(--muted)] text-xs mt-3">
            &ldquo;Exact&rdquo; tries to find the closest match. &ldquo;Grandma mode&rdquo; always overshoots to ensure you don&apos;t run out (e.g. buying the bigger jar if it&apos;s a better value).
          </p>
        </div>

        {/* Your store */}
        <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm mb-6">
          <h3 className="text-[var(--cast-iron)] font-medium mb-3 text-sm">Your store</h3>
          {storeLocationName ? (
            <p className="text-[var(--muted-foreground)] text-sm mb-3">{storeLocationName}</p>
          ) : (
            <p className="text-[var(--muted)] text-sm mb-3">Set your King Soopers (or Kroger) store so Olive uses the right location.</p>
          )}
          {storeSaveError && (
            <p className="text-red-600 text-sm mb-2">{storeSaveError}</p>
          )}
          {!storePickerOpen ? (
            <button
              type="button"
              onClick={() => {
                const zipMatch = storeLocationName?.match(/\b\d{5}(?:-\d{4})?\b/)
                if (zipMatch?.[0]) setStoreZip(zipMatch[0].slice(0, 5))
                setStorePickerOpen(true)
                setStoreLocations([])
                setStoreLocationError(null)
                setStoreSaveError(null)
              }}
              className="text-[var(--muted)] hover:text-[var(--sage-advice)] text-sm font-medium"
            >
              {storeLocationId ? 'Change store' : 'Set your store'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="ZIP (e.g. 80904)"
                  value={storeZip}
                  onChange={(e) => setStoreZip(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-sm text-[var(--cast-iron)]"
                />
                <button
                  type="button"
                  onClick={fetchStoreLocations}
                  disabled={storeLocationsLoading}
                  className="bg-[var(--sage)] text-white px-4 py-2 rounded-xl hover:bg-[var(--sage-advice)] transition text-sm font-medium disabled:opacity-50 w-full sm:w-auto"
                >
                  {storeLocationsLoading ? '…' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => setStorePickerOpen(false)}
                  className="px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--cast-iron)] text-sm w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
              {storeLocationError && (
                <p className="text-red-600 text-sm">{storeLocationError}</p>
              )}
              {storeLocations.length > 0 && (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {storeLocations.map((loc) => {
                    const addr = loc.address
                    const line = [addr?.addressLine1, addr?.city, addr?.state, addr?.zipCode].filter(Boolean).join(', ')
                    const displayName = loc.name && line ? `${loc.name} — ${line}` : (loc.name || line || loc.locationId)
                    return (
                      <li key={loc.locationId}>
                        <button
                          type="button"
                          onClick={() => setStore(loc.locationId, displayName)}
                          disabled={storeLoading}
                          className="w-full text-left px-3 py-2 rounded-xl bg-[var(--input)] hover:bg-[var(--olive-100)] text-[var(--cast-iron)] text-sm disabled:opacity-50"
                        >
                          {displayName}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Kroger Connection Card */}
        {!krogerStatus?.connected && (
          <div className="bg-[var(--card)] rounded-3xl p-6 border border-[var(--border)] shadow-sm mb-6 fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 bg-[var(--olive-100)] rounded-2xl flex items-center justify-center text-xl">
                🔗
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--cast-iron)] font-medium">Connect Kroger</h3>
                <p className="text-[var(--muted)] text-sm">One-time setup to link your account</p>
              </div>
              <SageAdviceButton onClick={connectKroger} className="px-5 py-2.5 text-sm w-full sm:w-auto">
                Connect
              </SageAdviceButton>
            </div>
            <p className="text-[var(--muted)] text-xs mt-3">
              Olive only builds your cart — you still review and place the order.
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="mb-6">
          <CommandInput
            value={newItem}
            onChange={setNewItem}
            onSubmit={addItem}
            inputTestId="manual-add-input"
            buttonTestId="manual-add-button"
            helperText="Type one item or paste a list."
            placeholder="What's on the menu? Paste a list, a recipe, or just type..."
          />
          {!zenMode && (
            <div className="mt-3 bg-[var(--input)] border border-[#e5ecd7] rounded-2xl p-3">
              <div className="text-xs text-[var(--olive-600)] font-medium mb-2">Quick actions</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={openBlobModal}
                  className="flex-1 text-left px-3 py-2 rounded-xl bg-[var(--card)] border border-[#e1e9d2] text-[#4d5f33] text-sm font-medium hover:bg-[var(--olive-100)]"
                >
                  📋 Smart Paste (paste a whole list)
                </button>
                <button
                  type="button"
                  onClick={openRecipeModal}
                  className="flex-1 text-left px-3 py-2 rounded-xl bg-[var(--card)] border border-[#e1e9d2] text-[#4d5f33] text-sm font-medium hover:bg-[var(--olive-100)]"
                >
                  🍳 Shop for a recipe (e.g. enchiladas for 4)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recipe modal */}
        <RecipeBottomSheet
          open={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
          title="Shop for a recipe"
        >
              <p className="text-[var(--muted-foreground)] text-xs mb-4">Your saved recipes can have options (e.g. chicken vs beef, green vs red sauce). Web search results don’t.</p>
              {extractedRecipe ? (
                <>
                  <p className="text-[var(--muted-foreground)] text-sm mb-4">{extractedRecipe.name}</p>
                  <p className="text-[var(--muted-foreground)] text-xs mb-2">Extracted from your link. Adjust servings and add to list.</p>
                  <div className="space-y-3 mb-4">
                    <label className="block text-[var(--cast-iron)] text-sm font-medium">Servings</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={recipeServings}
                      onChange={(e) => setRecipeServings(Math.max(1, Math.min(50, Number(e.target.value) || 4)))}
                      className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--cast-iron)]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      type="button"
                      onClick={addExtractedRecipeIngredients}
                      className="flex-1 bg-[var(--sage)] text-white py-3 rounded-xl hover:bg-[var(--sage-advice)] transition font-medium"
                    >
                      Add ingredients to list
                    </button>
                    <button type="button" onClick={() => setExtractedRecipe(null)} className="px-4 py-3 text-[var(--muted-foreground)] text-sm">Back</button>
                  </div>
                </>
              ) : !selectedRecipe ? (
                <>
                  {recipeListLoading ? (
                    <p className="text-[var(--muted)] text-sm">Loading recipes…</p>
                  ) : recipeList.length === 0 && !recipeSearchQuery ? (
                    <p className="text-[var(--muted)] text-sm mb-4">No saved recipes yet. Run <code className="bg-[var(--input)] px-1 rounded">supabase/recipes.sql</code> in Supabase to add Enchiladas (with protein/sauce options), or search the web below.</p>
                  ) : null}
                  {recipeList.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-[var(--muted-foreground)] text-xs font-medium mb-2">Your recipes (with options like protein/sauce)</p>
                      <ul className="space-y-2">
                        {recipeList.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => selectRecipe(r.slug)}
                              className="w-full text-left px-4 py-3 rounded-xl bg-[var(--input)] hover:bg-[var(--olive-100)] text-[var(--cast-iron)] font-medium"
                            >
                              {r.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="mb-4">
                    <label className="block text-[var(--muted-foreground)] text-xs font-medium mb-2">Search more recipes (Spoonacular)</label>
                    <input
                      type="text"
                      value={recipeSearchQuery}
                      onChange={(e) => onRecipeSearchChange(e.target.value)}
                      placeholder="e.g. pasta, chicken stir fry"
                      className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--cast-iron)] text-sm"
                    />
                    {recipeSearchLoading && (
                      <p className="text-[var(--muted)] text-xs mt-2">Searching…</p>
                    )}
                    {!recipeSearchLoading && recipeSearchQuery && recipeSearchResults.length === 0 && (
                      <p className="text-[var(--muted-foreground)] text-xs mt-2">No results or Spoonacular not configured.</p>
                    )}
                    {!recipeSearchLoading && recipeSearchResults.length > 0 ? (
                      <>
                        <p className="text-[var(--muted-foreground)] text-xs font-medium mt-2 mb-2">From the web</p>
                        <ul className="space-y-2">
                          {recipeSearchResults.map((r) => (
                            <li key={r.id}>
                              <button
                                type="button"
                                onClick={() => selectRecipe(r.slug)}
                                className="w-full text-left px-4 py-3 rounded-xl bg-[var(--input)] hover:bg-[var(--olive-100)] text-[var(--cast-iron)] font-medium"
                              >
                                {r.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                  <div className="mb-4">
                    <label className="block text-[var(--muted-foreground)] text-xs font-medium mb-2">Paste recipe link</label>
                    <p className="text-[var(--muted-foreground)] text-xs mb-2">Paste a URL from AllRecipes, Food Network, etc. We’ll extract the ingredients.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={pasteUrl}
                        onChange={(e) => { setPasteUrl(e.target.value); setPasteError(null); }}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--cast-iron)] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => extractRecipeFromUrl()}
                        disabled={pasteLoading || !pasteUrl.trim()}
                        className="bg-[var(--sage)] text-white px-4 py-2 rounded-xl hover:bg-[var(--sage-advice)] transition text-sm font-medium disabled:opacity-50 w-full sm:w-auto"
                      >
                        {pasteLoading ? '…' : 'Get recipe'}
                      </button>
                    </div>
                    {pasteError && <p className="text-red-600 text-xs mt-2">{pasteError}</p>}
                  </div>
                  <button type="button" onClick={() => setRecipeModalOpen(false)} className="mt-4 text-[var(--muted-foreground)] text-sm">Cancel</button>
                </>
              ) : (
                <>
                  <p className="text-[var(--muted-foreground)] text-sm mb-4">{selectedRecipe.name}</p>
                  <div className="space-y-3 mb-4">
                    <label className="block text-[var(--cast-iron)] text-sm font-medium">Servings</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={recipeServings}
                      onChange={(e) => setRecipeServings(Math.max(1, Math.min(50, Number(e.target.value) || 4)))}
                      className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--cast-iron)]"
                    />
                  </div>
                  {selectedRecipe.variants.map((v) => (
                    <div key={v.key} className="space-y-2 mb-4">
                      <label className="block text-[var(--cast-iron)] text-sm font-medium">{v.label}</label>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRecipeChoices((c) => ({ ...c, [v.key]: opt.value }))}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                              recipeChoices[v.key] === opt.value ? 'bg-[var(--sage)] text-white' : 'bg-[var(--input)] text-[var(--cast-iron)] hover:bg-[var(--olive-100)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      type="button"
                      onClick={addRecipeIngredients}
                      disabled={recipeIngredientsLoading}
                      className="flex-1 bg-[var(--sage)] text-white py-3 rounded-xl hover:bg-[var(--sage-advice)] transition font-medium disabled:opacity-50"
                    >
                      {recipeIngredientsLoading ? 'Adding…' : 'Add ingredients to list'}
                    </button>
                    <button type="button" onClick={() => setSelectedRecipe(null)} className="px-4 py-3 text-[var(--muted-foreground)] text-sm">Back</button>
                  </div>
                </>
              )}
        </RecipeBottomSheet>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Current Haul - Main Card */}
          <div data-testid="current-haul-card" className="col-span-1 sm:col-span-2 bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🛒</span>
              <h3 className="text-[var(--cast-iron)] font-medium">Current Haul</h3>
              {items.length > 0 && (
                <span className="ml-auto text-sm text-[var(--muted)]">
                  {items.reduce((sum, item) => sum + itemDisplayCount(item), 0)} items
                </span>
              )}
            </div>
          {selectedItems.size > 0 && (
            <div className="mb-3 flex items-center justify-between bg-[#fff7ed] dark:bg-[#2d1a0e] border border-[var(--heirloom-tomato)] dark:border-[#3f2a1a] rounded-xl px-3 py-2 text-sm">
              <span className="text-[var(--heirloom-tomato)]">{selectedItems.size} selected</span>
              <button
                type="button"
                onClick={removeSelectedItems}
                className="text-[var(--heirloom-tomato)] hover:underline"
              >
                Remove selected
              </button>
            </div>
          )}
            
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <HaulItemCard
                    key={`${item}-${i}`}
                    name={item}
                    checked={selectedItems.has(i)}
                    onToggle={() => toggleItemSelection(i)}
                    onRemove={() => removeItem(i)}
                    status={
                      cartStatusByTerm[normalizeTerm(item)] === 'found'
                        ? 'in_cart'
                        : cartStatusByTerm[normalizeTerm(item)] === 'not_found'
                          ? 'not_found'
                          : cartStatusByTerm[normalizeTerm(item)] === 'cart_failed'
                            ? 'cart_failed'
                            : 'pending'
                    }
                  />
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                <p className="text-[var(--muted)] text-center py-4 text-sm font-medium">
                  Your list is empty — add something above
                </p>
                <div className="grid grid-cols-1 gap-2 opacity-40">
                  {['Milk', 'Eggs', 'Bread'].map((ghost) => (
                    <div 
                      key={ghost}
                      className="flex justify-between items-center bg-[var(--input)] px-4 py-2.5 rounded-xl border border-dashed border-[var(--border)] cursor-pointer hover:opacity-100 transition-opacity"
                      onClick={() => addQuickItem(ghost)}
                    >
                      <span className="text-[var(--cast-iron)] font-medium">{ghost}</span>
                      <span className="text-xl text-[var(--muted)]">+</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result Card */}
          {cartResult && (
            <div className={`rounded-3xl p-5 border ${cartResult.success ? 'bg-[var(--olive-100)] dark:bg-[#1f221a] border-[var(--border)]' : 'bg-[#fff7ed] dark:bg-[#2d1a0e] border-[var(--heirloom-tomato)] dark:border-[#3f2a1a]'}`}>
              <div className="text-2xl mb-2">{cartResult.success ? '✓' : '⚠️'}</div>
              <h3 className="text-[var(--cast-iron)] font-medium text-sm">
                {cartResult.success ? 'Added to Cart' : 'Needs attention'}
              </h3>
              {cartResult.success && cartResult.shopping_mode_used && (
                <p className="text-[var(--muted)] text-xs mt-1">
                  {cartResult.shopping_mode_used === 'budget' ? 'Best deals' : 'Your preferences'}
                </p>
              )}
              {cartResult.success ? (
                <button
                  type="button"
                  onClick={() => openCartInterstitial(cartResult.cartUrl || `https://${process.env.NEXT_PUBLIC_KROGER_CART_DOMAIN || 'www.kroger.com'}/shopping/cart`)}
                  className="text-[var(--olive-600)] text-sm hover:underline mt-2 inline-block"
                >
                  Open Cart →
                </button>
              ) : (
                <p className="text-[var(--heirloom-tomato)] text-xs mt-2">
                  {typeof cartResult.error === 'string' ? cartResult.error : 'Some items could not be added.'}
                </p>
              )}
            </div>
          )}

          {/* Status Card */}
          {statusLoading ? (
            <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm">
              <div className="h-6 w-6 bg-[var(--olive-100)] rounded-full mb-3"></div>
              <div className="h-3 w-24 bg-[var(--olive-100)] rounded mb-2"></div>
              <div className="h-2 w-16 bg-[var(--olive-100)] rounded"></div>
            </div>
          ) : (
            krogerStatus?.connected && (
              <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm">
                <div className="text-2xl mb-2">✓</div>
                <h3 className="text-[var(--cast-iron)] font-medium text-sm">Kroger Connected</h3>
                <p className="text-[var(--muted)] text-xs">Ready to shop</p>
              </div>
            )
          )}
        </div>

        {/* Add to Cart Button */}
        {items.length > 0 && krogerStatus?.connected && (
          <SageAdviceButton
            onClick={addToKrogerCart}
            disabled={addingToCart}
            className="w-full py-4 text-lg rounded-2xl shadow-sm"
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Adding to Kroger...
              </span>
            ) : (
              `Add ${items.length} item${items.length > 1 ? 's' : ''} to Kroger Cart`
            )}
          </SageAdviceButton>
        )}

        {addingToCart && addToCartMessage && (
          <div className="mt-4">
            <NarrativeProgress message={addToCartMessage} step={addToCartStep} total={3} />
          </div>
        )}

        {/* Results List */}
        {Array.isArray(cartResult?.results) && cartResult.results.length > 0 && (
          <div className="mt-6 bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm">
            <h3 className="text-[var(--cast-iron)] font-medium mb-3 text-sm">Item results</h3>
            <div className="space-y-2 text-sm">
              {cartResult.results.map((result: any) => (
                <div
                  key={result.term}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl ${result.found ? (result.addedToCart === false ? 'bg-[#fff7ed] dark:bg-[#2d1a0e]' : 'bg-[var(--input)]') : 'bg-[#fff7ed] dark:bg-[#2d1a0e]'}`}
                >
                  <div>
                    <span className="text-[var(--cast-iron)]">{result.term}</span>
                    {result.found && (result.size || result.onSale) && (
                      <span className="ml-2 text-xs text-[var(--muted)]">
                        {result.onSale && 'Sale'}
                        {result.onSale && result.size ? ' · ' : ''}
                        {result.size}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${result.found ? (result.addedToCart === false ? 'text-[#c7762a] dark:text-[#e09b5a]' : 'text-[var(--olive-600)]') : 'text-[var(--heirloom-tomato)]'}`}>
                    {result.found
                      ? result.addedToCart === false
                        ? (result.outOfStock ? 'Out of stock' : result.cartError || 'Couldn\'t add')
                        : (result.price != null ? `$${result.price.toFixed(2)} · ` : '') + 'Added'
                      : 'Not found'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[var(--muted)] text-xs mt-3">
              Olive picks sale items first, then best price per unit. Kroger&apos;s API doesn&apos;t expose digital coupon data, so we can&apos;t show coupon-adjusted cost — clip coupons on King Soopers / Kroger before checkout for extra savings.
            </p>
          </div>
        )}

        {/* Focus + staples */}
        <div data-testid="focus-staples-card" className="mt-6 bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] shadow-sm">
          <h3 className="text-[var(--cast-iron)] font-medium mb-3 text-sm">Focus & staples</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[var(--cast-iron)] text-sm font-medium">Zen mode</p>
              <p className="text-[var(--muted)] text-xs">Hide suggestions and only do what you ask.</p>
            </div>
            <button
              type="button"
              onClick={() => setZenMode((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border ${zenMode ? 'bg-[var(--input)] border-[#9caf88] text-[var(--cast-iron)]' : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)]'}`}
            >
              {zenMode ? 'On' : 'Off'}
            </button>
          </div>

          <div>
            <p className="text-[var(--cast-iron)] text-sm font-medium mb-2">Staple blacklist</p>
            <p className="text-[var(--muted)] text-xs mb-3">Items here won’t be added from recipes or Smart Paste.</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={newBlacklistItem}
                onChange={(e) => setNewBlacklistItem(e.target.value)}
                placeholder="e.g. salt, flour"
                className="flex-1 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-sm text-[var(--cast-iron)]"
              />
              <button
                type="button"
                onClick={addBlacklistItem}
                className="bg-[var(--sage)] text-white px-4 py-2 rounded-xl hover:bg-[var(--sage-advice)] transition text-sm font-medium w-full sm:w-auto"
              >
                Add
              </button>
            </div>
            {blacklist.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blacklist.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeBlacklistItem(item)}
                    className="px-3 py-1.5 rounded-full bg-[var(--input)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {!zenMode && (
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <div className="flex items-center justify-center gap-2 mb-3 text-[var(--muted)] text-sm">
            <span>Quick add</span>
            {usualsLoading && <span className="text-xs">• loading usuals</span>}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[...new Set([...usuals, 'Milk', 'Eggs', 'Bread', 'Bananas', 'Butter'])].slice(0, 8).map((item) => (
              <PredictiveChip
                key={item}
                onClick={() => {
                  if (!items.includes(item) && !isBlacklisted(item)) {
                    setItems([...items, item])
                    setOliveMessage(`Added ${item}. Anything else?`)
                  }
                }}
              >
                + Add {item}?
              </PredictiveChip>
            ))}
          </div>
        </div>
        )}
      </div>

      <SuccessInterstitial
        open={showCartInterstitial}
        title="You’re in control"
        description="Olive never places the order. We only add items to your Kroger cart — you review and checkout there."
        onClose={() => setShowCartInterstitial(false)}
        primaryAction={(
          <SageAdviceButton onClick={confirmOpenCart} className="flex-1 py-3">
            Open my cart
          </SageAdviceButton>
        )}
        secondaryAction={(
          <SageAdviceButton onClick={() => setShowCartInterstitial(false)} variant="ghost" className="px-4 py-3 text-sm">
            Back
          </SageAdviceButton>
        )}
      />

      {blobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setBlobModalOpen(false)}>
          <div className="bg-[var(--card)] rounded-3xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[var(--cast-iron)] font-medium mb-2">Smart Paste</h3>
            <p className="text-[var(--muted-foreground)] text-xs mb-4">Paste a list, a recipe, or a messy note. Olive will sort it out.</p>
            <textarea
              value={blobText}
              onChange={(e) => setBlobText(e.target.value)}
              placeholder="Paste a list, a recipe, or a messy text from your husband. I'll handle the rest."
              className="w-full min-h-[140px] px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--cast-iron)] text-sm"
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                type="button"
                onClick={runBlobParse}
                disabled={blobParsing || !blobText.trim()}
                className="flex-1 bg-[var(--sage)] text-white py-3 rounded-xl hover:bg-[var(--sage-advice)] transition font-medium disabled:opacity-50"
              >
                {blobParsing ? 'Sorting…' : 'Sort my list'}
              </button>
              <button type="button" onClick={() => setBlobModalOpen(false)} className="px-4 py-3 text-[var(--muted-foreground)] text-sm">Cancel</button>
            </div>

            {blobItems.length > 0 && (
              <div className="mt-4">
                <p className="text-[var(--muted-foreground)] text-xs mb-2">I found these items. Sound right?</p>
                <div className="space-y-2">
                  {blobItems.map((item, idx) => (
                    <label key={`${item.name}-${idx}`} className="flex items-start gap-2 bg-[var(--input)] rounded-xl px-3 py-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setBlobItems((prev) => prev.map((it, i) => i === idx ? { ...it, checked } : it))
                        }}
                      />
                      <div className="text-sm text-[var(--cast-iron)]">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <ConfidenceBadge confidence={item.confidence} />
                          {item.quantity ? <span className="ml-2 text-xs text-[var(--muted)]">Qty {Math.round(item.quantity * 100) / 100}{item.unit ? ` ${item.unit}` : ''}</span> : null}
                        </div>
                        {item.notes && <div className="text-xs text-[var(--muted-foreground)]">Note: {item.notes}</div>}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    type="button"
                    onClick={applyBlobItems}
                    className="flex-1 bg-[var(--sage)] text-white py-3 rounded-xl hover:bg-[var(--sage-advice)] transition font-medium"
                  >
                    Add to list
                  </button>
                  <button type="button" onClick={() => setBlobItems([])} className="px-4 py-3 text-[var(--muted-foreground)] text-sm">Reset</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-12 h-12 bg-[var(--sage)] rounded-full flex items-center justify-center olive-pulse">
          <span className="text-white text-xl">🫒</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
