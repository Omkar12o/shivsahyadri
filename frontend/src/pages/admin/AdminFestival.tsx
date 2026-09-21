import { useEffect, useState } from 'react'
import { festivalService } from '@/services/festivalService'
import type { FestivalYear, FestivalTransaction, TransactionType } from '@/types'

export default function AdminFestival() {
  const [year, setYear] = useState<FestivalYear | null>(null)
  const [transactions, setTransactions] = useState<FestivalTransaction[]>([])
  const [form, setForm] = useState({ type: 'income' as TransactionType, category: '', amount: '', description: '', transaction_date: new Date().toISOString().slice(0, 10) })
  const [pooja, setPooja] = useState({ p1: '', p2: '' })

  const load = async () => {
    const y = await festivalService.getYear(2026).catch(() => null)
    if (!y) return
    setYear(y)
    setPooja({ p1: y.final_pooja_person1 ?? '', p2: y.final_pooja_person2 ?? '' })
    const t = await festivalService.listTransactions(y.id).catch(() => [])
    setTransactions(t as FestivalTransaction[])
  }
  useEffect(() => { (async () => { await load() })() }, [])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0)

  const handleAdd = async () => {
    if (!year) return alert('2026 year not found - run migration')
    if (!form.category || !form.amount) return alert('Category & amount required')
    await festivalService.addTransaction({
      festival_year_id: year.id,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      description: form.description || null,
      transaction_date: form.transaction_date,
      receipt_url: null,
    })
    setForm({ type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().slice(0, 10) })
    load()
  }

  const savePooja = async () => {
    if (!year) return
    await festivalService.updateYear(year.id, { final_pooja_person1: pooja.p1 || null, final_pooja_person2: pooja.p2 || null })
    alert('Final Pooja persons updated!')
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">2026 Ganpati Festival - Finance Sheet</h1>
      <p className="text-sm text-gray-500">Manage 2026 income/expense sheet, remaining auto-calculated, set final pooja 2 persons.</p>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="card p-4 bg-green-50 border-green-200 text-center"><p className="text-xs text-green-700">Total Income</p><p className="text-2xl font-bold text-green-700">₹{totalIncome.toLocaleString('en-IN')}</p></div>
        <div className="card p-4 bg-red-50 border-red-200 text-center"><p className="text-xs text-red-700">Total Expense</p><p className="text-2xl font-bold text-red-700">₹{totalExpense.toLocaleString('en-IN')}</p></div>
        <div className="card p-4 bg-blue-50 border-blue-200 text-center"><p className="text-xs text-blue-700">Remaining</p><p className="text-2xl font-bold text-blue-700">₹{(totalIncome - totalExpense).toLocaleString('en-IN')}</p></div>
      </div>

      {/* Final Pooja 2 persons */}
      <div className="card p-4 mt-6">
        <h3 className="font-bold">🙏 Final Pooja - 2 Persons Setting</h3>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <input className="input" placeholder="Final Pooja Person 1 Name" value={pooja.p1} onChange={e => setPooja({ ...pooja, p1: e.target.value })} />
          <input className="input" placeholder="Final Pooja Person 2 Name" value={pooja.p2} onChange={e => setPooja({ ...pooja, p2: e.target.value })} />
        </div>
        <button className="btn-primary mt-3" onClick={savePooja}>Save Final Pooja Persons</button>
        {year && <p className="text-xs text-gray-500 mt-2">Current: {year.final_pooja_person1 ?? '-'} & {year.final_pooja_person2 ?? '-'}</p>}
      </div>

      {/* Add Transaction - Sheet */}
      <div className="card p-4 mt-6">
        <h3 className="font-bold">➕ Add Sheet Entry (Income / Expense)</h3>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TransactionType })}>
            <option value="income">Income (जमा)</option>
            <option value="expense">Expense (खर्च)</option>
          </select>
          <input className="input" placeholder="Category (e.g. Donation, Decoration, Prasad)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input className="input" type="number" placeholder="Amount ₹" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <input className="input" type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
          <textarea className="input md:col-span-2" rows={2} placeholder="Description / Notes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button className="btn-primary md:col-span-2" onClick={handleAdd}>Add to Sheet</button>
        </div>
      </div>

      {/* Sheet Table */}
      <div className="card p-4 mt-6 overflow-x-auto">
        <h3 className="font-bold mb-3">📊 2026 Sheet - All Entries</h3>
        {transactions.length === 0 ? <p className="text-sm text-gray-500">No entries yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-2">Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Desc</th><th></th></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 text-xs">{t.transaction_date}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type}</span></td>
                  <td>{t.category}</td>
                  <td className="font-bold">₹{Number(t.amount).toLocaleString('en-IN')}</td>
                  <td className="text-gray-600 max-w-xs truncate">{t.description ?? '-'}</td>
                  <td><button onClick={async () => { await festivalService.removeTransaction(t.id); load() }} className="text-red-600 text-xs hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
