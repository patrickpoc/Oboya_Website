/**
 * Oboya Horticulture brand palette — source: Brand Guidelines 2026
 * @see Brand_guidelines_Oboya.pdf
 */
export const brandColors = {
  mainGreen: "#4DAF4E",
  lightGreen: "#75C566",
  mainBlue: "#004F7C",
  lightBlue: "#009CD4",
  darkBlue: "#01203F",
  softWhite: "#F1F5F1",
  lightYellow: "#DBE64C",
  darkYellow: "#909B03",
  orangeRed: "#EA5744",
  white: "#FFFFFF",
} as const;

export type BrandColor = keyof typeof brandColors;
