import { useEffect } from "react";

import { socketClient } from "../api/socket";
import { useCatalogStore } from "../store/catalogStore";
import { useAppStore } from "../store/appStore";
import type { AppStore } from "../store/types";

type SocketActions = Pick<
  AppStore,
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
  onRoomClosed,
}: SocketActions & { onRoomClosed?: () => void }) => {
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

    const handleClosed = () => {
      handleRoomClosed();
      onRoomClosed?.();
    };

    const cleanup = socketClient.setListeners({
      "room.created": handleRoomCreated,
      "room.joined": handleRoomJoined,
      "room.state": handleRoomState,
      "room.updated": handleRoomUpdated,
      "game.started": handleGameStarted,
      "round.started": handleRoundStarted,
      "round.ended": handleRoundEnded,
      "game.ended": handleGameEnded,
      "room.closed": handleClosed,
      "catalog.refresh": () => {
        void useCatalogStore.getState().ensureHomeCatalog(true);
      },
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
    onRoomClosed,
  ]);
};
