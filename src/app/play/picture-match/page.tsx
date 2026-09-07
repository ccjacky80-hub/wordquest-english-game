import { PictureMatchGame } from '@/components/child-ui/PictureMatchGame';
import { createDay1Mission } from '@/content/daily-plan';

export default function PictureMatchPage() {
  const mission = createDay1Mission();
  return <PictureMatchGame words={mission.newWords} optionCount={4} />;
}
