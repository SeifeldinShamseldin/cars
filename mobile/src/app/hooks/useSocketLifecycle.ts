import { useEffect } from "react";

import { socketClient } from "../../shared/api/socket";
import { useAppStore } from "../../shared/store/appStore";
import type { AppStore } from "../../shared/store/types";

type SocketActions = Pick<
  AppStore,
  | "setConnection"
  | "handleRoomCreated"
  | "handleRoomJoined"
  | "handleRoomState"
  | "handleRoomUpdated"
  | "handleGameStarted"
  | "handleRoundStarted"
  | "handleRoundEnded"
  | "handleGameEnded"
  | "handleRoomClosed"
  | "handleError"
>;

export const useSocketLifecycle = ({
  setConnection,
  handleRoomCreated,
  handleRoomJoined,
  handleRoomState,
  handleRoomUpdated,
  handleGameStarted,
  handleRoundStarted,
  handleRoundEnded,
  handleGameEnded,
  handleRoomClosed,
  handleError,
}: SocketActions) => {
  useEffect(() => {
    socketClient.setSyncProvider(() => {
      const currentState = useAppStore.getState();
      if (!currentState.roomCode || !currentState.playerToken || !currentState.roomState) {
        return undefined;
      }

      return {
        roomCode: currentState.roomCode,
        playerToken: currentState.playerToken,
        lastVersion: currentState.roomState.version,
      };
    });

    const cleanup = socketClient.setListeners({
      connect: () => setConnection(true),
      disconnect: () => setConnection(false),
      "room.created": handleRoomCreated,
      "room.joined": handleRoomJoined,
      "room.state": handleRoomState,
      "room.updated": handleRoomUpdated,
      "game.started": handleGameStarted,
      "round.started": handleRoundStarted,
      "round.ended": handleRoundEnded,
      "game.ended": handleGameEnded,
      "room.closed": handleRoomClosed,
      error: handleError,
    });

    socketClient.connect();
    return cleanup;
  }, [
    handleError,
    handleGameEnded,
    handleGameStarted,
    handleRoomClosed,
    handleRoomCreated,
    handleRoomJoined,
    handleRoomState,
    handleRoomUpdated,
    handleRoundEnded,
    handleRoundStarted,
    setConnection,
  ]);
};
