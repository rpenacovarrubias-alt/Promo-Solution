# FICHA DE CONFIGURACIÓN — CHATBOT JAIME
**Versión:** 1.0 | **Fecha de llenado:** _______________  | **Estado:** 🔴 Pendiente completar

> **Instrucciones:** Completa cada campo del lado derecho. Los campos marcados con ⬜ son opcionales pero recomendados.
> Una vez completa esta ficha, Jaime puede implementarse en ManyChat en 1 sesión de trabajo.

---

## 1. IDENTIDAD DEL HOTEL

| Campo | Valor |
|---|---|
| Nombre completo del hotel | `{{HOTEL_NOMBRE}}` |
| Marca / Concepto (tagline o filosofía) | `{{HOTEL_CONCEPTO}}` |
| Categoría (estrellas) | `{{HOTEL_ESTRELLAS}}` |
| Número total de habitaciones | `{{HOTEL_HABITACIONES}}` |
| Año de apertura / última remodelación | `{{HOTEL_APERTURA}}` |

---

## 2. CONTACTO Y UBICACIÓN

| Campo | Valor |
|---|---|
| Dirección completa | `{{HOTEL_DIRECCION}}` |
| Ciudad / Estado | `{{HOTEL_CIUDAD_ESTADO}}` |
| Teléfono principal (con lada) | `{{HOTEL_TELEFONO}}` |
| **WhatsApp donde vivirá Jaime** | `{{JAIME_WHATSAPP}}` |
| Email de reservaciones | `{{HOTEL_EMAIL_RESERVAS}}` |
| Email de administración | `{{HOTEL_EMAIL_ADMIN}}` |
| Sitio web | `{{HOTEL_WEB}}` |
| Motor de reservas (URL directa) | `{{HOTEL_MOTOR_RESERVAS_URL}}` |
| Facebook (URL) | `{{HOTEL_FACEBOOK}}` |
| Instagram (URL o @usuario) | `{{HOTEL_INSTAGRAM}}` |
| Google Maps (link) | `{{HOTEL_GOOGLEMAPS}}` |
| Distancia al aeropuerto más cercano | `{{HOTEL_DISTANCIA_AEROPUERTO}}` |
| Costo de transporte al aeropuerto | `{{HOTEL_COSTO_TAXI_AEROPUERTO}}` |
| Distancia al centro de la ciudad | `{{HOTEL_DISTANCIA_CENTRO}}` |
| Referencias de ubicación (puntos cercanos) | `{{HOTEL_REFERENCIAS_UBICACION}}` |

---

## 3. CHECK-IN Y CHECK-OUT

| Campo | Valor |
|---|---|
| Hora de check-in | `{{CHECKIN_HORA}}` |
| Hora de check-out | `{{CHECKOUT_HORA}}` |
| ¿Ofrece early check-in? (sí/no) | `{{EARLY_CHECKIN_DISPONIBLE}}` |
| Costo de early check-in | `{{EARLY_CHECKIN_COSTO}}` |
| ¿Ofrece late check-out? (sí/no) | `{{LATE_CHECKOUT_DISPONIBLE}}` |
| Costo de late check-out | `{{LATE_CHECKOUT_COSTO}}` |
| Documentos requeridos al check-in | `{{CHECKIN_DOCUMENTOS}}` |
| ¿Se requiere depósito de garantía? | `{{DEPOSITO_REQUERIDO}}` |
| Monto del depósito de garantía | `{{DEPOSITO_MONTO}}` |

---

## 4. HABITACIONES

| Tipo de habitación | Capacidad (personas) | m² | Tarifa/noche base | Descripción breve | Amenidades especiales |
|---|---|---|---|---|---|
| `{{HAB_TIPO_1}}` | `{{HAB1_CAPACIDAD}}` | `{{HAB1_M2}}` | `{{HAB1_TARIFA}}` | `{{HAB1_DESC}}` | `{{HAB1_EXTRAS}}` |
| `{{HAB_TIPO_2}}` | `{{HAB2_CAPACIDAD}}` | `{{HAB2_M2}}` | `{{HAB2_TARIFA}}` | `{{HAB2_DESC}}` | `{{HAB2_EXTRAS}}` |
| `{{HAB_TIPO_3}}` | `{{HAB3_CAPACIDAD}}` | `{{HAB3_M2}}` | `{{HAB3_TARIFA}}` | `{{HAB3_DESC}}` | `{{HAB3_EXTRAS}}` |
| `{{HAB_TIPO_4}}` | `{{HAB4_CAPACIDAD}}` | `{{HAB4_M2}}` | `{{HAB4_TARIFA}}` | `{{HAB4_DESC}}` | `{{HAB4_EXTRAS}}` |
| `{{HAB_TIPO_5}}` | `{{HAB5_CAPACIDAD}}` | `{{HAB5_M2}}` | `{{HAB5_TARIFA}}` | `{{HAB5_DESC}}` | `{{HAB5_EXTRAS}}` |

> Nota sobre tarifas: `{{HAB_NOTA_TARIFAS}}` *(ej: "Precio base 2 huéspedes · Desayuno incluido · Reserva y paga después")*

### Amenidades estándar en TODAS las habitaciones

| Amenidad | ¿Incluida? (✅/❌) |
|---|---|
| WiFi | `{{AMENIDAD_WIFI}}` |
| Caja fuerte con código | `{{AMENIDAD_CAJA_FUERTE}}` |
| Aire acondicionado | `{{AMENIDAD_AC}}` |
| TV con cable (canales) | `{{AMENIDAD_TV}}` |
| Baño privado | `{{AMENIDAD_BANO}}` |
| Ropa de cama de calidad | `{{AMENIDAD_ROPA_CAMA}}` |
| Closet con plancha | `{{AMENIDAD_CLOSET_PLANCHA}}` |
| Escritorio de trabajo | `{{AMENIDAD_ESCRITORIO}}` |
| Cerradura electrónica | `{{AMENIDAD_CERRADURA}}` |
| Teléfono | `{{AMENIDAD_TELEFONO}}` |
| Minibar / Frigobar | `{{AMENIDAD_MINIBAR}}` |
| Cocineta | `{{AMENIDAD_COCINETA}}` |
| Secador de pelo | `{{AMENIDAD_SECADORA}}` |
| Otro: `{{AMENIDAD_EXTRA_NOMBRE}}` | `{{AMENIDAD_EXTRA_DISPONIBLE}}` |

---

## 5. WIFI

| Campo | Valor |
|---|---|
| Nombre de la red (SSID) | `{{WIFI_SSID}}` |
| Contraseña | `{{WIFI_PASSWORD}}` |
| ¿Hay red separada para huéspedes? (sí/no) | `{{WIFI_RED_SEPARADA}}` |
| Nombre red de huéspedes (si aplica) | `{{WIFI_HUESPED_SSID}}` |
| Contraseña red de huéspedes | `{{WIFI_HUESPED_PASSWORD}}` |
| Velocidad / observaciones | `{{WIFI_VELOCIDAD}}` |

---

## 6. DESAYUNO

| Campo | Valor |
|---|---|
| ¿Incluye desayuno? (sí / no / según tarifa) | `{{DESAYUNO_INCLUIDO}}` |
| Tipo de desayuno (buffet / americano / continental) | `{{DESAYUNO_TIPO}}` |
| Horario de desayuno | `{{DESAYUNO_HORARIO}}` |
| ¿Qué incluye? | `{{DESAYUNO_INCLUYE}}` |
| Costo adicional si no está incluido | `{{DESAYUNO_COSTO_EXTRA}}` |
| Ubicación del restaurante en el hotel | `{{DESAYUNO_UBICACION}}` |

---

## 7. RESTAURANTE / ALIMENTOS Y BEBIDAS

| Campo | Valor |
|---|---|
| Nombre del restaurante | `{{REST_NOMBRE}}` |
| Horario de desayuno | `{{REST_HORARIO_DESAYUNO}}` |
| Horario de comida | `{{REST_HORARIO_COMIDA}}` |
| Horario de cena | `{{REST_HORARIO_CENA}}` |
| ¿Ofrece room service? (sí/no) | `{{ROOMSERVICE_DISPONIBLE}}` |
| Horario de room service | `{{ROOMSERVICE_HORARIO}}` |
| Tiempo estimado de entrega en habitación | `{{ROOMSERVICE_TIEMPO}}` |
| URL del menú en línea | `{{REST_MENU_URL}}` |
| ¿Se requiere reservación? | `{{REST_RESERVACION}}` |

### Menú de Room Service

| # | Platillo | Descripción | Precio |
|---|---|---|---|
| 1 | `{{RS_PLATILLO_1}}` | `{{RS_DESC_1}}` | `{{RS_PRECIO_1}}` |
| 2 | `{{RS_PLATILLO_2}}` | `{{RS_DESC_2}}` | `{{RS_PRECIO_2}}` |
| 3 | `{{RS_PLATILLO_3}}` | `{{RS_DESC_3}}` | `{{RS_PRECIO_3}}` |
| 4 | `{{RS_PLATILLO_4}}` | `{{RS_DESC_4}}` | `{{RS_PRECIO_4}}` |
| 5 | `{{RS_PLATILLO_5}}` | `{{RS_DESC_5}}` | `{{RS_PRECIO_5}}` |

---

## 8. ESTACIONAMIENTO

| Campo | Valor |
|---|---|
| ¿Tiene estacionamiento? (sí/no) | `{{ESTAC_DISPONIBLE}}` |
| ¿Es gratuito o de pago? | `{{ESTAC_COSTO_TIPO}}` |
| Costo (si aplica) | `{{ESTAC_COSTO}}` |
| ¿Es techado? (sí/no) | `{{ESTAC_TECHADO}}` |
| ¿Es vigilado / con cámaras? (sí/no) | `{{ESTAC_VIGILADO}}` |
| ¿Ofrece valet parking? (sí/no) | `{{ESTAC_VALET}}` |
| Costo de valet parking | `{{ESTAC_VALET_COSTO}}` |
| Capacidad del estacionamiento | `{{ESTAC_CAPACIDAD}}` |

---

## 9. INSTALACIONES Y SERVICIOS

| Instalación / Servicio | ¿Disponible? | Horario | Costo adicional | Notas |
|---|---|---|---|---|
| Alberca / Piscina | `{{ALBERCA_DISPONIBLE}}` | `{{ALBERCA_HORARIO}}` | `{{ALBERCA_COSTO}}` | `{{ALBERCA_NOTAS}}` |
| Gym / Gimnasio | `{{GYM_DISPONIBLE}}` | `{{GYM_HORARIO}}` | `{{GYM_COSTO}}` | `{{GYM_NOTAS}}` |
| Spa | `{{SPA_DISPONIBLE}}` | `{{SPA_HORARIO}}` | `{{SPA_COSTO}}` | `{{SPA_NOTAS}}` |
| Sauna | `{{SAUNA_DISPONIBLE}}` | `{{SAUNA_HORARIO}}` | `{{SAUNA_COSTO}}` | `{{SAUNA_NOTAS}}` |
| Business Center | `{{BIZC_DISPONIBLE}}` | `{{BIZC_HORARIO}}` | `{{BIZC_COSTO}}` | `{{BIZC_NOTAS}}` |
| Lavandería y tintorería | `{{LAVAND_DISPONIBLE}}` | `{{LAVAND_HORARIO}}` | `{{LAVAND_COSTO}}` | `{{LAVAND_NOTAS}}` |
| Servicio médico | `{{MED_DISPONIBLE}}` | `{{MED_HORARIO}}` | `{{MED_COSTO}}` | `{{MED_NOTAS}}` |
| Tours / Excursiones | `{{TOURS_DISPONIBLE}}` | `{{TOURS_HORARIO}}` | `{{TOURS_COSTO}}` | `{{TOURS_NOTAS}}` |
| Transporte al aeropuerto | `{{TRANSP_DISPONIBLE}}` | `{{TRANSP_HORARIO}}` | `{{TRANSP_COSTO}}` | `{{TRANSP_NOTAS}}` |
| Renta de autos | `{{RENTA_AUTO_DISPONIBLE}}` | `{{RENTA_AUTO_HORARIO}}` | `{{RENTA_AUTO_COSTO}}` | `{{RENTA_AUTO_NOTAS}}` |
| Terraza / Roof Garden | `{{TERRAZA_DISPONIBLE}}` | `{{TERRAZA_HORARIO}}` | `{{TERRAZA_COSTO}}` | `{{TERRAZA_NOTAS}}` |
| Bar | `{{BAR_DISPONIBLE}}` | `{{BAR_HORARIO}}` | `{{BAR_COSTO}}` | `{{BAR_NOTAS}}` |
| Kids Club | `{{KIDS_DISPONIBLE}}` | `{{KIDS_HORARIO}}` | `{{KIDS_COSTO}}` | `{{KIDS_NOTAS}}` |
| Canchas deportivas | `{{CANCHAS_DISPONIBLE}}` | `{{CANCHAS_HORARIO}}` | `{{CANCHAS_COSTO}}` | `{{CANCHAS_NOTAS}}` |

---

## 10. SALONES Y EVENTOS

| Nombre del salón | Capacidad máx. | Tipos de montaje | Equipamiento | Costo aproximado |
|---|---|---|---|---|
| `{{SALON_1_NOMBRE}}` | `{{SALON_1_CAPACIDAD}}` | `{{SALON_1_MONTAJES}}` | `{{SALON_1_EQUIPO}}` | `{{SALON_1_COSTO}}` |
| `{{SALON_2_NOMBRE}}` | `{{SALON_2_CAPACIDAD}}` | `{{SALON_2_MONTAJES}}` | `{{SALON_2_EQUIPO}}` | `{{SALON_2_COSTO}}` |
| `{{SALON_3_NOMBRE}}` | `{{SALON_3_CAPACIDAD}}` | `{{SALON_3_MONTAJES}}` | `{{SALON_3_EQUIPO}}` | `{{SALON_3_COSTO}}` |

| Campo | Valor |
|---|---|
| URL de cotización de eventos | `{{EVENTOS_URL_COTIZACION}}` |
| ¿Requiere depósito para reservar salón? | `{{SALON_DEPOSITO}}` |

---

## 11. POLÍTICAS DEL HOTEL

| Política | Detalle |
|---|---|
| Política de cancelación (plazo sin cargo) | `{{POL_CANCELACION}}` |
| Cargo por no-show | `{{POL_NOSHOW}}` |
| Tarifas no reembolsables | `{{POL_NO_REEMBOLSO}}` |
| Política de mascotas | `{{POL_MASCOTAS}}` |
| Peso máximo permitido (mascotas) | `{{POL_MASCOTAS_PESO}}` |
| Costo adicional por mascota | `{{POL_MASCOTAS_COSTO}}` |
| Política de fumadores | `{{POL_FUMADORES}}` |
| Sanción por fumar en zonas prohibidas | `{{POL_FUMADORES_SANCION}}` |
| Política de menores (edad sin cargo) | `{{POL_MENORES}}` |
| Horario de silencio | `{{POL_SILENCIO}}` |
| Política de visitas externas | `{{POL_VISITAS}}` |
| Política de objetos olvidados | `{{POL_OBJETOS_OLVIDADOS}}` |

---

## 12. MÉTODOS DE PAGO

| Método | ¿Aceptado? (✅/❌) |
|---|---|
| Efectivo MXN | `{{PAGO_EFECTIVO}}` |
| Tarjeta de crédito Visa | `{{PAGO_VISA}}` |
| Tarjeta de crédito Mastercard | `{{PAGO_MC}}` |
| Tarjeta de crédito American Express | `{{PAGO_AMEX}}` |
| Tarjeta de débito | `{{PAGO_DEBITO}}` |
| Transferencia bancaria | `{{PAGO_TRANSFERENCIA}}` |
| Vales electrónicos (Ticket/Si Vale) | `{{PAGO_VALES}}` |
| OXXO Pay | `{{PAGO_OXXO}}` |
| Criptomonedas | `{{PAGO_CRYPTO}}` |
| Facturación (RFC / CFDI) | `{{FACTURACION_DISPONIBLE}}` |
| URL para facturación | `{{FACTURACION_URL}}` |

---

## 13. INTEGRACIÓN OPERATIVA DE JAIME

| Campo | Valor |
|---|---|
| ¿A dónde llegan los tickets de mantenimiento? | `{{TICKET_MANTENIMIENTO_DESTINO}}` |
| ¿A dónde llegan los tickets de ama de llaves? | `{{TICKET_AMA_LLAVES_DESTINO}}` |
| ¿A dónde llegan los tickets de AyB / room service? | `{{TICKET_ROOMSERVICE_DESTINO}}` |
| ¿A dónde llegan los tickets de recepción? | `{{TICKET_RECEPCION_DESTINO}}` |
| Canal de escalamiento urgente | `{{ESCALAMIENTO_URGENTE}}` |
| Canal de escalamiento crítico | `{{ESCALAMIENTO_CRITICO}}` |
| PMS utilizado | `{{PMS_NOMBRE}}` |
| Channel Manager utilizado | `{{CHANNEL_MANAGER}}` |
| ¿Se integra con n8n? (sí/no) | `{{INTEGRACION_N8N}}` |
| ¿Se usa Google Sheets para tickets? (sí/no) | `{{TICKETS_GOOGLE_SHEETS}}` |

---

## 14. PREGUNTAS FRECUENTES DEL HOTEL

> Completa con las preguntas particulares de este hotel que no cubre la plantilla general.

| Pregunta frecuente del huésped | Respuesta oficial del hotel |
|---|---|
| `{{FAQ_PREGUNTA_1}}` | `{{FAQ_RESPUESTA_1}}` |
| `{{FAQ_PREGUNTA_2}}` | `{{FAQ_RESPUESTA_2}}` |
| `{{FAQ_PREGUNTA_3}}` | `{{FAQ_RESPUESTA_3}}` |
| `{{FAQ_PREGUNTA_4}}` | `{{FAQ_RESPUESTA_4}}` |
| `{{FAQ_PREGUNTA_5}}` | `{{FAQ_RESPUESTA_5}}` |

---

## 15. DIRECTORIO INTERNO

| Nombre | Puesto | Departamento(s) | WhatsApp |
|---|---|---|---|
| `{{DIR_NOMBRE_1}}` | `{{DIR_PUESTO_1}}` | `{{DIR_DEPT_1}}` | `{{DIR_WA_1}}` |
| `{{DIR_NOMBRE_2}}` | `{{DIR_PUESTO_2}}` | `{{DIR_DEPT_2}}` | `{{DIR_WA_2}}` |
| `{{DIR_NOMBRE_3}}` | `{{DIR_PUESTO_3}}` | `{{DIR_DEPT_3}}` | `{{DIR_WA_3}}` |
| `{{DIR_NOMBRE_4}}` | `{{DIR_PUESTO_4}}` | `{{DIR_DEPT_4}}` | `{{DIR_WA_4}}` |
| `{{DIR_NOMBRE_5}}` | `{{DIR_PUESTO_5}}` | `{{DIR_DEPT_5}}` | `{{DIR_WA_5}}` |

### Lógica de escalamiento de tickets para Jaime

| Tipo de solicitud | Prioridad | Notificar a |
|---|---|---|
| Amenidades (toallas, papel, cobijas…) | MEDIA | `{{ESC_AMENIDADES}}` |
| Limpieza de habitación | MEDIA | `{{ESC_LIMPIEZA}}` |
| Falla técnica (agua, A/C, luz, TV…) | ALTA | `{{ESC_FALLA_TECNICA}}` |
| Room service | MEDIA | `{{ESC_ROOMSERVICE}}` |
| Check-in / Check-out / Factura | MEDIA | `{{ESC_CHECKIN_FACTURA}}` |
| Queja de servicio | ALTA | `{{ESC_QUEJA}}` |
| Consulta de salones / eventos | BAJA | `{{ESC_EVENTOS}}` |
| Emergencia / Incidente de seguridad | CRÍTICA | `{{ESC_EMERGENCIA}}` |
| No-show / Compensación / Reembolso | ALTA | `{{ESC_REEMBOLSO}}` |

---

## 16. ESTADO DE IMPLEMENTACIÓN

| Componente | Estado |
|---|---|
| Ficha de configuración del hotel | ⬜ Pendiente |
| Directorio interno y escalamiento | ⬜ Pendiente |
| Menú principal (8 opciones) | ⬜ Pendiente |
| Submenús (Reservaciones, Info, Servicios, Eventos) | ⬜ Pendiente |
| Flujo 1 — Pre-Registro | ⬜ Pendiente |
| Flujo 2 — Check Out Express | ⬜ Pendiente |
| Flujo 3 — Facturación | ⬜ Pendiente |
| Flujo 4 — Amenidades | ⬜ Pendiente |
| Flujo 5 — Reportar Falla | ⬜ Pendiente |
| Flujo 6 — Limpieza | ⬜ Pendiente |
| Flujo 7 — Room Service | ⬜ Pendiente |
| Flujo 8 — Ubicación y cómo llegar | ⬜ Pendiente |
| Flujo 9 — Instalaciones | ⬜ Pendiente |
| Flujo 10 — Políticas del hotel | ⬜ Pendiente |
| Flujo 11 — Tipos de habitación y tarifas | ⬜ Pendiente |
| Flujo 12 — Eventos y salones | ⬜ Pendiente |
| Configuración en ManyChat | ⬜ Pendiente |
| Pruebas con WhatsApp real | ⬜ Pendiente |
| Capacitación al equipo de Recepción | ⬜ Pendiente |

---

**Llenado por:** _______________________
**Aprobado por:** _______________________
**Fecha de activación de Jaime:** _______________________
