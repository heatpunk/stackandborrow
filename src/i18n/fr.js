// ============================================================
// FR — français. Traduit depuis en.js.
// Les termes bitcoin (sats, BTC, LTV, multisig) sont conservés.
// Ton éditorial : court, déclaratif, sats d'abord.
// ============================================================

export default {
  // ----- COMMON: brand, header, nav, footer, errors -----

  'common.brand.name': 'Stack & Borrow',
  'common.brand.tagline': '· PRÊTS ADOSSÉS AU BITCOIN ·',
  'common.header.est': 'EST · {date}',
  'common.header.pageOf': '{current} SUR {of}',
  'common.header.issueNumber': 'N° 000.50K',

  'common.nav.overview': 'APERÇU',
  'common.nav.calculator': 'CALCULATEUR',
  'common.nav.lenders': 'PRÊTEURS',
  'common.nav.terms': 'CONDITIONS',

  'common.footer.btcSource': '※ BTC en direct : {source} · classé par coût total, pas par commission.',
  'common.footer.disclaimer': "※ Pas de conseil financier. Aucune donnée ne quitte ton navigateur.",
  'common.footer.contact': '※ stackandborrow.com · ',
  'common.footer.dataVerified': '※ Données prêteurs vérifiées {updated}.',

  'common.cta.runCalculator': 'LANCER LE CALCULATEUR',
  'common.cta.compareLenders': 'COMPARER LES PRÊTEURS',

  'common.spineLabel': 'STACK & BORROW · LIVRET · 2026',

  'common.glossary.label': 'GLOSSAIRE',
  'common.glossary.link': '↗ GLOSSAIRE COMPLET',
  'common.glossary.iconLabel': "Qu'est-ce que {term} ?",

  'common.theme.dark': '★ SOMBRE · MODE NUIT · TAPE POUR CHANGER ',
  'common.theme.light': '★ CLAIR · MODE JOUR · TAPE POUR CHANGER ',
  'common.theme.titleAuto': 'Thème : auto ({theme}) — clique pour remplacer',
  'common.theme.title': 'Thème : {theme} — clique pour basculer, ⌘-clique pour système',

  'common.error.title': 'Un problème est survenu lors du chargement de la page.',
  'common.error.unknown': 'Erreur inconnue',
  'common.error.return.before': 'Essaie de ',
  'common.error.return.link': "revenir à l'aperçu",
  'common.error.return.after': ', ou ouvre la console du navigateur pour les détails.',

  'common.livePrice.fetching': 'CHARGEMENT…',
  'common.livePrice.retry': 'RÉESSAYER ↻',
  'common.livePrice.refresh': 'Actualiser',
  'common.livePrice.refreshLabel': 'Actualiser le prix BTC en direct',

  // ----- ABOUT PAGE -----

  'about.meta.readFirst': 'À LIRE EN PREMIER',
  'about.meta.readTime': '5 MINUTES DE LECTURE',
  'about.meta.insert': 'ENCART · III · SUR III',

  'about.hero.titleLine1': 'Conditions de',
  'about.hero.titleLine2': 'philosophie.',
  'about.hero.subtitle': "Un calculateur pour la question que tout bitcoiner de long terme finit par se poser : devrais-je vendre des sats, ou emprunter contre eux ? Voici comment nous avons choisi de répondre.",

  'about.heroStamp.line1': 'NO',
  'about.heroStamp.line2': 'BS',
  'about.heroStamp.line3': '★ SATS FIRST ★',

  'about.section.principles': 'LES PRINCIPES',
  'about.section.notForYou': 'À QUI CE SITE NE CONVIENT PAS',
  'about.section.questions': 'LES QUESTIONS',
  'about.section.signatures': 'SIGNATURES',

  'about.principle.i.title': "BTC-only d'abord. Puis coût total. Point.",
  'about.principle.i.body': "Les prêteurs BTC-only passent toujours avant ceux à collatéral multiple. Au sein de chaque catégorie, le coût total le plus bas gagne — avec risque de garde et frais d'adhésion intégrés. Les commissions d'affiliation n'entrent jamais dans l'algorithme. Si un prêteur qui ne nous paie rien t'offre la meilleure offre, il gagne.",
  'about.principle.ii.title': "Sats d'abord. Tout le reste est traduction.",
  'about.principle.ii.body': 'Le chiffre principal est toujours "sats que tu gardes". Les conversions fiat se mettent à jour depuis le prix BTC en direct. Tu peux basculer entre USD, EUR, SEK et revenir ; les calculs sous-jacents sont en sats.',
  'about.principle.iii.title': 'Conscient des impôts par défaut.',
  'about.principle.iii.body': "Pour obtenir $N nets en cash, tu dois vendre assez de BTC pour couvrir $N + impôt sur les plus-values. Nous intégrons l'impôt dans chaque comparaison. Tu peux modifier le taux si ta juridiction diffère.",
  'about.principle.iv.title': 'Aucun pistage. Aucun compte. Aucune donnée ne quitte ton navigateur.',
  'about.principle.iv.body': "Tes saisies sont sauvegardées dans localStorage sur ton appareil. Pas d'analytics, pas de scripts tiers, pas d'inscription. Le site est un dossier de HTML et un JSON de taux de prêteurs.",
  'about.principle.v.title': 'Honnête sur les risques.',
  'about.principle.v.body': "BTC a chuté de >50 % depuis un sommet sur 12 mois six fois depuis 2013. Emprunter à 50 % LTV signifie qu'une baisse de 50 % est ta liquidation. Six fois en douze ans, ce n'est pas si mais quand.",

  'about.warning.heading': '⚠ NE PAS POURSUIVRE SI',
  'about.warning.item1': "Tu serais dévasté par une baisse de 50 % du BTC (ce qui est arrivé six fois)",
  'about.warning.item2': "Tu ne comprends pas la réhypothécation et quels prêteurs la pratiquent",
  'about.warning.item3.before': 'Tu empruntes pour ',
  'about.warning.item3.italic': 'acheter plus de bitcoin',
  'about.warning.item3.after': ". C'est de l'effet de levier, pas une stratégie.",

  'about.faq.funding.q': 'Q : Comment le site est-il financé ?',
  'about.faq.funding.a': "Certains liens vers les prêteurs sont d'affiliation. Quand tu cliques et prends un prêt, le prêteur paie une commission de référence. Cela finance l'hébergement. Le classement n'en est pas affecté — choisis le chemin que tu préfères.",
  'about.faq.prices.q': "Q : D'où vient le prix BTC ?",
  'about.faq.prices.a': 'mempool.space, interrogé toutes les cinq minutes. Le repli est utxoracle.io. Si les deux échouent, nous utilisons un repli intégré (visiblement marqué).',
  'about.faq.rates.q': 'Q : À quelle fréquence les taux sont-ils mis à jour ?',
  'about.faq.rates.a': 'Cible trimestrielle, plus tôt si un prêteur ferme ou évolue significativement. La dernière date de vérification est inscrite dans le pied du calculateur.',
  'about.faq.feedback.q': "Q : Trouvé quelque chose d'erroné ?",
  'about.faq.feedback.a': 'feedback@stackandborrow.com — les courriels courts reçoivent une réponse plus rapide.',

  'about.sig.signed': '~ signé',
  'about.sig.signedRole': "L'AUTEUR",
  'about.sig.domainRole': 'DOMAINE OFFICIEL',

  'about.verifiedStamp.line1': 'VÉRIFIÉ',
  'about.verifiedStamp.line2': 'CALC',
  'about.verifiedStamp.line3': '★ MAI 2026 ★',

  'about.desktop.leftLabel': 'PAGE IV · GAUCHE — LES PRINCIPES',
  'about.desktop.rightLabel': 'PAGE IV · DROITE — RÉSERVES, Q&R, SIGNÉ',

  'about.glossary.intro': 'Définitions en langage clair pour chaque terme utilisé sur ce site.',

  // ----- GLOSSARY -----

  'glossary.collateral.title': 'Collatéral',
  'glossary.collateral.body': "Le bitcoin que tu verrouilles chez le prêteur en garantie du prêt. Tu le récupères quand tu rembourses. Si le prix du BTC chute suffisamment, le prêteur peut en vendre une partie ou la totalité pour récupérer le prêt — c'est la liquidation.",
  'glossary.ltv.title': 'Loan-to-value (LTV)',
  'glossary.ltv.body': "Montant du prêt divisé par la valeur du collatéral, en pourcentage. 50 % LTV signifie emprunter 50 000 $ contre 100 000 $ de bitcoin. Plus le LTV est bas, plus la marge avant qu'une baisse de prix déclenche la liquidation est grande.",
  'glossary.apr.title': 'TAEG — taux annuel',
  'glossary.apr.body': "Le coût annuel de l'emprunt, exprimé en pourcentage du montant du prêt. Inclut le taux d'intérêt plus les frais de dossier éventuels. 10 % TAEG sur un prêt de 50 000 $ représente environ 5 000 $ par an.",
  'glossary.origination.title': 'Frais de dossier',
  'glossary.origination.body': 'Frais uniques que le prêteur facture pour mettre en place le prêt — généralement 1 à 2 % du montant emprunté. Certains prêteurs y renoncent pour les emprunteurs de leur région.',
  'glossary.liquidation.title': 'Liquidation',
  'glossary.liquidation.body': "Une vente forcée de ton collatéral si BTC tombe sous un seuil défini (le « prix de liquidation »). Le prêteur ne vend que juste assez de BTC pour couvrir ce que tu dois — mais c'est compté comme une vente imposable.",
  'glossary.balloon.title': 'Paiement ballon',
  'glossary.balloon.body': "Un prêt où tu ne fais aucun paiement mensuel (ou uniquement les intérêts) pendant la durée, et le capital total est dû en une somme unique à l'échéance. La plupart des prêts adossés au bitcoin sont structurés ainsi.",
  'glossary.sats.title': 'Sats — satoshis',
  'glossary.sats.body': 'La plus petite unité du bitcoin. 1 BTC = 100 000 000 sats. Ce site utilise les sats pour que de petites portions de bitcoin soient plus faciles à comparer en nombres entiers.',
  'glossary.taxEvent.title': 'Événement fiscal',
  'glossary.taxEvent.body': "Une action qui déclenche un gain ou une perte imposable dans la plupart des juridictions. Vendre du bitcoin est un événement fiscal. Emprunter contre du bitcoin ne l'est pas — tu possèdes toujours le BTC, donc rien n'est réalisé fiscalement.",
  'glossary.principal.title': 'Principal',
  'glossary.principal.body': "Le montant initial emprunté, distinct des intérêts. Sur un prêt de 50 000 $ avec 5 000 $ d'intérêts, le principal est 50 000 $ et le total dû à l'échéance est 55 000 $.",
  'glossary.interest.title': 'Intérêts',
  'glossary.interest.body': "Les frais que tu paies au prêteur pour emprunter, calculés en pourcentage (TAEG) du principal sur le temps. La plupart des prêts adossés au bitcoin accumulent des intérêts quotidiennement et les paient à l'échéance.",
  'glossary.custody.title': 'Garde',
  'glossary.custody.body': "Qui détient le bitcoin pendant le prêt. Custodial — le prêteur (ou un dépositaire tiers) le détient. Multisig — les clés sont réparties entre toi, le prêteur et un arbitre, de sorte qu'aucune partie ne peut déplacer le BTC seule.",
  'glossary.rehypothecation.title': 'Réhypothécation',
  'glossary.rehypothecation.body': "Quand un prêteur réutilise ton collatéral — par exemple en le re-prêtant ou en le mettant en gage pour sécuriser son propre emprunt. Augmente le risque de contrepartie : si le prêteur fait défaut, ton BTC peut être enchevêtré avec ses créanciers.",
  'glossary.multisig.title': 'Multisig — signature multiple',
  'glossary.multisig.body': "Un script bitcoin qui nécessite plus d'une clé privée pour déplacer des fonds. Utilisé en garde collaborative (toi + prêteur + arbitre) pour qu'aucune partie ne puisse agir seule avec ton collatéral.",
  'glossary.dlc.title': 'DLC — discreet log contract',
  'glossary.dlc.body': "Un design de contrat natif au bitcoin où le collatéral est verrouillé dans un script 2-sur-2 et le règlement est décidé par un oracle (flux de prix) sans partie centrale. Utilisé par certains prêteurs non-custodiaux.",
  'glossary.rollover.title': 'Rollover',
  'glossary.rollover.body': "Terme générique pour ne pas rembourser à l'échéance. Trois variantes : renouvelable (pas d'échéance à dépasser), refinancement (un nouveau prêt remplace l'ancien), ou nouveau contrat (tu candidates à nouveau depuis zéro). Ce que ton prêteur propose détermine la friction.",
  'glossary.newContract.title': "Nouveau prêt à l'échéance",
  'glossary.newContract.body': "Certains prêteurs ne proposent pas de refinancement — à l'échéance tu dois rembourser intégralement, puis demander un nouveau prêt depuis zéro pour continuer à emprunter. Traité comme une transaction entièrement nouvelle : nouvelle vérification de crédit, nouveaux frais de dossier, nouveau TAEG. Plus de friction qu'un refinancement, mais ton collatéral est libéré entre les prêts.",
  'glossary.refinance.title': 'Refinancement',
  'glossary.refinance.body': "Remplacer ton prêt existant par un nouveau à l'échéance. Le prêteur te réévalue, un nouveau TAEG est verrouillé et de nouveaux frais de dossier peuvent s'appliquer. Ton collatéral n'est pas touché — il reste simplement sous le nouveau prêt. Distinct d'une ligne renouvelable, qui n'a pas d'échéance à refinancer.",
  'glossary.revolving.title': 'Crédit renouvelable',
  'glossary.revolving.body': "Une ligne de crédit ouverte sans date d'échéance fixe. Tu rembourses et retires à tout moment, comme une carte de crédit. Il n'y a rien à refinancer car il n'y a pas de date de fin — les intérêts s'accumulent simplement sur le solde dû.",
  'glossary.capitalGains.title': 'Impôt sur les plus-values',
  'glossary.capitalGains.body': "Impôt sur le profit issu de la vente d'un actif qui s'est apprécié. Vendre du BTC à un prix supérieur à celui d'achat déclenche l'impôt sur les plus-values dans la plupart des juridictions. Taux et règles varient selon le pays.",
};
