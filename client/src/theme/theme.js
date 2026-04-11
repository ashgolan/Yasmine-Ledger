import { createTheme } from "@mui/material/styles";

export const getTheme = (mode = "light") =>
  createTheme({
    direction: "rtl",
    palette: {
      mode,
      primary: {
        main: "#1976d2",
      },
    },
    typography: {
      fontFamily: "Rubik, Arial",
    },
  });