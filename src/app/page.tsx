import { ElementCharacter } from '@/components/ElementCharacter';
import { ELEMENT_KEYS } from '@/lib/saju/types';

export default function Home() {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-20">
      {ELEMENT_KEYS.map((el) => <ElementCharacter key={el} element={el} />)}
    </div>
  );
}
