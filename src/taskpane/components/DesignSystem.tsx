import * as React from "react";
import { createTheme, ThemeProvider } from "@fluentui/react";

export const docuIdTheme = createTheme({
  palette: {
    themePrimary: "#0078d4",
    themeLighterAlt: "#f3f9fd",
    themeLighter: "#d0e7f8",
    themeLight: "#a9d3f4",
    themeTertiary: "#5ca9e5",
    themeSecondary: "#1a86d9",
    themeDarkAlt: "#006cbe",
    themeDark: "#005ba1",
    themeDarker: "#004377",
    neutralLighterAlt: "#faf9f8",
    neutralLighter: "#f3f2f1",
    neutralLight: "#edebe9",
    neutralQuaternaryAlt: "#e1dfdd",
    neutralQuaternary: "#d0d0d0",
    neutralTertiaryAlt: "#c8c6c4",
    neutralTertiary: "#a19f9d",
    neutralSecondary: "#605e5c",
    neutralPrimaryAlt: "#3b3a39",
    neutralPrimary: "#323130",
    neutralDark: "#201f1e",
    black: "#000000",
    white: "#ffffff",
  },
  defaultFontStyle: { fontFamily: "Segoe UI, Arial, sans-serif" },
});

export const DocuIdThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={docuIdTheme}>{children}</ThemeProvider>
);
