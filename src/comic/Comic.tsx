// The intro as a comic book: still panels appear one by one, pages slide past.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { renderAll } from './render';
import { PAGE_ASPECT, PAGES, type PanelSpec } from './story';

const READ_BASE = 3.2;
const READ_PER_CHAR = 0.045;

function holdFor(p: PanelSpec) {
  const chars = [...(p.captions ?? []), ...(p.balloons ?? [])].reduce((a, c) => a + c.text.length, 0);
  return p.hold ?? READ_BASE + chars * READ_PER_CHAR;
}

export function Comic({ onDone, onBook }: { onDone: () => void; onBook?: () => void }) {
  const [images, setImages] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(1);
  const [auto, setAuto] = useState(true);
  const flat = useMemo(() => PAGES.map((pg) => pg.panels), []);

  useEffect(() => {
    let alive = true;
    void renderAll((id, url) => alive && setImages((m) => ({ ...m, [id]: url })));
    return () => {
      alive = false;
    };
  }, []);

  const panels = flat[page];
  const current = panels[Math.min(shown, panels.length) - 1];
  const ready = current.build === 'text' || !!images[current.id];

  const next = useCallback(() => {
    if (shown < panels.length) setShown(shown + 1);
    else if (page < PAGES.length - 1) {
      setPage(page + 1);
      setShown(1);
    } else onDone();
  }, [shown, panels.length, page, onDone]);
  const prev = useCallback(() => {
    if (shown > 1) setShown(shown - 1);
    else if (page > 0) {
      setPage(page - 1);
      setShown(flat[page - 1].length);
    }
  }, [shown, page, flat]);

  // auto-advance once the current panel is inked
  useEffect(() => {
    if (!auto || !ready) return;
    const t = setTimeout(next, holdFor(current) * 1000);
    return () => clearTimeout(t);
  }, [auto, ready, current, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setAuto(false);
        next();
      } else if (e.key === 'ArrowLeft') {
        setAuto(false);
        prev();
      } else if (e.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onDone]);

  const last = page === PAGES.length - 1 && shown === panels.length;
  return (
    <div className="comic">
      <div className="comic-stage" onClick={() => { setAuto(false); next(); }}>
        <div key={page} className="comic-page" style={{ aspectRatio: String(PAGE_ASPECT) }}>
          {PAGES[page].title && <div className="comic-title">{PAGES[page].title}</div>}
          {panels.map((p, i) => (
            <Panel key={p.id} p={p} url={images[p.id]} visible={i < shown} />
          ))}
          <div className="comic-folio">{page + 1}</div>
        </div>
      </div>
      <div className="comic-ui" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setAuto(false); prev(); }} disabled={page === 0 && shown === 1}>‹</button>
        <button onClick={() => setAuto(!auto)}>{auto ? '❚❚' : '▶'}</button>
        <button onClick={() => { setAuto(false); next(); }}>›</button>
        <div className="comic-dots">
          {PAGES.map((_, i) => (
            <i key={i} className={i < page ? 'done' : i === page ? 'now' : ''} />
          ))}
        </div>
        {onBook && <button className="comic-book" onClick={onBook}>Book view</button>}
        {last ? (
          <button className="comic-go" onClick={onDone}>Take the city back →</button>
        ) : (
          <button className="comic-skip" onClick={onDone}>Skip</button>
        )}
      </div>
    </div>
  );
}

export function Panel({ p, url, visible }: { p: PanelSpec; url?: string; visible: boolean }) {
  const [x, y, w, h] = p.rect;
  return (
    <div
      className={`panel ${visible ? 'in' : ''}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
    >
      <div className="panel-frame">
        {p.build === 'text' && p.text ? (
          <div className={`panel-text ${p.text.title ? 'endcard' : ''}`}>
            {p.text.title && <div className="pt-title">{p.text.title}</div>}
            {p.text.sub && <div className="pt-sub">{p.text.sub}</div>}
            {p.text.lines.map((l, i) => (
              <div key={i} className="pt-line" style={{ animationDelay: `${0.4 + i * 0.7}s` }}>
                {l}
              </div>
            ))}
          </div>
        ) : url ? (
          <img src={url} alt="" draggable={false} />
        ) : (
          visible && <div className="panel-inking">inking…</div>
        )}
        {visible &&
          p.captions?.map((c, i) => (
            <div key={i} className={`cap cap-${c.at}`} style={{ animationDelay: `${0.35 + i * 0.6}s` }}>
              {c.text}
            </div>
          ))}
        {visible &&
          p.balloons?.map((b, i) => (
            <div key={i} className={`balloon tail-${b.tail} ${b.dark ? 'dark' : ''}`} style={{ left: `${b.x}%`, top: `${b.y}%`, maxWidth: b.w ? `${b.w}%` : undefined, animationDelay: `${0.6 + i * 0.9}s` }}>
              {b.text}
            </div>
          ))}
        {visible &&
          p.sfx?.map((s, i) => (
            <div key={i} className="sfx" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.rot}deg)`, fontSize: `${s.size}em`, color: s.color }}>
              {s.text}
            </div>
          ))}
      </div>
    </div>
  );
}

/** Dev view: every panel in a grid with its id. Open with #comicgrid. */
export function ComicGrid() {
  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    void renderAll((id, url) => setImages((m) => ({ ...m, [id]: url })));
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: '#222', display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
      {PAGES.flatMap((pg) => pg.panels).filter((p) => p.build !== 'text').map((p) => (
        <div key={p.id} style={{ width: 228, height: 280, color: '#ccc', font: '12px monospace' }}>
          {p.id}
          {images[p.id] && <img src={images[p.id]} style={{ width: '100%', height: 262, objectFit: 'contain', display: 'block' }} />}
        </div>
      ))}
    </div>
  );
}
