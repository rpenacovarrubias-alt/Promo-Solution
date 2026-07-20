# CLAUDE.md — Promo Solution
> Este archivo es específico del proyecto PromoSolution.
> Para contexto global del ecosistema: lee C:\Proyectos\CLAUDE.md

---

## Proyecto
Plataforma white-label de productos promocionales con agente IA de ventas.
**Repos:**
- `C:\Proyectos\PromoSolution\Promo-Solution\` (rpenacovarrubias-alt)
- `C:\Proyectos\PromoSolution\my-promoprice\`
**Sitio:** promosolution.com.mx

## Stack
- PostgreSQL `promosolution-db` (EasyPanel puerto 5432)
- Redis (caché de conversaciones)
- Docker scraper: 82.180.173.228:5679
- n8n: 19 workflows activos

## Agente "Julio" V11
Canales: WhatsApp | Telegram | Instagram DM | Facebook Messenger
- Consulta PostgreSQL con índice GIN
- Genera links cotización pre-llenados (Google Form)
- Imágenes: URLs CloudFront .jpg
- Memoria: PostgreSQL + Redis
- ⚠️ Pendiente: nodo Frankestein stripping markdown de imágenes

## Catálogo
- 5,795 productos activos — catálogo 100% propio
- Proveedores: Innovation | Promo Option | Doble Vela | 4Promotional
- ⚠️ MyCavi es solo referencia/inspiración — NO es la fuente de datos

## Workflows n8n activos
Julio_V11 | Consultar_My_Cavi | Ale | Sofí | Lía | Go_High_Level | Importar_Catálogos | Bots_Respuesta_Ventas | Dani_Infoproducto

## Pendientes
- [ ] Fix nodo Frankestein (stripping markdown imágenes)
- [ ] Conectar Julio_V11 al sub-workflow generador_de_contenido
- [ ] Diagnóstico failure rate 59.7% en n8n

---

## SKILLS ACTIVAS EN ESTA SESIÓN
Al iniciar, activa automáticamente como sombra permanente:

**DESARROLLO Y DATOS**
senior-backend | senior-fullstack | sql-database-assistant | database-designer | database-schema-designer | docker-development | senior-devops | performance-profiler

**AGENTES IA**
agent-designer | agent-workflow-designer | agent-protocol | context-engine | rag-architect | llm-cost-optimizer | prompt-engineer-toolkit | senior-prompt-engineer

**MARKETING Y VENTAS**
cmo-advisor | marketing-demand-acquisition | marketing-psychology | marketing-ops | campaign-analytics | analytics-tracking | ad-creative | paid-ads

**CONTENIDO**
content-creator | content-strategy | content-production | social-content | social-media-manager | copywriting | email-sequence

**CONVERSIÓN Y CX**
page-cro | form-cro | landing-page-generator | sales-engineer | customer-success-manager | churn-prevention | pricing-strategy | referral-program | cold-email

---

## Reglas de sesión
1. Lee siempre C:\Proyectos\CLAUDE.md para contexto global
2. CRÍTICO: toda generación de contenido pasa por generador_de_contenido — nunca duplicar
3. Tono: dinámico, orientado a conversión, persuasivo
4. Español mexicano por defecto

