import { Cell } from '../components/grid/Cell'

// Render the real game cells; keep their status colors, borders, and typography.
// This page is available only with REACT_APP_ARTWORK=1.
export const Thumbnail = () => (
  <main
    data-testid="thumbnail"
    aria-label="Wor🔗dle organization thumbnail"
    style={{
      width: 500,
      height: 500,
      padding: 36,
      display: 'grid',
      gridTemplateColumns: '208px 208px',
      gridTemplateRows: '208px 208px',
      gap: 12,
      background: 'white',
    }}
  >
    <style>{`
      .avatar-tile > div {
        margin: 0;
        font-size: 34px;
        transform: scale(${208 / 56});
        transform-origin: top left;
        animation: none;
      }
    `}</style>
    <div className="avatar-tile">
      <Cell value="W" status="present" />
    </div>
    <div className="avatar-tile" style={{ position: 'relative' }}>
      <Cell />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 118,
          lineHeight: 1,
        }}
      >
        🔗
      </span>
    </div>
    <div className="avatar-tile">
      <Cell value="R" status="absent" />
    </div>
    <div className="avatar-tile">
      <Cell value="D" status="correct" />
    </div>
  </main>
)
