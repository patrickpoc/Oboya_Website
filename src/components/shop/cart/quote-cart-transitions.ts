export const desktopExpandTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const desktopChipTransition = {
  duration: 0.18,
  ease: "easeOut" as const,
};

export const mobileFadeTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

export const mobileSheetTransition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const desktopPanelMotion = {
  initial: { scaleY: 0.12, opacity: 0.92 },
  animate: { scaleY: 1, opacity: 1 },
  exit: { scaleY: 0.12, opacity: 0.92 },
  style: { transformOrigin: "bottom right" as const },
};

export const desktopChipMotion = {
  initial: { scaleY: 0.65, opacity: 0 },
  animate: { scaleY: 1, opacity: 1 },
  exit: { scaleY: 0.65, opacity: 0 },
  style: { transformOrigin: "bottom right" as const },
};

export const mobileFabMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
