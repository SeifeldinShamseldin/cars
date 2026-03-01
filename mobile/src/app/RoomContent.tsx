import type { ReactNode } from "react";

import { ScreenShell } from "../shared/components/ScreenShell";
import { LobbyScreen } from "../features/games/lobby/LobbyScreen";
import { GuessCarScreen } from "../features/games/guess-car/GuessCarScreen";
import { ImposterScreen } from "../features/games/imposter/ImposterScreen";
import { socketClient } from "../shared/api/socket";
import type { RoomStatePublic } from "../../shared/types/domain";
import type {
  GuessCarRoundStartedPayload,
  GuessCarRoundEndedResults,
  ImposterRoundStartedPayload,
  ImposterRoundEndedResults,
} from "../../shared/types/domain";

type RoomContentProps = {
  roomState: RoomStatePublic;
  footer?: ReactNode;
  isModeDetailScreen: boolean;
  isHost: boolean;
  hostKey?: string;
  roomCode?: string;
  playerToken?: string;
  roomClosesAt?: number;
  currentGuessPayload?: GuessCarRoundStartedPayload;
  selectedOptionId?: string;
  guessDisabled: boolean;
  guessResults?: GuessCarRoundEndedResults;
  currentImposterPayload?: ImposterRoundStartedPayload;
  imposterResults?: ImposterRoundEndedResults;
  eyebrow: string;
  title: string;
  subtitle: string;
  playersLabel: string;
  hostLabel: string;
  hostControlsLabel: string;
  waitingHostLabel: string;
  guessLabel: string;
  imposterLabel: string;
  startRoundsLabel: string;
  waitingText: string;
  leaveRoomLabel: string;
  onLeaveRoom: () => void;
  guessScreenLabels: {
    eyebrow: string;
    roundTitle: string;
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
    waitingLabel: string;
    timeLeftLabel: string;
    roomClosesLabel: string;
    imposterRevealLabel: string;
    normalImageLabel: string;
    imposterImageLabel: string;
  };
  onSelectOption: (optionId: string) => void;
  onMarkGuessSubmitted: () => void;
};

export const RoomContent = ({
  roomState,
  footer,
  isModeDetailScreen,
  isHost,
  hostKey,
  roomCode,
  playerToken,
  roomClosesAt,
  currentGuessPayload,
  selectedOptionId,
  guessDisabled,
  guessResults,
  currentImposterPayload,
  imposterResults,
  eyebrow,
  title,
  subtitle,
  playersLabel,
  hostLabel,
  hostControlsLabel,
  waitingHostLabel,
  guessLabel,
  imposterLabel,
  startRoundsLabel,
  waitingText,
  leaveRoomLabel,
  onLeaveRoom,
  guessScreenLabels,
  imposterScreenLabels,
  onSelectOption,
  onMarkGuessSubmitted,
}: RoomContentProps) => (
  <ScreenShell footer={footer} scrollEnabled={!isModeDetailScreen}>
    {roomState.status === "LOBBY" ? (
      <LobbyScreen
        roomState={roomState}
        isHost={isHost}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        playersLabel={playersLabel}
        hostLabel={hostLabel}
        hostControlsLabel={hostControlsLabel}
        waitingHostLabel={waitingHostLabel}
        guessLabel={guessLabel}
        imposterLabel={imposterLabel}
        startRoundsLabel={startRoundsLabel}
        waitingText={waitingText}
        leaveRoomLabel={leaveRoomLabel}
        onStartGame={() => {
          if (!roomCode || !hostKey) {
            return;
          }

          socketClient.startGame({ roomCode, hostKey });
        }}
        onLeaveRoom={onLeaveRoom}
      />
    ) : roomState.gameType === "GUESS_CAR" ? (
      <GuessCarScreen
        payload={currentGuessPayload}
        round={roomState.round}
        roundEndsAt={roomState.roundEndsAt}
        selectedOptionId={selectedOptionId}
        disabled={guessDisabled}
        results={guessResults}
        roomClosesAt={roomClosesAt}
        eyebrow={guessScreenLabels.eyebrow}
        roundTitle={guessScreenLabels.roundTitle}
        chooseOptionLabel={guessScreenLabels.chooseOptionLabel}
        submittedLabel={guessScreenLabels.submittedLabel}
        waitingLabel={guessScreenLabels.waitingLabel}
        timeLeftLabel={guessScreenLabels.timeLeftLabel}
        roomClosesLabel={guessScreenLabels.roomClosesLabel}
        winnerLabel={guessScreenLabels.winnerLabel}
        noWinnerLabel={guessScreenLabels.noWinnerLabel}
        correctOptionLabel={guessScreenLabels.correctOptionLabel}
        answeredPlayersLabel={guessScreenLabels.answeredPlayersLabel}
        leaderboardLabel={guessScreenLabels.leaderboardLabel}
        roundPointsLabel={guessScreenLabels.roundPointsLabel}
        totalPointsLabel={guessScreenLabels.totalPointsLabel}
        countryLabel={guessScreenLabels.countryLabel}
        ccLabel={guessScreenLabels.ccLabel}
        hpLabel={guessScreenLabels.hpLabel}
        torqueLabel={guessScreenLabels.torqueLabel}
        specialLabel={guessScreenLabels.specialLabel}
        noSpecialLabel={guessScreenLabels.noSpecialLabel}
        onSelectOption={onSelectOption}
        onSubmitOption={(optionId) => {
          if (!roomCode || !playerToken || !roomState.round || guessDisabled) {
            return;
          }

          onMarkGuessSubmitted();
          socketClient.submitGuess({
            roomCode,
            playerToken,
            round: roomState.round,
            optionId,
            clientTime: Date.now(),
          });
        }}
      />
    ) : (
      <ImposterScreen
        payload={currentImposterPayload}
        round={roomState.round}
        roundEndsAt={roomState.roundEndsAt}
        results={imposterResults}
        roomClosesAt={roomClosesAt}
        eyebrow={imposterScreenLabels.eyebrow}
        roundTitle={imposterScreenLabels.roundTitle}
        waitingLabel={imposterScreenLabels.waitingLabel}
        timeLeftLabel={imposterScreenLabels.timeLeftLabel}
        roomClosesLabel={imposterScreenLabels.roomClosesLabel}
        imposterRevealLabel={imposterScreenLabels.imposterRevealLabel}
        normalImageLabel={imposterScreenLabels.normalImageLabel}
        imposterImageLabel={imposterScreenLabels.imposterImageLabel}
      />
    )}
  </ScreenShell>
);
