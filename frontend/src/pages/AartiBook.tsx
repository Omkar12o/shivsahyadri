import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AARTI_BOOK, AARTI_BOOK_TITLE, AARTI_BOOK_SUBTITLE } from '@/data/aartiBook'

export default function AartiBook() {
  const [q, setQ] = useState('')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const ql = q.trim().toLowerCase()
  const filtered = AARTI_BOOK.filter(a =>
    !ql ||
    a.title.toLowerCase().includes(ql) ||
    (a.subtitle ?? '').toLowerCase().includes(ql) ||
    a.lyrics.toLowerCase().includes(ql),
  )
  const clearSearch = () => setQ('')

  const shareBook = async () => {
    const text = `${AARTI_BOOK_TITLE}\n${AARTI_BOOK_SUBTITLE}\n\n॥ गणपती बाप्पा मोरया ॥\n\n` + AARTI_BOOK.map(a => `*${a.title}*\n${a.lyrics.slice(0, 200)}...`).join('\n\n---\n\n')
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: AARTI_BOOK_TITLE, text, url }); return } catch {}
    }
    // WhatsApp fallback - सर्वांना पाठवावे
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`, '_blank')
  }

  const shareOne = (id: string) => {
    const a = AARTI_BOOK.find(x => x.id === id)!
    const text = `*${a.title}*\n${a.subtitle ? a.subtitle + '\n' : ''}\n${a.lyrics}\n\n${AARTI_BOOK_SUBTITLE} — ${window.location.href}`
    if (navigator.share) navigator.share({ title: a.title, text }).catch(() => navigator.clipboard.writeText(text))
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Book Cover Header */}
      <div className="bg-gradient-to-br from-saffron via-orange-600 to-red-700 text-white">
        <div className="container-main px-4 py-8 md:py-12 text-center">
          <p className="text-xs font-bold tracking-widest bg-white/20 inline-block px-4 py-1 rounded-full">सर्व मोबाईल धारकांसाठी • सर्वांना पाठवावे</p>
          <h1 className="text-3xl md:text-5xl font-bold mt-4 font-devanagari">{AARTI_BOOK_TITLE}</h1>
          <p className="text-lg mt-2 font-devanagari">{AARTI_BOOK_SUBTITLE}</p>
          <p className="mt-1 text-2xl">🙏 ॥ गणपती बाप्पा मोरया ॥ 🙏</p>
          <p className="mt-3 text-sm text-white/80">*सर्व मोबाईल धारकांसाठी आरती पुस्तक ... सर्वांना पाठवावे ..*</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={shareBook} className="bg-white text-saffron px-6 py-3 rounded-xl font-bold shadow">📤 सर्वांना पाठवा (WhatsApp)</button>
            <Link to="/aarti" className="bg-white/15 border border-white/30 px-6 py-3 rounded-xl font-bold">Back to Aarti Library →</Link>
          </div>
          <p className="mt-3 text-xs text-white/70">{AARTI_BOOK.length} आरत्या • Offline ready • मराठी</p>
        </div>
      </div>

      <div className="container-main px-4 py-6">
        {/* Search + Index — rendered ONCE at the top, above all Aarti pages */}
        <div className="card p-4">
          <input
            placeholder="शोधा... उदा. गणपती, देवी, विठ्ठल"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="input"
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filtered.map(a => (
              <button
                key={a.id}
                onClick={() => refs.current[a.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-saffron/10 text-saffron text-xs font-medium hover:bg-saffron hover:text-white transition"
              >
                {a.title.replace('श्री ', '').slice(0, 14)}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">आरत्या — अनुक्रमणिका ({filtered.length}/{AARTI_BOOK.length})</p>
            {q.trim() && (
              <button onClick={clearSearch} className="text-xs font-semibold text-saffron hover:underline">
                ✕ Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Book Pages */}
        {filtered.length === 0 ? (
          <div className="card p-8 mt-6 text-center">
            <p className="text-2xl">🙏</p>
            <p className="font-devanagari text-lg mt-2">कोणतीही आरती सापडली नाही</p>
            <p className="text-sm text-gray-500 mt-1">"{q}" साठी काहीही आढळले नाही.</p>
            <button onClick={clearSearch} className="btn-primary mt-4">Clear Search</button>
          </div>
        ) : (
        <>
        <div className="mt-6 space-y-6">
          {filtered.map((a, idx) => (
            <div
              key={a.id}
              ref={el => { refs.current[a.id] = el }}
              className="card overflow-hidden scroll-mt-32"
            >
              <div className="bg-gradient-to-r from-saffron/10 to-orange-50 px-6 py-4 border-b flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-saffron tracking-widest">आरती {idx + 1} • {AARTI_BOOK.length}</p>
                  <h2 className="text-xl md:text-2xl font-bold font-devanagari text-gray-900 mt-1">{a.title}</h2>
                  {a.subtitle && <p className="text-sm text-gray-500 font-devanagari">{a.subtitle}</p>}
                </div>
                <span className="text-2xl hidden md:block">🙏</span>
              </div>
              <div className="px-6 py-6 bg-white">
                <pre className="whitespace-pre-wrap leading-relaxed font-devanagari text-[15px] md:text-[17px] text-gray-800 break-words">
                  {a.lyrics}
                </pre>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-2">
                <button onClick={() => shareOne(a.id)} className="btn-outline text-xs px-3 py-1.5">📤 Share</button>
                <button onClick={() => navigator.clipboard.writeText(a.lyrics)} className="btn-outline text-xs px-3 py-1.5">📋 Copy</button>
                <button onClick={() => window.print()} className="btn-outline text-xs px-3 py-1.5 hidden md:inline-flex">🖨 Print Book</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer of book */}
        <div className="card p-8 mt-8 text-center bg-gradient-to-br from-orange-50 to-red-50 border-saffron/20">
          <p className="text-2xl">🚩 सर्व गणेश भक्तांना गणेशोत्सवाच्या हार्दिक शुभेच्छा 🚩</p>
          <p className="mt-2 font-devanagari text-lg">॥ गणपती बाप्पा मोरया • मंगलमूर्ती मोरया ॥</p>
          <p className="mt-4 text-sm text-gray-600">हे आरती पुस्तक सर्व मोबाईल धारकांसाठी आहे — कृपया सर्वांना पाठवावे.</p>
          <button onClick={shareBook} className="btn-primary mt-4">📤 सर्वांना पाठवा — Share Book</button>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
