КРИТИЧЕСКИЙ КОНТЕКСТ: баги проявляются ТОЛЬКО в мобильной версии в ГОРИЗОНТАЛЬНОЙ ориентации (mobile landscape, например iPhone 12 Pro 844×390):

появляется два вертикальных скроллбара (внешний и внутренний). Wheel/scroll переключается между ними в зависимости от позиции курсора.

появляется правый “шов/полоса”, который обрезает контент (ощущение clip/overflow).
В portrait и на desktop может быть норм — чинить нужно именно landscape.

ЦЕЛЬ: в mobile landscape оставить только один источник скролла и убрать любое горизонтальное переполнение/шов.

ШАГ 1 — Диагностика строго в mobile landscape (обязательно)

Открой DevTools → Device emulation → iPhone 12 Pro → landscape (844×390).
Выполни в консоли 2 скрипта и используй результаты для точечного фикса.

1A) Найти все реальные scroll-контейнеры (в landscape)
(() => {
  const els = Array.from(document.querySelectorAll("*"));
  const res = els.map(el => {
    const cs = getComputedStyle(el);
    const oy = cs.overflowY;
    const isScrollable = (oy === "auto" || oy === "scroll") && (el.scrollHeight - el.clientHeight) > 2;
    if (!isScrollable) return null;
    return {
      el,
      id: el.id,
      className: el.className,
      overflowY: oy,
      height: cs.height,
      maxHeight: cs.maxHeight,
      position: cs.position
    };
  }).filter(Boolean);
  console.table(res.slice(0, 30));
  return res;
})();

1B) Найти виновника “шва” справа (overflow по X) (в landscape)
(() => {
  const docW = document.documentElement.clientWidth;
  const offenders = Array.from(document.querySelectorAll("*"))
    .filter(el => el.getBoundingClientRect().right > docW + 1)
    .slice(0, 40)
    .map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className,
        right: Math.round(r.right),
        docW,
        width: cs.width,
        position: cs.position
      };
    });
  console.table(offenders);
  return offenders;
})();


ВАЖНО: Делать фикс только после того, как определены элементы из этих таблиц.

ШАГ 2 — Убрать второй скролл именно в LANDSCAPE (точечно)

После того как найден внутренний scroll-container (обычно #root, main, .layout, .page, .content):

2A) Если это wrapper страницы (не меню/модалка)

В режиме mobile landscape нужно:

убрать у него overflow-y: auto/scroll

убрать height: 100vh/100dvh

вернуть height:auto; overflow:visible;

Сделай это только для landscape:
@media (max-height: 430px) and (orientation: landscape) { ... }

Пример требований (подставь реальные селекторы виновника):

overflow-y: visible !important;

height: auto !important;

max-height: none !important;

min-height: 100% (опционально)

2B) Если внутренний скролл нужен только для меню

Тогда убедись, что скролл внутри меню существует только когда меню открыто, а когда закрыто:

меню: display:none или visibility:hidden; pointer-events:none;

никакой невидимый контейнер не должен оставаться с overflow:auto поверх страницы

ШАГ 3 — Убрать “шов” справа в LANDSCAPE (почти всегда 100vw/w-screen)

В landscape чаще всего ломают:

width: 100vw / Tailwind w-screen

position: fixed + width:100vw (header/overlay)

большие элементы, рассчитанные на portrait

Исправление правила:

заменить 100vw → 100%

заменить w-screen → w-full

для fixed header: left:0; right:0; width:auto; вместо 100vw

Сделать это условно для landscape, чтобы не поломать desktop:
@media (max-height: 430px) and (orientation: landscape) { ... }

ШАГ 4 — Починить Header element not found (важно именно в landscape)

Ошибка Header element not found (headerHeight.ts:13) может включать неправильные высоты/паддинги, и в landscape создавать второй контейнер.

Нужно:

В Header добавить атрибут data-site-header="true" (или id="site-header").

В headerHeight.ts искать по нему.

Если не найден — использовать fallback 64px, без спама в консоль.

Обновлять значения на resize и orientationchange + ResizeObserver.

Критерии приёмки (строго в mobile landscape)

В DevTools виден только один вертикальный скроллбар.

Wheel/trackpad скроллит всегда один и тот же контейнер, независимо от позиции курсора.

Нет “шва” справа, нет обрезания контента.

Меню/оверлеи не создают невидимых hitbox/scroll слоёв.