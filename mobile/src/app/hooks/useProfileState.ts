import { useEffect, useState } from "react";

import {
  getStoredProfileName,
  setStoredProfileName,
} from "../../shared/lib/storage";

export const useProfileState = () => {
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDraft, setProfileDraft] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  return {
    hasLoadedProfile,
    profileName,
    profileDraft,
    isSavingProfile,
    setProfileDraft,
    saveProfileName,
  };
};
