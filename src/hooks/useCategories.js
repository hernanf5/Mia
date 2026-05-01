import { supabase } from '../lib/supabaseClient'

export function useCategories() {
  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    return { data, error }
  }

  async function fetchSubcategories(categoryId) {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('name')
    return { data, error }
  }

  async function createCategory(data) {
    const { data: result, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single()
    return { data: result, error }
  }

  async function updateCategory(id, data) {
    const { data: result, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    return { data: result, error }
  }

  async function deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    return { error }
  }

  async function createSubcategory(data) {
    const { data: result, error } = await supabase
      .from('subcategories')
      .insert(data)
      .select()
      .single()
    return { data: result, error }
  }

  async function updateSubcategory(id, data) {
    const { data: result, error } = await supabase
      .from('subcategories')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    return { data: result, error }
  }

  async function deleteSubcategory(id) {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id)
    return { error }
  }

  return {
    fetchCategories,
    fetchSubcategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  }
}
