import { ParentDashboard } from '@/components/parent-ui/ParentDashboard';
import { ParentGate } from '@/components/parent-ui/ParentGate';

export default function ParentPage() {
  return <ParentGate><ParentDashboard /></ParentGate>;
}
