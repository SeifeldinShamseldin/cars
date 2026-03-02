import type { RoomStatePublic } from "../../../shared/types/domain";
import { translate } from "../../shared/lib/i18n";

type UseAppScreenPropsParams = {
  profileName?: string;
  profileDraft: string;
  isSavingProfile: boolean;
  sellScrollOffset: number;
  updatesScrollOffset: number;
  isFeaturedCarsRefreshing: boolean;
  activeMode: "GUESS_CAR" | "IMPOSTER" | null;
  roomState?: RoomStatePublic;
  setProfileDraft: (value: string) => void;
  saveProfileName: (value: string) => Promise<void>;
  setSellScrollOffset: (offset: number) => void;
  setUpdatesScrollOffset: (offset: number) => void;
  setJoinRoomCode: (code: string) => void;
  createRoomForGame: (game: "GUESS_CAR" | "IMPOSTER") => void;
  joinRoomForGame: () => void;
  closeModeDetail: () => void;
  openCarDetail: (carId: string) => void;
  refreshFeaturedCars: () => Promise<boolean>;
};

export const useAppScreenProps = ({
  profileName,
  profileDraft,
  isSavingProfile,
  sellScrollOffset,
  updatesScrollOffset,
  isFeaturedCarsRefreshing,
  activeMode,
  roomState,
  setProfileDraft,
  saveProfileName,
  setSellScrollOffset,
  setUpdatesScrollOffset,
  setJoinRoomCode,
  createRoomForGame,
  joinRoomForGame,
  closeModeDetail,
  openCarDetail,
  refreshFeaturedCars,
}: UseAppScreenPropsParams) => {
  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate("en", key, params);

  const catalogProps = {
    featuredLabel: t("home.featuredLabel"),
    sellLabel: t("home.sellLabel"),
    loadingLabel: t("home.featuredLoading"),
    errorLabel: t("home.featuredError"),
    typeLabel: t("home.typeLabel"),
    topSpeedLabel: t("home.topSpeedLabel"),
    torqueLabel: t("home.torqueLabel"),
    yearLabel: t("home.yearLabel"),
    searchPlaceholder: t("catalog.searchPlaceholder"),
    isRefreshing: isFeaturedCarsRefreshing,
    onRefresh: refreshFeaturedCars,
    onOpenCar: openCarDetail,
  };

  const homeCards = [
    {
      id: "GUESS_CAR" as const,
      title: t("home.carGuess"),
      description: t("home.carGuessDescription"),
    },
    {
      id: "IMPOSTER" as const,
      title: t("home.imposter"),
      description: t("home.imposterDescription"),
    },
  ];

  return {
    t,
    navLabels: {
      sellLabel: t("common.sellCar"),
      updatesLabel: t("common.carUpdates"),
      gamesLabel: t("common.games"),
      profileLabel: t("common.profile"),
    },
    sellScreenProps: {
      ...catalogProps,
      quickSearchTitle: t("catalog.quickSearch"),
      brandLabel: t("catalog.carBrand"),
      modelLabel: t("catalog.carModel"),
      carTypeLabel: t("catalog.carType"),
      priceLabel: t("catalog.price"),
      priceFromLabel: t("catalog.priceMin"),
      priceToLabel: t("catalog.priceMax"),
      yearFilterLabel: t("catalog.year"),
      yearFromLabel: t("catalog.from"),
      yearToLabel: t("catalog.to"),
      mileageLabel: t("catalog.mileage"),
      mileageFromLabel: t("catalog.kmFrom"),
      mileageToLabel: t("catalog.kmTo"),
      conditionLabel: t("catalog.condition"),
      transmissionLabel: t("catalog.transmission"),
      fuelTypeLabel: t("catalog.fuelType"),
      clearAllLabel: t("catalog.clearAll"),
      offersLabel: t("catalog.offers"),
      chooseBrandFirstLabel: t("catalog.chooseBrandFirst"),
      noModelsLabel: t("catalog.noModelsFound"),
      initialScrollOffset: sellScrollOffset,
      onScrollOffsetChange: setSellScrollOffset,
    },
    updatesScreenProps: {
      ...catalogProps,
      initialScrollOffset: updatesScrollOffset,
      onScrollOffsetChange: setUpdatesScrollOffset,
    },
    gamesHubProps: {
      title: t("games.title"),
      subtitle: t("games.subtitle"),
      tapToPlayLabel: t("home.tapToPlay"),
      cards: homeCards,
    },
    launchProps: {
      headline: t("launch.headline"),
      shadow: t("launch.shadow"),
      metaLabel: t("launch.metaLabel"),
      metaValue: t("launch.metaValue"),
      continueLabel: t("common.continue"),
    },
    nameSetupProps: {
      eyebrow: t("setup.eyebrow"),
      title: t("setup.title"),
      subtitle: t("setup.subtitle"),
      nameLabel: t("setup.nameLabel"),
      helper: t("setup.helper"),
      continueLabel: t("common.continue"),
      value: profileDraft,
      isSaving: isSavingProfile,
      onChange: setProfileDraft,
      onSubmit: () => {
        void saveProfileName(profileDraft);
      },
    },
    profileProps: {
      eyebrow: t("profile.eyebrow"),
      subtitle: t("profile.subtitle"),
      updateNameLabel: t("profile.updateName"),
      playerNameLabel: t("common.playerName"),
      helper: t("profile.helper"),
      saveNameLabel: t("profile.saveName"),
      currentName: profileName ?? "",
      draftName: profileDraft,
      isSaving: isSavingProfile,
      onChangeDraft: setProfileDraft,
      onSave: () => {
        void saveProfileName(profileDraft);
      },
    },
    getModeEntryProps: (roomCode: string) => {
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
        roomCode,
        onChangeRoomCode: setJoinRoomCode,
        onBack: closeModeDetail,
        onCreate: () => createRoomForGame(activeMode),
        onJoin: joinRoomForGame,
      };
    },
    getRoomLabels: () => {
      if (!roomState) {
        return null;
      }

      return {
        eyebrow: t("lobby.eyebrow", { code: roomState.roomCode }),
        title: t("lobby.title"),
        subtitle: t("lobby.subtitle", { count: roomState.players.length }),
        playersLabel: t("lobby.players"),
        hostLabel: t("lobby.host"),
        hostControlsLabel: t("lobby.hostControls"),
        waitingHostLabel: t("lobby.waitingHost"),
        guessLabel: t("home.carGuess"),
        imposterLabel: t("home.imposter"),
        startRoundsLabel: t("lobby.startRounds"),
        waitingText: t(
          roomState.gameType === "GUESS_CAR"
            ? "lobby.hostSelectedGuess"
            : roomState.gameType === "IMPOSTER"
              ? "lobby.hostSelectedImposter"
              : "lobby.hostNotSelected",
        ),
        leaveRoomLabel: t("lobby.leaveRoom"),
        guessScreenLabels: {
          eyebrow: t("guess.eyebrow"),
          roundTitle: t("guess.roundTitle", { round: roomState.round }),
          chooseOptionLabel: t("guess.chooseOption"),
          submittedLabel: t("guess.submitted"),
          waitingLabel: t("guess.waiting"),
          timeLeftLabel: t("timer.timeLeft"),
          roomClosesLabel: t("timer.roomCloses"),
          winnerLabel: t("guess.winner"),
          noWinnerLabel: t("guess.noWinner"),
          correctOptionLabel: t("guess.correctOption"),
          answeredPlayersLabel: t("guess.answeredPlayers"),
          leaderboardLabel: t("guess.leaderboard"),
          roundPointsLabel: t("guess.roundPoints"),
          totalPointsLabel: t("guess.totalPoints"),
          countryLabel: t("guess.country"),
          ccLabel: t("guess.cc"),
          hpLabel: t("guess.hp"),
          torqueLabel: t("guess.torque"),
          specialLabel: t("guess.special"),
          noSpecialLabel: t("guess.noSpecial"),
        },
        imposterScreenLabels: {
          eyebrow: t("imposter.eyebrow"),
          roundTitle: t("imposter.roundTitle", { round: roomState.round }),
          waitingLabel: t("imposter.waiting"),
          timeLeftLabel: t("timer.timeLeft"),
          roomClosesLabel: t("timer.roomCloses"),
          imposterRevealLabel: t("imposter.wasImposter"),
          normalImageLabel: t("imposter.normalImage"),
          imposterImageLabel: t("imposter.imposterImage"),
        },
      };
    },
  };
};
