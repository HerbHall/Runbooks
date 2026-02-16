import { Chip, Box } from "@mui/material";
import type { Category } from "../types";
import { ICON_LABELS } from "../category-defaults";

interface CategoryBadgeProps {
  category: Category;
  size?: "small" | "medium";
}

export function CategoryBadge({ category, size = "small" }: CategoryBadgeProps) {
  const emoji = ICON_LABELS[category.icon] ?? "";

  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: category.color,
              flexShrink: 0,
            }}
          />
          {emoji && <span>{emoji}</span>}
          {category.name}
        </Box>
      }
      variant="outlined"
      sx={{ borderColor: category.color, color: "text.primary" }}
    />
  );
}
