export function fmtARS(n) {
  return '$ ' + Math.abs(Math.round(n)).toLocaleString('es-AR')
}
