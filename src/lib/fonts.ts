import { Plus_Jakarta_Sans, Noto_Sans_SC } from "next/font/google";

export const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const notoSansSC = Noto_Sans_SC({
  variable: "--font-chinese",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontVariables = `${plusJakarta.variable} ${notoSansSC.variable}`;
