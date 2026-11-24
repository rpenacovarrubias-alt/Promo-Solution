// VISTA PREVIA de la clasificación de productos en subcategorías. Solo LEE (GET) del admin;
// no modifica nada. Genera .claude/clasificacion-preview.md y .claude/clasificacion-preview.csv
//
// Uso: node scripts/classify-preview.mjs <URL-del-admin> [--cache archivo.json]
//   ej: node scripts/classify-preview.mjs https://admin-staging.promosolution.com.mx --cache tmp.json
import fs from 'node:fs'
import { RULES, matches, norm } from '../lib/subcategoryRules.js'

const base = (process.argv[2] ?? '').replace(/\/$/, '')
const cacheIdx = process.argv.indexOf('--cache')
const cacheFile = cacheIdx > 0 ? process.argv[cacheIdx + 1] : null
if (!base.startsWith('http')) {
  console.error('Falta la URL del admin. Ej: node scripts/classify-preview.mjs https://admin-staging.promosolution.com.mx')
  process.exit(1)
}

async function loadProducts() {
  if (cacheFile && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
  const out = []
  for (let page = 1; ; page++) {
    const res = await fetch(`${base}/api/products?limit=300&page=${page}`)
    if (!res.ok) throw new Error(`GET /api/products?page=${page} -> ${res.status}`)
    const body = await res.json()
    for (const p of body.data) {
      out.push({ id: p.id, name: p.name, desc: p.description ?? '', cat: p.category?.name ?? '(sin categoría)', prov: p.provider?.name ?? '?', active: p.isActive && p.isVisible })
    }
    process.stderr.write(`\rleídos ${out.length}/${body.pagination.total}`)
    if (!body.pagination.hasNext) break
  }
  process.stderr.write('\n')
  if (cacheFile) fs.writeFileSync(cacheFile, JSON.stringify(out))
  return out
}

const products = await loadProducts()

// ── Clasificar ────────────────────────────────────────────────────────────────
const SUB_RULES = RULES.filter(r => r.sub)
const bySub = new Map(SUB_RULES.map(r => [r.sub, { parent: r.parent, items: [] }]))
const unclassified = [] // ninguna regla coincide: se queda donde está
const kept = []         // regla de conservación (sub = null): se queda donde está
const conflicts = new Map() // "ganadora | otra" -> n
let multi = 0
for (const p of products) {
  const hits = matches(p.name, p.desc)
  if (!hits.length) { unclassified.push(p); continue }
  if (hits[0].sub === null) { kept.push(p); continue }
  bySub.get(hits[0].sub).items.push(p)
  if (hits.length > 1) {
    multi++
    for (const h of hits.slice(1)) {
      const k = `${hits[0].sub} | ${h.sub ?? '(se queda)'}`
      conflicts.set(k, (conflicts.get(k) ?? 0) + 1)
    }
  }
}

// ── Reporte ───────────────────────────────────────────────────────────────────
const top = (items, key, n) => {
  const c = new Map()
  for (const it of items) c.set(it[key], (c.get(it[key]) ?? 0) + 1)
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(', ')
}
const spread = (items, n) => {
  const act = items.filter(i => i.active)
  const src = act.length >= n ? act : items
  const step = Math.max(1, Math.floor(src.length / n))
  return Array.from({ length: Math.min(n, src.length) }, (_, i) => src[i * step].name)
}

const total = products.length
const activeTotal = products.filter(p => p.active).length
const classified = [...bySub.values()].reduce((s, v) => s + v.items.length, 0)
const classifiedActive = [...bySub.values()].reduce((s, v) => s + v.items.filter(i => i.active).length, 0)

let md = `# Vista previa de clasificación en subcategorías\n\n`
md += `Fuente: ${base} · productos leídos: ${total} (${activeTotal} activos y visibles)\n\n`
md += `- Se moverían a una subcategoría **${classified}** productos (**${classifiedActive}** activos).\n`
md += `- Se quedan donde están: **${unclassified.length + kept.length}** (${unclassified.length} sin ninguna regla + ${kept.length} por regla de conservación: llavero, mochila, termo o agendario sin rasgo claro).\n`
md += `- Productos que coinciden con más de una regla: **${multi}** (gana la primera regla; ver conflictos al final).\n`
md += `- NO se movió nada: esto es solo lectura.\n\n`

const parents = [...new Set(SUB_RULES.map(r => r.parent))]
for (const parent of parents) {
  const subs = [...new Set(SUB_RULES.filter(r => r.parent === parent).map(r => r.sub))]
  const n = subs.reduce((s, sub) => s + bySub.get(sub).items.length, 0)
  md += `## ${parent} — ${n} productos\n\n`
  for (const sub of subs) {
    const { items } = bySub.get(sub)
    const act = items.filter(i => i.active).length
    md += `### ${sub}: ${items.length} (${act} activos)\n`
    if (!items.length) { md += `_sin coincidencias_\n\n`; continue }
    md += `- Proveedores: ${top(items, 'prov', 4)}\n`
    md += `- Vienen de: ${top(items, 'cat', 4)}\n`
    md += `- Ejemplos: ${spread(items, 6).join(' · ')}\n\n`
  }
}

md += `## Se quedan por regla de conservación: ${kept.length}\n\n`
md += `Categorías de origen: ${top(kept, 'cat', 8)}\n\n`
md += `Muestra: ${spread(kept, 12).join(' · ')}\n\n`
md += `## Sin ninguna regla (se quedan donde están): ${unclassified.length}\n\n`
md += `Categorías de origen más frecuentes: ${top(unclassified, 'cat', 12)}\n\n`
md += `Muestra: ${spread(unclassified, 25).join(' · ')}\n\n`
md += `## Conflictos (ganadora | otra regla que también coincidía)\n\n`
for (const [k, v] of [...conflicts].sort((a, b) => b[1] - a[1]).slice(0, 25)) md += `- ${k}: ${v}\n`

fs.mkdirSync('.claude', { recursive: true })
fs.writeFileSync('.claude/clasificacion-preview.md', md)

const q = s => `"${String(s).replace(/"/g, '""')}"`
const rows = ['id,nombre,activo,categoria_actual,subcategoria_propuesta,categoria_principal']
for (const [sub, { parent, items }] of bySub) for (const p of items) rows.push([p.id, q(p.name), p.active, q(p.cat), q(sub), q(parent)].join(','))
fs.writeFileSync('.claude/clasificacion-preview.csv', rows.join('\n'))

console.log(`Total ${total} | se moverían ${classified} (activos ${classifiedActive}) | se quedan ${unclassified.length + kept.length} (${kept.length} por conservación) | conflictos ${multi}`)
console.log('Reporte: .claude/clasificacion-preview.md  ·  Detalle: .claude/clasificacion-preview.csv')
void norm
