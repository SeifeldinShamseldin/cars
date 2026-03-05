# Car Party Game Architecture

## Goals

- Build a low-cost realtime party game with no login and no polling.
- Support two server-authoritative games: Guess the Car and Imposter.
- Keep mobile and backend event/domain contracts aligned through duplicated shared files.

## Stack

- Mobile: Expo, React Native, TypeScript, React Native Paper, Zustand, Socket.IO client, expo-image, AsyncStorage
- Server: Node.js, TypeScript, Socket.IO, in-memory room manager
- Home catalog content: lightweight HTTP endpoint on the same Node server for non-realtime featured car content

## Folder Structure

```text
.
├── architecture.md
├── mobile/
│   ├── App.tsx
│   ├── shared/types/
│   └── src/
│       ├── features/
│       └── shared/
└── server/
    ├── prisma/
    ├── shared/types/
    ├── sqlite/
    └── src/
        ├── admin/
        ├── core/
        ├── data/
        └── scripts/
```

## Event Contract Overview

- Client to server room events: `room.create`, `room.join`, `room.leave`, `room.sync`
- Client to server host controls: `game.select`, `game.start`, `game.next`
- Client to server guess action: `guess.submit`
- Server to client room lifecycle: `room.created`, `room.joined`, `room.state`, `room.updated`, `room.closed`
- Server to client game lifecycle: `game.started`, `round.started`, `round.ended`, `game.ended`
- Errors are emitted with `error` and a `{ code, message }` payload

## Home Catalog API

- Launch is the only local/static experience on mobile.
- All catalog content after launch is backend-driven over HTTP, not Socket.IO.
- Bootstrap preload:
  - `GET /api/home`
  - returns featured sell cars, featured update cars, first sell page, first update page
- Paginated list feeds:
  - `GET /api/sell-cars?offset=20&limit=20`
  - `GET /api/new-cars?offset=20&limit=20`
- Reference preload:
  - `GET /api/reference/cars`
  - returns brands and grouped models for local filter/search state
- Seller request action:
  - `POST /api/sell-cars/{listingId}/request-sell-car`
  - marks a seller feature request as pending for admin review
- Catalog images are served by the backend from `/assets/catalog/*`.
- Mobile caches:
  - bootstrap home payload in memory during launch-to-app
  - reference brands/models payload in memory for the current session
  - paginated list pages per category in memory, including appended page 2/page 3/etc for the current session
  - car detail overlays are resolved directly from cached catalog items by `id`

## Current Mobile Structure

```text
mobile/src/
  features/
    catalog/
      components/
        CarDetailScreen.tsx
        CarsCatalogFeed.tsx
        CarsHeroScreen.tsx
        CatalogHeader.tsx
        CatalogSearchOverlay.tsx
    launch/
      screens/
    sellcar/
      screens/
    carnews/
      screens/
    games/
      games/
        screens/
      lobby/
      guess-car/
      imposter/
    profile/
      screens/
  shared/
    api/
    components/
      BackArrow.tsx
      BottomNav.tsx
      CountdownPill.tsx
      ResponsiveImage.tsx
      ScreenShell.tsx
    hooks/
      useCarCatalog.ts
      useCarsCatalogFeed.ts
      useCountdown.ts
      useLaunchTransition.ts
      useLoopingCarousel.ts
      useOverlayTransition.ts
      usePreRoomFlow.ts
      useProfileState.ts
      useSocketLifecycle.ts
    lib/
      catalogFeedMappers.ts
      catalogFilters.ts
      catalogPresentation.ts
      catalogSearchOverlay.ts
      imagePipeline.ts
    store/
      actions.ts
      appStore.ts
      catalogStore.helpers.ts
      catalogStore.ts
      catalogStore.types.ts
      selectors.ts
      slices/
        guessCarSlice.ts
        imposterSlice.ts
        roomSlice.ts
      types.ts
    theme/
```

## Mobile UX Flow

- App opens on a branded local launch screen with the Porsche key animation.
- On first open, player enters a local-only username.
- Name is stored on the device with AsyncStorage.
- Main shell uses a bottom navigation with 4 tabs:
  - `Sell Car`
  - `Car Updates`
  - `Games`
  - `Profile`
- `Sell Car` tab:
  - shows the sell-car hero carousel at the top
  - shows the paginated sell-car feed underneath in the same screen
- `Car Updates` tab:
  - shows the car-updates hero carousel at the top
  - shows the paginated updates feed underneath in the same screen
- Tapping any car from the hero or feed opens the same dynamic detail overlay by `carId`.
- `Games` tab shows the two available modes:
  - `Car Guess`
  - `Imposter`
- `Car Guess` and `Imposter` each open a mode entry overlay with `Create room` and `Join room`.
- `Profile` lets the player update the stored device-side name.
- Once a room is active, the app leaves the tab shell and shows lobby/game screens.

## Localization

- Mobile copy is currently English-only in `mobile/src/languages/en.json`.
- `mobile/src/shared/lib/i18n.ts` resolves translation keys for the active UI language.

## Mobile Rendering Notes

- `App.tsx` is the only app entrypoint and top-level composition layer.
- There is no separate `mobile/src/app/*` layer anymore.
- Feature screens stay close to their feature folders.
- Catalog cache state and fetch actions live in Zustand under `mobile/src/shared/store/*`.
- Shared catalog hooks in `mobile/src/shared/hooks/*` act as view-model/orchestration layers over the store and API layer.
- Catalog-only render UI lives under `mobile/src/features/catalog/components/*`.
- Only truly reusable cross-app UI stays in `mobile/src/shared/components/*`.
- Image rendering is centralized in `mobile/src/shared/components/ResponsiveImage.tsx`.
- Looping carousel behavior is centralized in `mobile/src/shared/hooks/useLoopingCarousel.ts`.
- Zustand access is split between:
  - `mobile/src/shared/store/actions.ts`
  - `mobile/src/shared/store/appStore.ts`
  - `mobile/src/shared/store/catalogStore.ts`
  - `mobile/src/shared/store/slices/*`
  - `mobile/src/shared/store/selectors.ts`
- Main tabs stay mounted so tab switching does not remount the whole screen tree.
- Car detail opens as an overlay on top of the mounted current tab.
- Game mode entry opens as an overlay on top of the mounted `Games` tab.
- Swipe-back is only used on those overlay screens so the previous content remains visible underneath.
- The launch screen uses standard React Native layout only.

## Catalog Refresh Rules

- Lists keep current cached data visible while refreshing.
- No manual pull-to-refresh is used for catalog feeds.
- Automatic stale refresh runs in background after `30 sec`
  - only for catalog data
  - uses `GET /api/home` to refresh the bootstrap payload and first page cache
  - does not clear the current UI first
- Hero car sections and detail galleries use a looping carousel with swipe-follow indicators.
- Refresh replaces page 1 for both sell and update sections so:
  - removed items disappear
  - changed items update
  - new items appear
- Cached older feed pages are dropped on refresh so moderation and visibility changes are always accurate.

## Backend Status

- Backend is still a single deployable modular Node service.
- Current backend structure:
  - `server/src/index.ts` for HTTP/bootstrap
  - `server/src/admin/*` for admin-only listing, update, and DB tooling
  - `server/src/core/socket/registerHandlers.ts` for Socket.IO wiring
  - `server/src/core/rooms/*` for room state ownership
  - `server/src/core/games/*` for game orchestration
  - `server/src/data/catalogSqlite.ts` for SQLite-backed catalog/reference reads
  - `server/src/data/demoCars.ts` for game/demo question data
  - `server/src/scripts/seedSqlite.ts` for rebuilding the local SQLite catalog database
- SQLite is now the source of truth for:
  - `car_brands`
  - `car_models`
  - `sellers`
  - `car_listings`
  - `car_updates`
- Admin tooling runs on the same backend and is browser-based:
  - `/admin/listings`
  - `/admin/updates`
  - `/admin/db`
- No microservice split is planned yet.

## Game Rules

### Guess the Car

- Exactly 12 rounds total.
- Each round has 4 answer options.
- Round starts with a 30 second deadline.
- Correct answers are ranked by server receive order:
  - 1st correct = 4 points
  - 2nd correct = 3 points
  - 3rd correct = 2 points
  - later correct answers = 1 point
- Wrong answers score 0.
- Round ends when every player has answered or the timer expires.
- Between rounds, mobile shows the round winner and current standings.
- The next round starts automatically after a 2 second intermission.

### Imposter

- Requires 3 to 12 players.
- Exactly 12 rounds total.
- Each round runs for 30 seconds.
- Every player sees a car image except one imposter, who sees a different car image.
- Round ends only on timeout, then server reveals the imposter and both images.
- The next round starts automatically after a 2 second intermission.

## Cleanup Rules

- Public room state contains no secrets.
- If a room has no connected players, the server schedules deletion after `EMPTY_ROOM_TTL_MS`.
- If the host disconnects unexpectedly, the server allows `HOST_RECONNECT_GRACE_MS`.
- After host grace expires, the oldest connected player becomes the new host.
- After round 12 ends, server emits `game.ended`, waits 20 seconds, emits `room.closed`, then deletes the room.

## Constants And Timing Notes

- `TOTAL_QUESTIONS = 12`
- `ROUND_MAX_MS = 30_000`
- `INTERMISSION_MS = 2_000`
- `ROOM_CLOSE_AFTER_GAME_MS = 20_000`
- `EMPTY_ROOM_TTL_MS = 60_000`
- `HOST_RECONNECT_GRACE_MS = 15_000`
- `MAX_PLAYERS = 12`
- `MIN_PLAYERS_IMPOSTER = 3`

Timing flow:

```text
Games tab
  -> choose Car Guess or Imposter
  -> create room or join room
  -> lobby
  -> game.start
  -> round 1 starts (30s max)
  -> round ends when all answers are in OR timeout
  -> round result / standings view
  -> 2s intermission
  -> repeat until round 12
  -> game.ended
  -> 20s closing window
  -> room.closed + room cleanup
```
