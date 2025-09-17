import FocusFlowApp from '@/components/app/focus-flow-app';
import { FocusStoreProvider } from '@/contexts/focus-store-context';

export default function FocusPage() {
  return (
    <FocusStoreProvider>
      <FocusFlowApp />
    </FocusStoreProvider>
  );
}
