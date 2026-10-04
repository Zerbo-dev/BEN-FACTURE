import { Telegraf, Markup, Input } from "telegraf";
import { db, must } from "./supabase.js";
import { randomToken } from "./crypto.js";
import { getState, setState, clearState } from "./session.js";
import { nextDocNumber, saveDocument, monthlyCount } from "./documents.js";
import { extractInvoiceData } from "./parseText.js";
import { DOC_LABELS, fmtMoney, lineQty, totals, todayFr, todayIso } from "./format.js";
import { loadBranding } from "./branding.js";
import { FREE_MONTHLY_LIMIT } from "./meta.js";
import { renderPdf, pdfToPng } from "./pdf/render.jsx";

const MAX_ITEMS = 40; // garde-fou anti-abus
const h = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const HTML = { parse_mode: "HTML" };
const UN = { devis: "un devis", facture: "une facture", proforma: "une proforma" };
const DU = { devis: "du devis", facture: "de la facture", proforma: "de la proforma" };

// Champs texte demandés avant l'aperçu, avec valeur par défaut configurable dans le tableau de bord.
const FIELDS = {
  terms: { key: "termsAndConditions", step: "await_terms", def: "default_terms", q: "Quels sont les termes et conditions à afficher ?" },
  garantie: { key: "garantie", step: "await_garantie", def: "default_garantie", q: "Quelle garantie s'applique à ce document ?" },
};

const cleanItems = (items = []) =>
  items.map((it) => ({
    description: it.description,
    unitPrice: Number(it.unitPrice) || 0,
    quantity: it.quantity ? Number(it.quantity) : null,
  }));

/**
 * Construit le bot Telegram d'UNE organisation (un token = un client).
 * Instancié à chaque requête webhook : aucun état en mémoire, tout est en base.
 */
export function buildBot(org, token) {
  const bot = new Telegraf(token);
  const methods = () => org.payment_methods || [];
  const isAuthorized = (chatId) => (org.authorized_chats || []).map(Number).includes(Number(chatId));
  const S = (ctx) => getState(org.id, ctx.chat.id);
  const save = (ctx, st) => setState(org.id, ctx.chat.id, st);

  const emptyDoc = (docType) => ({
    step: "await_client_name", docType, client: { name: "", address: "", phone: "" }, items: [],
    tvaRate: Number(org.default_tva) || 0, number: null, paymentModes: null, termsAndConditions: null, garantie: null,
  });

  /* ----- Claviers ----- */
  const itemsKb = () => Markup.inlineKeyboard([
    [Markup.button.callback("➕ Ajouter une prestation", "add_item")],
    [Markup.button.callback("🛠️ Gérer les prestations", "manage_items")],
    [Markup.button.callback("✅ Terminer et voir l'aperçu", "items_done")],
  ]);
  const confirmKb = () => Markup.inlineKeyboard([
    [Markup.button.callback("✅ Confirmer et générer", "confirm")],
    [Markup.button.callback("➕ Ajouter une prestation", "add_item")],
    [Markup.button.callback("🛠️ Gérer les prestations", "manage_items")],
    [Markup.button.callback("❌ Annuler", "cancel")],
  ]);
  const manageKb = (items) => Markup.inlineKeyboard([
    ...items.map((it, i) => [
      Markup.button.callback("✏️", `edit_item_${i}`),
      Markup.button.callback(`🗑️ ${i + 1}. ${it.description.slice(0, 22)}`, `del_item_${i}`),
    ]),
    [Markup.button.callback("⬅️ Retour", "back_from_manage")],
  ]);
  const payKb = (selected) => Markup.inlineKeyboard([
    ...methods().map((m, i) => [Markup.button.callback(`${selected.includes(m.label) ? "✅ " : ""}${m.label}`, `pm_${i}`)]),
    [Markup.button.callback("☑️ Valider la sélection", "pm_validate")],
  ]);

  const itemsSummary = (items) =>
    items.length
      ? items.map((it, i) => `${i + 1}. ${h(it.description)} — ${fmtMoney(it.unitPrice)}${it.quantity > 1 ? ` x${it.quantity}` : ""} = ${fmtMoney(it.unitPrice * lineQty(it))} ${org.currency}`).join("\n")
      : "(aucune prestation pour le moment)";

  /* ----- Étapes de la conversation ----- */
  async function askClientName(ctx, docType) {
    await save(ctx, emptyDoc(docType));
    await ctx.reply(`D'accord, on prépare <b>${UN[docType]}</b>.\n\nQuel est le nom du client ?`, HTML);
  }

  async function goToItems(ctx, st) {
    st.step = "await_items";
    await save(ctx, st);
    await ctx.reply('Décris la ou les prestations, avec le prix (et la quantité si besoin).\nExemple : "Diagnostic et repérage 25000, câblage du tableau 55000"', itemsKb());
  }

  async function askPayment(ctx, st) {
    st.step = "await_payment_mode";
    st.paymentModes = [];
    await save(ctx, st);
    await ctx.reply("Quel(s) mode(s) de paiement pour cette facture ? Tu peux en choisir plusieurs.", payKb(st.paymentModes));
  }

  async function askField(ctx, st, name) {
    const f = FIELDS[name];
    st.step = f.step;
    await save(ctx, st);
    const def = (org[f.def] || "").trim();
    const rows = [];
    if (def) rows.push([Markup.button.callback(`✅ Garder : ${def.slice(0, 40)}${def.length > 40 ? "…" : ""}`, `field_default_${name}`)]);
    rows.push([Markup.button.callback("Aucun", `field_none_${name}`)]);
    await ctx.reply(`${f.q}\nÉcris-le, ou choisis une option.`, Markup.inlineKeyboard(rows));
  }

  async function showPreview(ctx, st) {
    st.step = "await_confirmation";
    await save(ctx, st);
    const t = totals(st.items, st.tvaRate);
    const cur = org.currency;
    await ctx.reply(
      `<b>Aperçu ${DU[st.docType]}</b>\n\n` +
        `Client : ${h(st.client.name) || "(non précisé)"}\nAdresse : ${h(st.client.address) || "-"}\nTéléphone : ${h(st.client.phone) || "-"}\n` +
        (st.paymentModes?.length ? `Paiement : ${h(st.paymentModes.join(", "))}\n` : "") +
        (st.termsAndConditions ? `Termes : ${h(st.termsAndConditions)}\n` : "") +
        (st.garantie ? `Garantie : ${h(st.garantie)}\n` : "") +
        `\nPrestations :\n${itemsSummary(st.items)}\n\n` +
        `Total HT : ${fmtMoney(t.ht)} ${cur}\nTVA (${st.tvaRate}%) : ${fmtMoney(t.tva)} ${cur}\n<b>Total : ${fmtMoney(t.ttc)} ${cur}</b>`,
      { ...HTML, ...confirmKb() }
    );
  }

  /** Questions restantes dans l'ordre : paiement (facture) → termes → garantie → aperçu. */
  async function afterItems(ctx, st) {
    if (st.docType === "facture" && st.paymentModes === null) {
      if (methods().length) return askPayment(ctx, st);
      st.paymentModes = [];
    }
    if (st.termsAndConditions === null) return askField(ctx, st, "terms");
    if (st.garantie === null) return askField(ctx, st, "garantie");
    return showPreview(ctx, st);
  }

  async function backToView(ctx, st) {
    if (st.step === "await_confirmation" || st.manageReturnStep === "await_confirmation") return afterItems(ctx, st);
    st.step = "await_items";
    await save(ctx, st);
    await ctx.reply(`Prestations actuelles :\n${itemsSummary(st.items)}`, { ...HTML, ...itemsKb() });
  }

  async function advance(ctx, st) {
    if (!st.client.name) {
      st.step = "await_client_name";
      await save(ctx, st);
      return ctx.reply("Quel est le nom du client ?");
    }
    if (!st.items.length) return goToItems(ctx, st);
    return afterItems(ctx, st);
  }

  /* ----- Sécurité : seuls les chats associés au propriétaire peuvent utiliser ce bot ----- */
  bot.use(async (ctx, next) => {
    if (ctx.myChatMember) return next();
    if (ctx.chat?.type !== "private") return;
    const isStart = (ctx.message?.text || "").startsWith("/start");
    if (!isAuthorized(ctx.chat.id) && !isStart) {
      await ctx.reply("🔒 Ce bot est privé. Ouvre le lien d'accès affiché dans ton espace de configuration.");
      return;
    }
    return next();
  });

  // Le bot vient d'être ajouté (ou retiré) comme admin d'un canal => canal d'archivage des PDF.
  bot.on("my_chat_member", async (ctx) => {
    const u = ctx.myChatMember;
    if (u.chat.type !== "channel") return;
    const status = u.new_chat_member.status;
    const notify = (txt) => org.authorized_chats?.[0] && ctx.telegram.sendMessage(org.authorized_chats[0], txt).catch(() => {});
    if (status === "administrator") {
      if (u.new_chat_member.can_post_messages === false) {
        return notify(`⚠️ Je suis admin du canal « ${u.chat.title} » mais sans le droit de publier. Active « Publier des messages ».`);
      }
      must(await db().from("organizations").update({ storage_channel_id: u.chat.id }).eq("id", org.id));
      org.storage_channel_id = u.chat.id;
      await notify(`✅ Canal d'archivage connecté : « ${u.chat.title} ». Tes PDF y seront sauvegardés.`);
    } else if ((status === "left" || status === "kicked") && Number(org.storage_channel_id) === u.chat.id) {
      must(await db().from("organizations").update({ storage_channel_id: null }).eq("id", org.id));
      org.storage_channel_id = null;
    }
  });

  bot.start(async (ctx) => {
    if (!isAuthorized(ctx.chat.id)) {
      if (ctx.startPayload && org.claim_code && ctx.startPayload === org.claim_code) {
        const authorized_chats = [...(org.authorized_chats || []), ctx.chat.id];
        const claim_code = randomToken(8); // lien à usage unique
        must(await db().from("organizations").update({ authorized_chats, claim_code }).eq("id", org.id));
        Object.assign(org, { authorized_chats, claim_code });
      } else {
        return ctx.reply("🔒 Ce bot est privé. Ouvre le lien d'accès affiché dans ton espace de configuration.");
      }
    }
    await ctx.reply(
      `👋 Bienvenue chez <b>${h(org.name || "ton entreprise")}</b>.\n\n` +
        "Je prépare tes devis, factures et proformas de deux façons :\n\n" +
        '1️⃣ <b>Rapide</b> — décris tout en un message :\n   "Devis pour M. Sawadogo, Kamboinsin, 70245268. Diagnostic 25000, câblage du tableau 55000"\n\n' +
        "2️⃣ <b>Guidé</b> — tape /devis, /facture ou /proforma et je te pose les questions une par une.\n\n" +
        "Tape /annuler à tout moment pour recommencer.",
      HTML
    );
  });

  bot.command("devis", (ctx) => askClientName(ctx, "devis"));
  bot.command("facture", (ctx) => askClientName(ctx, "facture"));
  bot.command("proforma", (ctx) => askClientName(ctx, "proforma"));
  bot.command("annuler", async (ctx) => {
    await clearState(org.id, ctx.chat.id);
    await ctx.reply("Ok, j'ai tout annulé. Tape /devis, /facture, /proforma, ou décris directement ta demande.");
  });

  /* ----- Boutons ----- */
  const withState = (fn) => async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const st = await S(ctx);
    if (!st) return ctx.reply("Aucune commande en cours. Tape /devis, /facture ou /proforma pour commencer.");
    return fn(ctx, st);
  };

  bot.action("add_item", withState(async (ctx, st) => {
    if (st.items.length >= MAX_ITEMS) return ctx.reply(`Limite de ${MAX_ITEMS} prestations atteinte. Supprime une ligne avant d'en ajouter (🛠️ Gérer les prestations).`);
    return goToItems(ctx, st);
  }));

  bot.action("items_done", withState(async (ctx, st) => {
    if (!st.items.length) return ctx.reply("Il faut au moins une prestation avant de continuer.");
    return afterItems(ctx, st);
  }));

  bot.action("manage_items", withState(async (ctx, st) => {
    if (!st.items.length) return ctx.reply("Aucune prestation à gérer pour le moment.");
    st.manageReturnStep = st.step;
    await save(ctx, st);
    return ctx.reply("Modifie (✏️) ou supprime (🗑️) une prestation :", manageKb(st.items));
  }));

  bot.action("back_from_manage", withState((ctx, st) => backToView(ctx, st)));

  bot.action(/^del_item_(\d+)$/, withState(async (ctx, st) => {
    const idx = Number(ctx.match[1]);
    if (idx >= st.items.length) return;
    const [removed] = st.items.splice(idx, 1);
    await save(ctx, st);
    if (!st.items.length) {
      await ctx.reply(`Supprimé : ${removed.description}`);
      return goToItems(ctx, st);
    }
    await ctx.editMessageText(`Supprimé : ${removed.description}\n\nModifie (✏️) ou supprime (🗑️) une prestation :`, manageKb(st.items))
      .catch(() => ctx.reply("Modifie ou supprime une prestation :", manageKb(st.items)));
  }));

  bot.action(/^edit_item_(\d+)$/, withState(async (ctx, st) => {
    const idx = Number(ctx.match[1]);
    if (idx >= st.items.length) return;
    st.editIndex = idx;
    st.step = "await_item_edit";
    await save(ctx, st);
    return ctx.reply(`Renvoie la nouvelle description + prix pour remplacer :\n"${st.items[idx].description}"\n\nExemple : "Câblage complet 60000"`);
  }));

  bot.action(/^pm_(\d+)$/, async (ctx) => {
    const st = await S(ctx);
    const m = methods()[Number(ctx.match[1])];
    if (!st || !m || !st.paymentModes) return ctx.answerCbQuery();
    const i = st.paymentModes.indexOf(m.label);
    if (i === -1) st.paymentModes.push(m.label); else st.paymentModes.splice(i, 1);
    await save(ctx, st);
    await ctx.answerCbQuery(i === -1 ? `${m.label} ajouté` : `${m.label} retiré`);
    await ctx.editMessageReplyMarkup(payKb(st.paymentModes).reply_markup).catch(() => {});
  });

  bot.action("pm_validate", async (ctx) => {
    const st = await S(ctx);
    if (!st) return ctx.answerCbQuery();
    if (!st.paymentModes?.length) return ctx.answerCbQuery("Choisis au moins un mode de paiement.", { show_alert: true });
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    return afterItems(ctx, st);
  });

  bot.action(/^field_(default|none)_(terms|garantie)$/, withState(async (ctx, st) => {
    const f = FIELDS[ctx.match[2]];
    st[f.key] = ctx.match[1] === "default" ? (org[f.def] || "").trim() : "";
    await save(ctx, st);
    await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    return afterItems(ctx, st);
  }));

  bot.action("cancel", async (ctx) => {
    await ctx.answerCbQuery();
    await clearState(org.id, ctx.chat.id);
    await ctx.editMessageReplyMarkup(undefined).catch(() => {});
    await ctx.reply("Annulé. Tape /devis, /facture ou /proforma pour recommencer.");
  });

  /* ----- Génération du document ----- */
  bot.action("confirm", async (ctx) => {
    await ctx.answerCbQuery();
    const st = await S(ctx);
    if (!st) return;
    await ctx.editMessageReplyMarkup(undefined).catch(() => {});

    if (org.plan !== "pro" && (await monthlyCount(org.id)) >= FREE_MONTHLY_LIMIT) {
      return ctx.reply(
        `🚫 Limite du forfait gratuit atteinte (${FREE_MONTHLY_LIMIT} documents ce mois-ci).\n` +
          "Le brouillon est conservé : contactez l'équipe pour passer au forfait payant, puis retapez sur « Confirmer et générer »."
      );
    }

    const wait = await ctx.reply("⏳ Génération du document en cours...");
    try {
      // Le numéro n'est tiré qu'une fois : une tentative ratée réutilise le même.
      if (!st.number) {
        st.number = await nextDocNumber(org.id, st.docType);
        await save(ctx, st);
      }
      const doc = {
        docType: st.docType, number: st.number, date: todayFr(), client: st.client, items: st.items, tvaRate: st.tvaRate,
        termsAndConditions: st.termsAndConditions, garantie: st.garantie, paymentModes: st.paymentModes,
        // Facture : seulement les modes choisis. Devis/proforma : tous les modes proposés.
        paymentBlocks: st.docType === "facture" ? methods().filter((m) => st.paymentModes?.includes(m.label)) : methods(),
      };
      const branding = await loadBranding(org);
      const pdf = await renderPdf({ template: org.template, theme: org.theme, org, branding, doc });
      let png = null;
      try { png = await pdfToPng(pdf); } catch (e) { console.error("Aperçu PNG impossible:", e.message); }

      const label = DOC_LABELS[st.docType];
      const base = `${label}_${st.number.replace("/", "-")}_${(st.client.name || "client").replace(/[^\p{L}\p{N}]+/gu, "_")}`;
      if (png) await ctx.replyWithPhoto(Input.fromBuffer(png, `${base}.png`));
      const sentDoc = await ctx.replyWithDocument(Input.fromBuffer(pdf, `${base}.pdf`));
      let tg = { tg_file_id: sentDoc.document?.file_id || null, tg_channel_id: null, tg_message_id: null };

      if (org.storage_channel_id) {
        try {
          const arch = await ctx.telegram.sendDocument(org.storage_channel_id, Input.fromBuffer(pdf, `${base}.pdf`), {
            caption: `${label} n° ${st.number} — ${st.client.name || "client"}`,
          });
          tg = { tg_file_id: arch.document?.file_id || tg.tg_file_id, tg_channel_id: arch.chat.id, tg_message_id: arch.message_id };
        } catch (e) {
          console.error("Archivage canal:", e.message);
          await ctx.reply("⚠️ Sauvegarde dans le canal impossible : vérifie que je suis bien admin du canal.");
        }
      }

      const t = totals(st.items, st.tvaRate);
      await saveDocument({
        org_id: org.id, doc_type: st.docType, number: st.number, issued_on: todayIso(), client_name: st.client.name || "",
        currency: org.currency, total_ht: t.ht, total_ttc: t.ttc, payload: { ...doc, template: org.template, theme: org.theme }, ...tg,
      });
      await ctx.reply(`✅ ${label} n° ${st.number} généré(e) avec succès !`);

      // Prévenir avant la coupure plutôt que de laisser le client la découvrir en bloquant sur le prochain document.
      if (org.plan !== "pro") {
        const used = await monthlyCount(org.id);
        const remaining = FREE_MONTHLY_LIMIT - used;
        if (remaining === 1) await ctx.reply(`ℹ️ Il te reste 1 document gratuit ce mois-ci.`);
        else if (remaining <= 0) await ctx.reply(`⚠️ C'était ton dernier document gratuit ce mois-ci. Contacte l'équipe pour passer au forfait payant et continuer.`);
      }

      await clearState(org.id, ctx.chat.id);
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Une erreur est survenue pendant la génération. Retape sur « Confirmer et générer » — le même numéro sera réutilisé.", confirmKb());
    } finally {
      await ctx.deleteMessage(wait.message_id).catch(() => {});
    }
  });

  /* ----- Messages texte ----- */
  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;
    const st = await S(ctx);

    // Pas de conversation en cours : extraction complète en mode libre
    if (!st) {
      const x = extractInvoiceData(text);
      const ns = {
        ...emptyDoc(["facture", "proforma"].includes(x.docType) ? x.docType : "devis"),
        step: "collecting",
        client: { name: x.client?.name || "", address: x.client?.address || "", phone: x.client?.phone || "" },
        items: cleanItems(x.items),
        tvaRate: x.tvaRate || Number(org.default_tva) || 0,
      };
      await save(ctx, ns);
      return advance(ctx, ns);
    }

    switch (st.step) {
      case "await_client_name":
        st.client.name = text; st.step = "await_client_address";
        await save(ctx, st);
        return ctx.reply('Adresse du client ? (ou envoie "-" pour passer)');
      case "await_client_address":
        st.client.address = text === "-" ? "" : text; st.step = "await_client_phone";
        await save(ctx, st);
        return ctx.reply('Téléphone du client ? (ou envoie "-" pour passer)');
      case "await_client_phone":
        st.client.phone = text === "-" ? "" : text;
        return goToItems(ctx, st);
      case "await_items": {
        if (st.items.length >= MAX_ITEMS) return ctx.reply(`Limite de ${MAX_ITEMS} prestations atteinte. Supprime une ligne (🛠️ Gérer les prestations) avant d'en ajouter.`);
        const added = cleanItems(extractInvoiceData(text).items);
        if (!added.length) return ctx.reply('Je n\'ai pas trouvé de prestation avec un prix. Réessaie, ex: "Câblage 55000".');
        st.items.push(...added);
        await save(ctx, st);
        return ctx.reply(`Ajouté ✅\n\n${itemsSummary(st.items)}\n\nAutre chose à ajouter ?`, { ...HTML, ...itemsKb() });
      }
      case "await_item_edit": {
        const [item] = cleanItems(extractInvoiceData(text).items);
        if (!item) return ctx.reply('Je n\'ai pas trouvé de prix dans ce texte. Réessaie, ex: "Câblage 60000".');
        st.items[st.editIndex] = item;
        delete st.editIndex;
        await save(ctx, st);
        await ctx.reply(`Modifié ✅\n\n${itemsSummary(st.items)}`, HTML);
        return backToView(ctx, st);
      }
      case "await_terms":
      case "await_garantie": {
        st[st.step === "await_terms" ? "termsAndConditions" : "garantie"] = text === "-" ? "" : text;
        await save(ctx, st);
        return afterItems(ctx, st);
      }
      case "await_payment_mode":
        return ctx.reply('Utilise les boutons ci-dessus pour choisir un ou plusieurs modes, puis "Valider" 👆');
      case "collecting":
        if (!st.client.name) {
          st.client.name = text;
        } else {
          st.items.push(...cleanItems(extractInvoiceData(text).items));
          await save(ctx, st);
        }
        return advance(ctx, st);
      case "await_confirmation":
        return ctx.reply("Utilise les boutons ci-dessus pour confirmer, ajouter/gérer une prestation ou annuler 👆");
      default:
        await clearState(org.id, ctx.chat.id);
        return ctx.reply("Tape /devis, /facture ou /proforma pour commencer.");
    }
  });

  return bot;
}
