import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { festivalService } from '@/services/festivalService'
import { galleryService } from '@/services/galleryService'
import { LoadingScreen } from '@/components/ui/feedback'
import { formatDate } from '@/utils'
import type { FestivalYear, FestivalTransaction, FestivalFinanceSummary, GalleryImage } from '@/types'

export default function Festival2026() {
  const [year, setYear] = useState<FestivalYear | null>(null)
  const [summary, setSummary] = useState<FestivalFinanceSummary | null>(null)
  const [transactions, setTransactions] = useState<FestivalTransaction[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  const loadFestival = async () => {
    try {
      const y = await festivalService.getYear(2026).catch(() => null)
      setYear(y)
      if (y) {
        const [s, t, g] = await Promise.all([
          festivalService.getSummary(2026).catch(() => null),
          festivalService.listTransactions(y.id).catch(() => []),
          galleryService.list({ limit: 20 }).catch(() => []),
        ])
        setSummary(s)
        setTransactions(t as FestivalTransaction[])
        setGallery(g.slice(0, 12))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    (async () => { await loadFestival() })()
    // Live: admin upload -> auto-show on public festival page without refresh
    const ch1 = supabase.channel('festival-2026-gallery').on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => loadFestival()).subscribe()
    const ch2 = supabase.channel('festival-2026-finance').on('postgres_changes', { event: '*', schema: 'public', table: 'festival_transactions' }, () => loadFestival()).subscribe()
    const ch3 = supabase.channel('festival-2026-year').on('postgres_changes', { event: '*', schema: 'public', table: 'festival_years' }, () => loadFestival()).subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3) }
  }, [])

  if (loading) return <LoadingScreen label="Loading 2026 Festival..." />

  const totalIncome = summary?.total_income ?? transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0)
  const totalExpense = summary?.total_expense ?? transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0)
  const remaining = totalIncome - totalExpense

  return (
    <div className="container-main px-4 py-8">
      {/* Header - Made in 2026 badge */}
      <div className="bg-gradient-to-br from-saffron via-orange-500 to-red-600 rounded-3xl p-6 md:p-10 text-white text-center">
        <p className="text-sm font-bold tracking-widest uppercase bg-white/20 inline-block px-4 py-1 rounded-full">Made in 2026 • Shivsaydri Mandal</p>
        <h1 className="text-3xl md:text-5xl font-bold mt-4">🙏 Ganpati Festival 2026</h1>
        <p className="mt-2 text-white/90">{year?.theme ?? 'Shivsaydri 2026'} • {year?.decoration_theme ?? 'Traditional Maharashtra'} Decoration</p>
        <p className="mt-1 text-sm text-white/80">{year?.description ?? 'Official 2026 Ganpati festival - All images, decoration & finance details'}</p>
        <div className="mt-4 flex justify-center gap-2 text-xs">
          <span className="bg-white text-saffron px-3 py-1 rounded-full font-bold">Year: 2026</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">Website launched in 2026</span>
        </div>
      </div>

      {/* Final Pooja Persons */}
      <section className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="card p-6 border-l-4 border-l-saffron">
          <h3 className="font-bold flex items-center gap-2">🙏 Final Pooja - Person 1</h3>
          <p className="text-2xl font-bold text-saffron mt-2">{year?.final_pooja_person1 ?? '— Not yet decided —'}</p>
          <p className="text-xs text-gray-500 mt-1">Set by Admin in Festival Settings</p>
        </div>
        <div className="card p-6 border-l-4 border-l-primary-600">
          <h3 className="font-bold flex items-center gap-2">🙏 Final Pooja - Person 2</h3>
          <p className="text-2xl font-bold text-primary-700 mt-2">{year?.final_pooja_person2 ?? '— Not yet decided —'}</p>
          <p className="text-xs text-gray-500 mt-1">Set by Admin in Festival Settings</p>
        </div>
      </section>

      {/* Finance Summary - Money Get / Go / Remaining */}
      <section className="mt-8">
        <h2 className="text-xl font-bold flex items-center gap-2">💰 2026 Finance Sheet — Income / Expense / Remaining</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="card p-6 bg-green-50 border border-green-200 text-center">
            <p className="text-sm font-medium text-green-700">Total Money Received (जमा)</p>
            <p className="text-3xl font-bold text-green-700 mt-2">₹{totalIncome.toLocaleString('en-IN')}</p>
            <p className="text-xs text-green-600 mt-1">{transactions.filter(t => t.type==='income').length} entries</p>
          </div>
          <div className="card p-6 bg-red-50 border border-red-200 text-center">
            <p className="text-sm font-medium text-red-700">Total Money Spent (खर्च)</p>
            <p className="text-3xl font-bold text-red-700 mt-2">₹{totalExpense.toLocaleString('en-IN')}</p>
            <p className="text-xs text-red-600 mt-1">{transactions.filter(t => t.type==='expense').length} entries</p>
          </div>
          <div className={`card p-6 border text-center ${remaining >=0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className={`text-sm font-medium ${remaining>=0 ? 'text-blue-700' : 'text-orange-700'}`}>Remaining Balance (शिल्लक)</p>
            <p className={`text-3xl font-bold mt-2 ${remaining>=0 ? 'text-blue-700' : 'text-orange-700'}`}>₹{remaining.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Income - Expense</p>
          </div>
        </div>

        {/* Transactions Sheet */}
        <div className="card p-4 mt-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">📊 Detailed Sheet - All Transactions</h3>
            <Link to="/admin/festival" className="text-xs btn-outline px-3 py-1">Admin: Add Sheet Entry →</Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No finance entries yet. Admin can add income/expense sheet entries.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="py-2">Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 text-xs">{formatDate(t.transaction_date)}</td>
                    <td><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.type==='income'?'Income':'Expense'}</span></td>
                    <td>{t.category}</td>
                    <td className={`font-bold ${t.type==='income'?'text-green-700':'text-red-700'}`}>₹{Number(t.amount).toLocaleString('en-IN')}</td>
                    <td className="text-gray-600 max-w-xs truncate">{t.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Decoration & All Images */}
      <section className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2">🎨 Decoration & All Images - 2026</h2>
        <p className="text-sm text-gray-500">All decoration photos from Gallery (2026)</p>
        {gallery.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">No decoration images yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {gallery.map(g => (
              <div key={g.id} className="card overflow-hidden">
                <img src={g.image_url} alt={g.title} className="h-40 w-full object-cover" loading="lazy" />
                <div className="p-3"><p className="text-sm font-medium truncate">{g.title}</p><p className="text-xs text-gray-500">{g.category} • {g.event_date ? formatDate(g.event_date) : '2026'}</p></div>
              </div>
            ))}
          </div>
        )}
        <Link to="/gallery" className="btn-secondary mt-4 inline-flex">View Full Gallery →</Link>
      </section>

      <div className="mt-10 p-6 bg-cream rounded-2xl text-center border">
        <p className="text-sm text-gray-600">This festival page is for <span className="font-bold">Ganpati 2026</span> only. Click any year to see its images & finance. Website built in 2026.</p>
        <Link to="/home" className="btn-primary mt-3 inline-flex">Back to Home</Link>
      </div>
    </div>
  )
}
