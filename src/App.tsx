import { TelegramProvider } from '@/lib/telegram';
import { RootScreen } from '@/components/RootScreen';

/**
 * Корень приложения.
 * TelegramProvider поднимает Telegram-окружение и тему, RootScreen
 * переключает экраны (старт с яйцом -> главный экран с питомцем).
 */
export default function App() {
  return (
    <TelegramProvider>
      <div className="h-full w-full overflow-hidden bg-app-bg text-app-text">
        <RootScreen />
      </div>
    </TelegramProvider>
  );
}
