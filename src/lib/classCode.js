const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClassCode() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
}
