import './home.css';

/**
 * HomeLayout
 * Conteneur principal compatible avec une sidebar externe.
 * Props :
 *   - topbar     : ReactNode — contenu de la barre du haut
 *   - main       : ReactNode — panneau principal (grande carte gauche)
 *   - widgets    : ReactNode — colonne droite
 *   - banner     : ReactNode — bandeau bas
 *   - loading    : bool      — état squelette
 */
export default function HomeLayout({ topbar, main, widgets, banner, loading = false }) {
  return (
    <div className="hl-root">
      {/* Topbar */}
      <header className="hl-topbar">
        {topbar}
      </header>

      {/* Zone principale */}
      <main className="hl-main">
        {loading ? (
          <SkeletonLayout />
        ) : (
          <>
            <div className="hl-grid">
              <section className="hl-panel-main" aria-label="Panneau principal">
                {main ?? <EmptyState label="Aucun contenu" />}
              </section>
              <aside className="hl-panel-widgets" aria-label="Widgets">
                {widgets ?? <EmptyState label="Aucun widget" />}
              </aside>
            </div>
            <div className="hl-banner" aria-label="Bandeau bas">
              {banner ?? <EmptyState label="Aucune annonce" compact />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({ label, compact }) {
  return (
    <div className={`hl-empty ${compact ? 'hl-empty--compact' : ''}`}>
      <span className="hl-empty-icon">○</span>
      <span>{label}</span>
    </div>
  );
}

function SkeletonLayout() {
  return (
    <>
      <div className="hl-grid">
        <div className="hl-skeleton hl-skeleton--main" />
        <div className="hl-skeleton hl-skeleton--widgets">
          <div className="hl-skeleton hl-skeleton--widget-item" />
          <div className="hl-skeleton hl-skeleton--widget-item" />
        </div>
      </div>
      <div className="hl-skeleton hl-skeleton--banner" />
    </>
  );
}
