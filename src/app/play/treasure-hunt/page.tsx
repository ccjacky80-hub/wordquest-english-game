import { TreasureHuntGame } from '@/components/child-ui/TreasureHuntGame';
import { createDay1Mission } from '@/content/daily-plan';

export default function TreasureHuntPage() {
  const mission = createDay1Mission();
  return <TreasureHuntGame words={mission.newWords} />;
}
