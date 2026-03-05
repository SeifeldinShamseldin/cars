import { useEffect, useMemo, useState } from "react";

import type { SellerType } from "../api/catalog";
import {
  ApiRequestError,
} from "../api/http";
import {
  saveSellerProfile,
  signInSellerWithPin,
  verifySellerAccessCode,
} from "../api/sellerAccess";
import {
  clearStoredSellerRefreshToken,
} from "../lib/storage";
import {
  fetchAndApplySellerSession,
  resolveAndApplySellerSession,
} from "../lib/sellerSession";
import {
  useSellerAccessActions,
  useSellerAccessState,
} from "../store/selectors";

type SellerFlowStep = "CHOICE" | "SIGN_IN" | "ACCESS" | "SIGNUP" | null;

const shouldClearSellerSession = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.status === 401;

export const useSellerAccessFlow = ({
  defaultSellerType = "OWNER",
  labels,
}: {
  defaultSellerType?: SellerType;
  labels: {
    accessTitle: string;
    accessSubtitle: string;
    choiceTitle: string;
    choiceSubtitle: string;
    signInLabel: string;
    signUpLabel: string;
    signInTitle: string;
    signInSubtitle: string;
    signInHelper: string;
    signInPinLabel: string;
    accessPhoneLabel: string;
    accessCodeLabel: string;
    accessHelper: string;
    accessVerifyLabel: string;
    signupTitle: string;
    signupSubtitle: string;
    signupNameLabel: string;
    signupPhoneLabel: string;
    signupPinLabel: string;
    signupConfirmPinLabel: string;
    signupSellerTypeLabel: string;
    signupOwnerLabel: string;
    signupDealerLabel: string;
    signupSaveLabel: string;
    backLabel: string;
    requiredFieldsError: string;
    pinMismatchError: string;
    missingAccessTokenError: string;
    unavailableError: string;
  };
}) => {
  const {
    sellerAccessToken,
    sellerAccessRefreshToken,
    sellerAccessPhone,
    hasSellerProfile,
    sellerProfile,
  } = useSellerAccessState();
  const {
    setSellerAccessSession,
    clearSellerAccessSession,
    setSellerProfile,
  } = useSellerAccessActions();

  const [activeStep, setActiveStep] = useState<SellerFlowStep>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [accessPhoneDraft, setAccessPhoneDraft] = useState(sellerAccessPhone ?? "");
  const [accessCodeDraft, setAccessCodeDraft] = useState("");
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | undefined>();
  const [signInPhoneDraft, setSignInPhoneDraft] = useState(sellerAccessPhone ?? "");
  const [signInPinDraft, setSignInPinDraft] = useState("");
  const [isSubmittingSignIn, setIsSubmittingSignIn] = useState(false);
  const [signInError, setSignInError] = useState<string | undefined>();
  const [signupNameDraft, setSignupNameDraft] = useState(sellerProfile?.name ?? "");
  const [signupPhoneDraft, setSignupPhoneDraft] = useState(sellerAccessPhone ?? "");
  const [signupPinDraft, setSignupPinDraft] = useState("");
  const [signupConfirmPinDraft, setSignupConfirmPinDraft] = useState("");
  const [signupSellerType, setSignupSellerType] = useState<SellerType>(
    sellerProfile?.sellerType ?? defaultSellerType,
  );
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [signupError, setSignupError] = useState<string | undefined>();

  useEffect(() => {
    if (!sellerAccessPhone) {
      return;
    }

    setAccessPhoneDraft((current) => (current.trim().length > 0 ? current : sellerAccessPhone));
    setSignInPhoneDraft((current) => (current.trim().length > 0 ? current : sellerAccessPhone));
    setSignupPhoneDraft(sellerAccessPhone);
  }, [sellerAccessPhone]);

  useEffect(() => {
    if (!sellerProfile) {
      return;
    }

    setSignupNameDraft(sellerProfile.name);
    setSignupSellerType(sellerProfile.sellerType);
  }, [sellerProfile]);

  useEffect(() => {
    let isMounted = true;

    const restoreSellerSession = async () => {
      try {
        const session = await resolveAndApplySellerSession({
          accessToken: sellerAccessToken,
          refreshToken: sellerAccessRefreshToken,
          setSellerAccessSession,
          setSellerProfile,
        });

        if (!isMounted) {
          return;
        }

        setSignupPhoneDraft(session.phone);
      } catch (error) {
        if (shouldClearSellerSession(error)) {
          await clearStoredSellerRefreshToken();
          if (isMounted) {
            clearSellerAccessSession();
          }
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    };

    void restoreSellerSession();

    return () => {
      isMounted = false;
    };
  }, [
    clearSellerAccessSession,
    sellerAccessRefreshToken,
    sellerAccessToken,
    setSellerAccessSession,
    setSellerProfile,
  ]);

  const applySellerSession = async ({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) =>
    fetchAndApplySellerSession({
      accessToken,
      refreshToken,
      setSellerAccessSession,
      setSellerProfile,
    });

  const ensureActiveSellerSession = async () => {
    try {
      const session = await resolveAndApplySellerSession({
        accessToken: sellerAccessToken,
        refreshToken: sellerAccessRefreshToken,
        setSellerAccessSession,
        setSellerProfile,
      });
      setSignupPhoneDraft(session.phone);
      return {
        accessToken: session.accessToken,
        phone: session.phone,
        hasProfile: session.hasProfile,
      };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw new ApiRequestError({
          message: labels.unavailableError,
          status: error.status,
        });
      }
      throw error;
    }
  };

  const closeSellerFlow = () => {
    setActiveStep(null);
    setAccessCodeDraft("");
    setAccessError(undefined);
    setSignInPinDraft("");
    setSignInError(undefined);
    setSignupError(undefined);
  };

  const openSellerFlow = async () => {
    setAccessError(undefined);
    setSignupError(undefined);

    if (!sellerAccessToken) {
      setActiveStep("CHOICE");
      return;
    }

    setIsSubmittingAccess(true);
    try {
      await ensureActiveSellerSession();
      setActiveStep("CHOICE");
    } catch (error) {
      if (shouldClearSellerSession(error)) {
        void clearStoredSellerRefreshToken();
        clearSellerAccessSession();
      }
      setActiveStep("CHOICE");
      setAccessError(
        error instanceof ApiRequestError
          ? error.message
          : labels.unavailableError,
      );
    } finally {
      setIsSubmittingAccess(false);
    }
  };

  const submitSellerAccess = async () => {
    if (!accessPhoneDraft.trim() || !accessCodeDraft.trim()) {
      setAccessError(labels.requiredFieldsError);
      return;
    }

    setIsSubmittingAccess(true);
    setAccessError(undefined);
    try {
      const verifyResponse = await verifySellerAccessCode({
        phone: accessPhoneDraft,
        code: accessCodeDraft,
      });
      const nextSession = await applySellerSession({
        accessToken: verifyResponse.accessToken,
        refreshToken: verifyResponse.refreshToken,
      });
      setAccessCodeDraft("");
      setSignupPhoneDraft(nextSession.phone);
      setActiveStep(nextSession.hasProfile ? null : "SIGNUP");
    } catch (error) {
      setAccessError(
        error instanceof ApiRequestError
          ? error.message
          : labels.unavailableError,
      );
    } finally {
      setIsSubmittingAccess(false);
    }
  };

  const submitSellerSignIn = async () => {
    if (!signInPhoneDraft.trim() || !signInPinDraft.trim()) {
      setSignInError(labels.requiredFieldsError);
      return;
    }

    setIsSubmittingSignIn(true);
    setSignInError(undefined);
    try {
      const signInResponse = await signInSellerWithPin({
        phone: signInPhoneDraft,
        pin: signInPinDraft,
      });
      const session = await applySellerSession({
        accessToken: signInResponse.accessToken,
        refreshToken: signInResponse.refreshToken,
      });
      setSignupPhoneDraft(session.phone);
      setSignInPinDraft("");
      closeSellerFlow();
    } catch (error) {
      setSignInError(
        error instanceof ApiRequestError ? error.message : labels.unavailableError,
      );
    } finally {
      setIsSubmittingSignIn(false);
    }
  };

  const submitSellerSignup = async () => {
    if (!sellerAccessToken) {
      try {
        await ensureActiveSellerSession();
      } catch {
        setSignupError(labels.missingAccessTokenError);
        return;
      }
    }

    if (!signupNameDraft.trim() || !signupPhoneDraft.trim()) {
      setSignupError(labels.requiredFieldsError);
      return;
    }

    if (!signupPinDraft.trim() || !signupConfirmPinDraft.trim()) {
      setSignupError(labels.requiredFieldsError);
      return;
    }

    if (signupPinDraft.trim() !== signupConfirmPinDraft.trim()) {
      setSignupError(labels.pinMismatchError);
      return;
    }

    setIsSubmittingSignup(true);
    setSignupError(undefined);
    try {
      const activeSession = await ensureActiveSellerSession();
      const response = await saveSellerProfile({
        accessToken: activeSession.accessToken,
        name: signupNameDraft,
        phone: signupPhoneDraft,
        pin: signupPinDraft,
        sellerType: signupSellerType,
      });
      setSellerProfile(response.profile);
      setSignupPinDraft("");
      setSignupConfirmPinDraft("");
      closeSellerFlow();
    } catch (error) {
      setSignupError(
        error instanceof ApiRequestError
          ? error.message
          : labels.unavailableError,
      );
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const profileStateLabel = useMemo(() => {
    if (sellerProfile) {
      return `${sellerProfile.name} · ${sellerProfile.phone} · ${sellerProfile.sellerType}`;
    }

    if (sellerAccessPhone && hasSellerProfile) {
      return sellerAccessPhone;
    }

    return undefined;
  }, [hasSellerProfile, sellerAccessPhone, sellerProfile]);

  return {
    activeStep,
    isRestoringSession,
    hasSellerAccess: Boolean(sellerAccessToken),
    hasSellerProfile,
    profileStateLabel,
    openSellerFlow,
    closeSellerFlow,
    choiceScreenProps: {
      title: labels.choiceTitle,
      subtitle: labels.choiceSubtitle,
      signInLabel: labels.signInLabel,
      signUpLabel: labels.signUpLabel,
      backLabel: labels.backLabel,
      onSignIn: () => {
        setSignInError(undefined);
        setActiveStep("SIGN_IN");
      },
      onSignUp: () => {
        setAccessError(undefined);
        setActiveStep("ACCESS");
      },
      onBack: closeSellerFlow,
    },
    signInScreenProps: {
      title: labels.signInTitle,
      subtitle: labels.signInSubtitle,
      phoneLabel: labels.accessPhoneLabel,
      pinLabel: labels.signInPinLabel,
      helper: labels.signInHelper,
      signInLabel: labels.signInLabel,
      backLabel: labels.backLabel,
      phoneValue: signInPhoneDraft,
      pinValue: signInPinDraft,
      isSubmitting: isSubmittingSignIn,
      errorMessage: signInError,
      onChangePhone: setSignInPhoneDraft,
      onChangePin: setSignInPinDraft,
      onSubmit: submitSellerSignIn,
      onBack: () => {
        setActiveStep("CHOICE");
      },
    },
    accessScreenProps: {
      phoneLabel: labels.accessPhoneLabel,
      codeLabel: labels.accessCodeLabel,
      title: labels.accessTitle,
      subtitle: labels.accessSubtitle,
      helper: labels.accessHelper,
      verifyLabel: labels.accessVerifyLabel,
      backLabel: labels.backLabel,
      phoneValue: accessPhoneDraft,
      codeValue: accessCodeDraft,
      isSubmitting: isSubmittingAccess,
      errorMessage: accessError,
      onChangePhone: setAccessPhoneDraft,
      onChangeCode: setAccessCodeDraft,
      onSubmit: submitSellerAccess,
      onBack: closeSellerFlow,
    },
    signupScreenProps: {
      title: labels.signupTitle,
      subtitle: labels.signupSubtitle,
      nameLabel: labels.signupNameLabel,
      phoneLabel: labels.signupPhoneLabel,
      pinLabel: labels.signupPinLabel,
      confirmPinLabel: labels.signupConfirmPinLabel,
      sellerTypeLabel: labels.signupSellerTypeLabel,
      ownerLabel: labels.signupOwnerLabel,
      dealerLabel: labels.signupDealerLabel,
      saveLabel: labels.signupSaveLabel,
      backLabel: labels.backLabel,
      nameValue: signupNameDraft,
      phoneValue: signupPhoneDraft,
      pinValue: signupPinDraft,
      confirmPinValue: signupConfirmPinDraft,
      sellerType: signupSellerType,
      isSubmitting: isSubmittingSignup,
      errorMessage: signupError,
      onChangeName: setSignupNameDraft,
      onChangePhone: setSignupPhoneDraft,
      onChangePin: setSignupPinDraft,
      onChangeConfirmPin: setSignupConfirmPinDraft,
      onChangeSellerType: setSignupSellerType,
      onSubmit: submitSellerSignup,
      onBack: () => {
        setActiveStep("CHOICE");
      },
    },
  };
};
