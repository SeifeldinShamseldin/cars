import type { ReactNode } from "react";
import type { Animated } from "react-native";

import { GameEntryScreen } from "../../features/games/games/screens/GameEntryScreen";
import type { HubGame } from "../../features/games/types";
import type {
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
  RoomStatePublic,
} from "../../../shared/types/domain";
import { buildModeEntryProps } from "../lib/gameEntryPresentation";
import type { translate } from "../lib/i18n";
import { buildRoomLabels } from "../lib/roomPresentation";
import { useOverlayTransition } from "./useOverlayTransition";
import { useRoomSessionContent } from "./useRoomSessionContent";

type AnimatedScalar = Animated.Value | Animated.AnimatedInterpolation<number>;
type TranslateFn = (
  key: Parameters<typeof translate>[1],
  params?: Record<string, string | number>,
) => string;

export type GameSessionOverlay = {
  id: "mode-entry" | "room-session";
  opacity: AnimatedScalar;
  translateY: AnimatedScalar;
  onBack: () => void;
  scrollEnabled: boolean;
  swipeEnabled: boolean;
  content: ReactNode;
};

type UseGameSessionOverlaysParams = {
  t: TranslateFn;
  activeMode: HubGame | null;
  setActiveMode: (mode: HubGame | null) => void;
  joinRoomCode: string;
  setJoinRoomCode: (code: string) => void;
  createRoomForGame: (game: HubGame) => void;
  joinRoomForGame: () => void;
  roomState?: RoomStatePublic;
  isHost: boolean;
  roomClosesAt?: number;
  currentGuessPayload?: GuessCarRoundStartedPayload;
  selectedOptionId?: string;
  guessDisabled: boolean;
  guessResults?: GuessCarRoundEndedResults;
  currentImposterPayload?: ImposterRoundStartedPayload;
  imposterResults?: ImposterRoundEndedResults;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onExitGame: () => void;
  onRematchGame: () => void;
  onSelectOption: (optionId: string) => void;
  onSubmitOption: (optionId: string) => void;
};

export const useGameSessionOverlays = ({
  t,
  activeMode,
  setActiveMode,
  joinRoomCode,
  setJoinRoomCode,
  createRoomForGame,
  joinRoomForGame,
  roomState,
  isHost,
  roomClosesAt,
  currentGuessPayload,
  selectedOptionId,
  guessDisabled,
  guessResults,
  currentImposterPayload,
  imposterResults,
  onStartGame,
  onLeaveRoom,
  onExitGame,
  onRematchGame,
  onSelectOption,
  onSubmitOption,
}: UseGameSessionOverlaysParams): GameSessionOverlay[] => {
  const modeEntryTransition = useOverlayTransition(Boolean(activeMode));
  const roomSessionTransition = useOverlayTransition(Boolean(roomState));

  const closeModeEntry = () => {
    modeEntryTransition.close(() => {
      setActiveMode(null);
    });
  };

  const dismissModeEntry = () => {
    modeEntryTransition.dismiss(() => {
      setActiveMode(null);
    });
  };

  const modeEntryProps = buildModeEntryProps({
    t,
    activeMode,
    joinRoomCode,
    setJoinRoomCode,
    closeModeDetail: closeModeEntry,
    createRoomForGame,
    joinRoomForGame,
  });

  const roomLabels = roomState ? buildRoomLabels({ t, roomState }) : null;
  const roomSessionContent = useRoomSessionContent({
    roomState,
    isHost,
    labels: roomLabels,
    roomClosesAt,
    currentGuessPayload,
    selectedOptionId,
    guessDisabled,
    guessResults,
    currentImposterPayload,
    imposterResults,
    onStartGame,
    onLeaveRoom,
    onExitGame,
    onRematchGame,
    onSelectOption,
    onSubmitOption,
  });

  const overlays: GameSessionOverlay[] = [];

  if (modeEntryProps) {
    overlays.push({
      id: "mode-entry",
      opacity: modeEntryTransition.opacity,
      translateY: modeEntryTransition.translateY,
      onBack: dismissModeEntry,
      scrollEnabled: false,
      swipeEnabled: !roomState,
      content: <GameEntryScreen {...modeEntryProps} />,
    });
  }

  if (roomSessionContent) {
    overlays.push({
      id: "room-session",
      opacity: roomSessionTransition.opacity,
      translateY: roomSessionTransition.translateY,
      onBack: onLeaveRoom,
      scrollEnabled: true,
      swipeEnabled: roomState?.status === "LOBBY",
      content: roomSessionContent,
    });
  }

  return overlays;
};
