// ============================================================
// SWEDEN-TAX PAGE — Swedish-locale guide to the tax treatment of
// bitcoin-backed loans in Sweden.
// URL: /skatt-bitcoin-lan
//
// Hard-coded Swedish (not i18n) because this is locale-specific
// content, not a translation of the rest of the site. The page
// targets searches like "låna mot bitcoin skatt", "kryptolån
// skatt", "deklarera bitcoin lån".
//
// IMPORTANT: not legal/tax advice. Cites Skatteverket where
// applicable. Encourages the reader to verify against current
// rules before acting.
// ============================================================

import React, { useState } from 'react';
import { SB } from '../system/tokens.js';
import {
  PaperFrame,
  BrandHeader,
  DashedRule,
  PageNav,
  FineFooter,
  LivePriceBadge,
  Pill,
} from '../system/components.jsx';
import { useIsDesktop } from '../system/theme.jsx';

export default function SwedenTaxPage({ live, lastUpdated }) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DesktopLayout live={live} lastUpdated={lastUpdated} />
  ) : (
    <MobileLayout live={live} lastUpdated={lastUpdated} />
  );
}

// ============================================================
// MOBILE
// ============================================================
function MobileLayout({ live, lastUpdated }) {
  return (
    <PaperFrame>
      <BrandHeader
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      <Eyebrow />
      <Hero />
      <TldrBlock />

      <DashedRule label="GRUNDREGELN" />
      <SectionPrinciple />

      <DashedRule label="NÄR UPPSTÅR SKATT?" />
      <SectionWhenTaxable />

      <DashedRule label="RÄNTEAVDRAG" />
      <SectionInterestDeduction />

      <DashedRule label="LIKVIDATION" />
      <SectionLiquidation />

      <DashedRule label="DEKLARATION" />
      <SectionDeclaration />

      <DashedRule label="HJÄLPMEDEL" />
      <SectionTools />

      <DashedRule label="VANLIGA MISSFÖRSTÅND" />
      <SectionMisconceptions />

      <DashedRule label="KÄLLOR" />
      <Sources />

      <Disclaimer />

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="about" />
      <div style={{ height: 14 }} />
    </PaperFrame>
  );
}

// ============================================================
// DESKTOP — open spread.
// ============================================================
function DesktopLayout({ live, lastUpdated }) {
  return (
    <PaperFrame maxWidth={1320} sidePad={60} innerPad="0 56px">
      <BrandHeader
        size="desktop"
        rightSlot={<LivePriceBadge btcUsd={live.btcUsd} loading={live.loading} error={live.error} onRefresh={live.refresh} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', marginTop: 8 }}>
        {/* LEFT */}
        <div style={{ padding: '0 32px 0 0', minWidth: 0 }}>
          <Eyebrow desktop />
          <Hero desktop />
          <TldrBlock desktop />

          <DashedRule label="GRUNDREGELN" />
          <SectionPrinciple desktop />

          <DashedRule label="NÄR UPPSTÅR SKATT?" />
          <SectionWhenTaxable desktop />

          <DashedRule label="RÄNTEAVDRAG" />
          <SectionInterestDeduction desktop />
        </div>

        {/* SPINE */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 0,
            borderLeft: `1px dashed ${SB.inkLine}`,
            transform: 'translateX(-0.5px)',
          }} />
        </div>

        {/* RIGHT */}
        <div style={{ padding: '0 0 0 32px', minWidth: 0 }}>
          <div style={{
            fontFamily: SB.mono, fontSize: 10, letterSpacing: '0.24em',
            color: SB.inkMute, fontWeight: 700,
            marginTop: 18, marginBottom: 14,
          }}>
            BILAGA · SVERIGE · DEL II
          </div>

          <DashedRule label="LIKVIDATION" />
          <SectionLiquidation desktop />

          <DashedRule label="DEKLARATION" />
          <SectionDeclaration desktop />

          <DashedRule label="HJÄLPMEDEL" />
          <SectionTools desktop />

          <DashedRule label="VANLIGA MISSFÖRSTÅND" />
          <SectionMisconceptions desktop />

          <DashedRule label="KÄLLOR" />
          <Sources desktop />

          <Disclaimer desktop />
        </div>
      </div>

      <FineFooter source={live.source || 'mempool.space'} updated={lastUpdated} />
      <PageNav active="about" />
      <div style={{ height: 18 }} />
    </PaperFrame>
  );
}

// ============================================================
// Building blocks
// ============================================================

function Eyebrow({ desktop = false }) {
  return (
    <div style={{
      marginTop: desktop ? 18 : 4,
      fontFamily: SB.mono,
      fontSize: desktop ? 10 : 9,
      letterSpacing: '0.22em',
      color: SB.inkMute, fontWeight: 700,
      marginBottom: desktop ? 14 : 8,
    }}>
      SVERIGE-BILAGA · SKATT PÅ LÅN MOT BITCOIN
    </div>
  );
}

function Hero({ desktop = false }) {
  return (
    <div style={{ marginBottom: desktop ? 6 : 2 }}>
      <h1 style={{
        margin: 0,
        fontFamily: SB.serif,
        fontSize: desktop ? 48 : 30,
        fontWeight: 600,
        lineHeight: 1.04,
        letterSpacing: '-0.025em',
        color: SB.ink,
      }}>
        Skatt på lån
        <br />
        <span style={{ color: SB.orange, fontStyle: 'italic', fontWeight: 500, whiteSpace: 'nowrap' }}>mot bitcoin</span>
        <br />
        i Sverige.
      </h1>
      <p style={{
        marginTop: desktop ? 22 : 14, marginBottom: 0,
        fontFamily: SB.sans,
        fontSize: desktop ? 15 : 13,
        lineHeight: 1.55,
        color: SB.inkSoft, textWrap: 'pretty',
        maxWidth: desktop ? 460 : 'none',
      }}>
        Att <b style={{ color: SB.ink }}>låna mot</b> bitcoin är inte samma sak som att <b style={{ color: SB.ink }}>sälja</b> bitcoin — och det har stor skattemässig betydelse. Här är hur Skatteverket ser på saken.
      </p>
    </div>
  );
}

function TldrBlock({ desktop = false }) {
  const fontSize = desktop ? 13 : 12;
  return (
    <div style={{
      marginTop: desktop ? 22 : 14,
      padding: '14px 14px 12px',
      border: `1.5px solid ${SB.ink}`,
      background: SB.creamWarm,
    }}>
      <div style={{
        fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
        color: SB.inkMute, fontWeight: 700, marginBottom: 8,
      }}>
        KORTVERSIONEN
      </div>
      <ul style={{
        margin: 0, padding: 0, listStyle: 'none',
        fontFamily: SB.sans, fontSize, lineHeight: 1.55,
        color: SB.ink,
      }}>
        <Bullet>
          <b>Att ta ett lån mot din bitcoin är ingen skattepliktig händelse.</b> Du säljer ingenting — du pantsätter.
        </Bullet>
        <Bullet>
          <b>Räntan på lånet är avdragsgill</b> som en räntekostnad i kapital, precis som ränta på ett bolån.
        </Bullet>
        <Bullet>
          <b>Likvidation räknas som försäljning</b> och utlöser kapitalvinstskatt. Det här är den dolda risken.
        </Bullet>
        <Bullet>
          <b>Återbetalning i bitcoin</b> i stället för fiat <b>räknas också som försäljning</b> av den bitcoin du betalar med.
        </Bullet>
      </ul>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li style={{
      display: 'grid',
      gridTemplateColumns: '14px 1fr',
      gap: 6,
      marginBottom: 8,
      textWrap: 'pretty',
    }}>
      <span style={{ color: SB.orange, fontWeight: 700 }}>·</span>
      <span>{children}</span>
    </li>
  );
}

function P({ children, desktop = false }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontFamily: SB.sans,
      fontSize: desktop ? 13.5 : 12.5,
      lineHeight: 1.65,
      color: SB.inkSoft, textWrap: 'pretty',
    }}>
      {children}
    </p>
  );
}

function Bold({ children }) {
  return <b style={{ color: SB.ink }}>{children}</b>;
}

function SectionPrinciple({ desktop = false }) {
  return (
    <div>
      <P desktop={desktop}>
        Skatteverkets utgångspunkt: <Bold>en händelse beskattas när du avyttrar en tillgång</Bold>. När du pantsätter din bitcoin som säkerhet för ett lån avyttrar du den inte — den ligger kvar som <i>din</i> tillgång, även om den är låst hos långivaren eller i en multisig under lånets löptid.
      </P>
      <P desktop={desktop}>
        Det här är samma princip som när du tar ett bolån mot din bostad: du säljer inte huset, du pantsätter det. Banken får panträtt; du behåller äganderätten. Skattemässigt händer ingenting förrän du faktiskt säljer.
      </P>
      <P desktop={desktop}>
        <Bold>Förutsättningen är att motparten inte fritt får använda din bitcoin under tiden.</Bold> Lånar långivaren ut din BTC till tredje part (<i>återpantsättning</i>, eller "rehypothecation"), kan Skatteverket i värsta fall hävda att den ändå har avyttrats. Det är ett av flera skäl att välja en långivare som <Bold>inte återpantsätter</Bold>.
      </P>
    </div>
  );
}

function SectionWhenTaxable({ desktop = false }) {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: SB.sans,
    fontSize: desktop ? 12.5 : 11.5,
    lineHeight: 1.5,
    color: SB.inkSoft,
  };
  const th = {
    textAlign: 'left',
    padding: '8px 8px',
    fontFamily: SB.mono,
    fontSize: 9.5, letterSpacing: '0.14em', fontWeight: 700,
    color: SB.ink,
    borderBottom: `1.5px solid ${SB.ink}`,
  };
  const td = {
    padding: '8px 8px',
    borderBottom: `1px dotted ${SB.inkLine}`,
    verticalAlign: 'top',
  };
  return (
    <div>
      <P desktop={desktop}>
        Praktisk översikt — när utlöser ett bitcoin-lån skatt, och när gör det inte det?
      </P>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>Händelse</th>
            <th style={th}>Skattepliktig?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td}>Du tar ett lån mot din BTC, fiat betalas ut</td>
            <td style={{ ...td, color: SB.forest, fontWeight: 600 }}>Nej</td>
          </tr>
          <tr>
            <td style={td}>Du betalar ränta i fiat</td>
            <td style={{ ...td, color: SB.forest, fontWeight: 600 }}>Nej (men avdragsgill, se nedan)</td>
          </tr>
          <tr>
            <td style={td}>Du betalar tillbaka lånet i fiat, din BTC släpps</td>
            <td style={{ ...td, color: SB.forest, fontWeight: 600 }}>Nej</td>
          </tr>
          <tr>
            <td style={td}>Du betalar tillbaka lånet i bitcoin (eller stablecoin köpt med bitcoin)</td>
            <td style={{ ...td, color: SB.rust, fontWeight: 600 }}>Ja — avyttring av den BTC du betalar med</td>
          </tr>
          <tr>
            <td style={td}>Långivaren likviderar din säkerhet vid prisras</td>
            <td style={{ ...td, color: SB.rust, fontWeight: 600 }}>Ja — räknas som tvångsförsäljning</td>
          </tr>
          <tr>
            <td style={td}>Långivaren tar din BTC i utbyte mot skuldnedskrivning (utan likvidation)</td>
            <td style={{ ...td, color: SB.rust, fontWeight: 600 }}>Ja — räknas som avyttring</td>
          </tr>
          <tr>
            <td style={td}>Du sätter in BTC som säkerhet (BTC ligger låst men ägs av dig)</td>
            <td style={{ ...td, color: SB.forest, fontWeight: 600 }}>Nej</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SectionInterestDeduction({ desktop = false }) {
  return (
    <div>
      <P desktop={desktop}>
        Räntan du betalar på ett lån mot bitcoin <Bold>är som regel avdragsgill</Bold> som en räntekostnad i inkomstslaget kapital, på samma sätt som ränta på ett konsumtionslån eller bolån.
      </P>
      <P desktop={desktop}>
        <Bold>Praktisk gräns:</Bold> avdraget är 30 % upp till 100 000 kr ränta per år, och 21 % över det. Det fungerar som ett underskott i kapital — du behöver alltså andra inkomster av kapital eller tjänst för att skatten ska minska.
      </P>
      <P desktop={desktop}>
        <Bold>Betalar du ränta i bitcoin?</Bold> Då sker två saker samtidigt: räntebeloppet är fortfarande avdragsgillt <i>i kronor</i>, men den bitcoin du använder för att betala är samtidigt en avyttring och utlöser kapitalvinstskatt på den BTC:n. För svenska låntagare är fiat-ränta i praktiken alltid lättare att hantera.
      </P>
    </div>
  );
}

function SectionLiquidation({ desktop = false }) {
  return (
    <div>
      <P desktop={desktop}>
        Det här är fällan: om bitcoinpriset faller tillräckligt långt och långivaren tvingas sälja din säkerhet (likvidation), <Bold>räknas det som en försäljning av din BTC</Bold> i Skatteverkets ögon — även om du inte själv vidtog någon åtgärd och inte fick några pengar i hand.
      </P>
      <P desktop={desktop}>
        Konsekvensen: du sitter med en <Bold>kapitalvinst att skatta på</Bold> (om priset låg över ditt omkostnadsbelopp när BTC köptes) <Bold>utan att ha fått några sålda kronor</Bold> som kan betala skatten. Lånet löstes ut, men vinsten räknas mot dig.
      </P>
      <div style={{
        margin: '10px 0',
        padding: '10px 12px',
        border: `1px dashed ${SB.rust}`,
        background: 'rgba(160, 60, 30, 0.04)',
      }}>
        <div style={{
          fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.2em',
          color: SB.rust, fontWeight: 700, marginBottom: 4,
        }}>
          ⚠ KONKRET EXEMPEL
        </div>
        <P desktop={desktop}>
          Du köpte 1 BTC för 200 000 kr 2021. Priset står i 1 000 000 kr 2026. Du tar ett lån på 400 000 kr (40 % LTV). BTC rasar 60 % — likvidation. Din 1 BTC säljs för ungefär 400 000 kr för att täcka lånet. Skatteverket räknar: <Bold>vinst = 400 000 − 200 000 = 200 000 kr</Bold>. Skatt: 30 % på vinst i kapital = 60 000 kr. Du har 0 kr i kontanter kvar — men 60 000 kr i skatt att betala.
        </P>
      </div>
      <P desktop={desktop}>
        Det här är inte ett argument <i>mot</i> bitcoin-säkrade lån — det är ett argument <Bold>mot för hög belåningsgrad</Bold>. Vår kalkylator räknar standardiserat på 50 % LTV, vilket kräver ett ras på cirka 38 % från spotpriset för att utlösa likvidation hos de flesta långivare.
      </P>
    </div>
  );
}

function SectionDeclaration({ desktop = false }) {
  return (
    <div>
      <P desktop={desktop}>
        Praktiska steg vid deklaration:
      </P>
      <ol style={{
        margin: 0, paddingLeft: 22,
        fontFamily: SB.sans, fontSize: desktop ? 13 : 12.5,
        lineHeight: 1.65, color: SB.inkSoft,
      }}>
        <li style={{ marginBottom: 8 }}>
          <Bold>Själva lånet redovisas inte.</Bold> Det är inte en skattepliktig händelse — du har inget att rapportera vid lånestart eller löpande, så länge ingen avyttring sker.
        </li>
        <li style={{ marginBottom: 8 }}>
          <Bold>Räntan rapporteras under kapital (ränteutgifter).</Bold> Långivare i Sverige kontrolluppgiftar normalt; utländska långivare gör det inte — då fyller du i räntan själv (oftast i 8.1 / "Ränteutgifter").
        </li>
        <li style={{ marginBottom: 8 }}>
          <Bold>Vid likvidation eller återbetalning i BTC</Bold> redovisar du den avyttrade BTC:n på K4 (avsnitt D, "Övriga värdepapper") som vilken kryptoförsäljning som helst. Omkostnadsbelopp beräknas enligt genomsnittsmetoden över hela ditt BTC-innehav.
        </li>
        <li>
          <Bold>Spara underlag.</Bold> Avtalet med långivaren, transaktionshistorik, och bevis på vad lånets pengar användes till — Skatteverket frågar inte ofta, men kan göra det.
        </li>
      </ol>
    </div>
  );
}

// SectionTools — single curated recommendation for users who need help
// with the actual K4 filing. Affiliate disclosed openly so the link
// is transparent. `rel="sponsored"` tells Google this is a paid link
// (per Google's link-attribute guidelines).
function SectionTools({ desktop = false }) {
  return (
    <div style={{
      padding: '14px 14px 12px',
      border: `1px dashed ${SB.inkLine}`,
    }}>
      <div style={{
        fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.22em',
        color: SB.orange, fontWeight: 700, marginBottom: 8,
      }}>
        ★ DEKLARATIONSVERKTYG
      </div>
      <div style={{
        fontFamily: SB.serif, fontSize: desktop ? 18 : 16, fontWeight: 600,
        color: SB.ink, letterSpacing: '-0.005em', marginBottom: 6,
      }}>
        Divly
      </div>
      <p style={{
        margin: '0 0 12px',
        fontFamily: SB.sans, fontSize: desktop ? 13 : 12.5,
        lineHeight: 1.6, color: SB.inkSoft, textWrap: 'pretty',
      }}>
        Svenskt verktyg byggt specifikt för krypto-deklaration enligt Skatteverket. Importerar från börser och plånböcker, räknar omkostnadsbelopp enligt genomsnittsmetoden, och genererar K4-filen du laddar upp direkt. Värt det om du har transaktioner från fler än ett konto eller flera år bakåt.
      </p>
      <a
        href="https://divly.com/?ref=otq1ztc"
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{
          display: 'inline-block',
          padding: '9px 14px',
          border: `1.5px solid ${SB.ink}`,
          background: 'transparent',
          fontFamily: SB.mono,
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.18em',
          color: SB.ink,
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}
      >
        Pröva Divly →
      </a>
      <div style={{
        marginTop: 10,
        fontFamily: SB.mono, fontSize: 9, letterSpacing: '0.04em',
        color: SB.inkMute, lineHeight: 1.55,
      }}>
        ※ Affiliate-länk — Divly betalar oss en hänvisningsavgift om du registrerar dig. Det finansierar hosting och påverkar inte rekommendationen.
      </div>
    </div>
  );
}

function SectionMisconceptions({ desktop = false }) {
  return (
    <div>
      <Misconception
        myth="“Lånar jag mot min BTC är det ett sätt att kringgå skatten.”"
        truth="Det är ingen kringgång — det är hur Skatteverket beskattar avyttring kontra pantsättning. Ingen avyttring sker, alltså ingen skatt än. Du har skjutit fram skatten, inte avskaffat den. När du betalar tillbaka och säljer BTC längre fram betalas vinstskatten då. Bitcoin-lån är skatteneutralt, inte skattefritt."
        desktop={desktop}
      />
      <Misconception
        myth="“Att låna ut min BTC och att låna mot min BTC är samma sak skattemässigt.”"
        truth="Nej. Att låna ut BTC mot ränta (yield, staking-liknande arrangemang) räknas i många fall som en avyttring eftersom motparten fritt får använda kryptot — det utlöser kapitalvinstskatt. Att låna mot BTC, där BTC förblir din och inte används, gör det inte."
        desktop={desktop}
      />
      <Misconception
        myth="“Räntan är inte avdragsgill eftersom det är ett kryptolån.”"
        truth="Det stämmer inte. Ränta på lån är avdragsgill i inkomstslaget kapital oavsett vilken tillgång som ligger som säkerhet. Det avgörande är att det är ett riktigt lån med dokumenterad ränta — inte vad som finns på andra sidan av panträtten."
        desktop={desktop}
      />
      <Misconception
        myth="“Jag måste betala förmögenhetsskatt på den BTC jag har som säkerhet.”"
        truth="Sverige har ingen förmögenhetsskatt. Du behöver inte deklarera värdet på din BTC löpande — bara realiserade vinster och förluster när du faktiskt säljer eller på annat sätt avyttrar."
        desktop={desktop}
      />
    </div>
  );
}

function Misconception({ myth, truth, desktop }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginBottom: 14,
      borderLeft: `2.5px solid ${SB.orange}`,
      background: 'rgba(186, 95, 21, 0.04)',
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '10px 12px',
          margin: 0,
          cursor: 'pointer',
          color: 'inherit',
          font: 'inherit',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 16px',
          gap: 10,
          alignItems: 'start',
        }}>
          <div style={{
            fontFamily: SB.serif, fontStyle: 'italic',
            fontSize: desktop ? 14 : 13, color: SB.ink, fontWeight: 500,
            textWrap: 'pretty', lineHeight: 1.4,
          }}>
            {myth}
          </div>
          <span
            aria-hidden="true"
            style={{
              fontFamily: SB.mono,
              fontSize: 16,
              color: SB.orange,
              fontWeight: 700,
              lineHeight: 1.2,
              userSelect: 'none',
              transform: open ? 'rotate(45deg)' : 'rotate(0)',
              transition: 'transform 180ms ease',
              transformOrigin: 'center',
              display: 'inline-block',
              textAlign: 'center',
            }}
          >
            +
          </span>
        </div>
      </button>
      {open && (
        <div style={{
          padding: '8px 12px 12px',
          marginTop: -2,
          borderTop: `1px dashed ${SB.inkLine}`,
          fontFamily: SB.sans, fontSize: desktop ? 12.5 : 12,
          lineHeight: 1.6, color: SB.inkSoft, textWrap: 'pretty',
        }}>
          {truth}
        </div>
      )}
    </div>
  );
}

function Sources({ desktop = false }) {
  const linkStyle = {
    color: SB.orange,
    textDecoration: 'none',
    borderBottom: `1px dashed ${SB.orange}`,
  };
  return (
    <ul style={{
      margin: 0, padding: 0, listStyle: 'none',
      fontFamily: SB.sans, fontSize: desktop ? 12.5 : 12,
      lineHeight: 1.7, color: SB.inkSoft,
    }}>
      <li style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 6, marginBottom: 6 }}>
        <span style={{ color: SB.inkMute }}>·</span>
        <span>
          <a href="https://www.skatteverket.se/privat/skatter/vardepapper/andratillgangar/kryptovalutor.4.15532c7b1442f256bae11b60.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Skatteverket — Kryptovalutor (grundsidan)
          </a>
          {' '}— officiella reglerna om beskattning av kryptotillgångar i Sverige.
        </span>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 6, marginBottom: 6 }}>
        <span style={{ color: SB.inkMute }}>·</span>
        <span>
          <a href="https://www.skatteverket.se/privat/skatter/vardepapper/avdragforranteutgifter.4.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Skatteverket — Ränteutgifter
          </a>
          {' '}— regler för ränteavdrag.
        </span>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 6, marginBottom: 6 }}>
        <span style={{ color: SB.inkMute }}>·</span>
        <span>
          <a href="https://www.bitcoin.se/articles/deklaration-av-kryptolan-staking-mm" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Bitcoin.se — Deklaration av kryptolån, staking m.m.
          </a>
          {' '}— bra svensk-skriven sammanställning.
        </span>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 6 }}>
        <span style={{ color: SB.inkMute }}>·</span>
        <span>
          <a href="https://www.fi.se/sv/publicerat/nyheter/2023/bedragare-lockar-med-bitcoin/" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            Finansinspektionen
          </a>
          {' '}— kontrollera alltid att en svensk långivare har tillstånd.
        </span>
      </li>
    </ul>
  );
}

function Disclaimer({ desktop = false }) {
  return (
    <div style={{
      marginTop: 18,
      padding: '12px 14px',
      border: `1px dashed ${SB.inkLine}`,
      fontFamily: SB.mono,
      fontSize: desktop ? 10 : 9.5,
      letterSpacing: '0.02em',
      lineHeight: 1.6,
      color: SB.inkMute,
    }}>
      <Pill color={SB.orange}>EJ SKATTERÅDGIVNING</Pill>
      <div style={{ marginTop: 8 }}>
        Den här sidan är en sammanställning, inte personlig skatte- eller juridisk rådgivning. Skattereglerna förändras, din situation är unik, och Skatteverkets praxis kring krypto kan utvecklas. Stäm av med en svensk auktoriserad redovisningskonsult eller skattejurist innan du fattar beslut som kostar mycket att ångra.
      </div>
    </div>
  );
}
