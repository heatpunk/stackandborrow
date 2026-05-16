// ============================================================
// PT — português. Traduzido de en.js.
// Termos bitcoin (sats, BTC, LTV, multisig) são mantidos.
// Voz editorial: curta, declarativa, sats-primeiro.
// ============================================================

export default {
  // ----- COMMON: brand, header, nav, footer, errors -----

  'common.brand.name': 'Stack & Borrow',
  'common.brand.tagline': '· EMPRÉSTIMOS LASTREADOS EM BITCOIN ·',
  'common.header.est': 'EST · {date}',
  'common.header.pageOf': '{current} DE {of}',
  'common.header.issueNumber': 'N.º 000.50K',

  'common.nav.overview': 'VISÃO GERAL',
  'common.nav.calculator': 'CALCULADORA',
  'common.nav.lenders': 'CREDORES',
  'common.nav.terms': 'TERMOS',

  'common.footer.btcSource': '※ BTC ao vivo: {source} · classificado por custo total, não por comissão.',
  'common.footer.disclaimer': '※ Não é aconselhamento financeiro. Nenhum dado sai do teu navegador.',
  'common.footer.contact': '※ stackandborrow.com · ',
  'common.footer.dataVerified': '※ Dados de credores verificados {updated}.',

  'common.cta.runCalculator': 'EXECUTAR CALCULADORA',
  'common.cta.compareLenders': 'COMPARAR CREDORES',

  'common.spineLabel': 'STACK & BORROW · CADERNO · 2026',

  'common.glossary.label': 'GLOSSÁRIO',
  'common.glossary.link': '↗ GLOSSÁRIO COMPLETO',
  'common.glossary.iconLabel': 'O que é {term}?',

  'common.theme.dark': '★ ESCURO · MODO NOITE · TOQUE PARA TROCAR ',
  'common.theme.light': '★ CLARO · MODO DIA · TOQUE PARA TROCAR ',
  'common.theme.titleAuto': 'Tema: auto ({theme}) — clique para sobrepor',
  'common.theme.title': 'Tema: {theme} — clique para alternar, ⌘-clique para sistema',

  'common.error.title': 'Algo correu mal ao carregar a página.',
  'common.error.unknown': 'Erro desconhecido',
  'common.error.return.before': 'Tenta ',
  'common.error.return.link': 'voltar à visão geral',
  'common.error.return.after': ', ou abre a consola do navegador para detalhes.',

  'common.livePrice.fetching': 'A CARREGAR…',
  'common.livePrice.retry': 'TENTAR DE NOVO ↻',
  'common.livePrice.refresh': 'Atualizar',
  'common.livePrice.refreshLabel': 'Atualizar preço BTC ao vivo',

  // ----- ABOUT PAGE -----

  'about.meta.readFirst': 'LÊ ISTO PRIMEIRO',
  'about.meta.readTime': 'LEITURA DE 5 MIN.',
  'about.meta.insert': 'ANEXO · III · DE III',

  'about.hero.titleLine1': 'Termos de',
  'about.hero.titleLine2': 'filosofia.',
  'about.hero.subtitle': 'Uma calculadora para a pergunta que todo bitcoiner de longo prazo enfrenta cedo ou tarde: devo vender alguns sats ou pedir emprestado contra eles? O que segue é como decidimos responder.',

  'about.heroStamp.line1': 'NO',
  'about.heroStamp.line2': 'BS',
  'about.heroStamp.line3': '★ SATS FIRST ★',

  'about.section.principles': 'OS PRINCÍPIOS',
  'about.section.notForYou': 'QUEM NÃO DEVERIA USAR ISTO',
  'about.section.questions': 'AS PERGUNTAS',
  'about.section.signatures': 'ASSINATURAS',

  'about.principle.i.title': 'BTC-only primeiro. Depois custo total. Ponto.',
  'about.principle.i.body': 'Credores BTC-only ficam sempre acima dos multi-colaterais. Dentro de cada nível ganha o menor custo total — com riscos de custódia e mensalidades já incluídos. Comissões de afiliados nunca entram no algoritmo. Se um credor que não nos paga nada te oferecer o melhor negócio, ele ganha.',
  'about.principle.ii.title': 'Sats primeiro. Tudo o resto é tradução.',
  'about.principle.ii.body': 'O número principal é sempre "sats que ficas". Conversões para fiat atualizam a partir do preço BTC ao vivo. Podes alternar entre USD, EUR, SEK e voltar; a matemática subjacente está em sats.',
  'about.principle.iii.title': 'Consciente de impostos por padrão.',
  'about.principle.iii.body': 'Para receber $N líquidos em dinheiro, deves vender BTC suficiente para cobrir $N + imposto sobre ganhos de capital. Embutimos o imposto em cada comparação. Podes editar a taxa se a tua jurisdição diferir.',
  'about.principle.iv.title': 'Sem rastreio. Sem contas. Nenhum dado sai do teu navegador.',
  'about.principle.iv.body': 'As tuas entradas são guardadas em localStorage no teu dispositivo. Não há analytics, scripts de terceiros, nem registo. O site é uma pasta de HTML e um JSON com taxas de credores.',
  'about.principle.v.title': 'Honesto sobre os riscos.',
  'about.principle.v.body': 'BTC caiu >50 % de um máximo de 12 meses seis vezes desde 2013. Pedir emprestado a 50 % LTV significa que uma queda de 50 % é o teu evento de liquidação. Seis vezes em doze anos não é se, mas quando.',

  'about.warning.heading': '⚠ NÃO PROSSIGAS SE',
  'about.warning.item1': 'Ficarias devastado com uma queda de 50 % do BTC (o que já aconteceu seis vezes)',
  'about.warning.item2': 'Não entendes rehipotecação e quais credores a praticam',
  'about.warning.item3.before': 'Estás a pedir emprestado para ',
  'about.warning.item3.italic': 'comprar mais bitcoin',
  'about.warning.item3.after': '. Isso é alavancagem, não estratégia.',

  'about.faq.funding.q': 'P: Como é financiado o site?',
  'about.faq.funding.a': 'Alguns links para credores são de afiliado. Quando clicas e tomas um empréstimo, o credor paga uma comissão de indicação. Isto financia o alojamento. O ranking não é afetado — escolhe o caminho que preferires.',
  'about.faq.prices.q': 'P: De onde vem o preço BTC?',
  'about.faq.prices.a': 'mempool.space, consultado a cada cinco minutos. A alternativa é utxoracle.io. Se ambos falharem usamos um fallback embutido (marcado visivelmente).',
  'about.faq.rates.q': 'P: Com que frequência as taxas são atualizadas?',
  'about.faq.rates.a': 'Meta trimestral, mais cedo se um credor fechar ou mudar materialmente. A última data de verificação está no rodapé da calculadora.',
  'about.faq.feedback.q': 'P: Encontraste algo errado?',
  'about.faq.feedback.a': 'feedback@stackandborrow.com — e-mails curtos recebem resposta mais rápida.',

  'about.sig.signed': '~ assinado',
  'about.sig.signedRole': 'O AUTOR',
  'about.sig.domainRole': 'DOMÍNIO OFICIAL',

  'about.verifiedStamp.line1': 'VERIFICADO',
  'about.verifiedStamp.line2': 'CALC',
  'about.verifiedStamp.line3': '★ MAIO 2026 ★',

  'about.desktop.leftLabel': 'PÁGINA IV · ESQUERDA — OS PRINCÍPIOS',
  'about.desktop.rightLabel': 'PÁGINA IV · DIREITA — RESERVAS, P&R, ASSINADO',

  'about.glossary.intro': 'Definições em linguagem clara para cada termo usado neste site.',

  // ----- GLOSSARY -----

  'glossary.collateral.title': 'Colateral',
  'glossary.collateral.body': 'O bitcoin que bloqueias com o credor para garantir o empréstimo. Recebê-lo de volta quando pagas. Se o preço do BTC cair o suficiente, o credor pode vender parte ou tudo para recuperar o empréstimo — isso é liquidação.',
  'glossary.ltv.title': 'Loan-to-value (LTV)',
  'glossary.ltv.body': 'Valor do empréstimo dividido pelo valor do colateral, em percentagem. 50 % LTV significa pedir emprestado $50K contra $100K de bitcoin. Quanto menor o LTV, maior a margem antes que uma queda de preço desencadeie liquidação.',
  'glossary.apr.title': 'APR — taxa anual',
  'glossary.apr.body': 'O custo anual de pedir emprestado, expresso como percentagem do valor do empréstimo. Inclui a taxa de juro mais qualquer comissão de abertura. 10 % APR num empréstimo de $50K são cerca de $5.000 por ano.',
  'glossary.origination.title': 'Comissão de abertura',
  'glossary.origination.body': 'Uma comissão única que o credor cobra para abrir o empréstimo — geralmente 1–2 % do valor emprestado. Alguns credores dispensam-na para mutuários da sua região.',
  'glossary.liquidation.title': 'Liquidação',
  'glossary.liquidation.body': 'Uma venda forçada do teu colateral se BTC cair abaixo de um limite definido (o "preço de liquidação"). O credor vende apenas o BTC necessário para cobrir o que deves — mas conta como venda tributável.',
  'glossary.balloon.title': 'Pagamento balão',
  'glossary.balloon.body': 'Um empréstimo onde não fazes pagamentos mensais (ou só juros) durante o prazo, e o capital total vence numa única quantia no vencimento. A maioria dos empréstimos lastreados em bitcoin são estruturados assim.',
  'glossary.sats.title': 'Sats — satoshis',
  'glossary.sats.body': 'A menor unidade do bitcoin. 1 BTC = 100.000.000 sats. Este site usa sats para que pequenas porções de bitcoin sejam mais fáceis de comparar como números inteiros.',
  'glossary.taxEvent.title': 'Evento tributável',
  'glossary.taxEvent.body': 'Uma ação que desencadeia ganho ou perda tributável na maioria das jurisdições. Vender bitcoin é um evento tributável. Pedir emprestado contra bitcoin não é — continuas a possuir o BTC, portanto nada é realizado fiscalmente.',
  'glossary.principal.title': 'Capital',
  'glossary.principal.body': 'O valor original emprestado, separado dos juros. Num empréstimo de $50K com $5K de juros, o capital é $50K e o total devido no vencimento é $55K.',
  'glossary.interest.title': 'Juros',
  'glossary.interest.body': 'A taxa que pagas ao credor por pedir dinheiro, calculada como percentagem (APR) do capital ao longo do tempo. A maioria dos empréstimos lastreados em bitcoin acumulam juros diariamente e pagam-nos no vencimento.',
  'glossary.custody.title': 'Custódia',
  'glossary.custody.body': 'Quem guarda o bitcoin durante o empréstimo. Custodial — o credor (ou um custodiante terceiro) guarda. Multisig — as chaves são divididas entre ti, o credor e um árbitro, para que nenhuma parte possa mover o BTC sozinha.',
  'glossary.rehypothecation.title': 'Rehipotecação',
  'glossary.rehypothecation.body': 'Quando um credor reutiliza o teu colateral — por exemplo, emprestando-o novamente ou empenhando-o para garantir o próprio endividamento. Aumenta o risco de contraparte: se o credor falir, o teu BTC pode ficar emaranhado com os credores dele.',
  'glossary.multisig.title': 'Multisig — multiassinatura',
  'glossary.multisig.body': 'Um script de bitcoin que requer mais de uma chave privada para mover fundos. Usado em custódia colaborativa (tu + credor + árbitro) para que nenhuma parte possa agir sozinha com o teu colateral.',
  'glossary.dlc.title': 'DLC — discreet log contract',
  'glossary.dlc.body': 'Um design de contrato nativo do bitcoin onde o colateral fica bloqueado num script 2-de-2 e a liquidação é decidida por um oráculo (feed de preços) sem parte central. Usado por alguns credores não-custodiais.',
  'glossary.rollover.title': 'Renovação',
  'glossary.rollover.body': 'Termo guarda-chuva para não pagar no vencimento. Três variantes: rotativo (sem vencimento a renovar), refinanciamento (um novo empréstimo substitui o antigo), ou novo contrato (candidatas-te de novo do zero). O que o teu credor oferece determina quanta fricção há.',
  'glossary.newContract.title': 'Novo empréstimo no vencimento',
  'glossary.newContract.body': 'Alguns credores não oferecem refinanciamento — no vencimento deves pagar integralmente e depois candidatar-te a um novo empréstimo do zero se quiseres continuar a tomar emprestado. Tratado como transação totalmente nova: nova verificação de crédito, nova comissão de abertura, nova APR. Mais fricção que refinanciar, mas o teu colateral é libertado entre empréstimos.',
  'glossary.refinance.title': 'Refinanciamento',
  'glossary.refinance.body': 'Substituir o teu empréstimo existente por um novo no vencimento. O credor reavalia-te, uma nova APR é fixada e uma nova comissão de abertura pode aplicar-se. O teu colateral não é tocado — fica apenas sob o novo empréstimo. Distinto de uma linha rotativa, que não tem vencimento a refinanciar.',
  'glossary.revolving.title': 'Crédito rotativo',
  'glossary.revolving.body': 'Uma linha de crédito aberta sem data de vencimento fixa. Pagas e levantas a qualquer momento, como um cartão de crédito. Não há nada a refinanciar porque não há data de fim — os juros simplesmente acumulam sobre o saldo em dívida.',
  'glossary.capitalGains.title': 'Imposto sobre mais-valias',
  'glossary.capitalGains.body': 'Imposto sobre o lucro da venda de um ativo que valorizou. Vender BTC a um preço maior do que o de compra desencadeia imposto sobre mais-valias na maioria das jurisdições. Taxas e regras variam por país.',
};
