// Reglas para clasificar productos en las subcategorías (tomadas de Promo Opción) usando
// las palabras del NOMBRE del producto. Se usa primero en modo vista previa
// (scripts/classify-preview.mjs); no mueve nada por sí sola.
//
// El ORDEN importa: gana la primera regla que coincide, así que va de lo más específico
// ("set de regalo con pluma" es un set, no una pluma) a lo más general.
// Cada regla: r(categoría principal, subcategoría, todas-deben-coincidir, no-debe-coincidir).
// subcategoría = null es una regla de CONSERVACIÓN: el producto se queda donde está
// (p. ej. un llavero sin rasgo claro no debe caer en "Reconocimientos" por una palabra suelta).
// Los textos son regex ya sin acentos y en minúsculas; se les antepone \b (inicio de palabra).

export const norm = s =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const r = (parent, sub, all, not, desc = false) => ({
  parent,
  sub,
  desc,
  all: [].concat(all).map(x => new RegExp('\\b(?:' + x + ')')),
  not: not ? new RegExp('\\b(?:' + not + ')') : null,
})
// Regla "con descripción": el primer patrón (QUÉ ES el producto) se prueba solo contra el NOMBRE;
// los demás (material, uso) contra nombre + descripción. Va DESPUÉS de las reglas por nombre de su
// familia, para que lo escrito en el nombre mande sobre lo que dice la descripción.
const rd = (parent, sub, all, not) => r(parent, sub, all, not, true)

const SET = '(?:set|kit|juego|combo)s?\\b'
const SET_E = '(?:set|kit|juego|estuche|combo)s?\\b' // con "estuche": útil en plumas, belleza y bar
const ECO = 'eco(?:logic[oa]s?)?\\b|bambu|reciclad|carton|kraft|trigo|rpet|corcho|biodegrad'

export const RULES = [
  // ── Sets (primero) ─────────────────────────────────────────────────────────
  r('SETS DE REGALO', 'SETS', '(?:set|kit|paquete|combo)s? de (?:regalo|obsequio|bienvenida)|welcome kit'),
  r('TECNOLOGIA', 'SETS TECNOLOGIA', [SET, 'usb|power ?bank|audifono|cable|cargador|bocina|tecnolog']),
  r('OFICINA', 'SETS EJECUTIVOS', [SET, 'ejecutiv|escritorio|oficina']),
  r('LIBRETAS Y CARPETAS', 'SETS DE LIBRETAS', [SET, 'libreta|cuaderno|libro de notas']),
  r('ESCRITURA', 'SETS DE BOLIGRAFOS', [SET_E, 'bolig|pluma|esfero|escritura']),
  r('BELLEZA', 'SETS DE BELLEZA', [SET_E, 'belleza|spa\\b|manicure|cuidado|maquillaje|cosmetic|bano|facial']),
  r('BAR', 'SET Y ESTUCHES', [SET_E, 'licor|whisky|tequila|copa|coctel|cantina|sommelier|bar\\b|para vinos?|de vinos?|vinos\\b']),
  r('ENTRETENIMIENTO', 'SETS DE ENTRETENIMIENTO', [SET_E, 'poker|ajedrez|domino|entretenimiento|juego de mesa']),

  // ── Llaveros ───────────────────────────────────────────────────────────────
  r('LLAVEROS', 'LLAVEROS FUNCIONES', ['llavero', 'destapador|abridor|linterna|luz\\b|led\\b|navaja|multi|medidor|lupa|silbato|flexometro|cinta metrica|calculadora|antibacterial|moneda|usb|carrito|tarjeta']),
  r('LLAVEROS', 'LLAVEROS CURPIEL', ['llavero', 'piel|curpiel|vinil|cuero|polipiel']),
  r('LLAVEROS', 'LLAVEROS MADERA', ['llavero', 'madera|bambu|corcho']),
  r('LLAVEROS', 'LLAVEROS METALICOS', ['llavero', 'metal|aluminio|acero|zamak|cromad']),
  rd('LLAVEROS', 'LLAVEROS CURPIEL', ['llavero', 'llavero (?:\\w+ ){0,3}(?:de |en )?(?:piel|curpiel|polipiel|vinil|cuero)']),
  rd('LLAVEROS', 'LLAVEROS MADERA', ['llavero', 'llavero (?:\\w+ ){0,3}(?:de |en )?(?:madera|bambu|corcho)']),
  rd('LLAVEROS', 'LLAVEROS METALICOS', ['llavero', 'llavero (?:\\w+ ){0,3}(?:de |en )?(?:metal|aluminio|acero|zamak)|llavero metalico']),
  r('LLAVEROS', null, 'llavero'),

  // ── Mochilas ───────────────────────────────────────────────────────────────
  r('HIELERAS LONCHERAS Y PORTAVIANDAS', 'MOCHILA - HIELERA', ['mochila', 'hielera|lonchera|termic|cooler|enfriador|aislante']),
  r('BOLSAS', 'BOLSA MOCHILA', 'bolsa[ -]mochila|jareta|drawstring|string bag|mochila (?:de |tipo )?(?:bolsa|cordon|cordones)'),
  r('MOCHILAS', 'MOCHILAS TROLLEY', ['mochila', 'trolley|ruedas|rodante|carrito']),
  r('MOCHILAS', 'MOCHILAS ESCOLARES', ['mochila', 'escolar|kids|infantil|nino|nina|primaria|juvenil']),
  r('MOCHILAS', 'MOCHILAS EJECUTIVAS', ['mochila', 'ejecutiv|laptop|notebook|negocio|executive|business|computadora']),
  r('MOCHILAS', 'MOCHILAS DEPORTIVAS', ['mochila', 'deportiv|gym|sport|running|gimnasio|trail|fitness']),
  r('MOCHILAS', 'MOCHILAS DE VIAJE', ['mochila', 'viaje|travel|excursion|camping|senderismo|hiking|expedicion|cabina|aventura']),
  // ("trolley" en la descripción suele ser el pase para deslizarla sobre la maleta, no que lleve ruedas)
  rd('MOCHILAS', 'MOCHILAS TROLLEY', ['mochila', 'con ruedas|sobre ruedas|rodante']),
  rd('MOCHILAS', 'MOCHILAS ESCOLARES', ['mochila', 'escolar|infantil|ninos|ninas|primaria']),
  rd('MOCHILAS', 'MOCHILAS EJECUTIVAS', ['mochila', 'laptop|notebook|computadora|ejecutiv|negocio']),
  rd('MOCHILAS', 'MOCHILAS DEPORTIVAS', ['mochila', 'deportiv|gimnasio|gym\\b|running|fitness']),
  rd('MOCHILAS', 'MOCHILAS DE VIAJE', ['mochila', 'viaje|travel|excursion|camping|senderismo|aventura']),
  r('MOCHILAS', null, 'mochila'),

  // ── Tecnología ─────────────────────────────────────────────────────────────
  r('TECNOLOGIA', 'POWER BANKS', 'power ?bank|cargador portatil|bateria|banco de energia', 'lampara|luz\\b|linterna|ventilador|bocina|reloj|juguete'),
  r('TECNOLOGIA', 'AUDÍFONOS', 'audifono|auricular|earbud|headphone|manos libres|tws\\b'),
  r('TECNOLOGIA', 'BOCINAS', 'bocina|altavoz|speaker|parlante|soundbar'),
  r('TECNOLOGIA', 'BASES Y SOPORTES', ['soporte|base\\b|stand\\b|atril|tripie', 'celular|telefono|tablet|laptop|computadora|monitor|smartphone|ipad|notebook']),
  r('TECNOLOGIA', 'CABLES Y CARGADORES', 'cable|cargador|multicargador|adaptador de corriente|conector'),
  r('TECNOLOGIA', 'USB', 'usb|pendrive|memoria (?:flash|usb)|flash drive', 'cable|cargador|hub\\b|ventilador|lampara|luz|led\\b|adaptador|termo|taza|calentador|lector|power|bolig|pluma|mouse|teclado|humidificador|difusor'),
  r('TECNOLOGIA', 'ACCESORIOS DE COMPUTO', 'mouse|mousepad|teclado|webcam|camara web|hub\\b|concentrador de puertos|lector de tarjeta|limpiador de pantalla|cubre ?camara'),
  r('TECNOLOGIA', 'ACCESORIOS PARA SMARTPHONE Y TABLET', 'popsocket|pop socket|selfie|tripode|stylus|aro de luz|ring light|monopie|funda (?:\\w+ ){0,2}para (?:celular|telefono|tablet)|porta ?celular|lente para (?:celular|telefono)'),

  // ── Hieleras / portaviandas (antes de cocina y bebidas) ────────────────────
  r('HIELERAS LONCHERAS Y PORTAVIANDAS', 'PORTAVIANDAS', 'portaviandas?|porta viandas?|vianda|lunch ?box|box lunch|contenedor(?:es)? de alimentos|tupper|set de contenedores'),
  r('HIELERAS LONCHERAS Y PORTAVIANDAS', 'HIELERAS Y LONCHERAS', 'hielera|lonchera|cooler|bolsa (?:termica|isotermica)|enfriador de'),

  // ── Niños y antiestrés (antes de oficina y deportes) ───────────────────────
  r('ANTIESTRES', 'FIGURAS ANTIESTRES', 'anti[ -]?estres|anti[ -]?stress|squishy|estres\\b'),
  r('NIÑOS', 'ALCANCIAS', 'alcancia|puerquito|cochinito'),
  r('NIÑOS', 'ESCOLARES', 'crayon|lapices de color|escolar|plastilina|acuarela|colorear|kit de arte|set de arte|dibujo|pizarron|estuche de color'),
  r('NIÑOS', 'JUGUETES', 'juguete|peluche|muneco|muneca|carrito|robot|burbuja|pistola de agua|dinosaurio|bloques|slime|volador|papalote|cometa|sonaja|mordedera'),

  // ── Oficina (antes de bar: "copa trofeo") ──────────────────────────────────
  r('OFICINA', 'CALCULADORAS', 'calculadora'),
  r('OFICINA', 'RELOJES', 'reloj|smart ?watch|banda inteligente|pulsera inteligente'),
  r('OFICINA', 'PORTAGAFETE', 'gafete|portagafetes?|credencial|lanyard|cordon (?:para )?(?:cuello|gafete)|porta ?identificacion'),
  r('OFICINA', 'PORTA NOTAS', 'porta ?notas|notas? (?:adhesiv|adherible|autoadherible)|post[ -]?it|banderita|banderilla|memo ?pad|taco de notas', 'carpeta|folder'),
  r('OFICINA', 'RECONOCIMIENTOS', 'trofeo|medalla|reconocimiento|placas? de\\b|galardon|plaqueta|estatuilla', 'pin\\b|lanyard|llavero'),
  r('OFICINA', 'ARTICULOS DE OFICINA', 'grapadora|engrapadora|perforadora|porta ?lapiz|portalapices|lapicero|lapiz|lapices|sacapuntas|borrador|regla\\b|tijera|clips?\\b|marcatextos?|resaltador|plumon|marcador|clipboard|tablilla|abrecartas|organizador de escritorio|tapete de escritorio|sello\\b|pintarron|escritorio', 'bolig|pluma|esfero|llavero|libreta|lampara'),
  r('PORTAFOLIOS', 'PORTAFOLIOS Y PORTALAPTOPS', 'portafolio|portalaptop|porta laptop|funda (?:para )?(?:laptop|computadora|notebook)|maletin|sleeve'),
  r('PARAGUAS E IMPERMEABLES', 'PARAGUAS', 'paraguas|sombrilla|parasol'),

  // ── Textiles e impermeables (antes de belleza y decoración) ────────────────
  r('PARAGUAS E IMPERMEABLES', 'IMPERMEABLES', 'impermeable|poncho|chubasquero|capa (?:de|para) lluvia', 'mochila|bolsa|cangurera|funda|maleta|bocina|reloj|termo|cilindro|lonchera|estuche|bolso|morral|neceser|cobija|manta|portafolio|paraguas|sombrilla|cobertor|tela|cortavientos|chamarra|chaleco'),
  r('TEXTILES', 'CHAMARRAS Y CHALECOS', 'chamarra|chaleco|sudadera|rompevientos|cortavientos|abrigo|sueter|parka|hoodie|cardigan'),
  r('TEXTILES', 'GORRAS Y SOMBREROS', 'gorra|gorro|sombrero|visera|cachucha|bucket|boina'),
  r('TEXTILES', 'PLAYERAS', 'playera|camiseta|polo\\b|camisa|t-?shirt|jersey|blusa'),

  // ── Libretas y agendas (antes de bolígrafos: "libreta con bolígrafo" es libreta) ──
  r('LIBRETAS Y CARPETAS', 'LIBRETAS ECOLOGICAS', ['libreta|cuaderno|libro de notas|block', ECO + '|piedra']),
  r('LIBRETAS Y CARPETAS', 'CARPETAS', 'carpeta|folder\\b'),
  r('LIBRETAS Y CARPETAS', 'LIBRETAS EJECUTIVAS', 'libreta|cuaderno|libro de notas|block de notas|bloc de notas'),
  r('AGENDAS', 'DIARIA', ['agenda|planeador', 'diaria|365|dia por pagina|1 dia']),
  r('AGENDAS', 'SEMANAL', ['agenda|planeador', 'semanal|semana']),
  rd('AGENDAS', 'DIARIA', ['agenda|agendario|planeador', 'diaria|(?:una|1) pagina por dia|dia por pagina|365 dias|hoja por dia']),
  rd('AGENDAS', 'SEMANAL', ['agenda|agendario|planeador', 'semanal|(?:una|1) pagina por semana|vista semanal|semana por pagina|semana a la vista']),
  r('AGENDAS', null, 'agenda|agendario|planeador'),

  // ── Escritura ──────────────────────────────────────────────────────────────
  r('ESCRITURA', 'BOLIGRAFOS FUNCIONES', ['bolig|pluma|esfero', 'touch|stylus|puntero|laser|luz\\b|led\\b|multifunc|usb|destapador|antibac|lampara|2 en 1|3 en 1|soporte|reloj|memoria']),
  r('ESCRITURA', 'BOLIGRAFOS METALICOS', ['bolig|pluma|esfero', 'metal|aluminio|acero|cromad']),
  r('ESCRITURA', 'BOLIGRAFOS ECOLOGICOS', ['bolig|pluma|esfero', ECO + '|madera']),
  r('ESCRITURA', 'BOLIGRAFOS PLASTICO', ['bolig|pluma|esfero', 'plastic']),
  // Sin material en el nombre: se decide por la descripción ("Bolígrafo plástico con...", "Bolígrafo metálico...").
  // Si ni el nombre ni la descripción dicen el material, NO se adivina: queda donde está.
  rd('ESCRITURA', 'BOLIGRAFOS FUNCIONES', ['bolig|pluma|esfero', 'touch screen|pantalla tactil|puntero laser|multifuncion|con luz led']),
  rd('ESCRITURA', 'BOLIGRAFOS METALICOS', ['bolig|pluma|esfero', 'bolig\\w* (?:\\w+ ){0,2}(?:metalic[oa]|de aluminio|de metal|de acero|en aluminio|en metal)|cuerpo (?:\\w+ ){0,2}(?:de |en )?(?:aluminio|metal|acero)']),
  rd('ESCRITURA', 'BOLIGRAFOS ECOLOGICOS', ['bolig|pluma|esfero', 'bolig\\w* (?:\\w+ ){0,2}(?:ecologic[oa]|reciclad[oa]|biodegradable|de (?:bambu|carton|trigo|madera|corcho))|cuerpo (?:\\w+ ){0,2}(?:de |en )?(?:bambu|carton|trigo|madera|corcho|reciclad)|eco-?friendly|fibra de trigo|material eco']),
  rd('ESCRITURA', 'BOLIGRAFOS PLASTICO', ['bolig|pluma|esfero', 'bolig\\w* (?:\\w+ ){0,2}(?:de |en )?plastic|cuerpo (?:\\w+ ){0,2}(?:de |en )?plastic|\\babs\\b']),
  r('ESCRITURA', null, 'bolig|pluma|esfero'),

  // ── Bebidas ────────────────────────────────────────────────────────────────
  r('BEBIDAS', 'TAZAS', 'taza|tazon|mug\\b', 'porta ?taza|caja|empaque'),
  r('BEBIDAS', 'TERMO METALICO', ['termo\\b|termico|thermos', 'acero|metal|inoxidable|aluminio']),
  r('BEBIDAS', 'TERMO DE PLASTICO', ['termo\\b|termico|thermos', 'plastic|pp\\b|tritan']),
  // Termo sin material en el nombre: la descripción lo dice ("Pared interna y externa de acero inoxidable").
  rd('BEBIDAS', 'TERMO DE PLASTICO', ['termo\\b|thermos', 'termo (?:\\w+ ){0,3}(?:de |en )?(?:plastic|polipropileno|tritan)|(?:cuerpo|pared|paredes) (?:\\w+ ){0,2}(?:de |en )?(?:plastic|polipropileno|tritan)|fabricad[oa] en plastic']),
  rd('BEBIDAS', 'TERMO METALICO', ['termo\\b|thermos', 'acero|inoxidable|aluminio']),
  r('BEBIDAS', null, 'termo\\b'),
  r('BEBIDAS', 'CILINDROS DE VIDRIO', ['cilindro|botella|garrafa|jarra', 'vidrio|cristal'], 'vino|licor|tequila'),
  r('BEBIDAS', 'CILINDROS METÁLICOS', ['cilindro|botella|garrafa|bidon', 'acero|aluminio|metal|inoxidable']),
  r('BEBIDAS', 'CILINDROS DE PLASTICO', 'cilindro|botella|garrafa|bidon|shaker|sport bottle', 'vino|licor|tequila|sacacorcho|destapador|abridor|porta ?botella|bolsa|funda|accesorio|difusor|perfume|aroma'),
  r('BEBIDAS', 'VASOS', 'vasos?\\b|tarro', 'termo|cilindro|caja|empaque|estuche'),
  r('BEBIDAS', 'ARTICULOS PARA CAFÉ', 'cafetera|prensa francesa|molino de cafe|espumador|capuchinador|filtro para cafe|kit de cafe|set de cafe|dosificador de cafe|cafe molido|cafe soluble'),

  // ── Bar ────────────────────────────────────────────────────────────────────
  r('BAR', 'SACA CORCHOS', 'sacacorcho|saca corcho|descorchador'),
  r('BAR', 'DESTAPADORES', 'destapador|abrebotella|abridor de botella'),
  r('BAR', 'LICORERAS', 'licorera|petaca|decantador|caballito|tequilero|copa tequilera'),
  r('BAR', 'ARTICULOS PARA BAR', 'copas?\\b|coctelera|pinzas? para hielo|hielo|posavasos|enfriador de vino|cubeta|sommelier|accesorios? (?:p/|para )vinos?|para vinos?', 'mundial|fifa'),

  // ── Viaje (antes de maletas: "candado para maleta") ────────────────────────
  r('ARTICULOS PARA VIAJE', 'NECESER', 'neceser|bolsa de aseo|kit de aseo'),
  r('ARTICULOS PARA VIAJE', 'PORTA DOCUMENTOS', 'pasaporte|portadocumento|porta documento|tarjetero|portatarjeta|porta tarjeta|cartera de viaje'),
  r('ARTICULOS PARA VIAJE', 'CANGURERA y MOCHILA DE VIAJE', 'cangurera|rinonera|fanny|belt bag'),
  r('ARTICULOS PARA VIAJE', 'LENTES', 'lentes|gafas|anteojos|sunglass'),
  r('ARTICULOS PARA VIAJE', 'ACCESORIOS PARA VIAJE', 'almohada (?:de viaje|cervical)|cuello inflable|etiqueta (?:para )?equipaje|identificador de maleta|candado|bascula (?:para |de )?equipaje|antifaz|adaptador (?:universal|de viaje)|cubre ?maleta|forro para maleta|cinta para maleta|tapones'),
  r('ARTICULOS PARA VIAJE', 'ORGANIZADORES', 'organizador|packing cube'),
  r('MALETAS', 'MALETAS TROLLEY', ['maletas?\\b|valija', 'trolley|ruedas|rodante|cabina|carry']),
  r('MALETAS', 'MALETAS DE MANO', 'maletas?\\b|valija'),

  // ── Hogar (primera parte) y mascotas (antes de joyería: "collar") ──────────
  r('HOGAR', 'MANDILES', 'mandil|delantal'),
  r('HOGAR', 'TABLAS Y SETS DE QUESOS', 'queso|tablas?\\b', 'yoga|surf|skate|periodica|multiplicar|calculadora|snowboard'),
  r('HOGAR', 'BBQ', 'bbq|barbacoa|asador|parrilla|carne asada|pinzas? para asar|brocha para asar'),
  r('HOGAR', 'MASCOTAS', 'mascota|perro|gatos?\\b|canin|felin', 'hidraulic|juego de gato'),
  r('HOGAR', 'JARDINERÍA', 'maceta|macetero|semilla|jardin|regadera|plantas?\\b|cultivo|germinad|huerto'),
  r('HOGAR', 'CESTOS', 'cesto|canasta|canasto|cesta\\b|bote de basura|bote para basura'),

  // ── Belleza y salud ────────────────────────────────────────────────────────
  r('BELLEZA', 'COSMETIQUERAS', 'cosmetiquer|bolsa de maquillaje|estuche de maquillaje'),
  r('BELLEZA', 'ESPEJOS', 'espejo|espejito'),
  r('BELLEZA', 'MANICURE', 'manicure|pedicure|cortaunas|limas?\\b|esmalte'),
  r('BELLEZA', 'BROCHAS Y MAQUILLAJE', 'brocha|maquillaje|rubor|delineador|pestanina|brillo labial|lip gloss|sombra para ojos'),
  r('BELLEZA', 'COSTUREROS', 'costurer|kit de costura|set de costura|agujas?\\b|hilo y aguja'),
  r('BELLEZA', 'JOYERIA', 'joyero|alhajero|joyeria|pulsera|collar|arete|dije\\b|brazalete|mancuernilla|broche', 'tyvek|plastificado|planilla|gel|sanitizante'),
  r('BELLEZA', 'ARTICULOS PARA DAMA', 'damas?\\b|mujer|mujeres|femenin|secadora|plancha para cabello|cepillo para cabello|tocador'),
  r('SALUD', 'GELES Y SANITIZANTES', 'gel (?:antibacterial|sanitizante)|sanitizante|antibacterial|desinfectante|alcohol en gel|alcohol gel|toallitas'),
  r('SALUD', 'PASTILLEROS', 'pastillero|porta ?pastillas|organizador de pastillas'),
  r('SALUD', 'CUIDADO PERSONAL', 'balsamo|labial|crema|jabon|shampoo|cepillo|peine|masajeador|compresa|termometro|cubrebocas|tapabocas|mascarilla|higiene|repelente (?:de|para|contra)|bloqueador|protector solar|desodorante|perfume|colonia'),

  // ── Herramientas y hogar (segunda parte) ───────────────────────────────────
  r('HERRAMIENTAS', 'NAVAJAS', 'navaja|multiherramienta|multi herramienta|canivete|herramienta multiple'),
  r('HERRAMIENTAS', 'LAMPARAS', 'lampara|linterna|farol|frontal|reflector|luz de emergencia|foco\\b'),
  r('HERRAMIENTAS', 'SET DE HERRAMIENTAS', 'herramienta|destornillador|desarmador|martillo|flexometro|cinta metrica|llave allen|taladro|nivel\\b'),
  r('HERRAMIENTAS', 'AUTOMOVIL', 'automovil|vehiculo|coche|parabrisas|cubre ?asiento|para auto\\b|de auto\\b|para carro\\b|de carro\\b|llanta|inflador|kit de emergencia|pasa ?corriente|raspador'),
  r('HOGAR', 'DECORACION', 'portarretrato|porta retrato|figura decorativa|vela\\b|veladora|florero|jarron|adorno|esfera|luminaria|candelabro|difusor|aromatizante|incienso|cojin|almohada|manta\\b|cobija|frazada|cuadro\\b', 'bolsa|mochila|morral|tote|cangurera'),
  r('HOGAR', 'COCINA', 'cuchillo|cuchara|tenedor|cubierto|sarten|olla\\b|molde|licuadora|batidora|exprimidor|colador|rallador|pelador|bandeja|abrelatas|salero|pimentero|bowl|platos?\\b|charola|recipiente|pinzas? para cocina|espatula|rodillo|cocina'),

  // ── Deportes y entretenimiento ─────────────────────────────────────────────
  r('DEPORTES', 'FÚTBOL', ['futbol(?! americano)|soccer', 'balon|futbolito|porteria|jersey|pelota|uniforme|silbato'], 'bolsa|mochila|llavero|cangurera|impermeable|termo|vaso|taza|estuche|monedero'),
  r('DEPORTES', 'ARTICULOS DEPORTIVOS', 'deportiv|balon|pelota|raqueta|yoga|mancuerna|pesas|cuerda para saltar|banda elastica|banda de resistencia|fitness|gimnasio|bicicleta|golf|tenis\\b|basquet|beisbol|natacion|frisbee|boxeo|ejercicio', 'bolsa|mochila|cangurera|cilindro|botella|termo|gorra|playera|chamarra'),
  r('ENTRETENIMIENTO', 'JUEGOS', 'rompecabezas|puzzle|memorama|baraja|domino|ajedrez|loteria|dados\\b|dardos|mini juegos?\\b|poker|rubik|yoyo|trompo|damas chinas|juego de mesa|jenga|twister|juego de (?:destreza|ingenio)'),

  // ── Complementos y bolsas (al final) ───────────────────────────────────────
  r('COMPLEMENTOS', 'ACCESORIOS Y COMPLEMENTOS', 'cartera|billetera|cinturon|bufanda|guantes|corbata|panuelo|pashmina|calcetin|calceta|mascada|tirantes'),
  r('BOLSAS', 'BOLSAS ECOLOGICAS', ['bolsa|bolso|tote|morral', ECO + '|algodon|yute|papel|manta|lona|canvas|cartulina']),
  r('BOLSAS', 'BOLSAS REUTILIZBLES', ['bolsa|bolso|tote|morral', 'reutilizable|plegable|no tejida|tnt\\b|non ?woven|tela|nylon|poliester|super|mandado|compras|shopper']),
  r('BOLSAS', 'BOLSAS CASUALES', 'casual|tote|messenger|bandolera|crossbody|mensajero|morral|bolso|shopping'),
  // "BOLSA ABBA AZUL": el nombre no dice el tipo; la descripción sí ("non woven", "algodón", "yute"...).
  rd('BOLSAS', 'BOLSAS ECOLOGICAS', ['bolsa', 'algodon|yute|canvas|lona\\b|kraft|papel|reciclad|manta\\b|pana\\b']),
  rd('BOLSAS', 'BOLSAS REUTILIZBLES', ['bolsa', 'non ?woven|nonwoven|plegable|reutilizable|poliester|nylon|tnt\\b']),
  rd('BOLSAS', 'BOLSAS ECOLOGICAS', ['bolsa', 'ecologic']),
]

// Todas las reglas que coinciden con el nombre (la primera es la que gana).
export const matches = (name, description = '') => {
  const n = norm(name)
  const t = n + ' ' + norm(description).replace(/\s+/g, ' ')
  return RULES.filter(rule =>
    rule.all.every((re, i) => re.test(rule.desc && i > 0 ? t : n)) && !(rule.not && rule.not.test(n)))
}
