# Frontend Architecture

This app is a thin orchestration shell over state, hooks, and dumb UI.

## Directory Contract

- App entry/orchestration: `App.tsx`
- Feature screen containers:
  - `src/features/sellcar/screens`
  - `src/features/carnews/screens`
  - `src/features/profile/screens`
  - `src/features/games`
- Catalog-only dumb UI: `src/features/catalog/components`
- Shared reusable dumb UI only: `src/shared/components`
- API calls only: `src/shared/api`
- Zustand state/actions: `src/shared/store`
- Orchestration hooks: `src/shared/hooks`
- Pure helpers only: `src/shared/lib`

## Core Rules

- `App.tsx` composes layers and wiring; it must not duplicate business logic.
- `src/shared/hooks` owns orchestration, progression, and view-flow handlers.
- `src/shared/store` owns authoritative app/session state.
- `src/shared/api` performs network requests only.
- `src/features/*/screens` are container screens (props in, UI out).
- `src/shared/components` and `src/features/catalog/components` are render-only UI.
- Progression is state-driven; overlays are presentation only.
- Event-driven first; polling is allowed only when explicitly needed and always stoppable.
- No duplicated logic across screens, components, hooks, and store.
- No new fake `app/` layer.

## App Layering

`App.tsx` mounts and orders UI layers by priority:

1. Base mounted tab screen
2. Game overlays
3. Seller overlays
4. Generic detail/access overlays
5. Launch overlay

Heavy base screens should remain mounted for fast returns.

## Data and Control Flow

Use this flow everywhere:

1. UI event in screen/component
2. Handler provided by hook
3. Hook calls API/store actions
4. Store updates authoritative state
5. Screen rerenders from props/state

Avoid:

- screen-owned fetching/business branching
- overlay-owned progression decisions
- duplicated session logic in multiple hooks
- duplicated business branching in `App.tsx`

## Event Bus and Polling Discipline

- Trigger state transitions from explicit events (`onPress`, socket events, API completion events).
- Keep handlers lightweight and side effects localized in hooks/actions.
- Poll only as a handshake/recovery mechanism.
- Every polling loop must have:
  - start condition
  - stop condition
  - cancellation on unmount, tab change, or flow exit
- Never run background polling without clear ownership in a hook.

## Seller Domain Split

Seller logic is split into two independent domains:

- Access/auth/profile orchestration (`useSellerAccessFlow`, `sellerSession`, `sellerAccess`).
- Listings/history/post/edit orchestration (`useSellerListingFlow`, `useSellerListingOverlays`, `sellerListingsStore`, `sellerListings`).

Rules:

- Session apply/refresh stays centralized in `sellerSession`.
- Listing cache/pagination/mutations stay in `sellerListingsStore`.
- Seller progression state is hook/store-owned, not overlay-owned.

## Games Contract

- Multi-layer mounted screens are allowed for responsiveness.
- Game truth comes from store state and socket events, not overlay existence.
- Room and round progression must be orchestrated through hooks/store.

## PR Checklist (Architecture)

- Is new logic in the correct layer?
- Is progression state-driven (not overlay-driven)?
- Is event handling centralized in hooks/actions?
- Is polling stoppable and cleanup-safe?
- Is logic duplicated across screen/component/store/hook?
- Did `App.tsx` stay composition-only?
