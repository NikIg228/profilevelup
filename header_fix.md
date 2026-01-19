НУЖНО ПОЧИНИТЬ HEADER: сейчас на desktop часть header/его содержимого уезжает за пределы viewport и обрезается сверху (на скрине видно, что логотип/PROFILEVELUP режутся). Это выглядит как типичный кейс: header находится внутри контейнера, на который после загрузки навешивается transform (Lenis / smooth scroll / overlay wrapper). Из-за этого position: fixed становится “fixed внутри transformed ancestor” и уезжает/клипается.

ЦЕЛЬ:
1) Header всегда фиксирован к viewport и НЕ зависит от Lenis/transform.
2) Никакой обрезки сверху/сдвига по ширине.
3) Минимально меняем дизайн.

ФАЙЛЫ:
- Header.tsx
- globals.css
- (в проекте найти Layout/App компонент где подключён Header и Lenis wrapper)
- headerHeight.ts (проверить, чтобы он не ломал высоту)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ШАГ 1 — ПОДТВЕРДИТЬ ПРИЧИНУ (в коде)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Найди, где Lenis/scroll wrapper создаёт контейнер (часто это div.lenis / [data-lenis] / .lenis-wrapper).
Проверь, что Header сейчас рендерится ВНУТРИ этого контейнера.
Это и есть причина: transformed parent ломает fixed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ШАГ 2 — СДЕЛАТЬ HEADER ПОРТАЛОМ В BODY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
В Header.tsx:
- импортируй createPortal из react-dom
- рендери сам <header ...> через createPortal(..., document.body)
- добавь guard на SSR: если window/document undefined — вернуть null или обычный рендер

ПРИМЕР ЛОГИКИ:
const header = (<header ...>...</header>);
return typeof document !== "undefined" ? createPortal(header, document.body) : header;

Важно:
- сохранить data-site-header и className="header-base hidden lg:flex" (как сейчас)
- НО добавить к header inline style/class: "fixed top-0 left-0 right-0 w-full" (или в CSS) чтобы он точно был поверх.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ШАГ 3 — ЗАЩИТА ОТ ВЫЛЕЗАНИЯ ПО ШИРИНЕ (CSS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
В globals.css у header.header-base сейчас стоит overflow: visible;
Из-за этого любой внутренний flex может “вылезти” наружу.

Измени:
header.header-base { overflow-x: clip; overflow-y: visible; max-width: 100vw; }

И добавь min-width: 0 для контейнера:
header.header-base .header-container { min-width: 0; }
header.header-base nav { min-width: 0; white-space: nowrap; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ШАГ 4 — УБРАТЬ ДЕБИЛЬНЫЕ САЙД-ЭФФЕКТЫ ОТ ОБНОВЛЕНИЯ --header-h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
headerHeight.ts использует ResizeObserver и может менять --header-h.
Но у нас header зафиксирован как height: var(--header-h) (64px),
а внутренний контейнер ещё h-16 (64px). Это ок.

Проверь:
- updateHeaderHeight должен брать высоту header.getBoundingClientRect().height
- но НЕ должен учитывать offset/transform родителя.
Если нужно — зафиксируй --header-h на 64px для desktop:
в updateHeaderHeight: если window.innerWidth >= 1024 -> ставь 64px и выходи.
(Потому что desktop header статичный по макету, наблюдатель там не нужен.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ШАГ 5 — ПРОВЕРИТЬ OFFSET КОНТЕНТА
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Убедись, что main имеет padding-top: var(--header-h) на desktop.
Это уже есть в globals.css, но проверь, что это не переопределяется другими правилами.
Если нужно — усили это:
@media (min-width:1024px){ main#main-content, #main-content { padding-top: var(--header-h) !important; } }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ШАГ 6 — ПРОВЕРКА
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- открыть / и /about
- hard reload
- дождаться инициализации Lenis/скриптов (1–2 сек)
- header должен остаться на месте, без обрезки сверху
- никакого горизонтального скролла
- содержимое не уезжает за viewport

РЕЗУЛЬТАТ:
Сделай изменения:
1) Header.tsx (portal)
2) globals.css (overflow-x clip + min-width 0)
3) headerHeight.ts (на desktop фикс 64px, отключить ResizeObserver на desktop если надо)
и покажи diff этих файлов.
