/**
 * Formatos de fecha/hora compartidos por todo el front.
 *
 * El backend emite los timestamps con `datetime.utcnow().isoformat()`, es decir
 * strings UTC "naive" SIN marca de zona (ej. `2026-09-06T14:30:00.123456`). Si se
 * parsean tal cual, `new Date` los interpreta como hora LOCAL y la hora sale
 * desfasada. Por eso `toDate` les añade la `Z` antes de parsear, para tratarlos
 * como UTC; luego `Intl` los muestra en la zona local del navegador.
 */

/** Equivalente de `{{ tipo|title }}`. */
export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Convierte un string del backend en un `Date`, normalizando los timestamps UTC
 * "naive" (sin zona) para que se interpreten como UTC y no como hora local.
 * Devuelve `null` si el valor es vacío o no es una fecha válida.
 */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null

  let normalized = value
  // Solo los datetime (con 'T') pueden venir sin zona; los strings solo-fecha
  // ('2026-09-06') se dejan tal cual. Si no trae 'Z' ni offset (+hh:mm / -hh:mm),
  // asumimos UTC y le añadimos la 'Z'.
  if (value.includes('T') && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    normalized = `${value}Z`
  }

  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Fecha + hora en zona local del navegador, ej. `06 sept 2026, 14:30`. */
export function formatTimestamp(value: string | null): string {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : 'Sin fecha'
}

/** Solo fecha en zona local del navegador, ej. `06 sept 2026`. */
export function formatDate(value: string | null | undefined): string {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : 'Sin fecha'
}

/** "hace 4 min" / "hace 2 h" / "hace 3 d" — calculado a partir de la fecha real. */
export function timeAgo(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''

  const minutes = Math.round((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}
