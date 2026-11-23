// Siembra el árbol de categorías (con subcategorías) y las "Recomendaciones" tomados de
// Promo Opción (https://www.promoopcion.com, nov 2026). Solo CREA lo que falta: nunca
// modifica ni borra lo que ya existe, así que se puede repetir sin riesgo.
//
// Uso:  node scripts/seed-promoopcion.mjs <URL-del-admin> [--autofill]
//   ej: node scripts/seed-promoopcion.mjs https://admin-staging.promosolution.com.mx --autofill
// --autofill  llena cada recomendación con productos de TODOS los proveedores por palabras clave.

const base = (process.argv[2] ?? '').replace(/\/$/, '')
const autofill = process.argv.includes('--autofill')
if (!base.startsWith('http')) {
  console.error('Falta la URL del admin. Ej: node scripts/seed-promoopcion.mjs https://admin-staging.promosolution.com.mx')
  process.exit(1)
}

// Categoría principal -> subcategorías (tal cual las nombra Promo Opción).
const TREE = {
  'AGENDAS': ['DIARIA', 'SEMANAL'],
  'ANTIESTRES': ['FIGURAS ANTIESTRES'],
  'ARTICULOS PARA VIAJE': ['ACCESORIOS PARA VIAJE', 'CANGURERA y MOCHILA DE VIAJE', 'LENTES', 'ORGANIZADORES', 'PORTA DOCUMENTOS', 'NECESER'],
  'BAR': ['ARTICULOS PARA BAR', 'DESTAPADORES', 'LICORERAS', 'SACA CORCHOS', 'SET Y ESTUCHES'],
  'BEBIDAS': ['ARTICULOS PARA CAFÉ', 'CILINDROS DE PLASTICO', 'CILINDROS DE VIDRIO', 'CILINDROS METÁLICOS', 'TAZAS', 'TERMO DE PLASTICO', 'TERMO METALICO', 'VASOS'],
  'BELLEZA': ['ARTICULOS PARA DAMA', 'BROCHAS Y MAQUILLAJE', 'COSMETIQUERAS', 'COSTUREROS', 'ESPEJOS', 'JOYERIA', 'MANICURE', 'SETS DE BELLEZA'],
  'BOLSAS': ['BOLSA MOCHILA', 'BOLSAS ECOLOGICAS', 'BOLSAS REUTILIZBLES', 'BOLSAS CASUALES'],
  'COMPLEMENTOS': ['ACCESORIOS Y COMPLEMENTOS'],
  'DEPORTES': ['ARTICULOS DEPORTIVOS', 'FÚTBOL'],
  'ENTRETENIMIENTO': ['JUEGOS', 'SETS DE ENTRETENIMIENTO'],
  'ESCRITURA': ['BOLIGRAFOS ECOLOGICOS', 'BOLIGRAFOS FUNCIONES', 'BOLIGRAFOS METALICOS', 'BOLIGRAFOS PLASTICO', 'SETS DE BOLIGRAFOS'],
  'HERRAMIENTAS': ['AUTOMOVIL', 'LAMPARAS', 'NAVAJAS', 'SET DE HERRAMIENTAS'],
  'HIELERAS LONCHERAS Y PORTAVIANDAS': ['MOCHILA - HIELERA', 'HIELERAS Y LONCHERAS', 'PORTAVIANDAS'],
  'HOGAR': ['BBQ', 'CESTOS', 'COCINA', 'DECORACION', 'JARDINERÍA', 'MANDILES', 'MASCOTAS', 'TABLAS Y SETS DE QUESOS'],
  'LIBRETAS Y CARPETAS': ['LIBRETAS EJECUTIVAS', 'LIBRETAS ECOLOGICAS', 'SETS DE LIBRETAS', 'CARPETAS'],
  'LLAVEROS': ['LLAVEROS CURPIEL', 'LLAVEROS FUNCIONES', 'LLAVEROS MADERA', 'LLAVEROS METALICOS'],
  'MALETAS': ['MALETAS DE MANO', 'MALETAS TROLLEY'],
  'MOCHILAS': ['MOCHILAS DE VIAJE', 'MOCHILAS DEPORTIVAS', 'MOCHILAS EJECUTIVAS', 'MOCHILAS ESCOLARES', 'MOCHILAS TROLLEY'],
  'NIÑOS': ['ALCANCIAS', 'ESCOLARES', 'JUGUETES'],
  'OFICINA': ['ARTICULOS DE OFICINA', 'CALCULADORAS', 'PORTA NOTAS', 'PORTAGAFETE', 'RECONOCIMIENTOS', 'RELOJES', 'SETS EJECUTIVOS'],
  'PARAGUAS E IMPERMEABLES': ['IMPERMEABLES', 'PARAGUAS'],
  'PORTAFOLIOS': ['PORTAFOLIOS Y PORTALAPTOPS'],
  'SALUD': ['CUIDADO PERSONAL', 'GELES Y SANITIZANTES', 'PASTILLEROS'],
  'SETS DE REGALO': ['SETS'],
  'TECNOLOGIA': ['CABLES Y CARGADORES', 'ACCESORIOS DE COMPUTO', 'ACCESORIOS PARA SMARTPHONE Y TABLET', 'AUDÍFONOS', 'BASES Y SOPORTES', 'BOCINAS', 'POWER BANKS', 'SETS TECNOLOGIA', 'USB'],
  'TEXTILES': ['CHAMARRAS Y CHALECOS', 'GORRAS Y SOMBREROS', 'PLAYERAS'],
}

// Recomendaciones de Promo Opción, en su orden. kw = palabras para autollenar por NOMBRE de
// producto ("%" = comodín). Las de temporada llevan palabras de regalo típico: se afinan en el admin.
const RECS = [
  ['FUTBOL', 'Fútbol', 'Goal', 'futbol, soccer, balon de futbol'],
  ['ALGODON', 'Algodón', 'Shirt', 'algodon'],
  ['BOLIGRAFOS-TINTA-AZUL', 'Bolígrafos Tinta Azul', 'PenLine', 'boligrafo%azul, pluma%azul, tinta azul'],
  ['COLECCION-ROSA', 'Colección Rosa', 'Gem', 'rosa, rosado, pink'],
  ['DIA-DE-LA-MADRE', 'Día De La Madre', 'Flower2', 'cosmetiquera, espejo, joyero, masajeador, difusor, costurero, manicure'],
  ['DIA-DE-LA-MUJER', 'Día De La Mujer', 'Sparkles', 'cosmetiquera, espejo, joyero, brocha, maquillaje, manicure'],
  ['DIA-DE-MUERTOS-HALLOWEEN', 'Día De Muertos Y Halloween', 'Skull', 'calavera, halloween, catrina, dia de muertos, calabaza'],
  ['DIA-DEL-NINO', 'Día Del Niño', 'Baby', 'infantil, juguete, alcancia, crayones, kids'],
  ['DIA-DEL-PADRE', 'Día Del Padre', 'Wrench', 'bbq, parrilla, navaja, multiherramienta, destapador, cartera'],
  ['ECOLOGICOS', 'Ecológicos', 'Leaf', 'ecologico, ecologica, eco, bambu, reciclado, reciclada, rpet, biodegradable, kraft, corcho, trigo'],
  ['EXPLOSION-DE-COLOR', 'Explosión De Color', 'Palette', 'multicolor, neon, fluorescente'],
  ['FITNESS', 'Fitness', 'Dumbbell', 'fitness, gym, yoga, pesas, mancuerna, ejercicio, shaker, cuerda para saltar, toalla deportiva'],
  ['FORMULA-1', 'Fórmula 1', 'Flag', 'formula 1, f1, racing, carreras'],
  ['HECHO-EN-MEXICO', 'Hecho En México', 'MapPin', 'hecho en mexico, talavera, artesanal, artesania'],
  ['NAVIDAD', 'Navidad', 'TreePine', 'navidad, navideno, navidena, esfera, santa, nochebuena, reno'],
  ['LLAVEROS-CON-GRABADO-INCLUIDO', 'Llaveros Con Grabado Incluido', 'KeyRound', 'llavero'],
  ['RUNNERS', 'Runners', 'Footprints', 'runner, runners, running, correr, cangurera'],
  ['SALUD', 'Salud', 'HeartPulse', 'cubrebocas, sanitizante, gel antibacterial, termometro, botiquin, pastillero, antibacterial'],
  ['SAN-VALENTIN', 'San Valentín', 'Heart', 'corazon, san valentin, amor, cupido'],
  ['SUPERBOWL', 'Superbowl', 'Trophy', 'balon americano, super bowl, superbowl, football americano'],
  ['SUBLIMACION', 'Artículos Para Sublimación', 'Printer', 'sublimacion, sublimable, sublimar'],
  ['TERMOGRABADO', 'Termograbado', 'Flame', 'termograbado'],
  ['DETALLES-QUE-TRANSFORMAN', 'Artículos Para Transformación Promo', 'Sparkles', ''],
  ['PRODUCTOS-TINTOS', 'Productos Tintos', 'Wine', 'tinto, vino, burdeos, guinda'],
  ['PRIDE', 'Pride', 'Rainbow', 'pride, arcoiris, arco iris, rainbow, lgbt'],
]

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const title = s => s.toLowerCase().replace(/(^|[\s(-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())

async function api(path, init) {
  const res = await fetch(base + path, { headers: { 'Content-Type': 'application/json' }, ...init })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} -> ${res.status} ${body.error ?? ''}`)
  return body
}

// ── Categorías ────────────────────────────────────────────────────────────────
const existing = await api('/api/categories')
// Si hay duplicados por acentos (Tecnologia / Tecnología) gana el que tiene más productos.
const byNorm = new Map([...existing].sort((a, b) => (a._count?.products ?? 0) - (b._count?.products ?? 0)).map(c => [norm(c.name), c]))
let createdTop = 0, createdSub = 0, skipped = 0

for (const [topRaw, subs] of Object.entries(TREE)) {
  let top = byNorm.get(norm(topRaw))
  if (!top) {
    top = await api('/api/categories', { method: 'POST', body: JSON.stringify({ name: title(topRaw) }) })
    byNorm.set(norm(topRaw), top)
    createdTop++
    console.log('+ principal:', top.name)
  }
  for (const subRaw of subs) {
    const key = norm(subRaw)
    if (byNorm.has(key)) { skipped++; continue } // ya existe una categoría con ese nombre: no se duplica
    const sub = await api('/api/categories', { method: 'POST', body: JSON.stringify({ name: title(subRaw), parentId: top.id }) })
    byNorm.set(key, sub)
    createdSub++
  }
}
console.log(`Categorías: ${createdTop} principales nuevas, ${createdSub} subcategorías nuevas, ${skipped} omitidas por nombre ya existente`)

// ── Recomendaciones ───────────────────────────────────────────────────────────
const cols = await api('/api/collections')
const byCode = new Map(cols.map(c => [c.code, c]))
let createdRec = 0
for (const [i, [code, name, icon, kw]] of RECS.entries()) {
  let col = byCode.get(code)
  if (!col) {
    col = await api('/api/collections', { method: 'POST', body: JSON.stringify({ code, name, icon, matchKeywords: kw, sortOrder: (i + 1) * 10 }) })
    createdRec++
  }
  if (autofill && (col.matchKeywords ?? kw)) {
    const r = await api(`/api/collections/${col.id}/autofill`, { method: 'POST', body: JSON.stringify({}) })
    console.log(`  ${name}: ${r.added} productos nuevos`, JSON.stringify(r.byProvider))
  }
}
console.log(`Recomendaciones: ${createdRec} nuevas (de ${RECS.length})`)
