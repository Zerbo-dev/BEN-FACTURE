export const SkeletonLine = ({ w = "100%", h = 14 }) => (
  <span className="skel" style={{ width: w, height: h }} aria-hidden="true" />
);

export const SkeletonBlock = ({ h = 90 }) => (
  <div className="skel" style={{ width: "100%", height: h }} aria-hidden="true" />
);

/** Lignes façon registre, pour remplacer .docs le temps du chargement. */
export function SkeletonRows({ n = 3 }) {
  return (
    <div className="docs" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div className="doc" key={i}>
          <SkeletonLine w="55%" />
          <SkeletonLine w="70px" />
          <SkeletonLine w="35%" h={11} />
          <SkeletonLine w="55px" h={11} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="stats-grid" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="stat" key={i}><SkeletonLine w="48px" h={26} /><SkeletonLine w="80%" h={11} /></div>
      ))}
    </div>
  );
}
