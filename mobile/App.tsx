import { StatusBar } from "expo-status-bar";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Snackbar, PaperProvider } from "react-native-paper";

import { CarNewsHomeScreen } from "./src/features/carnews/screens/CarNewsHomeScreen";
import { useFeaturedCars } from "./src/shared/hooks/useCarCatalog";
import { GameEntryScreen } from "./src/features/games/games/screens/GameEntryScreen";
import { GamesHubScreen } from "./src/features/games/games/screens/GamesHubScreen";
import { LaunchScreen } from "./src/features/launch/screens/LaunchScreen";
import { NameSetupScreen } from "./src/features/profile/screens/NameSetupScreen";
import { SellCarHomeScreen } from "./src/features/sellcar/screens/SellCarHomeScreen";
import { socketClient } from "./src/shared/api/socket";
import { BottomNav } from "./src/shared/components/BottomNav";
import { ScreenShell } from "./src/shared/components/ScreenShell";
import { translate } from "./src/shared/lib/i18n";
import { paperTheme } from "./src/shared/theme/paperTheme";
import { ProfileScreen } from "./src/features/profile/screens/ProfileScreen";
import { MountedTabs } from "./src/app/MountedTabs";
import { PreRoomStack } from "./src/app/PreRoomStack";
import { RoomContent } from "./src/app/RoomContent";
import { useLaunchTransition } from "./src/app/hooks/useLaunchTransition";
import { useOverlayTransition } from "./src/app/hooks/useOverlayTransition";
import { useProfileState } from "./src/app/hooks/useProfileState";
import { useSocketLifecycle } from "./src/app/hooks/useSocketLifecycle";
import { useRoomActions, useRoomStore } from "./src/shared/store/selectors";
import { usePreRoomFlow } from "./src/app/hooks/usePreRoomFlow";

export default function App() {
  const {
    featuredCars,
    sellCars,
    isLoading: isFeaturedCarsLoading,
    hasError: hasFeaturedCarsError,
    isRefreshing: isFeaturedCarsRefreshing,
    refresh: refreshFeaturedCars,
  } = useFeaturedCars();
  const {
    launchPhase,
    showLaunch,
    launchOpacity,
    launchScale,
    appOpacity,
    appTranslateY,
    appScale,
    continueFromLaunch,
  } = useLaunchTransition();
  const {
    hasLoadedProfile,
    profileName,
    profileDraft,
    isSavingProfile,
    setProfileDraft,
    saveProfileName,
  } = useProfileState();
  const {
    roomState,
    roomCode,
    playerToken,
    hostKey,
    roomClosesAt,
    lastError,
    currentGuessPayload,
    selectedOptionId,
    guessDisabled,
    guessResults,
    currentImposterPayload,
    imposterResults,
  } = useRoomStore();
  const {
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
  } = useRoomActions();
  const {
    activeTab,
    setActiveTab,
    selectedCarId,
    setSelectedCarId,
    sellScrollOffset,
    setSellScrollOffset,
    updatesScrollOffset,
    setUpdatesScrollOffset,
    activeMode,
    setActiveMode,
    joinRoomCode,
    setJoinRoomCode,
    isModeDetailScreen,
    createRoomForGame,
    joinRoomForGame,
    leaveRoomToPreviousMode,
    openCarDetail,
  } = usePreRoomFlow({
    profileName,
    roomState,
    roomCode,
    playerToken,
    hostKey,
    resetSession,
  });
  const modeTransition = useOverlayTransition(isModeDetailScreen);
  const detailTransition = useOverlayTransition(Boolean(selectedCarId));

  useSocketLifecycle({
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
  });

  const closeCarDetail = () => {
    detailTransition.close(() => {
      setSelectedCarId(null);
    });
  };

  const dismissCarDetailAfterSwipe = () => {
    detailTransition.dismiss(() => {
      setSelectedCarId(null);
    });
  };

  const closeModeDetail = () => {
    modeTransition.close(() => {
      setActiveMode(null);
    });
  };

  const dismissModeDetailAfterSwipe = () => {
    modeTransition.dismiss(() => {
      setActiveMode(null);
    });
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
        onTabChange={setActiveTab}
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
                  modeOpacity={modeTransition.opacity}
                  modeTranslateY={modeTransition.translateY}
                  detailOpacity={detailTransition.opacity}
                  detailTranslateY={detailTransition.translateY}
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
                onContinue={continueFromLaunch}
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
