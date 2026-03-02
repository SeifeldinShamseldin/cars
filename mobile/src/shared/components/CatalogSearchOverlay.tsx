import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CarReferenceModelGroup } from "../api/catalog";
import { appColors } from "../theme/paperTheme";
import { fontFamilies } from "../theme/typography";
import { BackArrow } from "./BackArrow";
import { CatalogHeader } from "./CatalogHeader";

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

const FilterChip = ({ label, active, onPress, showCloseIcon = false }: FilterChipProps) => (
  <Pressable
    onPress={onPress}
    style={[styles.chip, active ? styles.chipActive : null]}
  >
    <View style={styles.chipContent}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
        {label}
      </Text>
      {showCloseIcon ? (
        <Icon
          source="close"
          size={14}
          color={active ? appColors.primaryDeep : appColors.inkSoft}
        />
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
  <View style={styles.sectionCard}>
    <Pressable style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIconWrap}>
          <Icon source={icon} size={20} color={appColors.primary} />
        </View>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Icon
        source={expanded ? "chevron-up" : "chevron-down"}
        size={22}
        color={appColors.inkSoft}
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
    <Pressable style={styles.yearSelectButton} onPress={onToggle}>
      <Text style={styles.yearSelectValue}>
        {selectedYear !== undefined ? (formatter ? formatter(selectedYear) : selectedYear) : "Any"}
      </Text>
      <Icon
        source={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color={appColors.inkSoft}
      />
    </Pressable>
    {expanded ? (
      <View style={styles.yearDropdown}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          contentContainerStyle={styles.yearDropdownContent}
        >
          <Pressable
            onPress={() => onSelect(undefined)}
            style={[
              styles.yearOption,
              selectedYear === undefined ? styles.yearOptionActive : null,
            ]}
          >
            <Text
              style={[
                styles.yearOptionText,
                selectedYear === undefined ? styles.yearOptionTextActive : null,
              ]}
            >
              Any
            </Text>
          </Pressable>
          {years.map((year) => (
            <Pressable
              key={`${label}-${year}`}
              onPress={() => onSelect(selectedYear === year ? undefined : year)}
              style={[
                styles.yearOption,
                selectedYear === year ? styles.yearOptionActive : null,
              ]}
            >
              <Text
                style={[
                  styles.yearOptionText,
                  selectedYear === year ? styles.yearOptionTextActive : null,
                ]}
              >
                {formatter ? formatter(year) : year}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    ) : null}
  </View>
);

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

    for (let mileage = 0; mileage <= 1_000_000; mileage += 10_000) {
      values.push(mileage);
    }

    return values;
  }, []);
  const mileageToOptions = useMemo(() => {
    if (selectedMileageFrom === undefined) {
      return mileageOptions;
    }

    return mileageOptions.filter((value) => value >= selectedMileageFrom + 10_000);
  }, [mileageOptions, selectedMileageFrom]);
  const priceToOptions = useMemo(() => {
    if (selectedPriceFrom === undefined) {
      return availablePrices;
    }

    return availablePrices.filter((value) => value >= selectedPriceFrom + 100_000);
  }, [availablePrices, selectedPriceFrom]);

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

  useEffect(() => {
    setModelSearch("");
  }, [selectedBrand]);

  const filteredBrands = useMemo(() => {
    const normalizedBrandSearch = brandSearch.trim().toLowerCase();

    if (normalizedBrandSearch.length === 0) {
      return availableBrands;
    }

    return availableBrands.filter((brand) =>
      brand.toLowerCase().includes(normalizedBrandSearch),
    );
  }, [availableBrands, brandSearch]);

  const filteredModelGroups = useMemo(() => {
    const normalizedModelSearch = modelSearch.trim().toLowerCase();

    if (normalizedModelSearch.length === 0) {
      return availableModelGroups;
    }

    return availableModelGroups
      .map((group) => ({
        ...group,
        models: group.models.filter((model) =>
          model.toLowerCase().includes(normalizedModelSearch),
        ),
      }))
      .filter((group) => group.models.length > 0);
  }, [availableModelGroups, modelSearch]);

  const toggleSection = (
    section: "brand" | "model" | "carType" | "price" | "year" | "mileage" | "transmission" | "fuelType" | "condition",
  ) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.root}>
        <View style={styles.overlayScreen}>
          <View
            style={[
              styles.topBar,
              {
                paddingTop: Math.max(insets.top, 12),
              },
            ]}
          >
            <View style={styles.backWrap}>
              <BackArrow onPress={onBack} />
            </View>
            <Text style={styles.topTitle}>{title}</Text>
            <View style={styles.topSpacer} />
          </View>

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
                style={styles.brandSearchInput}
                outlineStyle={styles.brandSearchOutline}
                contentStyle={styles.brandSearchContent}
                left={<TextInput.Icon icon="magnify" color={appColors.inkSoft} />}
                right={
                  brandSearch.trim().length > 0 ? (
                    <TextInput.Icon
                      icon="close"
                      color={appColors.inkSoft}
                      onPress={() => setBrandSearch("")}
                    />
                  ) : null
                }
              />
              {selectedBrand ? (
                <Pressable
                  style={styles.selectedBrandRow}
                  onPress={() => onSelectBrand(undefined)}
                >
                  <View style={styles.selectedBrandTextWrap}>
                    <Text style={styles.selectedBrandLabel}>Selected brand</Text>
                    <Text style={styles.selectedBrandValue}>{selectedBrand}</Text>
                  </View>
                  <Icon source="close" size={18} color={appColors.primaryDeep} />
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

            <AccordionSection
              icon="car-info"
              title={modelLabel}
              subtitle={
                selectedModels.length > 0
                  ? selectedModels.length === 1
                    ? selectedModels[0]
                    : `${selectedModels.length} selected`
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
                    style={styles.brandSearchInput}
                    outlineStyle={styles.brandSearchOutline}
                    contentStyle={styles.brandSearchContent}
                    left={<TextInput.Icon icon="magnify" color={appColors.inkSoft} />}
                    right={
                      modelSearch.trim().length > 0 ? (
                        <TextInput.Icon
                          icon="close"
                          color={appColors.inkSoft}
                          onPress={() => setModelSearch("")}
                        />
                      ) : null
                    }
                  />
                  {selectedModels.length > 0 ? (
                    <View style={styles.selectedModelsWrap}>
                      <Text style={styles.selectedBrandLabel}>Selected models</Text>
                      <View style={styles.chipsWrap}>
                        {selectedModels.map((model) => (
                          <FilterChip
                            key={`selected-${model}`}
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
                    {filteredModelGroups.map((group, index) => (
                      <View
                        key={`${group.groupLabel ?? "other"}-${index}`}
                        style={styles.modelGroupBlock}
                      >
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
                    <Text style={styles.emptyModelsText}>{noModelsLabel}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.emptyModelsText}>{chooseBrandFirstLabel}</Text>
              )}
            </AccordionSection>

            <AccordionSection
              icon="car-multiple"
              title={carTypeLabel}
              subtitle={selectedCarType}
              expanded={expandedSection === "carType"}
              onToggle={() => toggleSection("carType")}
            >
              <View style={styles.chipsWrap}>
                {availableCarTypes.map((carType) => (
                  <FilterChip
                    key={carType}
                    label={carType}
                    active={selectedCarType === carType}
                    onPress={() =>
                      onSelectCarType(selectedCarType === carType ? undefined : carType)
                    }
                  />
                ))}
              </View>
            </AccordionSection>

            <AccordionSection
              icon="cash-multiple"
              title={priceLabel}
              subtitle={
                selectedPriceFrom !== undefined || selectedPriceTo !== undefined
                  ? `${selectedPriceFrom?.toLocaleString() ?? "Any"} - ${selectedPriceTo?.toLocaleString() ?? "Any"} EGP`
                  : undefined
              }
              expanded={expandedSection === "price"}
              onToggle={() => toggleSection("price")}
            >
              <YearScroller
                label={priceFromLabel}
                selectedYear={selectedPriceFrom}
                years={availablePrices}
                expanded={expandedPricePicker === "from"}
                onToggle={() =>
                  setExpandedPricePicker((current) => (current === "from" ? null : "from"))
                }
                onSelect={(value) => {
                  onSelectPriceFrom(value);
                  setExpandedPricePicker(null);
                }}
                formatter={(value) => `${value.toLocaleString()} EGP`}
              />

              <YearScroller
                label={priceToLabel}
                selectedYear={selectedPriceTo}
                years={priceToOptions}
                expanded={expandedPricePicker === "to"}
                onToggle={() =>
                  setExpandedPricePicker((current) => (current === "to" ? null : "to"))
                }
                onSelect={(value) => {
                  onSelectPriceTo(value);
                  setExpandedPricePicker(null);
                }}
                formatter={(value) => `${value.toLocaleString()} EGP`}
              />
            </AccordionSection>

            <AccordionSection
              icon="calendar-range"
              title={yearLabel}
              subtitle={
                selectedYearFrom || selectedYearTo
                  ? `${selectedYearFrom ?? "Any"} - ${selectedYearTo ?? "Any"}`
                  : undefined
              }
              expanded={expandedSection === "year"}
              onToggle={() => toggleSection("year")}
            >
              <YearScroller
                label={yearFromLabel}
                selectedYear={selectedYearFrom}
                years={availableYears}
                expanded={expandedYearPicker === "from"}
                onToggle={() =>
                  setExpandedYearPicker((current) => (current === "from" ? null : "from"))
                }
                onSelect={(value) => {
                  onSelectYearFrom(value);
                  setExpandedYearPicker(null);
                }}
              />

              <YearScroller
                label={yearToLabel}
                selectedYear={selectedYearTo}
                years={availableYears}
                expanded={expandedYearPicker === "to"}
                onToggle={() =>
                  setExpandedYearPicker((current) => (current === "to" ? null : "to"))
                }
                onSelect={(value) => {
                  onSelectYearTo(value);
                  setExpandedYearPicker(null);
                }}
              />
            </AccordionSection>

            <AccordionSection
              icon="speedometer"
              title={mileageLabel}
              subtitle={
                selectedMileageFrom !== undefined || selectedMileageTo !== undefined
                  ? `${selectedMileageFrom ?? "Any"} - ${selectedMileageTo ?? "Any"} KM`
                  : undefined
              }
              expanded={expandedSection === "mileage"}
              onToggle={() => toggleSection("mileage")}
            >
              <YearScroller
                label={mileageFromLabel}
                selectedYear={selectedMileageFrom}
                years={mileageOptions}
                expanded={expandedMileagePicker === "from"}
                onToggle={() =>
                  setExpandedMileagePicker((current) => (current === "from" ? null : "from"))
                }
                onSelect={(value) => {
                  onSelectMileageFrom(value);
                  setExpandedMileagePicker(null);
                }}
                formatter={(value) => `${value.toLocaleString()} KM`}
              />

              <YearScroller
                label={mileageToLabel}
                selectedYear={selectedMileageTo}
                years={mileageToOptions}
                expanded={expandedMileagePicker === "to"}
                onToggle={() =>
                  setExpandedMileagePicker((current) => (current === "to" ? null : "to"))
                }
                onSelect={(value) => {
                  onSelectMileageTo(value);
                  setExpandedMileagePicker(null);
                }}
                formatter={(value) => `${value.toLocaleString()} KM`}
              />
            </AccordionSection>

            <AccordionSection
              icon="cog-outline"
              title={transmissionLabel}
              subtitle={selectedTransmission}
              expanded={expandedSection === "transmission"}
              onToggle={() => toggleSection("transmission")}
            >
              <View style={styles.chipsWrap}>
                {availableTransmissions.map((transmission) => (
                  <FilterChip
                    key={transmission}
                    label={transmission}
                    active={selectedTransmission === transmission}
                    onPress={() =>
                      onSelectTransmission(
                        selectedTransmission === transmission ? undefined : transmission,
                      )
                    }
                  />
                ))}
              </View>
            </AccordionSection>

            <AccordionSection
              icon="gas-station-outline"
              title={fuelTypeLabel}
              subtitle={selectedFuelType}
              expanded={expandedSection === "fuelType"}
              onToggle={() => toggleSection("fuelType")}
            >
              <View style={styles.chipsWrap}>
                {availableFuelTypes.map((fuelType) => (
                  <FilterChip
                    key={fuelType}
                    label={fuelType}
                    active={selectedFuelType === fuelType}
                    onPress={() =>
                      onSelectFuelType(selectedFuelType === fuelType ? undefined : fuelType)
                    }
                  />
                ))}
              </View>
            </AccordionSection>

            <AccordionSection
              icon="check-decagram-outline"
              title={conditionLabel}
              subtitle={selectedCondition}
              expanded={expandedSection === "condition"}
              onToggle={() => toggleSection("condition")}
            >
              <View style={styles.chipsWrap}>
                {availableConditions.map((condition) => (
                  <FilterChip
                    key={condition}
                    label={condition}
                    active={selectedCondition === condition}
                    onPress={() =>
                      onSelectCondition(selectedCondition === condition ? undefined : condition)
                    }
                  />
                ))}
              </View>
            </AccordionSection>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[
                styles.clearButton,
                {
                  marginBottom: Math.max(insets.bottom, 12),
                },
              ]}
              onPress={onClearAll}
            >
              <Icon source="close-circle-outline" size={18} color={appColors.white} />
              <Text style={styles.clearButtonText}>{clearAllLabel}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryButton,
                {
                  marginBottom: Math.max(insets.bottom, 12),
                },
              ]}
              onPress={onApply}
            >
              <Icon source="magnify" size={18} color={appColors.primaryDeep} />
              <Text style={styles.primaryButtonText}>
                {resultCount.toLocaleString()} {offersLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  overlayScreen: {
    flex: 1,
  },
  topBar: {
    zIndex: 40,
    elevation: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    minHeight: 56,
    backgroundColor: appColors.background,
  },
  backWrap: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  topTitle: {
    flex: 1,
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 18,
    lineHeight: 20,
    textAlign: "center",
  },
  topSpacer: {
    width: 48,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.ice,
    padding: 16,
    gap: 14,
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
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: appColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 20,
    lineHeight: 22,
  },
  sectionSubtitle: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 16,
  },
  sectionBody: {
    gap: 14,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectedBrandRow: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: appColors.primary,
    borderWidth: 1,
    borderColor: appColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectedBrandTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectedBrandLabel: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.body,
    fontSize: 11,
    lineHeight: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedBrandValue: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 15,
    lineHeight: 18,
  },
  brandSearchInput: {
    backgroundColor: appColors.surface,
  },
  brandSearchOutline: {
    borderRadius: 16,
    borderColor: appColors.ice,
  },
  brandSearchContent: {
    color: appColors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 15,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.ice,
    backgroundColor: appColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  chipText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
  },
  chipTextActive: {
    color: appColors.primaryDeep,
  },
  yearBlock: {
    gap: 10,
  },
  yearSelectButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.ice,
    backgroundColor: appColors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  yearSelectValue: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  yearDropdown: {
    maxHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.ice,
    backgroundColor: appColors.surface,
    overflow: "hidden",
  },
  yearDropdownContent: {
    paddingVertical: 6,
  },
  yearOption: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  yearOptionActive: {
    backgroundColor: appColors.primary,
  },
  yearOptionText: {
    color: appColors.ink,
    fontFamily: fontFamilies.displayBold,
    fontSize: 14,
    lineHeight: 16,
  },
  yearOptionTextActive: {
    color: appColors.primaryDeep,
  },
  modelGroupsWrap: {
    gap: 14,
  },
  modelGroupBlock: {
    gap: 10,
  },
  selectedModelsWrap: {
    gap: 10,
  },
  modelGroupTitle: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyModelsText: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  yearSubheading: {
    color: appColors.inkSoft,
    fontFamily: fontFamilies.displayBold,
    fontSize: 13,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 0,
    backgroundColor: appColors.background,
    borderTopWidth: 1,
    borderTopColor: appColors.ice,
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: appColors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButtonText: {
    color: appColors.white,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
  },
  primaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: appColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: appColors.primaryDeep,
    fontFamily: fontFamilies.displayBold,
    fontSize: 16,
    lineHeight: 18,
  },
});
