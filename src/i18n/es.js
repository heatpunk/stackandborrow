// ============================================================
// ES — español. Traducido desde en.js.
// Términos bitcoin (sats, BTC, LTV, multisig) se mantienen.
// Voz editorial: corta, declarativa, sats-primero.
// ============================================================

export default {
  // ----- COMMON: brand, header, nav, footer, errors -----

  'common.brand.name': 'Stack & Borrow',
  'common.brand.tagline': '· PRÉSTAMOS RESPALDADOS POR BITCOIN ·',
  'common.header.est': 'EST · {date}',
  'common.header.pageOf': '{current} DE {of}',
  'common.header.issueNumber': 'N.º 000.50K',

  'common.nav.overview': 'RESUMEN',
  'common.nav.calculator': 'CALCULADORA',
  'common.nav.lenders': 'PRESTAMISTAS',
  'common.nav.terms': 'TÉRMINOS',

  'common.footer.btcSource': '※ BTC en vivo: {source} · clasificado por coste total, no por comisión.',
  'common.footer.disclaimer': '※ No es asesoramiento financiero. Ningún dato sale de tu navegador.',
  'common.footer.contact': '※ stackandborrow.com · ',
  'common.footer.dataVerified': '※ Datos de prestamistas verificados {updated}.',

  'common.cta.runCalculator': 'EJECUTAR CALCULADORA',
  'common.cta.compareLenders': 'COMPARAR PRESTAMISTAS',

  'common.spineLabel': 'STACK & BORROW · CUADERNILLO · 2026',

  'common.glossary.label': 'GLOSARIO',
  'common.glossary.link': '↗ GLOSARIO COMPLETO',
  'common.glossary.iconLabel': '¿Qué es {term}?',

  'common.theme.dark': '★ OSCURO · MODO NOCHE · TOCA PARA CAMBIAR ',
  'common.theme.light': '★ CLARO · MODO DÍA · TOCA PARA CAMBIAR ',
  'common.theme.titleAuto': 'Tema: auto ({theme}) — haz clic para anular',
  'common.theme.title': 'Tema: {theme} — clic para alternar, ⌘-clic para sistema',

  'common.error.title': 'Algo salió mal al cargar la página.',
  'common.error.unknown': 'Error desconocido',
  'common.error.return.before': 'Intenta ',
  'common.error.return.link': 'volver al resumen',
  'common.error.return.after': ', o abre la consola del navegador para detalles.',

  'common.livePrice.fetching': 'CARGANDO…',
  'common.livePrice.retry': 'REINTENTAR ↻',
  'common.livePrice.refresh': 'Actualizar',
  'common.livePrice.refreshLabel': 'Actualizar precio BTC en vivo',

  // ----- ABOUT PAGE -----

  'about.meta.readFirst': 'LEE ESTO PRIMERO',
  'about.meta.readTime': 'LECTURA DE 5 MINUTOS',
  'about.meta.insert': 'ANEXO · III · DE III',

  'about.hero.titleLine1': 'Términos de',
  'about.hero.titleLine2': 'filosofía.',
  'about.hero.subtitle': 'Una calculadora para la pregunta que cada bitcoiner de largo plazo se hace tarde o temprano: ¿debo vender unos sats o pedir prestado contra ellos? Lo que sigue es cómo decidimos responder.',

  'about.heroStamp.line1': 'NO',
  'about.heroStamp.line2': 'BS',
  'about.heroStamp.line3': '★ SATS FIRST ★',

  'about.section.principles': 'LOS PRINCIPIOS',
  'about.section.notForYou': 'QUIÉN NO DEBERÍA USAR ESTO',
  'about.section.questions': 'LAS PREGUNTAS',
  'about.section.signatures': 'FIRMAS',

  'about.principle.i.title': 'BTC-only primero. Después coste total. Punto.',
  'about.principle.i.body': 'Los prestamistas BTC-only siempre están por encima de los multi-colateral. Dentro de cada nivel gana el menor coste total — con riesgos de custodia y cuotas de membresía incluidos. Las comisiones de afiliados nunca entran en el algoritmo. Si un prestamista que no nos paga nada te ofrece el mejor trato, gana.',
  'about.principle.ii.title': 'Sats primero. Todo lo demás es traducción.',
  'about.principle.ii.body': 'El número principal es siempre "sats que conservas". Las conversiones a fiat se actualizan con el precio BTC en vivo. Puedes cambiar a USD, EUR, SEK y volver; las matemáticas subyacentes están en sats.',
  'about.principle.iii.title': 'Consciente de impuestos por defecto.',
  'about.principle.iii.body': 'Para obtener $N netos en efectivo, debes vender suficiente BTC para cubrir $N + impuesto sobre ganancias de capital. Integramos el impuesto en cada comparación. Puedes editar la tasa si tu jurisdicción difiere.',
  'about.principle.iv.title': 'Sin rastreo. Sin cuentas. Ningún dato sale de tu navegador.',
  'about.principle.iv.body': 'Tus entradas se guardan en localStorage en tu dispositivo. No hay analíticas, ni scripts de terceros, ni registro. La página es una carpeta de HTML y un JSON de tarifas de prestamistas.',
  'about.principle.v.title': 'Honesto sobre los riesgos.',
  'about.principle.v.body': 'BTC ha caído >50 % desde un máximo de 12 meses seis veces desde 2013. Pedir prestado al 50 % LTV significa que una caída del 50 % es tu evento de liquidación. Seis veces en doce años no es si, sino cuándo.',

  'about.warning.heading': '⚠ NO CONTINÚES SI',
  'about.warning.item1': 'Te devastaría una caída del 50 % en BTC (que ha ocurrido seis veces)',
  'about.warning.item2': 'No entiendes la rehipotecación y qué prestamistas la practican',
  'about.warning.item3.before': 'Estás pidiendo prestado para ',
  'about.warning.item3.italic': 'comprar más bitcoin',
  'about.warning.item3.after': '. Eso es apalancamiento, no estrategia.',

  'about.faq.funding.q': 'P: ¿Cómo se financia la página?',
  'about.faq.funding.a': 'Algunos enlaces a prestamistas son de afiliados. Cuando haces clic y tomas un préstamo, el prestamista paga una comisión de referido. Esto financia el hosting. La clasificación no se ve afectada — elige la ruta que prefieras.',
  'about.faq.prices.q': 'P: ¿De dónde viene el precio de BTC?',
  'about.faq.prices.a': 'mempool.space, consultado cada cinco minutos. La alternativa es utxoracle.io. Si ambos fallan usamos un fallback incorporado (marcado visiblemente).',
  'about.faq.rates.q': 'P: ¿Con qué frecuencia se actualizan las tasas?',
  'about.faq.rates.a': 'Objetivo trimestral, antes si un prestamista cierra o cambia materialmente. La fecha de la última verificación está en el pie de la calculadora.',
  'about.faq.feedback.q': 'P: ¿Encontraste algo erróneo?',
  'about.faq.feedback.a': 'feedback@stackandborrow.com — los correos cortos reciben respuesta más rápida.',

  'about.sig.signed': '~ firmado',
  'about.sig.signedRole': 'EL AUTOR',
  'about.sig.domainRole': 'DOMINIO OFICIAL',

  'about.verifiedStamp.line1': 'VERIFICADO',
  'about.verifiedStamp.line2': 'CALC',
  'about.verifiedStamp.line3': '★ MAYO 2026 ★',

  'about.desktop.leftLabel': 'PÁGINA IV · IZQUIERDA — LOS PRINCIPIOS',
  'about.desktop.rightLabel': 'PÁGINA IV · DERECHA — ADVERTENCIAS, Q&A, FIRMADO',

  'about.glossary.intro': 'Definiciones en lenguaje claro para cada término usado en este sitio.',

  // ----- GLOSSARY -----

  'glossary.collateral.title': 'Colateral',
  'glossary.collateral.body': 'El bitcoin que bloqueas con el prestamista para respaldar el préstamo. Lo recuperas cuando devuelves. Si el precio de BTC cae lo suficiente, el prestamista puede vender parte o todo para recuperar el préstamo — eso es liquidación.',
  'glossary.ltv.title': 'Loan-to-value (LTV)',
  'glossary.ltv.body': 'El importe del préstamo dividido por el valor del colateral, en porcentaje. 50 % LTV significa pedir prestados $50K contra $100K de bitcoin. Cuanto menor el LTV, más margen antes de que una caída de precio desencadene liquidación.',
  'glossary.apr.title': 'APR — tasa anual',
  'glossary.apr.body': 'El coste anual de pedir prestado, expresado como porcentaje del importe del préstamo. Incluye la tasa de interés más cualquier comisión de apertura. 10 % APR en un préstamo de $50K son aproximadamente $5.000 al año.',
  'glossary.origination.title': 'Comisión de apertura',
  'glossary.origination.body': 'Una comisión única que el prestamista cobra por configurar el préstamo — normalmente 1–2 % del importe prestado. Algunos prestamistas la eximen para prestatarios de su región.',
  'glossary.liquidation.title': 'Liquidación',
  'glossary.liquidation.body': 'Una venta forzada de tu colateral si BTC cae por debajo de un umbral establecido (el "precio de liquidación"). El prestamista vende solo el BTC necesario para cubrir lo que debes — pero cuenta como una venta sujeta a impuestos.',
  'glossary.balloon.title': 'Pago globo (balloon)',
  'glossary.balloon.body': 'Un préstamo donde no haces pagos mensuales (o solo intereses) durante el plazo, y el principal completo vence en una suma única al vencimiento. La mayoría de préstamos respaldados por bitcoin están estructurados así.',
  'glossary.sats.title': 'Sats — satoshis',
  'glossary.sats.body': 'La unidad más pequeña de bitcoin. 1 BTC = 100.000.000 sats. Este sitio usa sats para que pequeñas porciones de un bitcoin sean más fáciles de comparar como números enteros.',
  'glossary.taxEvent.title': 'Evento fiscal',
  'glossary.taxEvent.body': 'Una acción que desencadena ganancia o pérdida sujeta a impuestos en la mayoría de jurisdicciones. Vender bitcoin es un evento fiscal. Pedir prestado contra bitcoin no lo es — sigues siendo dueño del BTC, así que nada se realiza fiscalmente.',
  'glossary.principal.title': 'Principal',
  'glossary.principal.body': 'El importe original prestado, separado de los intereses. En un préstamo de $50K con $5K de intereses, el principal es $50K y el total adeudado al vencimiento es $55K.',
  'glossary.interest.title': 'Intereses',
  'glossary.interest.body': 'La tarifa que pagas al prestamista por pedir dinero, calculada como porcentaje (APR) del principal a lo largo del tiempo. La mayoría de préstamos respaldados por bitcoin acumulan intereses diariamente y los pagan al vencimiento.',
  'glossary.custody.title': 'Custodia',
  'glossary.custody.body': 'Quién guarda el bitcoin durante el préstamo. Custodial — el prestamista (o un custodio de terceros) lo guarda. Multisig — las claves se dividen entre tú, el prestamista y un árbitro, así ninguna parte puede mover el BTC sola.',
  'glossary.rehypothecation.title': 'Rehipotecación',
  'glossary.rehypothecation.body': 'Cuando un prestamista reutiliza tu colateral — por ejemplo prestándolo de nuevo o usándolo para garantizar su propio endeudamiento. Aumenta el riesgo de contraparte: si el prestamista quiebra, tu BTC puede quedar enredado con sus acreedores.',
  'glossary.multisig.title': 'Multisig — multifirma',
  'glossary.multisig.body': 'Un script de bitcoin que requiere más de una clave privada para mover fondos. Se usa en custodia colaborativa (tú + prestamista + árbitro) para que ninguna parte pueda actuar sola con tu colateral.',
  'glossary.dlc.title': 'DLC — discreet log contract',
  'glossary.dlc.body': 'Un diseño de contrato nativo de bitcoin donde el colateral se bloquea en un script 2-de-2 y la liquidación la decide un oráculo (feed de precios) sin parte central. Lo usan algunos prestamistas no-custodiales.',
  'glossary.rollover.title': 'Renovación',
  'glossary.rollover.body': 'Término paraguas para no pagar al vencimiento. Tres variantes: revolvente (sin vencimiento que renovar), refinanciación (un nuevo préstamo reemplaza al anterior), o un nuevo contrato (aplicas de nuevo desde cero). Cuál ofrezca tu prestamista determina cuánta fricción habrá.',
  'glossary.newContract.title': 'Nuevo préstamo al vencimiento',
  'glossary.newContract.body': 'Algunos prestamistas no ofrecen refinanciación — al vencimiento debes pagar completo y luego aplicar a un nuevo préstamo desde cero si quieres seguir endeudado. Se trata como transacción completamente nueva: nueva verificación crediticia, nueva comisión de apertura, nuevo APR. Más fricción que refinanciar, pero tu colateral se libera entre préstamos.',
  'glossary.refinance.title': 'Refinanciación',
  'glossary.refinance.body': 'Reemplazar tu préstamo existente por uno nuevo al vencimiento. El prestamista te reevalúa, se fija un nuevo APR y puede aplicarse una nueva comisión de apertura. Tu colateral no se toca — solo permanece bajo el nuevo préstamo. Distinto del crédito revolvente, que no tiene vencimiento que refinanciar.',
  'glossary.revolving.title': 'Crédito revolvente',
  'glossary.revolving.body': 'Una línea de crédito abierta sin fecha de vencimiento fija. Pagas y vuelves a sacar en cualquier momento, como una tarjeta de crédito. No hay nada que refinanciar porque no hay fecha de fin — los intereses simplemente se acumulan sobre el saldo pendiente.',
  'glossary.capitalGains.title': 'Impuesto sobre ganancias de capital',
  'glossary.capitalGains.body': 'Impuesto sobre el beneficio de vender un activo que se ha apreciado. Vender BTC a un precio mayor del que compraste desencadena impuesto sobre ganancias de capital en la mayoría de jurisdicciones. Tasas y reglas varían por país.',
};
