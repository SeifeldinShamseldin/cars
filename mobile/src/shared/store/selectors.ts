import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "./appStore";

export const useRoomStore = () =>
  useAppStore(
    useShallow((state) => ({
      roomState: state.roomState,
      roomCode: state.roomCode,
      playerToken: state.playerToken,
      hostKey: state.hostKey,
      roomClosesAt: state.roomClosesAt,
      lastError: state.lastError,
      currentGuessPayload: state.currentGuessPayload,
      selectedOptionId: state.selectedOptionId,
      guessDisabled: state.guessDisabled,
      guessResults: state.guessResults,
      currentImposterPayload: state.currentImposterPayload,
      imposterResults: state.imposterResults,
    })),
  );

export const useRoomActions = () =>
  useAppStore(
    useShallow((state) => ({
      handleRoomCreated: state.handleRoomCreated,
      handleRoomJoined: state.handleRoomJoined,
      handleRoomState: state.handleRoomState,
      handleRoomUpdated: state.handleRoomUpdated,
      handleGameStarted: state.handleGameStarted,
      handleRoundStarted: state.handleRoundStarted,
      handleRoundEnded: state.handleRoundEnded,
      handleGameEnded: state.handleGameEnded,
      handleRoomClosed: state.handleRoomClosed,
      handleError: state.handleError,
      dismissError: state.dismissError,
      setSelectedOption: state.setSelectedOption,
      markGuessSubmitted: state.markGuessSubmitted,
      resetSession: state.resetSession,
    })),
  );

export const useSellerAccessState = () =>
  useAppStore(
    useShallow((state) => ({
      sellerAccessToken: state.sellerAccessToken,
      sellerAccessRefreshToken: state.sellerAccessRefreshToken,
      sellerAccessPhone: state.sellerAccessPhone,
      hasSellerProfile: state.hasSellerProfile,
      sellerProfile: state.sellerProfile,
    })),
  );

export const useSellerAccessActions = () =>
  useAppStore(
    useShallow((state) => ({
      setSellerAccessSession: state.setSellerAccessSession,
      clearSellerAccessSession: state.clearSellerAccessSession,
      setSellerProfile: state.setSellerProfile,
    })),
  );
