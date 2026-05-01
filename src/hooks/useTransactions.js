import { supabase } from '../lib/supabaseClient'

const SELECT = '*, category:categories(*), subcategory:subcategories(*)'

export function useTransactions() {
  async function fetchTransactions({ year, month } = {}) {
    let query = supabase
      .from('transactions')
      .select(SELECT)
      .order('date', { ascending: false })

    if (year !== undefined && month !== undefined) {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const last = new Date(year, month + 1, 0).getDate()
      const to   = `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
      query = query.gte('date', from).lte('date', to)
    }

    const { data, error } = await query
    return { data, error }
  }

  async function createTransaction(data) {
    const { data: result, error } = await supabase
      .from('transactions')
      .insert(data)
      .select(SELECT)
      .single()
    return { data: result, error }
  }

  async function updateTransaction(id, updates) {
    const { data: result, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select(SELECT)
      .single()
    return { data: result, error }
  }

  async function deleteTransaction(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    return { error }
  }

  async function toggleChecked(id, currentValue) {
    const { data: result, error } = await supabase
      .from('transactions')
      .update({ is_checked: !currentValue })
      .eq('id', id)
      .select(SELECT)
      .single()
    return { data: result, error }
  }

  return { fetchTransactions, createTransaction, updateTransaction, deleteTransaction, toggleChecked }
}
