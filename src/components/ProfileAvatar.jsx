import { useEffect, useMemo, useState } from "react";

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export default function ProfileAvatar({ name = "User", avatarUrl = "", size = "md", className = "" }) {
  const [broken, setBroken] = useState(false);
  const initials = useMemo(() => {
    const cleaned = String(name || "User")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("");
    return cleaned.toUpperCase() || "U";
  }, [name]);

  useEffect(() => {
    setBroken(false);
  }, [avatarUrl]);

  if (avatarUrl && !broken) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover ring-2 ring-white/60 ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`.trim()}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span className={`xenon-avatar ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`.trim()}>
      {initials}
    </span>
  );
}
