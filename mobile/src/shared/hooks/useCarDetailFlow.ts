import { useState } from "react";

export const useCarDetailFlow = () => {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const openCarDetail = (carId: string) => {
    setSelectedCarId(carId);
  };

  return {
    selectedCarId,
    setSelectedCarId,
    openCarDetail,
  };
};
