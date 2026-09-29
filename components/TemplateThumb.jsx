/** Miniature d'un modèle de document en SVG pur, aux couleurs choisies — instantanée, aucun appel serveur. */
export default function TemplateThumb({ id, primary, accent }) {
  const lines = (y, w = "70%") => <rect x="14" y={y} width={w} height="4" rx="2" fill="#c7cdda" />;

  if (id === "classique") {
    return (
      <svg viewBox="0 0 120 156" width="100%" height="100%" aria-hidden="true">
        <rect width="120" height="156" fill="#fff" />
        <rect x="10" y="12" width="34" height="8" rx="1" fill={primary} />
        <rect x="76" y="12" width="34" height="10" rx="1" fill={accent} />
        <rect x="10" y="30" width="100" height="1.4" fill={primary} />
        <rect x="10" y="40" width="100" height="20" fill="#eef0f5" />
        {lines(46, "50%")}{lines(53, "35%")}
        <rect x="10" y="68" width="100" height="10" fill={primary} />
        <rect x="10" y="82" width="100" height="8" fill="#f4f5f8" />
        <rect x="10" y="94" width="100" height="8" fill="#fff" />
        <rect x="10" y="110" width="60" height="10" fill={primary} />
      </svg>
    );
  }
  if (id === "sobre") {
    return (
      <svg viewBox="0 0 120 156" width="100%" height="100%" aria-hidden="true">
        <rect width="120" height="156" fill="#fff" />
        <rect x="10" y="14" width="24" height="24" rx="4" fill="#eef0f5" />
        <rect x="86" y="16" width="24" height="9" rx="1" fill={accent} />
        {lines(46, "44%")}{lines(53, "30%")}
        <rect x="10" y="70" width="100" height="1.2" fill="#111" />
        {lines(78, "40%")}
        <rect x="10" y="98" width="100" height="1" fill="#e3e3e3" />
        <rect x="10" y="108" width="100" height="1" fill="#e3e3e3" />
        <rect x="70" y="122" width="40" height="9" fill="#111" />
      </svg>
    );
  }
  // moderne (par défaut)
  return (
    <svg viewBox="0 0 120 156" width="100%" height="100%" aria-hidden="true">
      <rect width="120" height="156" fill="#fff" />
      <rect x="0" y="0" width="120" height="38" fill={primary} />
      <path d="M0,34 C 30,44 90,26 120,36 L120,40 L0,40 Z" fill={accent} />
      <rect x="10" y="10" width="46" height="8" rx="1" fill="#ffffffcc" />
      <rect x="88" y="10" width="22" height="18" rx="4" fill="#ffffff33" />
      {lines(50, "45%")}{lines(57, "30%")}
      <rect x="10" y="72" width="100" height="9" rx="2" fill={primary} />
      <rect x="10" y="86" width="100" height="7" fill="#f4f5f8" />
      <rect x="70" y="104" width="40" height="10" rx="2" fill={accent} />
    </svg>
  );
}
