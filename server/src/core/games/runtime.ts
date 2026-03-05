import type { GameService } from "./gameService";

let activeGameService: GameService | undefined;

export const setActiveGameService = (gameService: GameService): void => {
  activeGameService = gameService;
};

export const getActiveGameService = (): GameService | undefined => activeGameService;
