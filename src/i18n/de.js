// ============================================================
// DE — Deutsch. Übersetzt aus en.js.
// Bitcoin-Begriffe (sats, BTC, LTV, multisig) bleiben erhalten.
// Editorial: kurz, deklarativ, sats-first.
// ============================================================

export default {
  // ----- COMMON: brand, header, nav, footer, errors -----

  'common.brand.name': 'Stack & Borrow',
  'common.brand.tagline': '· BITCOIN-BESICHERTE KREDITE ·',
  'common.header.est': 'EST · {date}',
  'common.header.pageOf': '{current} VON {of}',
  'common.header.issueNumber': 'NR. 000.50K',

  'common.nav.overview': 'ÜBERSICHT',
  'common.nav.calculator': 'RECHNER',
  'common.nav.lenders': 'KREDITGEBER',
  'common.nav.terms': 'BEDINGUNGEN',

  'common.footer.btcSource': '※ Live BTC: {source} · sortiert nach Gesamtkosten, nicht Provision.',
  'common.footer.disclaimer': '※ Keine Finanzberatung. Keine Daten verlassen deinen Browser.',
  'common.footer.contact': '※ stackandborrow.com · ',
  'common.footer.dataVerified': '※ Kreditgeber-Daten verifiziert {updated}.',

  'common.cta.runCalculator': 'RECHNER STARTEN',
  'common.cta.compareLenders': 'KREDITGEBER VERGLEICHEN',

  'common.spineLabel': 'STACK & BORROW · HEFT · 2026',

  'common.glossary.label': 'GLOSSAR',
  'common.glossary.link': '↗ VOLLSTÄNDIGES GLOSSAR',
  'common.glossary.iconLabel': 'Was ist {term}?',

  'common.theme.dark': '★ DUNKEL · NACHTMODUS · TIPPEN ZUM UMSCHALTEN ',
  'common.theme.light': '★ HELL · TAGMODUS · TIPPEN ZUM UMSCHALTEN ',
  'common.theme.titleAuto': 'Design: auto ({theme}) — klicken zum Überschreiben',
  'common.theme.title': 'Design: {theme} — klicken zum Umschalten, ⌘-klicken für System',

  'common.error.title': 'Beim Laden der Seite ist etwas schiefgelaufen.',
  'common.error.unknown': 'Unbekannter Fehler',
  'common.error.return.before': 'Versuche es mit ',
  'common.error.return.link': 'zurück zur Übersicht',
  'common.error.return.after': ', oder öffne die Browser-Konsole für Details.',

  'common.livePrice.fetching': 'LÄDT…',
  'common.livePrice.retry': 'ERNEUT VERSUCHEN ↻',
  'common.livePrice.refresh': 'Aktualisieren',
  'common.livePrice.refreshLabel': 'Live BTC-Preis aktualisieren',

  // ----- ABOUT PAGE -----

  'about.meta.readFirst': 'ZUERST LESEN',
  'about.meta.readTime': '5 MINUTEN LESEZEIT',
  'about.meta.insert': 'BEILAGE · III · VON III',

  'about.hero.titleLine1': 'Grundsätze der',
  'about.hero.titleLine2': 'Philosophie.',
  'about.hero.subtitle': 'Ein Rechner für die Frage, die sich jeder langfristige Bitcoiner irgendwann stellt: Soll ich ein paar sats verkaufen oder gegen sie borgen? Was folgt, ist unsere Antwort.',

  'about.heroStamp.line1': 'NO',
  'about.heroStamp.line2': 'BS',
  'about.heroStamp.line3': '★ SATS FIRST ★',

  'about.section.principles': 'DIE GRUNDSÄTZE',
  'about.section.notForYou': 'WER DIES NICHT NUTZEN SOLLTE',
  'about.section.questions': 'DIE FRAGEN',
  'about.section.signatures': 'SIGNATUREN',

  'about.principle.i.title': 'BTC-only zuerst. Dann Gesamtkosten. Punkt.',
  'about.principle.i.body': 'BTC-only-Kreditgeber stehen immer über Multi-Collateral-Anbietern. Innerhalb jeder Stufe gewinnt der niedrigste Gesamtkostenanbieter — mit eingebackenen Custody-Risiken und Mitgliedsgebühren. Affiliate-Provisionen fließen niemals in den Algorithmus. Wenn ein Kreditgeber, der uns nichts zahlt, dir das beste Angebot macht, gewinnt er.',
  'about.principle.ii.title': 'Sats zuerst. Alles andere ist Übersetzung.',
  'about.principle.ii.body': 'Die Hauptzahl ist immer "sats, die du behältst". Fiat-Umrechnungen aktualisieren sich aus dem Live-BTC-Preis. Du kannst zu USD, EUR, SEK und zurück wechseln; die zugrundeliegende Mathematik ist in sats.',
  'about.principle.iii.title': 'Steuerbewusst standardmäßig.',
  'about.principle.iii.body': 'Um netto $N in bar zu erhalten, musst du genug BTC verkaufen, um $N + Kapitalertragsteuer zu decken. Wir backen die Steuer in jeden Vergleich ein. Den Satz kannst du anpassen, falls deine Jurisdiktion abweicht.',
  'about.principle.iv.title': 'Kein Tracking. Keine Konten. Keine Daten verlassen deinen Browser.',
  'about.principle.iv.body': 'Deine Eingaben werden in localStorage auf deinem Gerät gespeichert. Es gibt keine Analytics, keine Drittanbieter-Skripte, keine Anmeldung. Die Seite ist ein Ordner mit HTML und eine JSON mit Kreditgeber-Sätzen.',
  'about.principle.v.title': 'Ehrlich über die Risiken.',
  'about.principle.v.body': 'BTC ist seit 2013 sechsmal um >50 % von einem 12-Monats-Hoch gefallen. Borgen mit 50 % LTV bedeutet: ein 50 %-Drawdown ist deine Liquidation. Sechsmal in zwölf Jahren ist kein ob, sondern wann.',

  'about.warning.heading': '⚠ NICHT FORTFAHREN, WENN',
  'about.warning.item1': 'Dich ein 50 %-Drawdown bei BTC zerstören würde (was sechsmal passiert ist)',
  'about.warning.item2': 'Du nicht verstehst, was Rehypothekation ist und welche Kreditgeber sie betreiben',
  'about.warning.item3.before': 'Du borgst, um ',
  'about.warning.item3.italic': 'mehr Bitcoin zu kaufen',
  'about.warning.item3.after': '. Das ist Hebel, keine Strategie.',

  'about.faq.funding.q': 'F: Wie finanziert sich die Seite?',
  'about.faq.funding.a': 'Einige Kreditgeber-Links sind Affiliate-Links. Wenn du klickst und einen Kredit aufnimmst, zahlt der Kreditgeber eine Vermittlungsgebühr. Das finanziert das Hosting. Das Ranking ist davon unberührt — wähle den Weg, den du bevorzugst.',
  'about.faq.prices.q': 'F: Woher kommt der BTC-Preis?',
  'about.faq.prices.a': 'mempool.space, alle fünf Minuten abgefragt. Fallback ist utxoracle.io. Wenn beide ausfallen, nutzen wir einen eingebackenen Fallback (sichtbar markiert).',
  'about.faq.rates.q': 'F: Wie oft werden die Sätze aktualisiert?',
  'about.faq.rates.a': 'Ziel ist vierteljährlich, schneller wenn ein Kreditgeber schließt oder sich wesentlich ändert. Das letzte Verifizierungsdatum steht im Footer des Rechners.',
  'about.faq.feedback.q': 'F: Etwas falsch gefunden?',
  'about.faq.feedback.a': 'feedback@stackandborrow.com — kurze E-Mails bekommen schnellere Antworten.',

  'about.sig.signed': '~ signiert',
  'about.sig.signedRole': 'DER AUTOR',
  'about.sig.domainRole': 'OFFIZIELLE DOMAIN',

  'about.verifiedStamp.line1': 'VERIFIZIERT',
  'about.verifiedStamp.line2': 'CALC',
  'about.verifiedStamp.line3': '★ MAI 2026 ★',

  'about.desktop.leftLabel': 'SEITE IV · LINKS — DIE GRUNDSÄTZE',
  'about.desktop.rightLabel': 'SEITE IV · RECHTS — VORBEHALTE, Q&A, SIGNIERT',

  'about.glossary.intro': 'Verständliche Definitionen für jeden Begriff auf dieser Seite.',

  // ----- GLOSSARY -----

  'glossary.collateral.title': 'Sicherheit (Collateral)',
  'glossary.collateral.body': 'Die Bitcoin, die du beim Kreditgeber als Sicherheit für den Kredit hinterlegst. Du bekommst sie zurück, wenn du zurückzahlst. Wenn der BTC-Preis weit genug fällt, kann der Kreditgeber sie ganz oder teilweise verkaufen, um den Kredit zu decken — das ist Liquidation.',
  'glossary.ltv.title': 'Loan-to-value (LTV)',
  'glossary.ltv.body': 'Kreditbetrag geteilt durch Sicherheitswert, in Prozent. 50 % LTV bedeutet, 50.000 $ gegen 100.000 $ Bitcoin zu borgen. Je niedriger der LTV, desto mehr Spielraum, bevor ein Preisfall Liquidation auslöst.',
  'glossary.apr.title': 'APR — effektiver Jahreszins',
  'glossary.apr.body': 'Die jährlichen Kosten des Borgens, ausgedrückt als Prozent des Kreditbetrags. Inklusive Zinssatz plus etwaige Bearbeitungsgebühr. 10 % APR auf einen 50.000 $-Kredit sind rund 5.000 $ pro Jahr.',
  'glossary.origination.title': 'Bearbeitungsgebühr',
  'glossary.origination.body': 'Eine einmalige Gebühr, die der Kreditgeber für die Einrichtung des Kredits erhebt — meist 1–2 % des geborgten Betrags. Manche Kreditgeber erlassen sie für Kreditnehmer aus ihrer Heimatregion.',
  'glossary.liquidation.title': 'Liquidation',
  'glossary.liquidation.body': 'Ein Zwangsverkauf deiner Sicherheit, falls BTC unter eine festgelegte Schwelle ("Liquidationspreis") fällt. Der Kreditgeber verkauft nur so viel BTC, wie nötig ist, um die Schuld zu decken — gilt aber als steuerpflichtiger Verkauf.',
  'glossary.balloon.title': 'Ballonzahlung',
  'glossary.balloon.body': 'Ein Kredit, bei dem du während der Laufzeit keine monatlichen Zahlungen (oder nur Zinsen) leistest und das volle Kapital als Einmalbetrag bei Fälligkeit fällig wird. Die meisten bitcoin-besicherten Kredite sind so strukturiert.',
  'glossary.sats.title': 'Sats — Satoshis',
  'glossary.sats.body': 'Die kleinste Einheit von Bitcoin. 1 BTC = 100.000.000 sats. Diese Seite nutzt sats, damit kleine Anteile eines Bitcoins leichter als ganze Zahlen verglichen werden können.',
  'glossary.taxEvent.title': 'Steuerpflichtiges Ereignis',
  'glossary.taxEvent.body': 'Eine Handlung, die in den meisten Jurisdiktionen einen steuerpflichtigen Gewinn oder Verlust auslöst. Bitcoin verkaufen ist ein steuerpflichtiges Ereignis. Gegen Bitcoin borgen ist es nicht — du besitzt die BTC noch, also wird steuerlich nichts realisiert.',
  'glossary.principal.title': 'Hauptbetrag',
  'glossary.principal.body': 'Der ursprüngliche geborgte Geldbetrag, getrennt von den Zinsen. Bei einem 50.000 $-Kredit mit 5.000 $ Zinsen beträgt der Hauptbetrag 50.000 $ und die gesamte Schuld bei Fälligkeit 55.000 $.',
  'glossary.interest.title': 'Zinsen',
  'glossary.interest.body': 'Die Gebühr, die du dem Kreditgeber für das Borgen zahlst, berechnet als Prozent (APR) des Hauptbetrags über die Zeit. Die meisten bitcoin-besicherten Kredite haben tägliche Zinsabgrenzung und zahlen sie bei Fälligkeit aus.',
  'glossary.custody.title': 'Verwahrung (Custody)',
  'glossary.custody.body': 'Wer die Bitcoin während des Kredits hält. Custodial — der Kreditgeber (oder ein Drittverwahrer) hält sie. Multisig — Schlüssel werden zwischen dir, dem Kreditgeber und einem Schiedsrichter aufgeteilt, sodass keine Partei allein die BTC bewegen kann.',
  'glossary.rehypothecation.title': 'Rehypothekation',
  'glossary.rehypothecation.body': 'Wenn ein Kreditgeber deine Sicherheit weiterverwendet — sie z. B. weiterverleiht oder verpfändet, um seine eigene Finanzierung zu sichern. Erhöht das Gegenparteirisiko: Wenn der Kreditgeber ausfällt, könnte deine BTC mit seinen Gläubigern verstrickt sein.',
  'glossary.multisig.title': 'Multisig — Mehrfachsignatur',
  'glossary.multisig.body': 'Ein Bitcoin-Skript, das mehr als einen privaten Schlüssel benötigt, um Mittel zu bewegen. Eingesetzt in kollaborativer Verwahrung (du + Kreditgeber + Schiedsrichter), sodass keine Partei allein mit deiner Sicherheit handeln kann.',
  'glossary.dlc.title': 'DLC — discreet log contract',
  'glossary.dlc.body': 'Ein bitcoin-natives Vertragsdesign, bei dem die Sicherheit in einem 2-aus-2-Skript gesperrt ist und die Abwicklung von einem Orakel (Preisfeed) ohne zentrale Partei entschieden wird. Wird von einigen nicht-custodialen Kreditgebern verwendet.',
  'glossary.rollover.title': 'Verlängerung',
  'glossary.rollover.body': 'Sammelbegriff dafür, bei Fälligkeit nicht abzubezahlen. Drei Varianten: revolvierend (keine Fälligkeit zum Hinwegrollen), Refinanzierung (ein neuer Kredit ersetzt den alten), oder neuer Vertrag (du beantragst von vorne). Was dein Kreditgeber anbietet, bestimmt, wie viel Reibung entsteht.',
  'glossary.newContract.title': 'Neuer Kredit bei Fälligkeit',
  'glossary.newContract.body': 'Manche Kreditgeber bieten keine Refinanzierung — bei Fälligkeit musst du vollständig zurückzahlen und dann einen neuen Kredit von vorne beantragen, falls du weiter borgen willst. Wird als komplett neue Transaktion behandelt: neue Bonitätsprüfung, neue Bearbeitungsgebühr, neuer APR. Mehr Reibung als Refinanzierung, aber deine Sicherheit wird zwischen den Krediten freigegeben.',
  'glossary.refinance.title': 'Refinanzierung',
  'glossary.refinance.body': 'Den bestehenden Kredit bei Fälligkeit durch einen neuen ersetzen. Der Kreditgeber prüft dich neu, ein neuer APR wird festgelegt und eine neue Bearbeitungsgebühr kann anfallen. Deine Sicherheit bleibt unangetastet — sie bleibt einfach unter dem neuen Kredit liegen. Unterscheidet sich von revolvierendem Kredit, der keine Fälligkeit zum Refinanzieren hat.',
  'glossary.revolving.title': 'Revolvierender Kredit',
  'glossary.revolving.body': 'Eine offene Kreditlinie ohne festes Fälligkeitsdatum. Du zahlst zurück und nimmst jederzeit wieder auf, wie eine Kreditkarte. Es gibt nichts zu refinanzieren, weil es kein Enddatum gibt — Zinsen laufen einfach auf dem ausstehenden Saldo.',
  'glossary.capitalGains.title': 'Kapitalertragsteuer',
  'glossary.capitalGains.body': 'Steuer auf den Gewinn aus dem Verkauf eines im Wert gestiegenen Vermögenswerts. BTC zu einem höheren Preis als beim Kauf zu verkaufen, löst in den meisten Jurisdiktionen Kapitalertragsteuer aus. Sätze und Regeln variieren je nach Land.',
};
