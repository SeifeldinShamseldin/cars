import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  profileName: "car-party-game.profile-name",
} as const;

export const getStoredProfileName = async (): Promise<string | undefined> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.profileName);
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const setStoredProfileName = async (profileName: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.profileName, profileName.trim());
};
