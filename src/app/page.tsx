import FocusFlowApp from '@/components/app/focus-flow-app';
import { FocusStoreProvider } from '@/contexts/focus-store-context';

export default function Home() {
  return (
    <FocusStoreProvider>
      <FocusFlowApp />
    </FocusStoreProvider>
  );
}
