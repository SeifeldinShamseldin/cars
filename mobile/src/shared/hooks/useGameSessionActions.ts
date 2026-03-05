import { useCallback } from "react";

import type { RoomStatePublic } from "../../../shared/types/domain";
import { socketClient } from "../api/socket";

export const useGameSessionActions = ({
  roomCode,
  hostKey,
  playerToken,
  roomState,
  guessDisabled,
  markGuessSubmitted,
}: {
  roomCode?: string;
  hostKey?: string;
  playerToken?: string;
  roomState?: RoomStatePublic;
  guessDisabled: boolean;
  markGuessSubmitted: () => void;
}) => {
  const startGame = useCallback(() => {
    if (!roomCode || !hostKey) {
      return;
    }

    socketClient.startGame({ roomCode, hostKey });
  }, [hostKey, roomCode]);

  const submitGuess = useCallback(
    (optionId: string) => {
      if (!roomCode || !playerToken || !roomState || guessDisabled) {
        return;
      }

      socketClient.submitGuess({
        roomCode,
        playerToken,
        round: roomState.round,
        optionId,
        clientTime: Date.now(),
      });
      markGuessSubmitted();
    },
    [guessDisabled, markGuessSubmitted, playerToken, roomCode, roomState],
  );

  return {
    startGame,
    submitGuess,
  };
};
