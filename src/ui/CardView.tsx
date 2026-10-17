import { CARD } from '../game/cards';
import { POOL_ICONS, ROW_COLORS, ROW_NAMES, VIBE_COLORS, VIBE_ICONS, VIBE_NAMES } from '../game/content';
import { powerText, WHEN_HELP, WHEN_LABEL } from '../game/text';
import type { Row } from '../game/types';
import { useCardPortrait } from '../toys/portraits';

const ROW_EMOJI: Record<Row, string> = { 0: '🌱', 1: '🧶', 2: '💬' };

export function CardView({
  id, size = 'md', selected, dim, onClick, footer,
}: { id: string; size?: 'sm' | 'md' | 'lg'; selected?: boolean; dim?: boolean; onClick?: () => void; footer?: React.ReactNode }) {
  const c = CARD[id];
  const url = useCardPortrait(id);
  return (
    <div
      className={`card card-${size} ${selected ? 'selected' : ''} ${dim ? 'dim' : ''} ${onClick ? 'clickable' : ''}`}
      style={{ ['--vibe' as string]: VIBE_COLORS[c.vibe] }}
      onClick={onClick}
    >
      <div className="card-top">
        <div className="cost">
          {c.cost.map((k, i) => (
            <span key={i} className="cost-pip" title={k}>
              {POOL_ICONS[k]}
            </span>
          ))}
        </div>
        <div className="aura" title="Aura (victory points)">
          {c.aura}
          <small>✦</small>
        </div>
      </div>
      <div className="portrait">
        {url ? <img src={url} alt={c.name} draggable={false} /> : <div className="portrait-loading" />}
        <div className="rows">
          {c.rows.map((r) => (
            <span key={r} className="row-pip" style={{ background: ROW_COLORS[r] }} title={ROW_NAMES[r]}>
              {ROW_EMOJI[r]}
            </span>
          ))}
        </div>
      </div>
      <div className="card-name">{c.name}</div>
      <div className="card-meta">
        <span className="vibe">
          {VIBE_ICONS[c.vibe]} {VIBE_NAMES[c.vibe]}
        </span>
        <span className="rot" title="Rot % (used by Hunt powers)">Rot {c.rot}%</span>
      </div>
      {size !== 'sm' && (
        <>
          {c.power ? (
            <div className={`power power-${c.power.when}`} title={WHEN_HELP[c.power.when]}>
              <b>{WHEN_LABEL[c.power.when]}</b> {powerText(c.power)}
            </div>
          ) : (
            <div className="power power-none">No power. Just vibes.</div>
          )}
          {size === 'lg' && <div className="flavor">“{c.flavor}”</div>}
          <div className="cap" title="Craft capacity">
            {Array.from({ length: c.cap }, (_, i) => (
              <span key={i}>♡</span>
            ))}
            {c.cap === 0 && <span className="nocap">no crafts</span>}
          </div>
        </>
      )}
      {footer}
    </div>
  );
}
