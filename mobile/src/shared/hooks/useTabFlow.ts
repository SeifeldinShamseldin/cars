import { useState } from "react";

import type { BottomNavTab } from "../components/BottomNav";

export const useTabFlow = () => {
  const [activeTab, setActiveTab] = useState<BottomNavTab>("SELL");
  const [sellScrollOffset, setSellScrollOffset] = useState(0);
  const [updatesScrollOffset, setUpdatesScrollOffset] = useState(0);

  return {
    activeTab,
    setActiveTab,
    sellScrollOffset,
    setSellScrollOffset,
    updatesScrollOffset,
    setUpdatesScrollOffset,
  };
};
