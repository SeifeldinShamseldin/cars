import { randomBytes, randomUUID } from "node:crypto";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const createId = (): string => randomUUID();

export const createSecret = (): string => randomBytes(24).toString("hex");

export const createRoomCode = (): string => {
  let roomCode = "";

  while (roomCode.length < 5) {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    roomCode += ROOM_CODE_ALPHABET[index];
  }

  return roomCode;
};

export const shuffle = <T>(values: T[]): T[] => {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

