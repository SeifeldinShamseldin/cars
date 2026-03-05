import { create } from "zustand";

import { createAppStoreActions } from "./actions";
import { initialGuessCarSlice } from "./slices/guessCarSlice";
import { initialImposterSlice } from "./slices/imposterSlice";
import { initialRoomSlice } from "./slices/roomSlice";
import { initialSellerAccessSlice } from "./slices/sellerAccessSlice";
import type { AppStore } from "./types";

export const useAppStore = create<AppStore>((set) => ({
  ...initialRoomSlice,
  ...initialGuessCarSlice,
  ...initialImposterSlice,
  ...initialSellerAccessSlice,
  ...createAppStoreActions(set),
}));
