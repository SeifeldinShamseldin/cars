import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Animated, Linking, StyleSheet, View } from "react-native";
import { Snackbar, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CarNewsHomeScreen } from "./src/features/carnews/screens/CarNewsHomeScreen";
import {
  type CarDetailAction,
  CarDetailScreen,
  type CarDetailInfoItem,
} from "./src/features/catalog/components/CarDetailScreen";
import { GamesHubScreen } from "./src/features/games/games/screens/GamesHubScreen";
import { LaunchScreen } from "./src/features/launch/screens/LaunchScreen";
import { NameSetupScreen } from "./src/features/profile/screens/NameSetupScreen";
import { SellerAccessChoiceScreen } from "./src/features/profile/screens/SellerAccessChoiceScreen";
import { SellerPinSignInScreen } from "./src/features/profile/screens/SellerPinSignInScreen";
import { ProfileScreen } from "./src/features/profile/screens/ProfileScreen";
import { SellerAccessScreen } from "./src/features/profile/screens/SellerAccessScreen";
import { SellerSignupScreen } from "./src/features/profile/screens/SellerSignupScreen";
import { SellCarHomeScreen } from "./src/features/sellcar/screens/SellCarHomeScreen";
import { BottomNav } from "./src/shared/components/BottomNav";
import { OverlayScreen } from "./src/shared/components/OverlayScreen";
import { ScreenShell } from "./src/shared/components/ScreenShell";
import { isSellCar } from "./src/shared/api/catalog";
import { useCarDetail, useFeaturedCars } from "./src/shared/hooks/useCarCatalog";
import { useActiveOverlay } from "./src/shared/hooks/useActiveOverlay";
import { useGameSessionActions } from "./src/shared/hooks/useGameSessionActions";
import { useGameSessionOverlays } from "./src/shared/hooks/useGameSessionOverlays";
import { useLaunchTransition } from "./src/shared/hooks/useLaunchTransition";
import { useOverlayTransition } from "./src/shared/hooks/useOverlayTransition";
import { useCarDetailFlow } from "./src/shared/hooks/useCarDetailFlow";
import { usePreRoomFlow } from "./src/shared/hooks/usePreRoomFlow";
import { useProfileState } from "./src/shared/hooks/useProfileState";
import { useSellerAccessFlow } from "./src/shared/hooks/useSellerAccessFlow";
import { useSellerListingFlow } from "./src/shared/hooks/useSellerListingFlow";
import { useSellerListingOverlays } from "./src/shared/hooks/useSellerListingOverlays";
import { useSocketLifecycle } from "./src/shared/hooks/useSocketLifecycle";
import { useTabFlow } from "./src/shared/hooks/useTabFlow";
import { useSellCatalogFeed } from "./src/shared/hooks/useCarsCatalogFeed";
import {
  formatCatalogDate,
  formatCatalogEnumLabel,
  formatCatalogPrice,
} from "./src/shared/lib/catalogPresentation";
import { translate } from "./src/shared/lib/i18n";
import {
  useRoomActions,
  useRoomStore,
  useSellerAccessState,
} from "./src/shared/store/selectors";
import { paperTheme } from "./src/shared/theme/paperTheme";

const t = (
  key: Parameters<typeof translate>[1],
  params?: Record<string, string | number>,
) => translate("en", key, params);

export default function App() {
  const {
    activeTab,
    setActiveTab,
    sellScrollOffset,
    setSellScrollOffset,
    updatesScrollOffset,
    setUpdatesScrollOffset,
  } = useTabFlow();
  const { selectedCarId, setSelectedCarId, openCarDetail } = useCarDetailFlow();
  const {
    featuredCars,
    sellCars,
    isLoading: isFeaturedCarsLoading,
    hasError: hasFeaturedCarsError,
  } = useFeaturedCars({
    shouldRefreshWhenVisible: activeTab === "SELL" || activeTab === "UPDATES",
  });
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
    activeStep: sellerAccessStep,
    isRestoringSession,
    hasSellerAccess,
    hasSellerProfile,
    profileStateLabel,
    openSellerFlow,
    closeSellerFlow,
    choiceScreenProps,
    signInScreenProps,
    accessScreenProps,
    signupScreenProps,
  } = useSellerAccessFlow({
    labels: {
      accessTitle: t("profile.sellerAccessTitle"),
      accessSubtitle: t("profile.sellerAccessSubtitle"),
      choiceTitle: t("profile.sellerChoiceTitle"),
      choiceSubtitle: t("profile.sellerChoiceSubtitle"),
      signInLabel: t("profile.sellerSignIn"),
      signUpLabel: t("profile.sellerSignUp"),
      signInTitle: t("profile.sellerPinSignInTitle"),
      signInSubtitle: t("profile.sellerPinSignInSubtitle"),
      signInHelper: t("profile.sellerPinSignInHelper"),
      signInPinLabel: t("profile.pinLabel"),
      accessPhoneLabel: t("profile.phoneLabel"),
      accessCodeLabel: t("profile.accessCodeLabel"),
      accessHelper: t("profile.sellerAccessHelper"),
      accessVerifyLabel: t("profile.verifyAccess"),
      signupTitle: t("profile.sellerSignupTitle"),
      signupSubtitle: t("profile.sellerSignupSubtitle"),
      signupNameLabel: t("profile.sellerNameLabel"),
      signupPhoneLabel: t("profile.phoneLabel"),
      signupPinLabel: t("profile.pinLabel"),
      signupConfirmPinLabel: t("profile.confirmPinLabel"),
      signupSellerTypeLabel: t("profile.sellerType"),
      signupOwnerLabel: t("profile.owner"),
      signupDealerLabel: t("profile.dealer"),
      signupSaveLabel: t("profile.saveSellerProfile"),
      backLabel: t("common.back"),
      requiredFieldsError: t("profile.requiredFieldsError"),
      pinMismatchError: t("profile.pinMismatchError"),
      missingAccessTokenError: t("profile.missingSellerAccess"),
      unavailableError: t("profile.sellerUnavailable"),
    },
  });
  const { sellerProfile } = useSellerAccessState();
  const {
    layerStack: sellerListingStack,
    isLoggingOut: isSellerLoggingOut,
    openSellerAccount,
    openSellerPostCar,
    openSellerHistory,
    warmSellerHistory,
    accountScreenProps,
    historyScreenProps,
    postCarScreenProps,
  } = useSellerListingFlow({
    labels: {
      accountTitle: t("profile.sellerAccountTitle"),
      accountSubtitle: t("profile.sellerAccountSubtitle"),
      sellerNameLabel: t("profile.sellerNameLabel"),
      phoneLabel: t("profile.phoneLabel"),
      sellerTypeLabel: t("profile.sellerType"),
      logoutLabel: t("profile.logout"),
      logoutConfirmTitle: t("profile.logoutConfirmTitle"),
      logoutConfirmMessage: t("profile.logoutConfirmMessage"),
      logoutConfirmAction: t("profile.logoutConfirmAction"),
      logoutCancelAction: t("profile.logoutCancelAction"),
      postSuccessLabel: t("profile.postCarSuccess"),
      editSuccessLabel: t("profile.editCarSuccess"),
      historyTitle: t("profile.historyTitle"),
      historySubtitle: t("profile.historySubtitle"),
      historyLabel: t("profile.history"),
      historyLoadingLabel: t("profile.historyLoading"),
      historyErrorLabel: t("profile.historyError"),
      historyEmptyLabel: t("profile.historyEmpty"),
      historyLoadingMoreLabel: t("profile.historyLoadMore"),
      historyEditLabel: t("profile.historyEdit"),
      historyDeleteLabel: t("profile.historyDelete"),
      historyRequestFeatureLabel: t("profile.historyRequestFeature"),
      historyFeatureRequestPendingLabel: t("profile.historyFeaturePending"),
      historyFeatureRequestRejectedLabel: t("profile.historyFeatureRejected"),
      historyFeaturedLiveLabel: t("profile.historyFeaturedLive"),
      historyShownLabel: t("profile.historyShown"),
      historyHiddenLabel: t("profile.historyHidden"),
      historyPendingLabel: t("profile.historyPending"),
      historyDeleteConfirmTitle: t("profile.historyDeleteConfirmTitle"),
      historyDeleteConfirmMessage: t("profile.historyDeleteConfirmMessage"),
      historyDeleteConfirmAction: t("profile.historyDeleteConfirmAction"),
      historyDeleteCancelAction: t("profile.historyDeleteCancelAction"),
      postScreenTitle: t("profile.postCarTitle"),
      postScreenSubtitle: t("profile.postCarSubtitle"),
      editScreenTitle: t("profile.editCarTitle"),
      editScreenSubtitle: t("profile.editCarSubtitle"),
      brandLabel: t("profile.postCarBrandLabel"),
      modelLabel: t("profile.postCarModelLabel"),
      yearLabel: t("profile.postCarYearLabel"),
      priceLabel: t("profile.postCarPriceLabel"),
      mileageLabel: t("profile.postCarMileageLabel"),
      rimSizeLabel: t("profile.postCarRimSizeLabel"),
      colorLabel: t("profile.postCarColorLabel"),
      descriptionLabel: t("profile.postCarDescriptionLabel"),
      bodyTypeLabel: t("profile.postCarBodyTypeLabel"),
      conditionLabel: t("profile.postCarConditionLabel"),
      fuelTypeLabel: t("profile.postCarFuelTypeLabel"),
      transmissionLabel: t("profile.postCarTransmissionLabel"),
      negotiableLabel: t("profile.postCarNegotiableLabel"),
      accidentHistoryLabel: t("profile.postCarAccidentHistoryLabel"),
      photosLabel: t("profile.postCarPhotosLabel"),
      addPhotosLabel: t("profile.postCarAddPhotosLabel"),
      photosHelperLabel: t("profile.postCarPhotosHelper"),
      removePhotoLabel: t("profile.postCarRemovePhotoLabel"),
      submitLabel: t("profile.postCarSubmitLabel"),
      editSubmitLabel: t("profile.editCarSubmitLabel"),
      backLabel: t("common.back"),
      brandHelperLabel: t("profile.postCarBrandHelper"),
      modelHelperLabel: t("profile.postCarModelHelper"),
      emptyModelsLabel: t("profile.postCarEmptyModels"),
      requiredFieldsError: t("profile.requiredFieldsError"),
      invalidNumbersError: t("profile.postCarInvalidNumbers"),
      invalidReferenceError: t("profile.postCarInvalidReference"),
      photoPermissionError: t("profile.postCarPhotoPermissionError"),
      unavailableError: t("profile.sellerUnavailable"),
    },
  });
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
  const { startGame, submitGuess } = useGameSessionActions({
    roomCode,
    hostKey,
    playerToken,
    roomState,
    guessDisabled,
    markGuessSubmitted,
  });
  const {
    activeMode,
    setActiveMode,
    openModeEntry,
    joinRoomCode,
    setJoinRoomCode,
    createRoomForGame,
    joinRoomForGame,
    leaveRoomToPreviousMode,
    handleRoomClosedToPreviousMode,
  } = usePreRoomFlow({
    profileName,
    roomState,
    roomCode,
    playerToken,
    hostKey,
    setActiveTab,
    resetSession,
  });
  const detailTransition = useOverlayTransition(Boolean(selectedCarId));
  const sellerAccessTransition = useOverlayTransition(Boolean(sellerAccessStep));
  const { car: selectedCar, isLoading: isCarDetailLoading, hasError: hasCarDetailError } =
    useCarDetail(selectedCarId ?? undefined);

  useEffect(() => {
    if (activeTab !== "PROFILE" || !hasSellerProfile || isSellerLoggingOut) {
      return;
    }

    void warmSellerHistory();
  }, [activeTab, hasSellerProfile, isSellerLoggingOut, warmSellerHistory]);

  useEffect(() => {
    if (!roomState) {
      return;
    }

    setSelectedCarId(null);
  }, [roomState, setSelectedCarId]);

  const shouldWarmSellerHistoryUi =
    activeTab === "PROFILE" &&
    hasSellerProfile &&
    !isSellerLoggingOut &&
    !sellerListingStack.includes("HISTORY");
  const hasVisibleSellerListingOverlay = sellerListingStack.length > 0;

  useSocketLifecycle({
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
    onRoomClosed: handleRoomClosedToPreviousMode,
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

  const dismissSellerAccessAfterSwipe = () => {
    sellerAccessTransition.dismiss(() => {
      closeSellerFlow();
    });
  };

  const navLabels = {
    sellLabel: t("common.sellCar"),
    updatesLabel: t("common.carUpdates"),
    gamesLabel: t("common.games"),
    profileLabel: t("common.profile"),
  };

  const detailScreenLabels = {
    priceLabel: t("home.priceLabel"),
    sellerTypeLabel: t("home.sellerTypeLabel"),
    sellerNameLabel: t("home.sellerNameLabel"),
    postedAtLabel: t("home.postedAtLabel"),
    colorLabel: t("home.colorLabel"),
    negotiableLabel: t("home.negotiableLabel"),
    accidentHistoryLabel: t("home.accidentHistoryLabel"),
    mileageLabel: t("home.mileageLabel"),
    rimSizeLabel: t("home.rimSizeLabel"),
    transmissionLabel: t("home.transmissionLabel"),
    fuelLabel: t("home.fuelLabel"),
    conditionLabel: t("home.conditionLabel"),
    callLabel: t("home.callLabel"),
    whatsappLabel: t("home.whatsappLabel"),
  };

  const launchProps = {
    onContinue: continueFromLaunch,
  };

  const nameSetupProps = {
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
  };

  const profileProps = {
    eyebrow: t("profile.eyebrow"),
    subtitle: t("profile.subtitle"),
    updateNameLabel: t("profile.updateName"),
    playerNameLabel: t("common.playerName"),
    helper: t("profile.helper"),
    saveNameLabel: t("profile.saveName"),
    becomeSellerLabel: isSellerLoggingOut
      ? t("profile.becomeSeller")
      : hasSellerProfile
        ? t("profile.sellerAccountAction")
        : hasSellerAccess
          ? t("profile.continueSellerSignup")
          : t("profile.becomeSeller"),
    postCarLabel:
      hasSellerProfile && !isSellerLoggingOut ? t("profile.postCar") : undefined,
    historyLabel:
      hasSellerProfile && !isSellerLoggingOut ? t("profile.history") : undefined,
    sellerStateLabel:
      isSellerLoggingOut
        ? undefined
        : profileStateLabel ??
          (hasSellerAccess && accessScreenProps.phoneValue
            ? t("profile.sellerReady", { value: accessScreenProps.phoneValue })
            : undefined),
    currentName: profileName ?? "",
    draftName: profileDraft,
    isSaving: isSavingProfile,
    isBecomeSellerDisabled: isRestoringSession,
    onChangeDraft: setProfileDraft,
    onSave: () => {
      void saveProfileName(profileDraft);
    },
    onBecomeSeller: () => {
      if (hasSellerProfile && !isSellerLoggingOut && sellerProfile) {
        openSellerAccount();
        return;
      }

      void openSellerFlow();
    },
    onPostCar: hasSellerProfile && !isSellerLoggingOut
      ? () => {
          openSellerPostCar();
        }
      : undefined,
    onHistory: hasSellerProfile && !isSellerLoggingOut
      ? () => {
          void openSellerHistory();
        }
      : undefined,
  };

  const gamesHubProps = {
    eyebrow: t("games.eyebrow"),
    title: t("games.title"),
    subtitle: t("games.subtitle"),
    tipLabel: t("games.tip"),
    tapToPlayLabel: t("home.tapToPlay"),
    goLabel: t("games.go"),
    cards: [
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
    ],
  };

  const baseCatalogFeedParams = {
    featuredCars,
    sellCars,
    isFeaturedCarsLoading,
    hasFeaturedCarsError,
    featuredLabel: t("home.featuredLabel"),
    sellLabel: t("home.sellLabel"),
    featuredLoadingLabel: t("home.featuredLoading"),
    featuredErrorLabel: t("home.featuredError"),
    searchPlaceholder: t("catalog.searchPlaceholder"),
    loadingLabel: t("catalog.loadingCars"),
    emptyResultsLabel: t("catalog.emptyResults"),
    loadingMoreLabel: t("catalog.loadingMore"),
    sellerTypeLabel: t("home.sellerTypeLabel"),
    postedAtLabel: t("home.postedAtLabel"),
    onOpenCar: openCarDetail,
  };

  const sellFeedParams = {
    ...baseCatalogFeedParams,
    category: "SELL" as const,
    showHeader: true,
    headerTitle: navLabels.sellLabel,
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
    defaultCardsLayout: "grid" as const,
    filteredCardsLayout: "list" as const,
    initialScrollOffset: sellScrollOffset,
    onScrollOffsetChange: setSellScrollOffset,
  };

  const updatesFeedParams = {
    ...baseCatalogFeedParams,
    category: "UPDATE" as const,
    showHeader: false,
    headerTitle: navLabels.updatesLabel,
    carTypeLabel: t("catalog.carType"),
    defaultCardsLayout: "list" as const,
    filteredCardsLayout: "list" as const,
    initialScrollOffset: updatesScrollOffset,
    onScrollOffsetChange: setUpdatesScrollOffset,
  };
  const {
    feedProps: sellCatalogFeedProps,
    overlays: sellCatalogOverlays,
  } = useSellCatalogFeed(sellFeedParams);

  const selectedCarActionButtons: CarDetailAction[] =
    selectedCar && isSellCar(selectedCar)
      ? [
          {
            id: "whatsapp",
            label: detailScreenLabels.whatsappLabel,
            onPress: () => {
              const sanitizedPhone = selectedCar.telephone.replace(/[^\d+]/g, "");
              const whatsappPhone = sanitizedPhone.replace(/^\+/, "");

              void Linking.openURL(`https://wa.me/${whatsappPhone}`);
            },
          },
          {
            id: "call",
            label: detailScreenLabels.callLabel,
            onPress: () => {
              const sanitizedPhone = selectedCar.telephone.replace(/[^\d+]/g, "");

              void Linking.openURL(`tel:${sanitizedPhone}`);
            },
          },
        ]
      : [];
  const selectedCarDetailItems: CarDetailInfoItem[] = selectedCar
    ? isSellCar(selectedCar)
      ? [
          {
            label: detailScreenLabels.priceLabel,
            value: formatCatalogPrice(selectedCar.priceValue),
            fullWidth: true,
          },
          {
            label: detailScreenLabels.sellerNameLabel,
            value: selectedCar.sellerName,
            fullWidth: true,
          },
          {
            label: detailScreenLabels.sellerTypeLabel,
            value: formatCatalogEnumLabel(selectedCar.sellerType),
          },
          {
            label: detailScreenLabels.postedAtLabel,
            value: formatCatalogDate(selectedCar.postedAt),
          },
          {
            label: detailScreenLabels.colorLabel,
            value: selectedCar.color,
          },
          {
            label: detailScreenLabels.mileageLabel,
            value: `${selectedCar.mileage.toLocaleString()} KM`,
          },
          {
            label: detailScreenLabels.rimSizeLabel,
            value: `${selectedCar.rimSizeInches}"`,
          },
          {
            label: detailScreenLabels.transmissionLabel,
            value: formatCatalogEnumLabel(selectedCar.transmission),
          },
          {
            label: detailScreenLabels.fuelLabel,
            value: formatCatalogEnumLabel(selectedCar.fuelType),
          },
          {
            label: detailScreenLabels.conditionLabel,
            value: formatCatalogEnumLabel(selectedCar.condition),
          },
          {
            label: detailScreenLabels.negotiableLabel,
            value: formatCatalogEnumLabel(selectedCar.isNegotiable),
          },
          {
            label: detailScreenLabels.accidentHistoryLabel,
            value: formatCatalogEnumLabel(selectedCar.accidentHistory),
          },
        ]
      : [
          {
            label: detailScreenLabels.postedAtLabel,
            value: formatCatalogDate(selectedCar.postedAt),
          },
        ]
    : [];
  const carDetail = (
    <CarDetailScreen
      isLoading={isCarDetailLoading}
      hasError={hasCarDetailError}
      backLabel={t("common.back")}
      closeLabel={t("common.close")}
      loadingLabel={t("detail.loading")}
      errorLabel={t("detail.error")}
      eyebrow={selectedCar?.brand}
      title={selectedCar?.model}
      priceText={
        selectedCar && isSellCar(selectedCar)
          ? formatCatalogPrice(selectedCar.priceValue)
          : undefined
      }
      year={selectedCar ? String(selectedCar.year) : ""}
      typeText={selectedCar ? formatCatalogEnumLabel(selectedCar.type) : undefined}
      description={selectedCar?.description}
      galleryImageUrls={selectedCar?.galleryImageUrls ?? []}
      infoItems={selectedCarDetailItems}
      actionButtons={selectedCarActionButtons}
      onBack={closeCarDetail}
    />
  );
  const mountedTabs = (
    <View style={styles.tabStack}>
      <View
        pointerEvents={activeTab === "SELL" ? "auto" : "none"}
        style={[
          styles.tabLayer,
          activeTab === "SELL" ? styles.tabLayerVisible : styles.tabLayerHidden,
        ]}
      >
        <SellCarHomeScreen feedProps={sellCatalogFeedProps} />
      </View>
      <View
        pointerEvents={activeTab === "UPDATES" ? "auto" : "none"}
        style={[
          styles.tabLayer,
          activeTab === "UPDATES" ? styles.tabLayerVisible : styles.tabLayerHidden,
        ]}
      >
        <CarNewsHomeScreen feedParams={updatesFeedParams} />
      </View>
      <View
        pointerEvents={activeTab === "GAMES" ? "auto" : "none"}
        style={[
          styles.tabLayer,
          activeTab === "GAMES" ? styles.tabLayerVisible : styles.tabLayerHidden,
        ]}
      >
        <GamesHubScreen
          {...gamesHubProps}
          onOpenGame={(game) => {
            openModeEntry(game);
          }}
        />
      </View>
      <View
        pointerEvents={activeTab === "PROFILE" ? "auto" : "none"}
        style={[
          styles.tabLayer,
          activeTab === "PROFILE" ? styles.tabLayerVisible : styles.tabLayerHidden,
        ]}
      >
        <ProfileScreen {...profileProps} />
      </View>
    </View>
  );
  const footer = profileName
    ? (
        <BottomNav
          activeTab={activeTab}
          sellLabel={navLabels.sellLabel}
          updatesLabel={navLabels.updatesLabel}
          gamesLabel={navLabels.gamesLabel}
          profileLabel={navLabels.profileLabel}
          onTabChange={(tab) => {
            setSelectedCarId(null);
            setActiveTab(tab);
          }}
        />
      )
    : undefined;
  const sellerAccessContent =
    sellerAccessStep === "CHOICE" ? (
      <SellerAccessChoiceScreen {...choiceScreenProps} />
    ) : sellerAccessStep === "SIGN_IN" ? (
      <SellerPinSignInScreen {...signInScreenProps} />
    ) : sellerAccessStep === "ACCESS" ? (
      <SellerAccessScreen {...accessScreenProps} />
    ) : sellerAccessStep ? (
      <SellerSignupScreen {...signupScreenProps} />
    ) : null;
  const sellerListingOverlays = useSellerListingOverlays({
    layerStack: sellerListingStack,
    shouldWarmHistoryMounted: shouldWarmSellerHistoryUi,
    accountScreenProps,
    historyScreenProps,
    postCarScreenProps,
  });
  const gameSessionOverlays = useGameSessionOverlays({
    t,
    activeMode,
    setActiveMode,
    joinRoomCode,
    setJoinRoomCode,
    createRoomForGame,
    joinRoomForGame,
    roomState,
    isHost: Boolean(hostKey),
    roomClosesAt,
    currentGuessPayload,
    selectedOptionId,
    guessDisabled,
    guessResults,
    currentImposterPayload,
    imposterResults,
    onStartGame: startGame,
    onLeaveRoom: leaveRoomToPreviousMode,
    onExitGame: leaveRoomToPreviousMode,
    onRematchGame: leaveRoomToPreviousMode,
    onSelectOption: setSelectedOption,
    onSubmitOption: submitGuess,
  });
  const activeOverlay = useActiveOverlay([
    {
      id: "seller-access",
      isActive: Boolean(sellerAccessStep && sellerAccessContent),
      opacity: sellerAccessTransition.opacity,
      translateY: sellerAccessTransition.translateY,
      onBack: dismissSellerAccessAfterSwipe,
      scrollEnabled: false,
      swipeEnabled: true,
      content: sellerAccessContent,
    },
    {
      id: "car-detail",
      isActive: Boolean(selectedCarId),
      opacity: detailTransition.opacity,
      translateY: detailTransition.translateY,
      onBack: dismissCarDetailAfterSwipe,
      scrollEnabled: false,
      swipeEnabled: true,
      content: carDetail,
    },
  ]);

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
            {!hasLoadedProfile ? null : !profileName ? (
              <ScreenShell scrollEnabled={false}>
                <NameSetupScreen {...nameSetupProps} />
              </ScreenShell>
            ) : (
              <View style={styles.tabStack}>
                <ScreenShell scrollEnabled={false}>
                  {mountedTabs}
                </ScreenShell>
                {footer ? <View style={styles.bottomNavLayer}>{footer}</View> : null}
                {gameSessionOverlays.map((overlay) => (
                  <OverlayScreen
                    key={overlay.id}
                    isActive
                    opacity={overlay.opacity}
                    translateY={overlay.translateY}
                    onBack={overlay.onBack}
                    scrollEnabled={overlay.scrollEnabled}
                    swipeEnabled={overlay.swipeEnabled}
                  >
                    {overlay.content}
                  </OverlayScreen>
                ))}
                {sellerListingOverlays.map((overlay) => (
                  <OverlayScreen
                    key={overlay.id}
                    isActive={overlay.isActive}
                    opacity={overlay.opacity}
                    translateY={overlay.translateY}
                    onBack={overlay.onBack}
                    scrollEnabled={overlay.scrollEnabled}
                    swipeEnabled={overlay.swipeEnabled}
                  >
                    {overlay.content}
                  </OverlayScreen>
                ))}
                {!roomState
                  ? sellCatalogOverlays.map((overlay) => (
                      <OverlayScreen
                        key={overlay.id}
                        isActive={overlay.isActive}
                        opacity={overlay.opacity}
                        translateY={overlay.translateY}
                        onBack={overlay.onBack}
                        scrollEnabled={overlay.scrollEnabled}
                        swipeEnabled={overlay.swipeEnabled}
                        padded={overlay.padded}
                        safeAreaEdges={overlay.safeAreaEdges}
                      >
                        {overlay.content}
                      </OverlayScreen>
                    ))
                  : null}
                {!roomState && !hasVisibleSellerListingOverlay && activeOverlay ? (
                  <OverlayScreen
                    isActive
                    opacity={activeOverlay.opacity}
                    translateY={activeOverlay.translateY}
                    onBack={activeOverlay.onBack}
                    scrollEnabled={activeOverlay.scrollEnabled}
                    swipeEnabled={activeOverlay.swipeEnabled}
                    padded={activeOverlay.padded}
                    safeAreaEdges={activeOverlay.safeAreaEdges}
                  >
                    {activeOverlay.content}
                  </OverlayScreen>
                ) : null}
              </View>
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
              <LaunchScreen {...launchProps} />
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
  tabStack: {
    flex: 1,
  },
  tabLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tabLayerVisible: {
    opacity: 1,
  },
  tabLayerHidden: {
    opacity: 0,
  },
  bottomNavLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
});
