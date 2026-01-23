# BUG
В проекте на desktop включен Lenis. Он настраивает скролл так:
- document.documentElement.style.overflowY = 'scroll'
- document.body.style.overflowY = 'visible'
То есть основной scroll-контейнер = HTML (documentElement), а не body.

Сейчас при ОТКРЫТИИ модалки происходит jump/scrollToTop и визуально пропадает header.
Причина: ScrollLockManager блокирует скролл через body:
- body.position = 'fixed'
- body.top = -scrollY
- body.overflow = 'hidden'
Это ломается при html-scroll (Lenis), потому что body-fixed + html-scroll конфликтуют.

Также в unlock() менеджер сбрасывает стили на documentElement:
- document.documentElement.style.overflow = ''
- document.documentElement.style.overflowY = ''
что ломает настройки Lenis и вызывает побочные эффекты со скроллом.

# GOAL
Сделать scroll-lock совместимым с Lenis (html-scroll):
1) При открытии модалки НЕ должно быть jump-to-top
2) Header не должен исчезать
3) После закрытия скролл должен восстанавливаться без артефактов
4) Concurrency lock (несколько источников) должен работать как раньше
5) Никаких сторонних библиотек, минимальные правки

# REQUIRED FIX (ScrollLockManager.ts)
Переписать lock/unlock так:

## A) Если скролл-контейнер = documentElement (html-scroll / Lenis)
Использовать простой и корректный метод:
- сохранить scrollTop (из document.documentElement.scrollTop)
- установить document.documentElement.style.overflow = 'hidden' (и overflowY = 'hidden')
- (опционально) компенсировать scrollbar padding-right на body
- НЕ трогать body.position/top вообще

На unlock:
- восстановить overflow/overflowY html к тем значениям, которые были ДО lock
- восстановить paddingRight body
- вернуть scrollTop через window.scrollTo или documentElement.scrollTop (что у вас работает стабильнее)
- НЕ сбрасывать html overflow в '' если там было 'scroll' от Lenis — нужно восстановить предыдущее значение

## B) Если скролл на window/body (без Lenis)
Оставить текущий механизм с body.position=fixed + top=-scrollY, но:
- ничего не менять на documentElement
- восстановить scroll через window.scrollTo(savedScrollY)

## C) Реализация через сохранение previous styles
Добавь приватные поля:
- prevHtmlOverflow, prevHtmlOverflowY
- prevBodyOverflow, prevBodyOverflowY, prevBodyPosition, prevBodyTop, prevBodyWidth, prevBodyPaddingRight
И восстанавливай строго их, а не пустые строки.

## D) Определение режима Lenis/html-scroll
Сделай функцию isHtmlScrollMode():
- return getComputedStyle(document.documentElement).overflowY === 'scroll'
  OR document.documentElement.classList.contains('lenis')
  OR document.documentElement.hasAttribute('data-lenis') (если есть)
и использовать это для выбора стратегии A/B.

# IMPORTANT
Убери из unlock()/forceUnlock() строки, которые безусловно очищают html overflow:
- document.documentElement.style.overflow = ''
- document.documentElement.style.overflowY = ''
И замените на восстановление сохраненных значений (скорее всего 'scroll' на desktop).

# OUTPUT
Дай конкретный патч для ScrollLockManager.ts:
- новая логика lock/unlock/forceUnlock
- совместимость с Lenis html-scroll
- без изменения public API scrollLockManager
