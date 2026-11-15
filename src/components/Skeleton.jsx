// Skeletons (docs/rediseno-v2.md §5). Shimmer y reduced-motion en index.css (.skel)

/** Bloque base. w/h en px o cualquier valor CSS; r = border-radius. */
export function Skeleton({ w = '100%', h = 12, r = 6, style }) {
  return <span className="skel" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

const label = { fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }

/** Mismo layout que el Informe real (debajo del selector de mes). */
export function InformeSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span className="sr-only">Cargando informe…</span>

      {/* ¿Cómo me fue? */}
      <div className="card" style={{ padding: 20 }}>
        <Skeleton w="40%" h={13} />
        <Skeleton w="58%" h={38} r={10} style={{ margin: '10px 0 12px' }} />
        <Skeleton w="90%" h={13} style={{ marginBottom: 6 }} />
        <Skeleton w="60%" h={13} />
      </div>

      {/* Tabla vs mes anterior */}
      <div className="card" style={{ padding: 20 }}>
        <Skeleton w="35%" h={13} style={{ marginBottom: 16 }} />
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '10px 0' }}>
            <Skeleton w="70%" h={14} />
            <Skeleton w="80%" h={14} style={{ justifySelf: 'end' }} />
            <Skeleton w="60%" h={14} style={{ justifySelf: 'end' }} />
          </div>
        ))}
      </div>

      {/* Qué cambió por categoría */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ ...label, marginBottom: 16 }}>Qué cambió por categoría</div>
        {[80, 62, 45, 30, 20].map((w, i) => (
          <div key={i} style={{ marginBottom: i < 4 ? 16 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Skeleton w={`${28 + i * 4}%`} h={13} />
              <Skeleton w="28%" h={13} />
            </div>
            <Skeleton w={`${w}%`} h={6} r={3} />
          </div>
        ))}
      </div>

      {/* Consejo IA */}
      <div style={{ padding: 20, borderRadius: 20, background: 'var(--s2)', border: '1px solid var(--bd2)' }}>
        <div style={{ ...label, marginBottom: 12 }}>Consejo IA</div>
        <Skeleton w="85%" h={13} style={{ marginBottom: 8 }} />
        <Skeleton w="65%" h={13} />
      </div>
    </div>
  )
}

/**
 * Mismo layout que el Dashboard real (debajo del selector de mes).
 * Los textos fijos se muestran reales; los datos son bloques.
 */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="dash-layout">
      <span className="sr-only">Cargando datos del mes…</span>

      <div className="dash-left">
        {/* Card principal */}
        <div className="card" style={{ padding: 20 }}>
          <div style={label}>Disponible</div>
          <Skeleton w="62%" h={42} r={10} style={{ margin: '10px 0 8px' }} />
          <Skeleton w="45%" h={13} />
          <Skeleton h={10} r={5} style={{ margin: '18px 0 16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i}>
                <Skeleton w="50%" h={11} style={{ marginBottom: 8 }} />
                <Skeleton w="80%" h={16} />
              </div>
            ))}
          </div>
        </div>

        {/* En qué se fue */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ ...label, marginBottom: 16 }}>En qué se fue</div>
          {[70, 52, 38, 24].map((w, i) => (
            <div key={i} style={{ marginBottom: i < 3 ? 16 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Skeleton w={`${30 + i * 5}%`} h={13} />
                <Skeleton w="22%" h={13} />
              </div>
              <Skeleton w={`${w}%`} h={6} r={3} />
            </div>
          ))}
        </div>
      </div>

      <div className="dash-right">
        {/* Últimos movimientos */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ ...label, marginBottom: 12 }}>Últimos movimientos</div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <Skeleton w={36} h={36} r={12} />
              <div style={{ flex: 1 }}>
                <Skeleton w="60%" h={13} style={{ marginBottom: 6 }} />
                <Skeleton w="40%" h={11} />
              </div>
              <Skeleton w={64} h={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
