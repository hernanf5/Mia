export function fmtARS(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}