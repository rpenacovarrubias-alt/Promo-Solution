// ponytail: smallest runnable check for the guest-pricing bug (routes/public/products.js).
// Run: node scripts/verify-guest-markup.mjs
import assert from 'node:assert/strict'
import { formatProduct } from '../routes/public/products.js'

const product = { id: 'p1', name: 'Taza', basePrice: 100, isActive: true, isFeatured: false, stock: 10, category: null, images: [], colors: [], variants: [] }

// Guest (no session, clientMarkup null) must get the 33% default, not the raw provider price.
assert.equal(formatProduct(product, null).finalPrice, 133, 'invitado debe ver basePrice + 33%, no el precio crudo del proveedor')

// Logged-in client with a custom % still overrides the guest default.
assert.equal(formatProduct(product, 20).finalPrice, 120, 'cliente logueado debe usar SU markupPercent')

console.log('OK: precio de invitado y de cliente logueado calculan correctamente')
