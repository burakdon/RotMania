// A brainrot as a noir comic card: inked portrait, cost, strength, what it does once it's on your side.
import { BRAINROT } from '../game/cards';
import { TYPE_COLORS, TYPE_NAMES } from '../game/content';
import { ABILITY_LABEL, abilityText } from '../game/text';
import type { Bag } from '../game/types';
import { useBrainrotPortrait } from '../toys/portraits';
import { BagView, Star } from './icons';

export function BrainrotCard({
  id, cost, size = 'md', selected, dim, onClick, note,
}: { id: string; cost?: Bag; size?: 'sm' | 'md' | 'lg'; selected?: boolean; dim?: boolean; onClick?: () => void; note?: React.ReactNode }) {
  const b = BRAINROT[id];
  const url = useBrainrotPortrait(id);
  return (
    <div className={`bcard bcard-${size} ${selected ? 'selected' : ''} ${dim ? 'dim' : ''} ${onClick ? 'clickable' : ''}`} style={{ ['--type' as string]: TYPE_COLORS[b.type] }} onClick={onClick}>
      <div className="bcard-art">
        {url ? <img src={url} alt="" draggable={false} /> : <div className="bcard-inking" />}
        <div className="bcard-str" title="Points at the end">
          <Star size={size === 'sm' ? 12 : 15} />
          {b.strength}
        </div>
        <div className="bcard-type">{TYPE_NAMES[b.type]}</div>
      </div>
      <div className="bcard-name">{b.name}</div>
      <div className="bcard-cost">
        <BagView bag={cost ?? b.cost} />
      </div>
      {size !== 'sm' && (
        <div className="bcard-ability">
          {b.ability ? (
            <>
              <b>{ABILITY_LABEL[b.ability.k]}</b> {abilityText(b.ability)}
            </>
          ) : (
            <i>No tricks. Just muscle.</i>
          )}
        </div>
      )}
      {size === 'lg' && <div className="bcard-flavor">{b.flavor}</div>}
      {note}
    </div>
  );
}
