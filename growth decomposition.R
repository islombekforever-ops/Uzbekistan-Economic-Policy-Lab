# ----------------------------------------------------------------------
# PHASE 3: GROWTH DECOMPOSITION (WITH "OTHERS" GROUP)
# ----------------------------------------------------------------------
library(ggplot2)
library(dplyr)

# 1. Ҳисоблаш ва нормаллаштириш
numeric_data <- df_grw[, sapply(df_grw, is.numeric)]
var_names <- colnames(numeric_data)[1:nrow(est_dfm$C)]
loadings <- est_dfm$C[, 1]
std_data <- scale(numeric_data[, var_names])
latest_std_values <- as.numeric(tail(std_data, 1))

contributions <- data.frame(
  Variable = var_names,
  RawImpact = loadings * latest_std_values
)

# 7% га нормаллаштириш
scaling_factor <- 7 / sum(contributions$RawImpact, na.rm = TRUE)
contributions$Value <- contributions$RawImpact * scaling_factor

# 2. Фақат ижобийларни олиш ва гуруҳлаш
# 0.2 дан катталарини ажратиб оламиз
major_drivers <- contributions %>%
  dplyr::filter(Value >= 0.2) %>%
  mutate(UzbName = ifelse(Variable %in% names(uzb_names), uzb_names[Variable], Variable))

# 0.2 дан кичик ижобийларни "Бошқалар"га йиғамиз
others_value <- sum(contributions$Value[contributions$Value > 0 & contributions$Value < 0.2], na.rm = TRUE)

others_df <- data.frame(
  Variable = "others",
  RawImpact = NA,
  Value = others_value,
  UzbName = "Бошқа ижобий омиллар"
)

# 3. Иккита жадвални бирлаштириш
plot_data <- bind_rows(major_drivers, others_df) %>%
  arrange(desc(Value))

# 4. Графикни чизиш
ggplot(plot_data, aes(x = reorder(UzbName, Value), y = Value)) +
  geom_bar(stat = "identity", fill = "#2ecc71", width = 0.7) +
  geom_text(aes(label = sprintf("+%.2f", Value)), hjust = -0.2, size = 4.5, fontface = "bold") +
  coord_flip() +
  labs(
    title = "ЯИМ ўсиш прогнозиини таъминлаётган асосий омиллар",
    subtitle = "2026 йил 1-чораги прогноз драйверлари (ф.б. ҳисобида)",
    x = "",
    y = "ЯИМ ўсишига қўшилган ҳисса (ф.б.)"
  ) +
  theme_minimal() +
  theme(
    axis.text.y = element_text(size = 11, face = "bold"),
    plot.title = element_text(size = 14, face = "bold"),
    panel.grid.minor = element_blank()
  ) +
  scale_y_continuous(expand = expansion(mult = c(0, 0.2)))