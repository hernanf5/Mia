import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import CategoryModal from '../components/CategoryModal'
import SubcategoryModal from '../components/SubcategoryModal'
import ConfirmModal from '../components/ConfirmModal'

const TYPE_ORDER  = ['income', 'fixed', 'variable']
const TYPE_LABELS = { income: 'Ingresos', fixed: 'Gastos fijos', variable: 'Variables' }
const TYPE_BADGE  = {
  income:   { label: 'ingreso',  color: 'var(--gr)', bg: 'var(--grd)' },
  fixed:    { label: 'fijo',     color: 'var(--pu)', bg: 'var(--pud)' },
  variable: { label: 'variable', color: 'var(--am)', bg: 'rgba(245,158,11,.1)' },
}

const ChevRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const ChevDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

export default function Categories() {
  const { user } = useAuth()
  const {
    fetchCategories, fetchSubcategories,
    createCategory,  updateCategory,  deleteCategory,
    createSubcategory, updateSubcategory, deleteSubcategory,
  } = useCategories()

  const [categories, setCategories] = useState([])
  const [subMap, setSubMap]         = useState({})
  const [expanded, setExpanded]     = useState({})
  const [loading, setLoading]       = useState(true)

  // modal state
  const [catModal, setCatModal]       = useState(null)  // null | 'create' | category
  const [subModal, setSubModal]       = useState(null)  // null | { category } | { category, subcategory }
  const [confirmDel, setConfirmDel]   = useState(null)  // null | { type: 'cat'|'sub', item, parentId? }

  const loadCategories = useCallback(async () => {
    const { data } = await fetchCategories()
    setCategories(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  async function toggleExpand(cat) {
    const opening = !expanded[cat.id]
    setExpanded(prev => ({ ...prev, [cat.id]: opening }))
    if (opening && !subMap[cat.id]) {
      const { data } = await fetchSubcategories(cat.id)
      setSubMap(prev => ({ ...prev, [cat.id]: data ?? [] }))
    }
  }

  async function reloadSubs(categoryId) {
    const { data } = await fetchSubcategories(categoryId)
    setSubMap(prev => ({ ...prev, [categoryId]: data ?? [] }))
  }

  // ── Category CRUD ──
  async function handleSaveCategory(formData) {
    if (catModal === 'create') {
      await createCategory({ ...formData, user_id: user.id })
    } else {
      await updateCategory(catModal.id, formData)
    }
    await loadCategories()
    setCatModal(null)
  }

  async function handleDeleteCategory() {
    const cat = confirmDel.item
    await deleteCategory(cat.id)
    setSubMap(prev => { const n = { ...prev }; delete n[cat.id]; return n })
    setExpanded(prev => { const n = { ...prev }; delete n[cat.id]; return n })
    await loadCategories()
    setConfirmDel(null)
  }

  // ── Subcategory CRUD ──
  async function handleSaveSubcategory(formData) {
    const { category, subcategory } = subModal
    if (subcategory) {
      await updateSubcategory(subcategory.id, formData)
    } else {
      await createSubcategory({ ...formData, category_id: category.id, user_id: user.id })
    }
    await reloadSubs(category.id)
    setSubModal(null)
  }

  async function handleDeleteSubcategory() {
    const { item, parentId } = confirmDel
    await deleteSubcategory(item.id)
    await reloadSubs(parentId)
    setConfirmDel(null)
  }

  const grouped = TYPE_ORDER.reduce((acc, type) => {
    acc[type] = categories.filter(c => c.type === type)
    return acc
  }, {})

  if (loading) return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Cargando...</p>
    </div>
  )

  return (
    <div className="screen" style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px 16px' }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>Categorías</span>
      </div>

      {/* Grouped list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {TYPE_ORDER.map(type => {
          const cats = grouped[type]
          if (!cats.length) return null
          return (
            <section key={type}>
              {/* Group header */}
              <div className="slbl" style={{ marginBottom: 8 }}>{TYPE_LABELS[type]}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cats.map(cat => {
                  const isOpen = !!expanded[cat.id]
                  const subs   = subMap[cat.id] ?? []
                  const badge  = TYPE_BADGE[cat.type]

                  return (
                    <div key={cat.id} className="card" style={{ overflow: 'hidden', border: '1px solid var(--bd)' }}>
                      {/* Category row */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px 12px 14px', cursor: 'pointer' }}
                        onClick={() => toggleExpand(cat)}
                      >
                        {/* Color dot */}
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />

                        {/* Name + badge */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{cat.name}</span>
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
                          <button
                            style={s.iconBtn}
                            title="Agregar subcategoría"
                            onClick={() => setSubModal({ category: cat })}
                          >
                            <PlusIcon />
                          </button>
                          <button style={s.iconBtn} title="Editar" onClick={() => setCatModal(cat)}>
                            <EditIcon />
                          </button>
                          <button
                            style={{ ...s.iconBtn, color: 'var(--re)' }}
                            title="Eliminar"
                            onClick={() => setConfirmDel({ type: 'cat', item: cat })}
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        {/* Chevron */}
                        <span style={{ color: 'var(--tx3)', flexShrink: 0 }}>
                          {isOpen ? <ChevDown /> : <ChevRight />}
                        </span>
                      </div>

                      {/* Subcategory list */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid var(--bd)', background: 'rgba(0,0,0,0.2)' }}>
                          {subs.length === 0 ? (
                            <p style={{ color: 'var(--tx3)', fontSize: 12, padding: '10px 14px 10px 34px' }}>
                              Sin subcategorías
                            </p>
                          ) : (
                            subs.map((sub, idx) => (
                              <div
                                key={sub.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px 9px 34px', borderBottom: idx < subs.length - 1 ? '1px solid var(--bd)' : 'none' }}
                              >
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--tx3)', flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 13, color: 'var(--tx2)' }}>{sub.name}</span>
                                <div style={{ display: 'flex', gap: 2 }}>
                                  <button style={s.iconBtn} onClick={() => setSubModal({ category: cat, subcategory: sub })}>
                                    <EditIcon />
                                  </button>
                                  <button
                                    style={{ ...s.iconBtn, color: 'var(--re)' }}
                                    onClick={() => setConfirmDel({ type: 'sub', item: sub, parentId: cat.id })}
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {categories.length === 0 && (
          <p style={{ color: 'var(--tx3)', textAlign: 'center', fontSize: 13, paddingTop: '3rem' }}>
            Sin categorías. Tocá + para crear una.
          </p>
        )}
      </div>

      {/* FAB */}
      <button
        style={s.fab}
        onClick={() => setCatModal('create')}
        aria-label="Nueva categoría"
      >
        <PlusIcon />
      </button>

      {/* Modals */}
      {catModal && (
        <CategoryModal
          category={catModal === 'create' ? null : catModal}
          onSave={handleSaveCategory}
          onClose={() => setCatModal(null)}
        />
      )}
      {subModal && (
        <SubcategoryModal
          subcategory={subModal.subcategory ?? null}
          categoryName={subModal.category.name}
          onSave={handleSaveSubcategory}
          onClose={() => setSubModal(null)}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title={confirmDel.type === 'cat' ? `Eliminar "${confirmDel.item.name}"` : `Eliminar "${confirmDel.item.name}"`}
          message={
            confirmDel.type === 'cat'
              ? 'Se borrarán también todas sus subcategorías. Esta acción no se puede deshacer.'
              : 'Esta acción no se puede deshacer.'
          }
          onConfirm={confirmDel.type === 'cat' ? handleDeleteCategory : handleDeleteSubcategory}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

const s = {
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--tx3)',
    cursor: 'pointer',
    padding: '6px 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    transition: 'color .12s',
  },
  fab: {
    position: 'fixed',
    bottom: 76,
    right: 18,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'var(--gr)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
    zIndex: 90,
  },
}
