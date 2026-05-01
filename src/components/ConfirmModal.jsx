export default function ConfirmModal({ title, message, confirmLabel = 'Eliminar', onConfirm, onClose }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h3 style={s.title}>{title}</h3>
        {message && <p style={s.message}>{message}</p>}
        <div style={s.actions}>
          <button style={s.btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={s.btnDanger} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: '1rem',
  },
  modal: {
    background: 'var(--s1)', borderRadius: 16, padding: '1.5rem',
    width: '100%', maxWidth: 340, border: '1px solid var(--bd)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  title: { color: 'var(--tx)', margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 },
  message: { color: 'var(--tx2)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.25rem' },
  actions: { display: 'flex', gap: '0.75rem' },
  btnSecondary: {
    flex: 1, padding: '0.65rem', background: 'var(--s2)', color: 'var(--tx)',
    border: '1px solid var(--bd2)', borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDanger: {
    flex: 1, padding: '0.65rem', background: 'var(--red)', color: 'var(--re)',
    border: '1px solid rgba(244,63,94,.25)', borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
  },
}
