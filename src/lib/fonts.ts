import localFont from "next/font/local";
import { Noto_Sans_SC } from "next/font/google";

/**
 * Brand typography (Brandbook 2026):
 * - Main titles → Neue Haas Grotesk Display
 * - Subtitles & body → Plus Jakarta Display
 *
 * All font files from the brand zips live under src/fonts/.
 * CSS weights below map to the closest standard 100-step values.
 * (Thin files are kept on disk; XThin covers the 200 slot.)
 */

export const neueHaasDisplay = localFont({
  src: [
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayXXThin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayXXThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayXThin.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayXThinItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayLightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayRoman.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayRomanItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayMediu.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayMediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayBoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayBlack.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../fonts/neue-haas-display/NeueHaasDisplayBlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const plusJakartaDisplay = localFont({
  src: [
    {
      path: "../fonts/plus-jakarta-display/PlusJakartaDisplay-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/plus-jakarta-display/PlusJakartaDisplay-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/plus-jakarta-display/PlusJakartaDisplay-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/plus-jakarta-display/PlusJakartaDisplay-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const notoSansSC = Noto_Sans_SC({
  variable: "--font-chinese",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontVariables = `${neueHaasDisplay.variable} ${plusJakartaDisplay.variable}`;
