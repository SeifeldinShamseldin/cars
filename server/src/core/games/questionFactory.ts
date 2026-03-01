import type {
  GuessCarOption,
  GuessCarRoundStartedPayload,
} from "../../../shared/types/domain";
import { DEMO_CARS, type DemoCar } from "../../data/demoCars";
import { shuffle } from "../../utils/id";
import type { InternalRoom } from "../rooms/types";

export type GuessQuestion = {
  questionId: string;
  correctOptionId: string;
  startedPayload: GuessCarRoundStartedPayload;
};

const toOption = (car: DemoCar): GuessCarOption => ({
  id: car.id,
  label: car.label,
});

export const buildGuessQuestion = (room: InternalRoom): GuessQuestion => {
  const unusedCars = DEMO_CARS.filter((car) => !room.usedQuestionIds.has(car.id));
  const correctCar = unusedCars.length > 0 ? shuffle(unusedCars)[0] : shuffle(DEMO_CARS)[0];
  room.usedQuestionIds.add(correctCar.id);

  const distractors = shuffle(
    DEMO_CARS.filter((car) => car.id !== correctCar.id),
  ).slice(0, 3);

  const options = shuffle([correctCar, ...distractors]).map(toOption) as [
    GuessCarOption,
    GuessCarOption,
    GuessCarOption,
    GuessCarOption,
  ];

  const startedPayload: GuessCarRoundStartedPayload =
    room.round % 2 === 0
      ? {
          mode: "CLUE",
          questionId: correctCar.id,
          clue: correctCar.clue,
          options,
        }
      : {
          mode: "PART",
          questionId: correctCar.id,
          partImageUrl: correctCar.partImageUrl,
          options,
        };

  return {
    questionId: correctCar.id,
    correctOptionId: correctCar.id,
    startedPayload,
  };
};

export const buildImposterImages = (): {
  normalCar: DemoCar;
  imposterCar: DemoCar;
} => {
  const [normalCar, imposterCar] = shuffle(DEMO_CARS).slice(0, 2);
  return { normalCar, imposterCar };
};

