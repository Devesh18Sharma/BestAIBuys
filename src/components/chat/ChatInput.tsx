import { useState, useCallback } from "react";
import { Box, TextField, InputAdornment } from "@mui/material";

interface ChatInputProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, placeholder = "Search anything...", disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }, [value, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        // BES-15: slim padding so the bar lands near ~7% of the
        // viewport height (≈ 56px on an 800px screen). Removed the
        // borderTop divider that used to separate this from the chat;
        // the subtle top shadow alone is enough visual separation.
        // Removed the helper text underneath to reclaim the rest of
        // the vertical space without crowding the input pill.
        pt: { xs: "8px", sm: "10px" },
        px: { xs: "18px", sm: "28px" },
        pb: { xs: "14px", sm: "18px" },
        background: "color-mix(in oklab, #F1EEDA 92%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        // Top shadow lifts the bar off the conversation (the input
        // reads as an action surface, not page chrome).
        boxShadow: "0 -8px 24px -16px rgba(38,38,37,0.18)",
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box
                onClick={handleSubmit}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: value.trim() ? "#7BC362" : "#CCCBCA",
                  display: "grid",
                  placeItems: "center",
                  cursor: value.trim() ? "pointer" : "default",
                  transition: "background .15s ease, transform .15s ease",
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor: value.trim() ? "#5CBA49" : "#CCCBCA",
                    transform: value.trim() ? "scale(1.04)" : "none",
                  },
                }}
              >
                {/* Arrow icon from Good Find design */}
                <Box
                  component="svg"
                  width="18"
                  height="18"
                  viewBox="0 0 76 76"
                  fill="none"
                  sx={{ color: "#262625" }}
                >
                  <path
                    fill="currentColor"
                    d="M51.2,41.5H6.1v-6.9h45.2l-12.4-20.4h7.2c6.4,10.2,14.3,17.2,23.8,21.8v4.4c-9.4,4.6-17.4,11.7-23.8,21.9h-7.2c0,0,12.3-20.6,12.3-20.6Z"
                  />
                </Box>
              </Box>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "999px",
            fontSize: { xs: 16, sm: 18 },
            backgroundColor: "#FFFFFF",
            pr: 1,
            pl: 3,
            boxShadow: "0 4px 12px rgba(38,38,37,0.06), 0 12px 32px rgba(38,38,37,0.06)",
            "& fieldset": { borderColor: "transparent", borderWidth: "1px" },
            "&:hover fieldset": { borderColor: "#CCCBCA" },
            "&.Mui-focused fieldset": { borderColor: "#262625", borderWidth: "1px" },
            "&.Mui-focused": {
              boxShadow: "0 8px 24px rgba(38,38,37,0.08), 0 24px 64px rgba(38,38,37,0.08)",
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "18px 0",
            "&::placeholder": { color: "#7F8080", opacity: 1 },
          },
        }}
      />
    </Box>
  );
}
