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
import { paperTheme } from "./src/shared/theme/paperTheme";
import { ProfileScreen } from "./src/features/profile/screens/ProfileScreen";
import { MountedTabs } from "./src/app/MountedTabs";
import { PreRoomStack } from "./src/app/PreRoomStack";
import { RoomContent } from "./src/app/RoomContent";
import { useAppScreenProps } from "./src/app/hooks/useAppScreenProps";
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
  const screenProps = useAppScreenProps({
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
    closeModeDetail: () => {
      modeTransition.close(() => {
        setActiveMode(null);
      });
    },
    openCarDetail,
    refreshFeaturedCars,
  });

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

  const dismissModeDetailAfterSwipe = () => {
    modeTransition.dismiss(() => {
      setActiveMode(null);
    });
  };
  const roomLabels = roomState ? screenProps.getRoomLabels() : null;
  const modeEntryProps = screenProps.getModeEntryProps(joinRoomCode);

  const footer =
    !roomState && profileName && !isModeDetailScreen ? (
      <BottomNav
        activeTab={activeTab}
        sellLabel={screenProps.navLabels.sellLabel}
        updatesLabel={screenProps.navLabels.updatesLabel}
        gamesLabel={screenProps.navLabels.gamesLabel}
        profileLabel={screenProps.navLabels.profileLabel}
        onTabChange={setActiveTab}
      />
    ) : undefined;

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
                  <NameSetupScreen {...screenProps.nameSetupProps} />
                </ScreenShell>
              ) : (
                <PreRoomStack
                  footer={footer}
                  mountedTabs={
                    <MountedTabs
                      activeTab={activeTab}
                      sellTab={
                        <SellCarHomeScreen
                          featuredCars={featuredCars}
                          sellCars={sellCars}
                          isLoading={isFeaturedCarsLoading}
                          hasError={hasFeaturedCarsError}
                          {...screenProps.sellScreenProps}
                        />
                      }
                      updatesTab={
                        <CarNewsHomeScreen
                          featuredCars={featuredCars}
                          sellCars={sellCars}
                          isLoading={isFeaturedCarsLoading}
                          hasError={hasFeaturedCarsError}
                          {...screenProps.updatesScreenProps}
                        />
                      }
                      gamesTab={
                        <GamesHubScreen
                          {...screenProps.gamesHubProps}
                          onOpenGame={(game) => {
                            setSelectedCarId(null);
                            setActiveMode(game);
                          }}
                        />
                      }
                      profileTab={<ProfileScreen {...screenProps.profileProps} />}
                    />
                  }
                  modeDetail={
                    modeEntryProps ? <GameEntryScreen {...modeEntryProps} /> : null
                  }
                  showModeDetail={isModeDetailScreen}
                  selectedCarId={selectedCarId}
                  modeOpacity={modeTransition.opacity}
                  modeTranslateY={modeTransition.translateY}
                  detailOpacity={detailTransition.opacity}
                  detailTranslateY={detailTransition.translateY}
                  onDismissModeSwipe={dismissModeDetailAfterSwipe}
                  onDismissCarSwipe={dismissCarDetailAfterSwipe}
                  onCloseCar={closeCarDetail}
                  backLabel={screenProps.t("common.back")}
                  typeLabel={screenProps.t("home.typeLabel")}
                  topSpeedLabel={screenProps.t("home.topSpeedLabel")}
                  torqueLabel={screenProps.t("home.torqueLabel")}
                  yearLabel={screenProps.t("home.yearLabel")}
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
                eyebrow={roomLabels?.eyebrow ?? ""}
                title={roomLabels?.title ?? ""}
                subtitle={roomLabels?.subtitle ?? ""}
                playersLabel={roomLabels?.playersLabel ?? ""}
                hostLabel={roomLabels?.hostLabel ?? ""}
                hostControlsLabel={roomLabels?.hostControlsLabel ?? ""}
                waitingHostLabel={roomLabels?.waitingHostLabel ?? ""}
                guessLabel={roomLabels?.guessLabel ?? ""}
                imposterLabel={roomLabels?.imposterLabel ?? ""}
                startRoundsLabel={roomLabels?.startRoundsLabel ?? ""}
                waitingText={roomLabels?.waitingText ?? ""}
                leaveRoomLabel={roomLabels?.leaveRoomLabel ?? ""}
                onLeaveRoom={() => {
                  leaveRoomToPreviousMode(roomState.gameType);
                }}
                guessScreenLabels={roomLabels!.guessScreenLabels}
                imposterScreenLabels={roomLabels!.imposterScreenLabels}
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
                {...screenProps.launchProps}
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
