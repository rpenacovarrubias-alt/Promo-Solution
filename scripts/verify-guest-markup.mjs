// ponytail: smallest runnable check for the guest-pricing bug (routes/public/products.js
// and lib/julio/tools.js — same bug, two code paths).
// Run: node scripts/verify-guest-markup.mjs
import assert from 'node:assert/strict'
import { formatProduct } from '../routes/public/products.js'
import { mapProduct } from '../lib/julio/tools.js'

const product = { id: 'p1', name: 'Taza', basePrice: 100, isActive: true, isFeatured: false, stock: 10, category: null, images: [], colors: [], variants: [] }

// Guest (no session, clientMarkup null) must get the 33% default, not the raw provider price.
assert.equal(formatProduct(product, null).finalPrice, 133, 'invitado debe ver basePrice + 33%, no el precio crudo del proveedor')

// Logged-in client with a custom % still overrides the guest default.
assert.equal(formatProduct(product, 20).finalPrice, 120, 'cliente logueado debe usar SU markupPercent')

// Julio (Telegram/WhatsApp) todavía no identifica al cliente al listar productos —
// debe cotizar con el mismo default de 33%, no con el precio crudo del proveedor.
const julioProduct = { id: 'p1', externalId: 'SKU-1', name: 'Taza', description: '', basePrice: 100, images: [], variants: [], stock: 10 }
assert.equal(mapProduct(julioProduct).precio, 133, 'Julio debe cotizar basePrice + 33%, no el precio crudo del proveedor')

console.log('OK: precio de invitado, cliente logueado y Julio calculan correctamente')
