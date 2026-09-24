import React from "react";
import { Document, Page, View, Text, Image, Svg, Path } from "@react-pdf/renderer";
import { fmtMoney, lineQty, totals, DOC_TITLES } from "../format.js";
import { safeColor, tint, readableOn, textSafe } from "./colors.js";
import { DEFAULT_THEME } from "../meta.js";

const COLS = [
  { w: "50%", a: "left" },
  { w: "18%", a: "right" },
  { w: "10%", a: "right" },
  { w: "22%", a: "right" },
];
const HEADS = ["Description", "Prix unitaire", "Qté", "Total HT"];
const PAD = 36;

/* ---------- Blocs communs aux trois modèles ---------- */

function ColHead({ o }) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 7,
        paddingHorizontal: 10,
        backgroundColor: o.headBg,
        borderWidth: o.headBorder ? 1.2 : 0,
        borderColor: o.headBorder,
        borderRadius: o.headRadius || 0,
        borderBottomWidth: o.headLine ? 1 : o.headBorder ? 1.2 : 0,
        borderBottomColor: o.headLine || o.headBorder,
      }}
    >
      {HEADS.map((h, i) => (
        <Text key={h} style={{ width: COLS[i].w, textAlign: COLS[i].a, color: o.headColor, fontFamily: o.bold }}>
          {h}
        </Text>
      ))}
    </View>
  );
}

function Rows({ items, o }) {
  return items.map((it, i) => {
    const q = lineQty(it);
    const cells = [it.description, fmtMoney(it.unitPrice), it.quantity && Number(it.quantity) > 0 ? String(q) : "-", fmtMoney(Number(it.unitPrice) * q)];
    return (
      <View
        key={i}
        wrap={false}
        style={{
          flexDirection: "row",
          paddingVertical: 7,
          paddingHorizontal: 10,
          backgroundColor: o.zebra && i % 2 === 1 ? o.zebra : undefined,
          borderBottomWidth: o.rowLine ? 0.6 : 0,
          borderBottomColor: o.rowLine,
        }}
      >
        {cells.map((c, j) => (
          <Text key={j} style={{ width: COLS[j].w, textAlign: COLS[j].a, paddingRight: j === 0 ? 8 : 0 }}>
            {c}
          </Text>
        ))}
      </View>
    );
  });
}

function Client({ doc, o, label = "Client : " }) {
  return (
    <View>
      <Text style={{ fontFamily: o.bold, fontSize: o.fs + 1.5, marginBottom: 3 }}>{label}{doc.client?.name || ""}</Text>
      {!!doc.client?.address && <Text>{doc.client.address}</Text>}
      {!!doc.client?.phone && <Text>{doc.client.phone}</Text>}
    </View>
  );
}

function Company({ org, o, align = "left", withName = true }) {
  return (
    <View style={{ alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      {withName && !!org.name && <Text style={{ fontFamily: o.bold, fontSize: o.fs + 1.5, marginBottom: 3 }}>{org.name}</Text>}
      {!!org.address && <Text>{org.address}</Text>}
      {!!org.phone && <Text>{org.phone}</Text>}
      {!!org.email && <Text>{org.email}</Text>}
    </View>
  );
}

function Section({ title, o, children }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: o.bold, fontSize: o.fs + 1, marginBottom: 4 }}>{title}</Text>
      {children}
    </View>
  );
}

function Totals({ p, o }) {
  const { tot, cur, doc } = p;
  const rate = Number(doc.tvaRate) || 0;
  const row = (l, v) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
      <Text>{l}</Text>
      <Text style={{ fontFamily: o.bold }}>{v}</Text>
    </View>
  );
  return (
    <View style={{ alignSelf: "flex-end", width: "46%", marginTop: 12 }}>
      {rate > 0 && row("Total HT", `${fmtMoney(tot.ht)} ${cur}`)}
      {rate > 0 && row(`TVA (${rate}%)`, `${fmtMoney(tot.tva)} ${cur}`)}
      {o.totalBg ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
            paddingVertical: 9,
            paddingHorizontal: 12,
            backgroundColor: o.totalBg,
            borderRadius: o.totalRadius || 0,
          }}
        >
          <Text style={{ fontFamily: o.bold, fontSize: o.fs + 3, color: o.totalColor }}>Total</Text>
          <Text style={{ fontFamily: o.bold, fontSize: o.fs + 3, color: o.totalColor }}>{fmtMoney(tot.ttc)} {cur}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: p.accent }}>
          <Text style={{ fontFamily: o.bold, fontSize: o.fs + 3 }}>Total</Text>
          <Text style={{ fontFamily: o.bold, fontSize: o.fs + 3, color: textSafe(p.accent) }}>{fmtMoney(tot.ttc)} {cur}</Text>
        </View>
      )}
    </View>
  );
}

function Bottom({ p, o }) {
  const { doc, branding } = p;
  const blocks = doc.paymentBlocks || [];
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 22 }}>
      <View style={{ width: "56%" }}>
        {blocks.length > 0 && (
          <Section title="Informations de paiement" o={o}>
            {blocks.map((b, i) => (
              <View key={i} style={{ marginBottom: 5 }}>
                <Text style={{ fontFamily: o.bold }}>{b.label}</Text>
                {(b.lines || []).map((l, j) => <Text key={j}>{l}</Text>)}
              </View>
            ))}
          </Section>
        )}
        {!!doc.termsAndConditions && (
          <Section title="Termes et conditions" o={o}><Text>{doc.termsAndConditions}</Text></Section>
        )}
        {!!doc.garantie && <Section title="Garantie" o={o}><Text>{doc.garantie}</Text></Section>}
      </View>
      <View style={{ width: "36%", minHeight: 110, padding: 10, borderWidth: 1.2, borderColor: o.sigBorder, borderRadius: o.sigRadius || 0 }}>
        <Text style={{ fontFamily: o.bold }}>Signature</Text>
        {branding.signatureUri && (
          <Image src={branding.signatureUri} style={{ position: "absolute", right: 8, bottom: 8, width: 110, height: 60, objectFit: "contain" }} />
        )}
      </View>
    </View>
  );
}

function Footer({ org, o }) {
  return (
    <View fixed style={{ position: "absolute", bottom: 18, left: PAD, right: PAD, alignItems: "center" }}>
      {!!org.footer_text && <Text style={{ fontFamily: o.bold, fontSize: 8 }}>{org.footer_text}</Text>}
      <Text fixed style={{ fontSize: 7.5, color: "#777777", marginTop: 2 }} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber}/${totalPages}` : "")} />
    </View>
  );
}

/** Bandeau + en-tête de colonnes répétés en haut des pages 2 et suivantes. */
function Continuation({ p, o }) {
  return (
    <View fixed render={({ pageNumber }) => pageNumber > 1 ? (
      <View>
        <View style={{ backgroundColor: o.contBg, paddingVertical: 14, paddingHorizontal: PAD, borderBottomWidth: o.contBg ? 0 : 1, borderBottomColor: "#dddddd" }}>
          <Text style={{ fontFamily: o.bold, fontSize: 12, color: o.contColor }}>{p.title}</Text>
        </View>
        <View style={{ paddingHorizontal: PAD, paddingTop: 14 }}><ColHead o={o} /></View>
      </View>
    ) : null} />
  );
}

function Sheet({ p, o, header }) {
  return (
    <Document title={p.title} author={p.org.name} creator="BAG Facture">
      <Page size="A4" style={{ fontFamily: o.font, fontSize: o.fs, color: o.ink, paddingBottom: 56 }}>
        <Continuation p={p} o={o} />
        {header}
        <View style={{ paddingHorizontal: PAD, paddingTop: 20 }}>
          <ColHead o={o} />
          <Rows items={p.doc.items || []} o={o} />
          <View wrap={false}>
            <Totals p={p} o={o} />
            <Bottom p={p} o={o} />
          </View>
        </View>
        <Footer org={p.org} o={o} />
      </Page>
    </Document>
  );
}

/* ---------- Modèle 1 : Moderne (bandeau de couleur + vague) ---------- */

function Moderne(p) {
  const { primary, accent, org, doc, branding } = p;
  const onP = readableOn(primary);
  const o = {
    font: "Helvetica", bold: "Helvetica-Bold", fs: 9.5, ink: "#1a2140",
    headColor: "#1a2140", headBorder: accent, headRadius: 16,
    totalBg: accent, totalColor: readableOn(accent), totalRadius: 6,
    sigBorder: accent, sigRadius: 12, contBg: primary, contColor: onP,
  };
  const header = (
    <View>
      <View style={{ backgroundColor: primary, paddingTop: 30, paddingBottom: 50, paddingHorizontal: PAD }}>
        <Text style={{ color: onP, fontFamily: "Helvetica-Bold", fontSize: 20 }}>{p.title}</Text>
        <Text style={{ color: onP, marginTop: 4, opacity: 0.85 }}>Date : {doc.date}</Text>
        {branding.logoUri ? (
          <Image src={branding.logoUri} style={{ position: "absolute", top: 22, right: PAD, width: 66, height: 66, borderRadius: 8, objectFit: "cover" }} />
        ) : (
          <Text style={{ position: "absolute", top: 30, right: PAD, color: onP, fontFamily: "Helvetica-Bold", fontSize: 13 }}>{org.name}</Text>
        )}
        <Svg viewBox="0 0 595 40" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -1, width: 595, height: 40 }}>
          <Path d="M0,18 C 140,40 420,0 595,24 L595,40 L0,40 Z" fill={accent} />
          <Path d="M0,26 C 140,44 420,8 595,32 L595,40 L0,40 Z" fill="#ffffff" />
        </Svg>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: PAD, paddingTop: 14 }}>
        <View style={{ maxWidth: "55%" }}><Client doc={doc} o={o} /></View>
        <Company org={org} o={o} align="right" withName={!!branding.logoUri} />
      </View>
    </View>
  );
  return <Sheet p={p} o={o} header={header} />;
}

/* ---------- Modèle 2 : Classique (serif, en-tête de société, tableau plein) ---------- */

function Classique(p) {
  const { primary, accent, org, doc, branding } = p;
  const o = {
    font: "Times-Roman", bold: "Times-Bold", fs: 10.5, ink: "#222222",
    headBg: primary, headColor: readableOn(primary), zebra: tint(primary, 0.93),
    totalBg: primary, totalColor: readableOn(primary),
    sigBorder: tint(primary, 0.5), contBg: primary, contColor: readableOn(primary),
  };
  const header = (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: PAD, paddingTop: 34 }}>
        <View style={{ flexDirection: "row", alignItems: "center", maxWidth: "58%" }}>
          {branding.logoUri && <Image src={branding.logoUri} style={{ width: 56, height: 56, marginRight: 12, objectFit: "contain" }} />}
          <View>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 17, color: primary, marginBottom: 3 }}>{org.name}</Text>
            <Company org={org} o={o} withName={false} />
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: "Times-Bold", fontSize: 26, color: textSafe(accent) }}>{DOC_TITLES[doc.docType]}</Text>
          <Text style={{ marginTop: 3 }}>N° {doc.number}</Text>
          <Text>Date : {doc.date}</Text>
        </View>
      </View>
      <View style={{ marginHorizontal: PAD, marginTop: 14, borderTopWidth: 2, borderTopColor: primary }} />
      <View style={{ marginHorizontal: PAD, marginTop: 14, padding: 12, backgroundColor: tint(primary, 0.94) }}>
        <Client doc={doc} o={o} />
      </View>
    </View>
  );
  return <Sheet p={p} o={o} header={header} />;
}

/* ---------- Modèle 3 : Sobre (blanc, lignes fines, une seule couleur d'accent) ---------- */

function Sobre(p) {
  const { accent, org, doc, branding } = p;
  const o = {
    font: "Helvetica", bold: "Helvetica-Bold", fs: 9.5, ink: "#111111",
    headColor: "#111111", headLine: "#111111", rowLine: "#e3e3e3",
    sigBorder: "#cccccc", sigRadius: 4, contColor: "#111111",
  };
  const muted = { color: "#666666" };
  const header = (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: PAD, paddingTop: 40 }}>
        <View style={{ maxWidth: "55%" }}>
          {branding.logoUri ? (
            <Image src={branding.logoUri} style={{ width: 44, height: 44, objectFit: "contain", marginBottom: 6 }} />
          ) : (
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 4 }}>{org.name}</Text>
          )}
          <Text style={muted}>{[org.address, org.phone, org.email].filter(Boolean).join("  ·  ")}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 17, color: textSafe(accent) }}>{p.title}</Text>
          <Text style={{ ...muted, marginTop: 4 }}>Date : {doc.date}</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: PAD, marginTop: 28 }}>
        <Text style={{ ...muted, marginBottom: 3 }}>Client</Text>
        <Client doc={doc} o={{ ...o, fs: 9.5 }} label="" />
      </View>
    </View>
  );
  return <Sheet p={p} o={o} header={header} />;
}

/* ---------- Registre des modèles ---------- */

export const TEMPLATES = {
  moderne: { Component: Moderne },
  classique: { Component: Classique },
  sobre: { Component: Sobre },
};


/** props = { template, theme, org, branding: { logoUri, signatureUri }, doc } */
export function InvoiceDocument({ template, theme, org, branding, doc }) {
  const T = (TEMPLATES[template] || TEMPLATES.moderne).Component;
  const primary = safeColor(theme?.primary, DEFAULT_THEME.primary);
  const accent = safeColor(theme?.accent, DEFAULT_THEME.accent);
  const p = {
    org, branding: branding || {}, doc, primary, accent,
    tot: totals(doc.items, doc.tvaRate),
    cur: org.currency || "FCFA",
    title: `${DOC_TITLES[doc.docType]} n° ${doc.number}`,
  };
  return <T {...p} />;
}
