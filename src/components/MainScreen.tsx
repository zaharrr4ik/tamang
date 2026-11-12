import { PetHalf } from './pet/PetHalf';
import { BottomHalf } from './BottomHalf';

/**
 * Главный экран: две половины.
 * Верхняя (питомец, статы, наряд) постоянна и не размонтируется при смене вкладок,
 * нижняя — динамическая зона с контентом из реестра вкладок.
 */
export function MainScreen() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-app-bg text-app-text">
      <PetHalf />
      <BottomHalf />
    </div>
  );
}
