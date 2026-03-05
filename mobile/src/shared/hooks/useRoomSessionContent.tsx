import { useMemo } from "react";

import type {
  GuessCarRoundEndedResults,
  GuessCarRoundStartedPayload,
  ImposterRoundEndedResults,
  ImposterRoundStartedPayload,
  RoomStatePublic,
} from "../../../shared/types/domain";
import { GuessCarScreen } from "../../features/games/guess-car/GuessCarScreen";
import { ImposterScreen } from "../../features/games/imposter/ImposterScreen";
import { LobbyScreen } from "../../features/games/lobby/LobbyScreen";

type RoomSessionLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  activeModeLabel: string;
  playersLabel: string;
  hostLabel: string;
  hostControlsLabel: string;
  waitingHostLabel: string;
  startRoundsLabel: string;
  waitingText: string;
  leaveRoomLabel: string;
  guessScreenLabels: {
    eyebrow: string;
    roundTitle: string;
    exitGameLabel: string;
    rematchLabel: string;
    leaveRoomLabel: string;
    chooseOptionLabel: string;
    submittedLabel: string;
    waitingLabel: string;
    timeLeftLabel: string;
    roomClosesLabel: string;
    winnerLabel: string;
    noWinnerLabel: string;
    correctOptionLabel: string;
    answeredPlayersLabel: string;
    leaderboardLabel: string;
    roundPointsLabel: string;
    totalPointsLabel: string;
    countryLabel: string;
    ccLabel: string;
    hpLabel: string;
    torqueLabel: string;
    specialLabel: string;
    noSpecialLabel: string;
  };
  imposterScreenLabels: {
    eyebrow: string;
    roundTitle: string;
    exitGameLabel: string;
    rematchLabel: string;
    leaveRoomLabel: string;
    waitingLabel: string;
    timeLeftLabel: string;
    roomClosesLabel: string;
    imposterRevealLabel: string;
    normalImageLabel: string;
    imposterImageLabel: string;
  };
};

type UseRoomSessionContentParams = {
  roomState?: RoomStatePublic;
  isHost: boolean;
  labels?: RoomSessionLabels | null;
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

export const useRoomSessionContent = ({
  roomState,
  isHost,
  labels,
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
}: UseRoomSessionContentParams) =>
  useMemo(() => {
    if (!roomState || !labels) {
      return null;
    }

    if (roomState.status === "LOBBY") {
      return (
        <LobbyScreen
          roomState={roomState}
          isHost={isHost}
          eyebrow={labels.eyebrow}
          title={labels.title}
          subtitle={labels.subtitle}
          activeModeLabel={labels.activeModeLabel}
          playersLabel={labels.playersLabel}
          hostLabel={labels.hostLabel}
          hostControlsLabel={labels.hostControlsLabel}
          waitingHostLabel={labels.waitingHostLabel}
          startRoundsLabel={labels.startRoundsLabel}
          waitingText={labels.waitingText}
          leaveRoomLabel={labels.leaveRoomLabel}
          onStartGame={onStartGame}
          onLeaveRoom={onLeaveRoom}
        />
      );
    }

    if (roomState.gameType === "GUESS_CAR") {
      return (
        <GuessCarScreen
          payload={currentGuessPayload}
          roundEndsAt={roomState.roundEndsAt}
          isHost={isHost}
          selectedOptionId={selectedOptionId}
          disabled={guessDisabled}
          results={guessResults}
          roomClosesAt={roomClosesAt}
          eyebrow={labels.guessScreenLabels.eyebrow}
          roundTitle={labels.guessScreenLabels.roundTitle}
          exitGameLabel={labels.guessScreenLabels.exitGameLabel}
          rematchLabel={labels.guessScreenLabels.rematchLabel}
          leaveRoomLabel={labels.guessScreenLabels.leaveRoomLabel}
          chooseOptionLabel={labels.guessScreenLabels.chooseOptionLabel}
          submittedLabel={labels.guessScreenLabels.submittedLabel}
          waitingLabel={labels.guessScreenLabels.waitingLabel}
          timeLeftLabel={labels.guessScreenLabels.timeLeftLabel}
          roomClosesLabel={labels.guessScreenLabels.roomClosesLabel}
          winnerLabel={labels.guessScreenLabels.winnerLabel}
          noWinnerLabel={labels.guessScreenLabels.noWinnerLabel}
          correctOptionLabel={labels.guessScreenLabels.correctOptionLabel}
          answeredPlayersLabel={labels.guessScreenLabels.answeredPlayersLabel}
          leaderboardLabel={labels.guessScreenLabels.leaderboardLabel}
          roundPointsLabel={labels.guessScreenLabels.roundPointsLabel}
          totalPointsLabel={labels.guessScreenLabels.totalPointsLabel}
          countryLabel={labels.guessScreenLabels.countryLabel}
          ccLabel={labels.guessScreenLabels.ccLabel}
          hpLabel={labels.guessScreenLabels.hpLabel}
          torqueLabel={labels.guessScreenLabels.torqueLabel}
          specialLabel={labels.guessScreenLabels.specialLabel}
          noSpecialLabel={labels.guessScreenLabels.noSpecialLabel}
          onExitGame={onExitGame}
          onRematchGame={onRematchGame}
          onLeaveRoom={onLeaveRoom}
          onSelectOption={onSelectOption}
          onSubmitOption={onSubmitOption}
        />
      );
    }

    return (
      <ImposterScreen
        payload={currentImposterPayload}
        roundEndsAt={roomState.roundEndsAt}
        isHost={isHost}
        results={imposterResults}
        roomClosesAt={roomClosesAt}
        eyebrow={labels.imposterScreenLabels.eyebrow}
        roundTitle={labels.imposterScreenLabels.roundTitle}
        exitGameLabel={labels.imposterScreenLabels.exitGameLabel}
        rematchLabel={labels.imposterScreenLabels.rematchLabel}
        leaveRoomLabel={labels.imposterScreenLabels.leaveRoomLabel}
        waitingLabel={labels.imposterScreenLabels.waitingLabel}
        timeLeftLabel={labels.imposterScreenLabels.timeLeftLabel}
        roomClosesLabel={labels.imposterScreenLabels.roomClosesLabel}
        imposterRevealLabel={labels.imposterScreenLabels.imposterRevealLabel}
        normalImageLabel={labels.imposterScreenLabels.normalImageLabel}
        imposterImageLabel={labels.imposterScreenLabels.imposterImageLabel}
        onExitGame={onExitGame}
        onRematchGame={onRematchGame}
        onLeaveRoom={onLeaveRoom}
      />
    );
  }, [
    currentGuessPayload,
    currentImposterPayload,
    guessDisabled,
    guessResults,
    imposterResults,
    isHost,
    labels,
    onExitGame,
    onLeaveRoom,
    onRematchGame,
    onSelectOption,
    onStartGame,
    onSubmitOption,
    roomClosesAt,
    roomState,
    selectedOptionId,
  ]);
