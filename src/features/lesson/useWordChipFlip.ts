import { useLayoutEffect, useRef } from 'react';

/**
 * FLIP-анимация плашек слов. После выбора/удаления слова плашка переезжает
 * из банка в строку ответа (или обратно), и мы проигрываем этот перелёт плавно.
 * Анимируем сразу все плашки: та, что переехала, летит на новое место,
 * а соседние в строке ответа плавно сдвигаются в освободившийся слот.
 *  - chipElementsRef хранит активную кнопку слова (в банке или в ответе) по word.id;
 *  - pendingRectsRef — экранные rect'ы всех плашек до обновления состояния,
 *    из которых они «вылетают» после рендера.
 */
export function useWordChipFlip(selectedWordIds: string[], animationsEnabled: boolean) {
  const chipElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pendingRectsRef = useRef<Map<string, DOMRect>>(new Map());

  // Привязываем ref к активной кнопке слова — в банке или в поле ответа.
  const registerChip = (wordId: string) => (element: HTMLButtonElement | null) => {
    if (element === null) {
      chipElementsRef.current.delete(wordId);
    } else {
      chipElementsRef.current.set(wordId, element);
    }
  };

  // Перед любым изменением ответа запоминаем положение всех видимых плашек.
  const captureChipRects = (): void => {
    chipElementsRef.current.forEach((element, wordId) => {
      pendingRectsRef.current.set(wordId, element.getBoundingClientRect());
    });
  };

  // После обновления selectedWordIds новые кнопки уже смонтированы: каждой плашке,
  // у которой сохранился старый rect, мгновенно даём старую позицию и плавно
  // возвращаем на место — так переезжает нажатое слово и подтягиваются соседи.
  useLayoutEffect(() => {
    if (!animationsEnabled || pendingRectsRef.current.size === 0) {
      pendingRectsRef.current.clear();
      return;
    }

    const cleanups: Array<() => void> = [];

    chipElementsRef.current.forEach((element, wordId) => {
      const oldRect = pendingRectsRef.current.get(wordId);
      if (oldRect === undefined) {
        return;
      }

      const newRect = element.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) <= 0.5 && Math.abs(dy) <= 0.5) {
        return;
      }

      element.style.transition = 'none';
      element.style.transform = `translate(${dx}px, ${dy}px)`;
      // Форсируем reflow, чтобы браузер запомнил стартовую позицию до анимации.
      void element.offsetWidth;

      let frame = 0;
      let timeout = 0;
      let isFinished = false;

      function finishAnimation(): void {
        if (isFinished) {
          return;
        }
        isFinished = true;
        element.style.transition = '';
        element.style.transform = '';
        element.removeEventListener('transitionend', handleTransitionEnd);
        window.clearTimeout(timeout);
      }

      function handleTransitionEnd(event: TransitionEvent): void {
        if (event.target !== element || event.propertyName !== 'transform') {
          return;
        }
        finishAnimation();
      }

      element.addEventListener('transitionend', handleTransitionEnd);

      frame = requestAnimationFrame(() => {
        element.style.transition = 'transform 290ms cubic-bezier(0.22, 1, 0.36, 1)';
        element.style.transform = 'translate(0px, 0px)';
        // Страховка на случай, если transitionend не придёт.
        timeout = window.setTimeout(finishAnimation, 320);
      });

      cleanups.push(() => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
        element.removeEventListener('transitionend', handleTransitionEnd);
        element.style.transition = '';
        element.style.transform = '';
      });
    });

    pendingRectsRef.current.clear();

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [selectedWordIds, animationsEnabled]);

  return { registerChip, captureChipRects };
}
