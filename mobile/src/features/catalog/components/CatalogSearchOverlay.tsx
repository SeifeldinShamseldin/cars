import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CarReferenceModelGroup } from "../../../shared/api/catalog";
import { BackArrow } from "../../../shared/components/BackArrow";
import {
  matchesLookupQuery,
  rankLookupSuggestions,
} from "../../../shared/lib/lookupSearch";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";
import { CatalogHeader } from "./CatalogHeader";

// ─── Types (unchanged) ────────────────────────────────────────────────────────
type CatalogSearchOverlayProps = {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  brandLabel: string;
  modelLabel: string;
  carTypeLabel: string;
  priceLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  yearLabel: string;
  yearFromLabel: string;
  yearToLabel: string;
  mileageLabel: string;
  mileageFromLabel: string;
  mileageToLabel: string;
  conditionLabel: string;
  transmissionLabel: string;
  fuelTypeLabel: string;
  clearAllLabel: string;
  offersLabel: string;
  selectedBrand?: string;
  selectedModels: string[];
  selectedCarType?: string;
  selectedPriceFrom?: number;
  selectedPriceTo?: number;
  selectedYearFrom?: number;
  selectedYearTo?: number;
  selectedMileageFrom?: number;
  selectedMileageTo?: number;
  selectedCondition?: string;
  selectedTransmission?: string;
  selectedFuelType?: string;
  availableBrands: string[];
  availableModelGroups: CarReferenceModelGroup[];
  availableCarTypes: string[];
  availablePrices: number[];
  availableYears: number[];
  availableConditions: string[];
  availableTransmissions: string[];
  availableFuelTypes: string[];
  chooseBrandFirstLabel: string;
  noModelsLabel: string;
  resultCount: number;
  onBack: () => void;
  onChangeSearch: (value: string) => void;
  onClearAll: () => void;
  onClearSearch: () => void;
  onSelectBrand: (value?: string) => void;
  onToggleModel: (value: string) => void;
  onSelectCarType: (value?: string) => void;
  onSelectPriceFrom: (value?: number) => void;
  onSelectPriceTo: (value?: number) => void;
  onSelectYearFrom: (value?: number) => void;
  onSelectYearTo: (value?: number) => void;
  onSelectMileageFrom: (value?: number) => void;
  onSelectMileageTo: (value?: number) => void;
  onSelectCondition: (value?: string) => void;
  onSelectTransmission: (value?: string) => void;
  onSelectFuelType: (value?: string) => void;
  onApply: () => void;
};

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  showCloseIcon?: boolean;
};

type AccordionSectionProps = {
  icon: string;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

type YearScrollerProps = {
  label: string;
  selectedYear?: number;
  years: number[];
  expanded: boolean;
  onToggle: () => void;
  onSelect: (value?: number) => void;
  formatter?: (value: number) => string;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FilterChip = ({ label, active, onPress, showCloseIcon = false }: FilterChipProps) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <View style={styles.chipContent}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      {showCloseIcon ? (
        <Icon source="close" size={13} color={active ? appColors.inkDark : appColors.muted} />
      ) : null}
    </View>
  </Pressable>
);

const AccordionSection = ({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: AccordionSectionProps) => (
  <View style={[styles.sectionCard, expanded && styles.sectionCardExpanded]}>
    <Pressable style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionHeading}>
        {/* Icon pill — yellow tint when expanded */}
        <View style={[styles.sectionIconWrap, expanded && styles.sectionIconWrapActive]}>
          <Icon source={icon} size={18} color={expanded ? appColors.inkDark : appColors.primary} />
        </View>
        <View style={styles.sectionTitleWrap}>
          <Text style={[styles.sectionTitle, expanded && styles.sectionTitleActive]}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Icon
        source={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color={expanded ? appColors.primary : appColors.muted}
      />
    </Pressable>
    {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
  </View>
);

const YearScroller = ({
  label,
  selectedYear,
  years,
  expanded,
  onToggle,
  onSelect,
  formatter,
}: YearScrollerProps) => (
  <View style={styles.yearBlock}>
    <Text style={styles.yearSubheading}>{label}</Text>
    <Pressable style={[styles.yearSelectButton, expanded && styles.yearSelectButtonActive]} onPress={onToggle}>
      <Text style={[styles.yearSelectValue, selectedYear !== undefined && styles.yearSelectValueActive]}>
        {selectedYear !== undefined ? (formatter ? formatter(selectedYear) : selectedYear) : "Any"}
      </Text>
      <Icon
        source={expanded ? "chevron-up" : "chevron-down"}
        size={18}
        color={selectedYear !== undefined ? appColors.primary : appColors.muted}
      />
    </Pressable>
    {expanded ? (
      <View style={styles.yearDropdown}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.yearDropdownContent}
        >
          <Pressable
            onPress={() => onSelect(undefined)}
            style={[styles.yearOption, selectedYear === undefined && styles.yearOptionActive]}
          >
            <Text style={[styles.yearOptionText, selectedYear === undefined && styles.yearOptionTextActive]}>
              Any
            </Text>
          </Pressable>
          {years.map((year) => (
            <Pressable
              key={`${label}-${year}`}
              onPress={() => onSelect(selectedYear === year ? undefined : year)}
              style={[styles.yearOption, selectedYear === year && styles.yearOptionActive]}
            >
              <Text style={[styles.yearOptionText, selectedYear === year && styles.yearOptionTextActive]}>
                {formatter ? formatter(year) : year}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    ) : null}
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const CatalogSearchOverlay = ({
  visible,
  title,
  searchPlaceholder,
  searchValue,
  brandLabel,
  modelLabel,
  carTypeLabel,
  priceLabel,
  priceFromLabel,
  priceToLabel,
  yearLabel,
  yearFromLabel,
  yearToLabel,
  mileageLabel,
  mileageFromLabel,
  mileageToLabel,
  conditionLabel,
  transmissionLabel,
  fuelTypeLabel,
  clearAllLabel,
  offersLabel,
  selectedBrand,
  selectedModels,
  selectedCarType,
  selectedPriceFrom,
  selectedPriceTo,
  selectedYearFrom,
  selectedYearTo,
  selectedMileageFrom,
  selectedMileageTo,
  selectedCondition,
  selectedTransmission,
  selectedFuelType,
  availableBrands,
  availableModelGroups,
  availableCarTypes,
  availablePrices,
  availableYears,
  availableConditions,
  availableTransmissions,
  availableFuelTypes,
  chooseBrandFirstLabel,
  noModelsLabel,
  resultCount,
  onBack,
  onChangeSearch,
  onClearAll,
  onClearSearch,
  onSelectBrand,
  onToggleModel,
  onSelectCarType,
  onSelectPriceFrom,
  onSelectPriceTo,
  onSelectYearFrom,
  onSelectYearTo,
  onSelectMileageFrom,
  onSelectMileageTo,
  onSelectCondition,
  onSelectTransmission,
  onSelectFuelType,
  onApply,
}: CatalogSearchOverlayProps) => {
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<
    "brand" | "model" | "carType" | "price" | "year" | "mileage" | "transmission" | "fuelType" | "condition" | null
  >(null);
  const [expandedPricePicker, setExpandedPricePicker] = useState<"from" | "to" | null>(null);
  const [expandedYearPicker, setExpandedYearPicker] = useState<"from" | "to" | null>(null);
  const [expandedMileagePicker, setExpandedMileagePicker] = useState<"from" | "to" | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const mileageOptions = useMemo(() => {
    const values: number[] = [];
    for (let m = 0; m <= 1_000_000; m += 10_000) values.push(m);
    return values;
  }, []);

  const mileageToOptions = useMemo(() =>
    selectedMileageFrom === undefined
      ? mileageOptions
      : mileageOptions.filter((v) => v >= selectedMileageFrom + 10_000),
    [mileageOptions, selectedMileageFrom],
  );

  const priceToOptions = useMemo(() =>
    selectedPriceFrom === undefined
      ? availablePrices
      : availablePrices.filter((v) => v >= selectedPriceFrom + 100_000),
    [availablePrices, selectedPriceFrom],
  );

  useEffect(() => {
    if (!visible) {
      setBrandSearch("");
      setModelSearch("");
      setExpandedSection(null);
      setExpandedPricePicker(null);
      setExpandedYearPicker(null);
      setExpandedMileagePicker(null);
    }
  }, [visible]);

  useEffect(() => { setModelSearch(""); }, [selectedBrand]);

  const filteredBrands = useMemo(() => {
    if (brandSearch.trim().length === 0) return availableBrands;
    return rankLookupSuggestions(
      availableBrands.filter((b) => matchesLookupQuery(b, brandSearch)),
      brandSearch,
    );
  }, [availableBrands, brandSearch]);

  const filteredModelGroups = useMemo(() => {
    if (modelSearch.trim().length === 0) return availableModelGroups;
    return availableModelGroups
      .map((g) => ({
        ...g,
        models: rankLookupSuggestions(
          g.models.filter((m) => matchesLookupQuery(m, modelSearch)),
          modelSearch,
        ),
      }))
      .filter((g) => g.models.length > 0);
  }, [availableModelGroups, modelSearch]);

  const toggleSection = (
    section: "brand" | "model" | "carType" | "price" | "year" | "mileage" | "transmission" | "fuelType" | "condition",
  ) => setExpandedSection((c) => (c === section ? null : section));

  return (
    <View style={styles.root}>
      <View style={styles.overlayScreen}>

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.backWrap}>
            <BackArrow onPress={onBack} />
          </View>
          <Text style={styles.topTitle}>{title}</Text>
          <View style={styles.topSpacer} />
        </View>

        {/* ── Scrollable filter sections ───────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <CatalogHeader
            searchPlaceholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onChangeSearch}
            onClear={onClearSearch}
          />

          {/* Brand */}
          <AccordionSection
            icon="car-outline"
            title={brandLabel}
            subtitle={selectedBrand}
            expanded={expandedSection === "brand"}
            onToggle={() => toggleSection("brand")}
          >
            <TextInput
              mode="outlined"
              value={brandSearch}
              onChangeText={setBrandSearch}
              placeholder={`Search ${brandLabel.toLowerCase()}`}
              style={styles.searchInput}
              outlineStyle={styles.searchOutline}
              contentStyle={styles.searchContent}
              placeholderTextColor={appColors.muted}
              left={<TextInput.Icon icon="magnify" color={appColors.muted} />}
              right={
                brandSearch.trim().length > 0 ? (
                  <TextInput.Icon icon="close" color={appColors.muted} onPress={() => setBrandSearch("")} />
                ) : null
              }
            />
            {selectedBrand ? (
              <Pressable style={styles.selectedRow} onPress={() => onSelectBrand(undefined)}>
                <View style={styles.selectedTextWrap}>
                  <Text style={styles.selectedLabel}>Selected brand</Text>
                  <Text style={styles.selectedValue}>{selectedBrand}</Text>
                </View>
                <Icon source="close" size={16} color={appColors.inkDark} />
              </Pressable>
            ) : null}
            <View style={styles.chipsWrap}>
              {filteredBrands.map((brand) => (
                <FilterChip
                  key={brand}
                  label={brand}
                  active={selectedBrand === brand}
                  onPress={() => onSelectBrand(selectedBrand === brand ? undefined : brand)}
                />
              ))}
            </View>
          </AccordionSection>

          {/* Model */}
          <AccordionSection
            icon="car-info"
            title={modelLabel}
            subtitle={
              selectedModels.length > 0
                ? selectedModels.length === 1 ? selectedModels[0] : `${selectedModels.length} selected`
                : undefined
            }
            expanded={expandedSection === "model"}
            onToggle={() => toggleSection("model")}
          >
            {selectedBrand ? (
              <>
                <TextInput
                  mode="outlined"
                  value={modelSearch}
                  onChangeText={setModelSearch}
                  placeholder={`Search ${modelLabel.toLowerCase()}`}
                  style={styles.searchInput}
                  outlineStyle={styles.searchOutline}
                  contentStyle={styles.searchContent}
                  placeholderTextColor={appColors.muted}
                  left={<TextInput.Icon icon="magnify" color={appColors.muted} />}
                  right={
                    modelSearch.trim().length > 0 ? (
                      <TextInput.Icon icon="close" color={appColors.muted} onPress={() => setModelSearch("")} />
                    ) : null
                  }
                />
                {selectedModels.length > 0 ? (
                  <View style={styles.selectedModelsWrap}>
                    <Text style={styles.selectedLabel}>Selected models</Text>
                    <View style={styles.chipsWrap}>
                      {selectedModels.map((model) => (
                        <FilterChip
                          key={`sel-${model}`}
                          label={model}
                          active
                          showCloseIcon
                          onPress={() => onToggleModel(model)}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
                {filteredModelGroups.length > 0 ? (
                  <View style={styles.modelGroupsWrap}>
                    {filteredModelGroups.map((group, i) => (
                      <View key={`${group.groupLabel ?? "other"}-${i}`} style={styles.modelGroupBlock}>
                        {group.groupLabel ? (
                          <Text style={styles.modelGroupTitle}>{group.groupLabel}</Text>
                        ) : null}
                        <View style={styles.chipsWrap}>
                          {group.models.map((model) => (
                            <FilterChip
                              key={model}
                              label={model}
                              active={selectedModels.includes(model)}
                              onPress={() => onToggleModel(model)}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>{noModelsLabel}</Text>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>{chooseBrandFirstLabel}</Text>
            )}
          </AccordionSection>

          {/* Car type */}
          <AccordionSection
            icon="car-multiple"
            title={carTypeLabel}
            subtitle={selectedCarType}
            expanded={expandedSection === "carType"}
            onToggle={() => toggleSection("carType")}
          >
            <View style={styles.chipsWrap}>
              {availableCarTypes.map((t) => (
                <FilterChip
                  key={t} label={t}
                  active={selectedCarType === t}
                  onPress={() => onSelectCarType(selectedCarType === t ? undefined : t)}
                />
              ))}
            </View>
          </AccordionSection>

          {/* Price */}
          <AccordionSection
            icon="cash-multiple"
            title={priceLabel}
            subtitle={
              selectedPriceFrom !== undefined || selectedPriceTo !== undefined
                ? `${selectedPriceFrom?.toLocaleString() ?? "Any"} – ${selectedPriceTo?.toLocaleString() ?? "Any"} EGP`
                : undefined
            }
            expanded={expandedSection === "price"}
            onToggle={() => toggleSection("price")}
          >
            <YearScroller
              label={priceFromLabel} selectedYear={selectedPriceFrom}
              years={availablePrices}
              expanded={expandedPricePicker === "from"}
              onToggle={() => setExpandedPricePicker((c) => (c === "from" ? null : "from"))}
              onSelect={(v) => { onSelectPriceFrom(v); setExpandedPricePicker(null); }}
              formatter={(v) => `${v.toLocaleString()} EGP`}
            />
            <YearScroller
              label={priceToLabel} selectedYear={selectedPriceTo}
              years={priceToOptions}
              expanded={expandedPricePicker === "to"}
              onToggle={() => setExpandedPricePicker((c) => (c === "to" ? null : "to"))}
              onSelect={(v) => { onSelectPriceTo(v); setExpandedPricePicker(null); }}
              formatter={(v) => `${v.toLocaleString()} EGP`}
            />
          </AccordionSection>

          {/* Year */}
          <AccordionSection
            icon="calendar-range"
            title={yearLabel}
            subtitle={
              selectedYearFrom || selectedYearTo
                ? `${selectedYearFrom ?? "Any"} – ${selectedYearTo ?? "Any"}`
                : undefined
            }
            expanded={expandedSection === "year"}
            onToggle={() => toggleSection("year")}
          >
            <YearScroller
              label={yearFromLabel} selectedYear={selectedYearFrom}
              years={availableYears}
              expanded={expandedYearPicker === "from"}
              onToggle={() => setExpandedYearPicker((c) => (c === "from" ? null : "from"))}
              onSelect={(v) => { onSelectYearFrom(v); setExpandedYearPicker(null); }}
            />
            <YearScroller
              label={yearToLabel} selectedYear={selectedYearTo}
              years={availableYears}
              expanded={expandedYearPicker === "to"}
              onToggle={() => setExpandedYearPicker((c) => (c === "to" ? null : "to"))}
              onSelect={(v) => { onSelectYearTo(v); setExpandedYearPicker(null); }}
            />
          </AccordionSection>

          {/* Mileage */}
          <AccordionSection
            icon="speedometer"
            title={mileageLabel}
            subtitle={
              selectedMileageFrom !== undefined || selectedMileageTo !== undefined
                ? `${selectedMileageFrom ?? "Any"} – ${selectedMileageTo ?? "Any"} KM`
                : undefined
            }
            expanded={expandedSection === "mileage"}
            onToggle={() => toggleSection("mileage")}
          >
            <YearScroller
              label={mileageFromLabel} selectedYear={selectedMileageFrom}
              years={mileageOptions}
              expanded={expandedMileagePicker === "from"}
              onToggle={() => setExpandedMileagePicker((c) => (c === "from" ? null : "from"))}
              onSelect={(v) => { onSelectMileageFrom(v); setExpandedMileagePicker(null); }}
              formatter={(v) => `${v.toLocaleString()} KM`}
            />
            <YearScroller
              label={mileageToLabel} selectedYear={selectedMileageTo}
              years={mileageToOptions}
              expanded={expandedMileagePicker === "to"}
              onToggle={() => setExpandedMileagePicker((c) => (c === "to" ? null : "to"))}
              onSelect={(v) => { onSelectMileageTo(v); setExpandedMileagePicker(null); }}
              formatter={(v) => `${v.toLocaleString()} KM`}
            />
          </AccordionSection>

          {/* Transmission */}
          <AccordionSection
            icon="cog-outline"
            title={transmissionLabel}
            subtitle={selectedTransmission}
            expanded={expandedSection === "transmission"}
            onToggle={() => toggleSection("transmission")}
          >
            <View style={styles.chipsWrap}>
              {availableTransmissions.map((t) => (
                <FilterChip
                  key={t} label={t}
                  active={selectedTransmission === t}
                  onPress={() => onSelectTransmission(selectedTransmission === t ? undefined : t)}
                />
              ))}
            </View>
          </AccordionSection>

          {/* Fuel type */}
          <AccordionSection
            icon="gas-station-outline"
            title={fuelTypeLabel}
            subtitle={selectedFuelType}
            expanded={expandedSection === "fuelType"}
            onToggle={() => toggleSection("fuelType")}
          >
            <View style={styles.chipsWrap}>
              {availableFuelTypes.map((f) => (
                <FilterChip
                  key={f} label={f}
                  active={selectedFuelType === f}
                  onPress={() => onSelectFuelType(selectedFuelType === f ? undefined : f)}
                />
              ))}
            </View>
          </AccordionSection>

          {/* Condition */}
          <AccordionSection
            icon="check-decagram-outline"
            title={conditionLabel}
            subtitle={selectedCondition}
            expanded={expandedSection === "condition"}
            onToggle={() => toggleSection("condition")}
          >
            <View style={styles.chipsWrap}>
              {availableConditions.map((c) => (
                <FilterChip
                  key={c} label={c}
                  active={selectedCondition === c}
                  onPress={() => onSelectCondition(selectedCondition === c ? undefined : c)}
                />
              ))}
            </View>
          </AccordionSection>
        </ScrollView>

        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable style={styles.clearButton} onPress={onClearAll}>
            <Icon source="close-circle-outline" size={16} color={appColors.muted} />
            <Text style={styles.clearButtonText}>{clearAllLabel}</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onApply}>
            <Icon source="magnify" size={16} color={appColors.inkDark} />
            <Text style={styles.primaryButtonText}>
              {resultCount.toLocaleString()} {offersLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  overlayScreen: {
    flex: 1,
  },

  // ── Top bar ─────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingBottom: 14,
    minHeight: 56,
    backgroundColor: appColors.background,
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
  },
  backWrap: {
    paddingLeft: 20,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    zIndex: 2,
  },
  topTitle: {
    flex: 1,
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  topSpacer: {
    width: 68,
  },

  // ── Scroll body ──────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: appSpacing.xxl,
    paddingTop: appSpacing.xl,
    paddingBottom: 120,
    gap: appSpacing.md2,
  },

  // ── Accordion card ───────────────────────────────────────────────────────
  sectionCard: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: appSpacing.xl,
    gap: appSpacing.lg2,
  },
  sectionCardExpanded: {
    borderColor: appColors.borderStrong,
    backgroundColor: appColors.surfaceAlt,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: appRadii.md,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconWrapActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 17,
    lineHeight: 20,
  },
  sectionTitleActive: {
    color: appColors.white,
  },
  sectionSubtitle: {
    color: appColors.primary,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBody: {
    gap: 14,
    paddingTop: 4,
  },

  // ── Search input inside sections ─────────────────────────────────────────
  searchInput: {
    backgroundColor: appColors.inputBg,
  },
  searchOutline: {
    borderRadius: appRadii.lg,
    borderColor: appColors.borderStrong,
  },
  searchContent: {
    color: appColors.white,
    fontFamily: fontFamilies.body,
    fontSize: 15,
  },

  // ── Selected brand/model row ─────────────────────────────────────────────
  selectedRow: {
    minHeight: 52,
    borderRadius: appRadii.xl,
    backgroundColor: appColors.primary,
    paddingHorizontal: appSpacing.xl,
    paddingVertical: appSpacing.md2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appSpacing.lg,
  },
  selectedTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectedLabel: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.body,
    fontSize: 10,
    lineHeight: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.7,
  },
  selectedValue: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
  },
  selectedModelsWrap: {
    gap: 10,
  },

  // ── Filter chips ────────────────────────────────────────────────────────
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md,
  },
  chip: {
    borderRadius: appRadii.pill,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: appSpacing.lg2,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: appColors.inkDark,
  },

  // ── Model groups ────────────────────────────────────────────────────────
  modelGroupsWrap: { gap: 14 },
  modelGroupBlock: { gap: 10 },
  modelGroupTitle: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  emptyText: {
    color: appColors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Year / price / mileage scroller ─────────────────────────────────────
  yearBlock: { gap: 8 },
  yearSubheading: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  yearSelectButton: {
    minHeight: 48,
    borderRadius: appRadii.lg,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    backgroundColor: appColors.inputBg,
    paddingHorizontal: appSpacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appSpacing.lg,
  },
  yearSelectButtonActive: {
    borderColor: appColors.primary,
  },
  yearSelectValue: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  yearSelectValueActive: {
    color: appColors.white,
  },
  yearDropdown: {
    maxHeight: 220,
    borderRadius: appRadii.lg,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    backgroundColor: appColors.surfaceDarker,
    overflow: "hidden",
  },
  yearDropdownContent: {
    paddingVertical: 6,
  },
  yearOption: {
    minHeight: 44,
    paddingHorizontal: appSpacing.xl,
    paddingVertical: 10,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
  },
  yearOptionActive: {
    backgroundColor: appColors.primary,
  },
  yearOptionText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  yearOptionTextActive: {
    color: appColors.inkDark,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: appSpacing.xxl,
    paddingTop: appSpacing.lg2,
    backgroundColor: appColors.background,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
    flexDirection: "row",
    gap: appSpacing.lg,
  },
  clearButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: appRadii.xl,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: appSpacing.md,
  },
  clearButtonText: {
    color: appColors.muted,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  primaryButton: {
    flex: 2,
    minHeight: 56,
    borderRadius: appRadii.xl,
    backgroundColor: appColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: appSpacing.md2,
  },
  primaryButtonText: {
    color: appColors.inkDark,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
