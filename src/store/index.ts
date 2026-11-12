/**
 * Единая точка входа в глобальный стейт.
 * UI импортирует сторы только отсюда: `import { usePetStore, useUiStore } from '@/store';`
 */
export * from './petStore';
export * from './uiStore';
export * from './lessonStore';
export * from './settingsStore';
