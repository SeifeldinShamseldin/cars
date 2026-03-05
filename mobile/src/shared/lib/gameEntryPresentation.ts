import type { translate } from "./i18n";

type TranslateFn = (
  key: Parameters<typeof translate>[1],
  params?: Record<string, string | number>,
) => string;

export const buildModeEntryProps = ({
  t,
  activeMode,
  joinRoomCode,
  setJoinRoomCode,
  closeModeDetail,
  createRoomForGame,
  joinRoomForGame,
}: {
  t: TranslateFn;
  activeMode: "GUESS_CAR" | "IMPOSTER" | null;
  joinRoomCode: string;
  setJoinRoomCode: (code: string) => void;
  closeModeDetail: () => void;
  createRoomForGame: (mode: "GUESS_CAR" | "IMPOSTER") => void;
  joinRoomForGame: () => void;
}) => {
  if (!activeMode) {
    return null;
  }

  const isGuess = activeMode === "GUESS_CAR";

  return {
    eyebrow: t(isGuess ? "entry.guessEyebrow" : "entry.imposterEyebrow"),
    title: t(isGuess ? "home.carGuess" : "home.imposter"),
    note: t(isGuess ? "entry.guessNote" : "entry.imposterNote"),
    createNewRoomLabel: t("entry.createNewRoom"),
    joinExistingRoomLabel: t("entry.joinExistingRoom"),
    roomCodeLabel: t("common.roomCode"),
    joinHelper: t("entry.joinHelper"),
    createLabel: t("common.createRoom"),
    joinLabel: t("common.joinRoom"),
    backLabel: t("common.back"),
    roomCode: joinRoomCode,
    onChangeRoomCode: setJoinRoomCode,
    onBack: closeModeDetail,
    onCreate: () => createRoomForGame(activeMode),
    onJoin: joinRoomForGame,
  };
};
