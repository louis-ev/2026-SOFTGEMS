/** Supported PDF export languages. */
export const SELECTION_PDF_LANGS = Object.freeze(["en", "fr"]);

/** Default language when exporting a selection PDF. */
export const SELECTION_PDF_DEFAULT_LANG = "en";

/**
 * Editable bilingual strings for selection PDF documents.
 * Edit `en` / `fr` values here — keep accented capitals in French (e.g. SIÈGE).
 */
export const selection_pdf_strings = Object.freeze({
  en: Object.freeze({
    col_no: "No",
    col_ref: "REF",
    col_description: "Description",
    col_photo: "Photo",
    col_qty: "Qty",
    col_weight: "Weight",
    col_price_per_ct: "Price /ct",
    col_total: "Total",
    total: "TOTAL",
    vat: "VAT",
    grand_total: "Total",
    order_number: "Purchase order N°:",
    supplier_account_number: "Supplier account N°:",
    date_line: "Paris, {date}",
    bank_intro: "On our bank account in US dollars:",
    payment_line:
      "Please kindly transfer {amount_words} dollars ({amount} $US)",
    title_generic: "Document N°{number}",
    title_box: "Box N°{number}",
    title_memo_out: "Consignment N°{number}",
    title_return_memo_out: "Return consignment N°{number}",
    title_return_memo_in: "Return memo in N°{number}",
    title_buying_invoice: "Invoice N°{number}",
    title_sale_invoice: "Invoice N°{number}",
    title_partner_invoice: "Invoice N°{number}",
    title_credit_note: "Credit note N°{number}",
    title_importation_return: "Importation return N°{number}",
    legal_memo_out:
      "It is expressly agreed that the Goods are delivered on a consignment (deposit) basis and do not constitute a sale. Under no circumstances may the Consignee relinquish possession or control of the Goods, including to any third party, and the Consignee shall at all times be able to produce and return the Goods immediately upon first demand. The Goods are delivered to and entrusted to the Consignee solely for the purpose of either presenting them to customers or carrying out work, processing, or other operations relating to them. The consignment shall terminate only upon the actual return of the Goods. Any failure to return the Goods shall constitute the criminal offence of criminal breach of trust, as provided under applicable law. The Consignee undertakes to insure the Goods, on behalf of the Consignor, against all risks of loss or damage for their full value, inclusive of all applicable taxes. Receipt of the Goods shall constitute the Consignee's irrevocable acceptance of these terms and conditions.",
    legal_generic:
      "This document is issued for informational and contractual purposes between the parties. The listed goods remain the property of the depositor until full payment and written agreement of the parties. Any dispute relating to the authenticity, conformity or value of the stones must be submitted in writing within the time limits agreed between the parties.",
    origin_prefix: "Origin: {value}",
    country_of_cut_prefix: "Country of cut: {value}",
    certificate_fallback: "Certificate",
    photo_fallback: "Photo",
    video_fallback: "Video",
    footer_line_1:
      "Registered Office: 10 Place Vendôme, 75001 Paris, France • Tel: +33 (0)6 69 24 14 89 • info@acfinegems.com",
    footer_line_2:
      "SAS with a share capital of EUR 50,000 • SIRET N° 994 099 448 00015",
  }),
  fr: Object.freeze({
    col_no: "N°",
    col_ref: "REF",
    col_description: "Description",
    col_photo: "Photo",
    col_qty: "Qté",
    col_weight: "Poids",
    col_price_per_ct: "Prix /ct",
    col_total: "Total",
    total: "TOTAL",
    vat: "TVA",
    grand_total: "Total",
    order_number: "N° Commande :",
    supplier_account_number: "N° Compte Fournisseur :",
    date_line: "Paris, {date}",
    bank_intro: "Sur notre compte bancaire en dollars US :",
    payment_line:
      "Merci de bien vouloir virer {amount_words} dollars ({amount} $US)",
    title_generic: "Document N°{number}",
    title_box: "Boîte N°{number}",
    title_memo_out: "Consignation N°{number}",
    title_return_memo_out: "Retour consignation N°{number}",
    title_return_memo_in: "Retour mémo in N°{number}",
    title_buying_invoice: "Facture d’achat N°{number}",
    title_sale_invoice: "Facture de vente N°{number}",
    title_partner_invoice: "Facture partenaire N°{number}",
    title_credit_note: "Avoir N°{number}",
    title_importation_return: "Retour importation N°{number}",
    legal_memo_out:
      "Il est expressément convenu que les marchandises sont remises à titre de dépôt (consignation) et ne font pas l’objet d’une vente. En aucun cas le dépositaire ne pourra se dessaisir de la possession ou du contrôle des marchandises, notamment au profit d’un tiers, et il devra à tout moment être en mesure de les présenter et de les restituer à première demande. Les marchandises sont remises et confiées au dépositaire aux fins soit de leur présentation à la clientèle, soit de l’exécution de travaux ou d’opérations de transformation les concernant. Le dépôt ne prendra fin qu’au moment de la restitution effective des marchandises. Le défaut de restitution des marchandises constituera le délit pénal d’abus de confiance. Le dépositaire s’engage à assurer lesdites marchandises, pour le compte du déposant, contre tous risques de perte ou de dommage, pour leur valeur totale toutes taxes comprises. La réception des marchandises emporte acceptation irrévocable des présentes stipulations et conditions.",
    legal_generic:
      "Le présent document est établi à titre informatif et contractuel entre les parties. Les marchandises listées demeurent la propriété du déposant jusqu’à règlement intégral et accord écrit des parties. Toute contestation relative à l’authenticité, à la conformité ou à la valeur des pierres devra être formulée par écrit dans les délais convenus entre les parties.",
    origin_prefix: "Origine : {value}",
    country_of_cut_prefix: "Pays de taille : {value}",
    certificate_fallback: "Certificat",
    photo_fallback: "Photo",
    video_fallback: "Vidéo",
    footer_line_1:
      "SIÈGE SOCIAL : 10 Place Vendôme, 75001 Paris, France • Tél. : +33 (0)6 69 24 14 89 • info@acfinegems.com",
    footer_line_2:
      "SAS AU CAPITAL DE 50 000 EUROS • SIRET 994 099 448 00015",
  }),
});

/**
 * @param {*} raw
 * @returns {"en"|"fr"}
 */
export function normalizeSelectionPdfLang(raw) {
  const lang = String(raw || "")
    .trim()
    .toLowerCase();
  if (lang === "fr") return "fr";
  return SELECTION_PDF_DEFAULT_LANG;
}

/**
 * @param {"en"|"fr"|string} lang
 * @param {string} key
 * @param {Record<string, string|number|null|undefined>} [params]
 * @returns {string}
 */
export function selectionPdfT(lang, key, params = {}) {
  const normalized = normalizeSelectionPdfLang(lang);
  const dict =
    selection_pdf_strings[normalized] ||
    selection_pdf_strings[SELECTION_PDF_DEFAULT_LANG];
  let template = dict[key];
  if (template === undefined || template === null) {
    template =
      selection_pdf_strings[SELECTION_PDF_DEFAULT_LANG][key] ?? String(key);
  }
  let text = String(template);
  Object.entries(params || {}).forEach(([param_key, value]) => {
    const safe =
      value === null || value === undefined ? "" : String(value);
    text = text.split(`{${param_key}}`).join(safe);
  });
  return text;
}

/**
 * ACF company footer lines for the print engine (every page).
 * Keep in sync with `pdf_footer_lines` in core2/api2.js.
 * @param {"en"|"fr"|string} lang
 * @returns {string[]}
 */
export function selectionPdfFooterLines(lang) {
  return [
    selectionPdfT(lang, "footer_line_1"),
    selectionPdfT(lang, "footer_line_2"),
  ];
}
