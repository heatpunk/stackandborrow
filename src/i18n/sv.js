// ============================================================
// SV — svenska. Översatt från en.js.
// Termer som "sats", "BTC", "LTV", "multisig" är bevarade.
// Editorial röst: kort, deklarativ, sats-först.
// ============================================================

export default {
  // ----- COMMON: brand, header, nav, footer, errors -----

  'common.brand.name': 'Stack & Borrow',
  'common.brand.tagline': '· BITCOIN-SÄKRADE LÅN ·',
  'common.header.est': 'EST · {date}',
  'common.header.pageOf': '{current} AV {of}',
  'common.header.issueNumber': 'NR. 000.50K',

  'common.nav.overview': 'ÖVERSIKT',
  'common.nav.calculator': 'KALKYLATOR',
  'common.nav.lenders': 'LÅNGIVARE',
  'common.nav.terms': 'VILLKOR',

  'common.footer.btcSource': '※ Direkt BTC: {source} · rankat efter total kostnad, inte provision.',
  'common.footer.disclaimer': '※ Ej finansiell rådgivning. Ingen data lämnar din webbläsare.',
  'common.footer.contact': '※ stackandborrow.com · ',
  'common.footer.dataVerified': '※ Långivardata verifierat {updated}.',

  'common.cta.runCalculator': 'KÖR KALKYLATORN',
  'common.cta.compareLenders': 'JÄMFÖR LÅNGIVARE',

  'common.spineLabel': 'STACK & BORROW · HÄFTE · 2026',

  'common.glossary.label': 'ORDLISTA',
  'common.glossary.link': '↗ HELA ORDLISTAN',
  'common.glossary.iconLabel': 'Vad är {term}?',

  'common.theme.dark': '★ MÖRKT · NATTLÄGE · TRYCK FÖR ATT BYTA ',
  'common.theme.light': '★ LJUST · DAGLÄGE · TRYCK FÖR ATT BYTA ',
  'common.theme.titleAuto': 'Tema: auto ({theme}) — klicka för att åsidosätta',
  'common.theme.title': 'Tema: {theme} — klicka för att växla, ⌘-klicka för systemets',

  'common.error.title': 'Något gick fel när sidan laddades.',
  'common.error.unknown': 'Okänt fel',
  'common.error.return.before': 'Försök ',
  'common.error.return.link': 'gå tillbaka till översikten',
  'common.error.return.after': ', eller öppna webbläsarens konsol för detaljer.',

  'common.livePrice.fetching': 'HÄMTAR…',
  'common.livePrice.retry': 'FÖRSÖK IGEN ↻',
  'common.livePrice.refresh': 'Uppdatera',
  'common.livePrice.refreshLabel': 'Uppdatera direktpriset på BTC',

  // ----- ABOUT PAGE -----

  'about.meta.readFirst': 'LÄS DETTA FÖRST',
  'about.meta.readTime': '5 MINUTERS LÄSNING',
  'about.meta.insert': 'BILAGA · III · AV III',

  'about.hero.titleLine1': 'En',
  'about.hero.titleLine2': 'filosofi.',
  'about.hero.subtitle': 'En kalkylator för frågan varje långsiktig bitcoiner förr eller senare ställer: ska jag sälja några sats, eller låna mot dem? Det som följer är hur vi valde att svara.',

  'about.heroStamp.line1': 'NO',
  'about.heroStamp.line2': 'BS',
  'about.heroStamp.line3': '★ SATS FÖRST ★',

  'about.section.principles': 'PRINCIPERNA',
  'about.section.notForYou': 'VEM SOM INTE BÖR ANVÄNDA DETTA',
  'about.section.questions': 'FRÅGORNA',
  'about.section.signatures': 'SIGNATURER',

  'about.principle.i.title': 'Endast BTC först. Sedan total kostnad. Punkt.',
  'about.principle.i.body': 'BTC-only-långivare rankas alltid över de med blandad säkerhet. Inom varje nivå vinner lägst total kostnad — med custody-risk och medlemsavgifter inräknade. Provisioner från affiliate-länkar går aldrig in i algoritmen. Om en långivare som inte betalar oss något ger dig bästa villkoret, vinner de.',
  'about.principle.ii.title': 'Sats först. Allt annat är översättning.',
  'about.principle.ii.body': 'Huvudsiffran är alltid "sats du behåller". Fiatkonverteringar uppdateras från direkt BTC-pris. Du kan växla till USD, EUR, SEK och tillbaka; den underliggande matematiken är i sats.',
  'about.principle.iii.title': 'Skattemedveten som standard.',
  'about.principle.iii.body': 'För att netto $N i kontanter måste du sälja tillräckligt med BTC för att täcka $N + kapitalvinstskatt. Vi bakar in skatten i varje jämförelse. Du kan ändra skattesatsen om din jurisdiktion skiljer sig.',
  'about.principle.iv.title': 'Ingen spårning. Inga konton. Ingen data lämnar din webbläsare.',
  'about.principle.iv.body': 'Dina inmatningar sparas i localStorage på din enhet. Det finns ingen analys, inga tredjepartsskript, ingen registrering. Sidan är en mapp med HTML och en JSON-fil med långivarräntor.',
  'about.principle.v.title': 'Ärlig om riskerna.',
  'about.principle.v.body': 'BTC har fallit >50 % från en 12-månaders topp sex gånger sedan 2013. Att låna vid 50 % LTV betyder att en nedgång på 50 % är din likvidation. Sex gånger på tolv år är inte om utan när.',

  'about.warning.heading': '⚠ FORTSÄTT INTE OM',
  'about.warning.item1': 'Du skulle förkrossas av en 50 %-nedgång i BTC (vilket har hänt sex gånger)',
  'about.warning.item2': 'Du inte förstår återpantsättning och vilka långivare som ägnar sig åt det',
  'about.warning.item3.before': 'Du lånar för att ',
  'about.warning.item3.italic': 'köpa mer bitcoin',
  'about.warning.item3.after': '. Det är hävstång, inte strategi.',

  'about.faq.funding.q': 'F: Hur finansieras sidan?',
  'about.faq.funding.a': 'Några länkar till långivare är affiliate-länkar. När du klickar dig vidare och tar ett lån betalar långivaren en hänvisningsavgift. Det finansierar hosting. Rankningen påverkas inte — välj vilken väg du vill.',
  'about.faq.prices.q': 'F: Var kommer BTC-priset ifrån?',
  'about.faq.prices.a': 'mempool.space, hämtas var femte minut. Reserv är utxoracle.io. Om båda misslyckas använder vi ett inbakat reservpris (synligt markerat).',
  'about.faq.rates.q': 'F: Hur ofta uppdateras räntorna?',
  'about.faq.rates.a': 'Mål är kvartalsvis, snabbare när en långivare stänger eller ändras väsentligt. Senast verifierat datum står i kalkylatorns sidfot.',
  'about.faq.feedback.q': 'F: Hittat något fel?',
  'about.faq.feedback.a': 'feedback@stackandborrow.com — korta mejl får snabbare svar.',

  'about.sig.signed': '~ signerad',
  'about.sig.signedRole': 'AV FÖRFATTAREN',
  'about.sig.domainRole': 'OFFICIELL DOMÄN',

  'about.verifiedStamp.line1': 'VERIFIERAD',
  'about.verifiedStamp.line2': 'KALK',
  'about.verifiedStamp.line3': '★ MAJ 2026 ★',

  'about.desktop.leftLabel': 'SIDA IV · VÄNSTER — PRINCIPERNA',
  'about.desktop.rightLabel': 'SIDA IV · HÖGER — RESERVATIONER, FRÅGOR, SIGNATUR',

  'about.glossary.intro': 'Vardagliga definitioner för varje term som används på den här sidan.',

  // ----- GLOSSARY (used both inline ⓘ and on About page) -----

  'glossary.collateral.title': 'Säkerhet',
  'glossary.collateral.body': 'Den bitcoin du låser hos långivaren som säkerhet för lånet. Du får tillbaka den när du betalar tillbaka. Om BTC-priset faller tillräckligt långt kan långivaren sälja delar eller allt för att täcka lånet — det är likvidation.',
  'glossary.ltv.title': 'Loan-to-value (LTV)',
  'glossary.ltv.body': 'Lånebelopp delat med säkerhetens värde, i procent. 50 % LTV betyder att man lånar 50 000 $ mot bitcoin värd 100 000 $. Ju lägre LTV, desto mer marginal innan ett prisfall utlöser likvidation.',
  'glossary.apr.title': 'APR — årlig ränta',
  'glossary.apr.body': 'Den årliga kostnaden för att låna, uttryckt som procent av lånebeloppet. Inkluderar räntesats plus eventuell uppläggningsavgift. 10 % APR på ett lån på 50 000 $ är ungefär 5 000 $ per år.',
  'glossary.origination.title': 'Uppläggningsavgift',
  'glossary.origination.body': 'En engångsavgift som långivaren tar för att skapa lånet — vanligtvis 1–2 % av lånebeloppet. Vissa långivare avstår den för låntagare i deras hemregion.',
  'glossary.liquidation.title': 'Likvidation',
  'glossary.liquidation.body': 'En tvångsförsäljning av din säkerhet om BTC faller under en viss tröskel ("likvidationspriset"). Långivaren säljer precis tillräckligt med BTC för att täcka det du är skyldig — men det räknas som en skattepliktig försäljning.',
  'glossary.balloon.title': 'Ballongbetalning',
  'glossary.balloon.body': 'Ett lån där du inte gör några månadsbetalningar (eller bara ränta) under löptiden, och hela huvudbeloppet förfaller i en klumpsumma vid förfall. De flesta bitcoin-säkrade lån är strukturerade så.',
  'glossary.sats.title': 'Sats — satoshis',
  'glossary.sats.body': 'Den minsta enheten av bitcoin. 1 BTC = 100 000 000 sats. Den här sidan använder sats så att små delar av en bitcoin är lättare att jämföra som hela tal.',
  'glossary.taxEvent.title': 'Skattepliktig händelse',
  'glossary.taxEvent.body': 'En händelse som utlöser en skattepliktig vinst eller förlust i de flesta jurisdiktioner. Att sälja bitcoin är en skattepliktig händelse. Att låna mot bitcoin är det inte — du äger fortfarande BTC, så inget realiseras skattemässigt.',
  'glossary.principal.title': 'Huvudbelopp',
  'glossary.principal.body': 'Det ursprungliga beloppet som lånats, separat från ränta. På ett lån på 50 000 $ med 5 000 $ i ränta är huvudbeloppet 50 000 $ och totalt skyldigt vid förfall är 55 000 $.',
  'glossary.interest.title': 'Ränta',
  'glossary.interest.body': 'Avgiften du betalar långivaren för att låna pengar, beräknad som procent (APR) av huvudbeloppet över tid. De flesta bitcoin-säkrade lån har ränta som löper dagligen och betalas vid förfall.',
  'glossary.custody.title': 'Förvaring',
  'glossary.custody.body': 'Vem som håller bitcoin under lånet. Custodial — långivaren (eller en tredjepartsförvarare) håller den. Multisig — nycklar delas mellan dig, långivaren och en skiljedomare, så ingen enskild part kan flytta BTC själv.',
  'glossary.rehypothecation.title': 'Återpantsättning',
  'glossary.rehypothecation.body': 'När en långivare återanvänder din säkerhet — t.ex. lånar ut den igen eller pantsätter den för sin egen upplåning. Ökar motpartsrisk: om långivaren går omkull kan din BTC vara invävd med deras borgenärer.',
  'glossary.multisig.title': 'Multisig — flersignatur',
  'glossary.multisig.body': 'Ett bitcoin-script som kräver mer än en privat nyckel för att flytta medel. Används i samverkansförvaring (du + långivare + skiljedomare) så att ingen enskild part kan agera ensam med din säkerhet.',
  'glossary.dlc.title': 'DLC — discreet log contract',
  'glossary.dlc.body': 'En bitcoin-inhemsk kontraktsdesign där säkerhet låses i ett 2-av-2-script och avveckling avgörs av en orakelkälla (prisflöde) utan en central part. Används av vissa icke-custodial långivare.',
  'glossary.rollover.title': 'Förlängning',
  'glossary.rollover.body': 'Samlingsterm för att inte betala av vid förfall. Tre varianter: revolverande (ingen förfallodag att förlänga förbi), refinansiering (ett nytt lån ersätter det gamla), eller nytt kontrakt (du ansöker igen från början). Vilken din långivare erbjuder avgör hur mycket friktion det blir.',
  'glossary.newContract.title': 'Nytt lån vid förfall',
  'glossary.newContract.body': 'Vissa långivare erbjuder ingen refinansiering — vid förfall måste du betala av helt och sedan ansöka om ett nytt lån från början om du vill fortsätta låna. Behandlas som en helt ny transaktion: ny kreditkontroll, ny uppläggningsavgift, ny APR. Mer friktion än refinansiering, men din säkerhet släpps och återlämnas till dig mellan lånen.',
  'glossary.refinance.title': 'Refinansiering',
  'glossary.refinance.body': 'Att ersätta ditt befintliga lån med ett nytt vid förfall. Långivaren omprövar dig, en ny APR låses, och en ny uppläggningsavgift kan tillkomma. Din säkerhet rörs inte — den ligger kvar under det nya lånet. Skiljer sig från revolverande kredit, som inte har någon förfallodag att refinansiera mot.',
  'glossary.revolving.title': 'Revolverande kredit',
  'glossary.revolving.body': 'En öppen kreditlina utan fast förfallodag. Du betalar tillbaka och tar ut igen när som helst, som ett kreditkort. Det finns inget att refinansiera eftersom det inte finns något slutdatum — ränta löper bara på utestående saldo.',
  'glossary.capitalGains.title': 'Kapitalvinstskatt',
  'glossary.capitalGains.body': 'Skatt på vinsten vid försäljning av en tillgång som ökat i värde. Att sälja BTC till ett högre pris än du köpte den utlöser kapitalvinstskatt i de flesta jurisdiktioner. Satser och regler varierar mellan länder.',
};
