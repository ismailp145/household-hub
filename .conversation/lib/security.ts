import { createHash, randomBytes } from "crypto";

export function createJoinCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function hashCode(value: string) {
  return createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
}