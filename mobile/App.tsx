import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Snackbar, PaperProvider } from "react-native-paper";

import { CarNewsHomeScreen } from "./src/features/carnews/screens/CarNewsHomeScreen";
import type { HubGame } from "./src/features/games/types";
import {
  prefetchCarDetail,
  useFeaturedCars,
} from "./src/shared/hooks/useCarCatalog";
import { GameEntryScreen } from "./src/features/games/games/screens/GameEntryScreen";
import { GamesHubScreen } from "./src/features/games/games/screens/GamesHubScreen";
import { LaunchScreen } from "./src/features/launch/screens/LaunchScreen";
import { NameSetupScreen } from "./src/features/profile/screens/NameSetupScreen";
import { SellCarHomeScreen } from "./src/features/sellcar/screens/SellCarHomeScreen";
import { socketClient } from "./src/shared/api/socket";
import {
  BottomNav,
  type BottomNavTab,
} from "./src/shared/components/BottomNav";
import { ScreenShell } from "./src/shared/components/ScreenShell";
import {
  getStoredProfileName,
  setStoredProfileName,
} from "./src/shared/lib/storage";
import { translate } from "./src/shared/lib/i18n";
import { useAppStore } from "./src/shared/store/appStore";
import { paperTheme } from "./src/shared/theme/paperTheme";
import { ProfileScreen } from "./src/features/profile/screens/ProfileScreen";
import { MountedTabs } from "./src/app/MountedTabs";
import { PreRoomStack } from "./src/app/PreRoomStack";
import { RoomContent } from "./src/app/RoomContent";

type EntryMode = HubGame | null;

export default function App() {
  const {
    featuredCars,
    sellCars,
    isLoading: isFeaturedCarsLoading,
    hasError: hasFeaturedCarsError,
    isRefreshing: isFeaturedCarsRefreshing,
    refresh: refreshFeaturedCars,
  } = useFeaturedCars();
  const [launchPhase, setLaunchPhase] = useState<"visible" | "exiting" | "hidden">("visible");
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDraft, setProfileDraft] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomNavTab>("SELL");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [sellScrollOffset, setSellScrollOffset] = useState(0);
  const [updatesScrollOffset, setUpdatesScrollOffset] = useState(0);
  const [activeMode, setActiveMode] = useState<EntryMode>(null);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [pendingAutoSelectGame, setPendingAutoSelectGame] = useState<
    "GUESS_CAR" | "IMPOSTER" | null
  >(null);
  const {
    roomState,
    roomCode,
    playerToken,
    hostKey,
    roomClosesAt,
    lastError,
    isConnected,
    currentGuessPayload,
    selectedOptionId,
    guessDisabled,
    guessResults,
    currentImposterPayload,
    imposterResults,
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
    dismissError,
    setSelectedOption,
    markGuessSubmitted,
    resetSession,
  } = useAppStore();
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const launchScale = useRef(new Animated.Value(1)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const appTranslateY = useRef(new Animated.Value(18)).current;
  const appScale = useRef(new Animated.Value(0.985)).current;
  const modeOpacity = useRef(new Animated.Value(0)).current;
  const modeTranslateY = useRef(new Animated.Value(18)).current;
  const detailOpacity = useRef(new Animated.Value(0)).current;
  const detailTranslateY = useRef(new Animated.Value(18)).current;
  const showLaunch = launchPhase !== "hidden";
  const isModeDetailScreen =
    !roomState && (activeMode === "GUESS_CAR" || activeMode === "IMPOSTER");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const storedProfileName = await getStoredProfileName();
        if (!isMounted) {
          return;
        }

        if (storedProfileName) {
          setProfileName(storedProfileName);
          setProfileDraft(storedProfileName);
        }
      } finally {
        if (isMounted) {
          setHasLoadedProfile(true);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    if (!roomState) {
      return;
    }

    setActiveMode(null);
    setJoinRoomCode("");
    setSelectedCarId(null);
  }, [roomState]);

  useEffect(() => {
    if (
      !pendingAutoSelectGame ||
      !roomState ||
      !roomCode ||
      !hostKey ||
      roomState.status !== "LOBBY"
    ) {
      return;
    }

    if (roomState.gameType === pendingAutoSelectGame) {
      setPendingAutoSelectGame(null);
      return;
    }

    socketClient.selectGame({
      roomCode,
      hostKey,
      gameType: pendingAutoSelectGame,
    });
    setPendingAutoSelectGame(null);
  }, [hostKey, pendingAutoSelectGame, roomCode, roomState]);

  useEffect(() => {
    if (!isModeDetailScreen) {
      modeOpacity.setValue(0);
      modeTranslateY.setValue(18);
      return;
    }

    Animated.parallel([
      Animated.timing(modeOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modeTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isModeDetailScreen, modeOpacity, modeTranslateY]);

  useEffect(() => {
    if (!selectedCarId) {
      detailOpacity.setValue(0);
      detailTranslateY.setValue(18);
      return;
    }

    Animated.parallel([
      Animated.timing(detailOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(detailTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [detailOpacity, detailTranslateY, selectedCarId]);

  const saveProfileName = async (nextName: string) => {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      return;
    }

    setIsSavingProfile(true);
    try {
      await setStoredProfileName(trimmedName);
      setProfileName(trimmedName);
      setProfileDraft(trimmedName);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const createRoomForGame = (game: "GUESS_CAR" | "IMPOSTER") => {
    if (!profileName.trim()) {
      return;
    }

    setPendingAutoSelectGame(game);
    socketClient.createRoom({ nickname: profileName.trim() });
  };

  const joinRoomForGame = () => {
    if (!profileName.trim() || !joinRoomCode.trim() || !activeMode) {
      return;
    }

    socketClient.joinRoom({
      roomCode: joinRoomCode.trim().toUpperCase(),
      nickname: profileName.trim(),
    });
  };

  const returnToPreviousMode = (gameType: "NONE" | "GUESS_CAR" | "IMPOSTER") => {
    if (gameType === "GUESS_CAR" || gameType === "IMPOSTER") {
      setActiveTab("GAMES");
      setActiveMode(gameType);
      return;
    }

    setActiveTab("GAMES");
    setActiveMode(null);
  };

  const leaveRoomToPreviousMode = (gameType: "NONE" | "GUESS_CAR" | "IMPOSTER") => {
    returnToPreviousMode(gameType);
    if (roomCode && playerToken) {
      socketClient.leaveRoom({ roomCode, playerToken });
    }

    resetSession();
  };

  const openCarDetail = (carId: string) => {
    void prefetchCarDetail(carId);
    setSelectedCarId(carId);
  };

  const closeCarDetail = () => {
    Animated.parallel([
      Animated.timing(detailOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(detailTranslateY, {
        toValue: 18,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedCarId(null);
    });
  };

  const dismissCarDetailAfterSwipe = () => {
    detailOpacity.setValue(0);
    detailTranslateY.setValue(18);
    setSelectedCarId(null);
  };

  const closeModeDetail = () => {
    Animated.parallel([
      Animated.timing(modeOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modeTranslateY, {
        toValue: 18,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveMode(null);
    });
  };

  const dismissModeDetailAfterSwipe = () => {
    modeOpacity.setValue(0);
    modeTranslateY.setValue(18);
    setActiveMode(null);
  };

  const t = (
    key: Parameters<typeof translate>[1],
    params?: Record<string, string | number>,
  ) => translate("en", key, params);
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

  const footer =
    !roomState && profileName && !isModeDetailScreen ? (
      <BottomNav
        activeTab={activeTab}
        sellLabel={t("common.sellCar")}
        updatesLabel={t("common.carUpdates")}
        gamesLabel={t("common.games")}
        profileLabel={t("common.profile")}
        onTabChange={(tab) => {
          if (tab === activeTab) {
            return;
          }

          setActiveTab(tab);
          setActiveMode(null);
          setSelectedCarId(null);
          setJoinRoomCode("");
        }}
      />
    ) : undefined;

  const renderSellHub = () => (
    <SellCarHomeScreen
      featuredCars={featuredCars}
      sellCars={sellCars}
      isLoading={isFeaturedCarsLoading}
      hasError={hasFeaturedCarsError}
      featuredLabel={t("home.featuredLabel")}
      sellLabel={t("home.sellLabel")}
      loadingLabel={t("home.featuredLoading")}
      errorLabel={t("home.featuredError")}
      typeLabel={t("home.typeLabel")}
      topSpeedLabel={t("home.topSpeedLabel")}
      torqueLabel={t("home.torqueLabel")}
      yearLabel={t("home.yearLabel")}
      searchPlaceholder={t("catalog.searchPlaceholder")}
      initialScrollOffset={sellScrollOffset}
      onScrollOffsetChange={setSellScrollOffset}
      isRefreshing={isFeaturedCarsRefreshing}
      onRefresh={refreshFeaturedCars}
      onOpenCar={openCarDetail}
    />
  );

  const renderUpdatesHub = () => (
    <CarNewsHomeScreen
      featuredCars={featuredCars}
      sellCars={sellCars}
      isLoading={isFeaturedCarsLoading}
      hasError={hasFeaturedCarsError}
      featuredLabel={t("home.featuredLabel")}
      sellLabel={t("home.sellLabel")}
      loadingLabel={t("home.featuredLoading")}
      errorLabel={t("home.featuredError")}
      typeLabel={t("home.typeLabel")}
      topSpeedLabel={t("home.topSpeedLabel")}
      torqueLabel={t("home.torqueLabel")}
      yearLabel={t("home.yearLabel")}
      searchPlaceholder={t("catalog.searchPlaceholder")}
      initialScrollOffset={updatesScrollOffset}
      onScrollOffsetChange={setUpdatesScrollOffset}
      isRefreshing={isFeaturedCarsRefreshing}
      onRefresh={refreshFeaturedCars}
      onOpenCar={openCarDetail}
    />
  );

  const renderGamesHub = () => (
    <GamesHubScreen
      title={t("games.title")}
      subtitle={t("games.subtitle")}
      tapToPlayLabel={t("home.tapToPlay")}
      cards={homeCards}
      onOpenGame={(game) => {
        setSelectedCarId(null);
        setActiveMode(game);
      }}
    />
  );

  const renderModeDetailContent = () => {
    if (activeMode === "GUESS_CAR" || activeMode === "IMPOSTER") {
      const isGuess = activeMode === "GUESS_CAR";

      return (
        <GameEntryScreen
          eyebrow={t(isGuess ? "entry.guessEyebrow" : "entry.imposterEyebrow")}
          title={t(isGuess ? "home.carGuess" : "home.imposter")}
          note={t(isGuess ? "entry.guessNote" : "entry.imposterNote")}
          createNewRoomLabel={t("entry.createNewRoom")}
          joinExistingRoomLabel={t("entry.joinExistingRoom")}
          roomCodeLabel={t("common.roomCode")}
          joinHelper={t("entry.joinHelper")}
          createLabel={t("common.createRoom")}
          joinLabel={t("common.joinRoom")}
          backLabel={t("common.back")}
          roomCode={joinRoomCode}
          onChangeRoomCode={setJoinRoomCode}
          onBack={closeModeDetail}
          onCreate={() => createRoomForGame(activeMode)}
          onJoin={joinRoomForGame}
        />
      );
    }

    return null;
  };

  const renderProfileContent = () => (
    <ProfileScreen
      eyebrow={t("profile.eyebrow")}
      subtitle={t("profile.subtitle")}
      updateNameLabel={t("profile.updateName")}
      playerNameLabel={t("common.playerName")}
      helper={t("profile.helper")}
      saveNameLabel={t("profile.saveName")}
      currentName={profileName}
      draftName={profileDraft}
      isSaving={isSavingProfile}
      onChangeDraft={setProfileDraft}
      onSave={() => {
        void saveProfileName(profileDraft);
      }}
    />
  );

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style={showLaunch ? "light" : "dark"} />
        <View style={styles.root}>
          <Animated.View
            style={[
              styles.appLayer,
              {
                opacity: appOpacity,
                transform: [{ translateY: appTranslateY }, { scale: appScale }],
              },
            ]}
          >
            {!roomState ? (
              !hasLoadedProfile ? null : !profileName ? (
                <ScreenShell scrollEnabled={false}>
                  <NameSetupScreen
                    eyebrow={t("setup.eyebrow")}
                    title={t("setup.title")}
                    subtitle={t("setup.subtitle")}
                    nameLabel={t("setup.nameLabel")}
                    helper={t("setup.helper")}
                    continueLabel={t("common.continue")}
                    value={profileDraft}
                    isSaving={isSavingProfile}
                    onChange={setProfileDraft}
                    onSubmit={() => {
                      void saveProfileName(profileDraft);
                    }}
                  />
                </ScreenShell>
              ) : (
                <PreRoomStack
                  footer={footer}
                  mountedTabs={
                    <MountedTabs
                      activeTab={activeTab}
                      sellTab={renderSellHub()}
                      updatesTab={renderUpdatesHub()}
                      gamesTab={renderGamesHub()}
                      profileTab={renderProfileContent()}
                    />
                  }
                  modeDetail={renderModeDetailContent()}
                  showModeDetail={isModeDetailScreen}
                  selectedCarId={selectedCarId}
                  modeOpacity={modeOpacity}
                  modeTranslateY={modeTranslateY}
                  detailOpacity={detailOpacity}
                  detailTranslateY={detailTranslateY}
                  onDismissModeSwipe={dismissModeDetailAfterSwipe}
                  onDismissCarSwipe={dismissCarDetailAfterSwipe}
                  onCloseCar={closeCarDetail}
                  backLabel={t("common.back")}
                  typeLabel={t("home.typeLabel")}
                  topSpeedLabel={t("home.topSpeedLabel")}
                  torqueLabel={t("home.torqueLabel")}
                  yearLabel={t("home.yearLabel")}
                />
              )
            ) : (
              <RoomContent
                roomState={roomState}
                footer={footer}
                isModeDetailScreen={isModeDetailScreen}
                isHost={Boolean(hostKey)}
                hostKey={hostKey}
                roomCode={roomCode}
                playerToken={playerToken}
                roomClosesAt={roomClosesAt}
                currentGuessPayload={currentGuessPayload}
                selectedOptionId={selectedOptionId}
                guessDisabled={guessDisabled}
                guessResults={guessResults}
                currentImposterPayload={currentImposterPayload}
                imposterResults={imposterResults}
                eyebrow={t("lobby.eyebrow", { code: roomState.roomCode })}
                title={t("lobby.title")}
                subtitle={t("lobby.subtitle", { count: roomState.players.length })}
                playersLabel={t("lobby.players")}
                hostLabel={t("lobby.host")}
                hostControlsLabel={t("lobby.hostControls")}
                waitingHostLabel={t("lobby.waitingHost")}
                guessLabel={t("home.carGuess")}
                imposterLabel={t("home.imposter")}
                startRoundsLabel={t("lobby.startRounds")}
                waitingText={t(
                  roomState.gameType === "GUESS_CAR"
                    ? "lobby.hostSelectedGuess"
                    : roomState.gameType === "IMPOSTER"
                      ? "lobby.hostSelectedImposter"
                      : "lobby.hostNotSelected",
                )}
                leaveRoomLabel={t("lobby.leaveRoom")}
                onLeaveRoom={() => {
                  leaveRoomToPreviousMode(roomState.gameType);
                }}
                guessScreenLabels={{
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
                }}
                imposterScreenLabels={{
                  eyebrow: t("imposter.eyebrow"),
                  roundTitle: t("imposter.roundTitle", { round: roomState.round }),
                  waitingLabel: t("imposter.waiting"),
                  timeLeftLabel: t("timer.timeLeft"),
                  roomClosesLabel: t("timer.roomCloses"),
                  imposterRevealLabel: t("imposter.wasImposter"),
                  normalImageLabel: t("imposter.normalImage"),
                  imposterImageLabel: t("imposter.imposterImage"),
                }}
                onSelectOption={setSelectedOption}
                onMarkGuessSubmitted={markGuessSubmitted}
              />
            )}
          </Animated.View>

          {showLaunch ? (
            <Animated.View
              pointerEvents={launchPhase === "visible" ? "auto" : "none"}
              style={[
                styles.launchLayer,
                {
                  opacity: launchOpacity,
                  transform: [{ scale: launchScale }],
                },
              ]}
            >
              <LaunchScreen
                headline={t("launch.headline")}
                shadow={t("launch.shadow")}
                metaLabel={t("launch.metaLabel")}
                metaValue={t("launch.metaValue")}
                continueLabel={t("common.continue")}
                onContinue={() => {
                  if (launchPhase !== "visible") {
                    return;
                  }

                  setLaunchPhase("exiting");
                  Animated.parallel([
                    Animated.timing(launchOpacity, {
                      toValue: 0,
                      duration: 320,
                      easing: Easing.out(Easing.cubic),
                      useNativeDriver: true,
                    }),
                    Animated.timing(launchScale, {
                      toValue: 1.06,
                      duration: 320,
                      easing: Easing.out(Easing.cubic),
                      useNativeDriver: true,
                    }),
                    Animated.timing(appOpacity, {
                      toValue: 1,
                      duration: 360,
                      easing: Easing.out(Easing.cubic),
                      useNativeDriver: true,
                    }),
                    Animated.timing(appTranslateY, {
                      toValue: 0,
                      duration: 360,
                      easing: Easing.out(Easing.cubic),
                      useNativeDriver: true,
                    }),
                    Animated.timing(appScale, {
                      toValue: 1,
                      duration: 360,
                      easing: Easing.out(Easing.cubic),
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    setLaunchPhase("hidden");
                  });
                }}
              />
            </Animated.View>
          ) : null}
        </View>
        <Snackbar visible={Boolean(lastError)} onDismiss={dismissError} duration={3000}>
          {lastError?.message}
        </Snackbar>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  appLayer: {
    flex: 1,
  },
  launchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
