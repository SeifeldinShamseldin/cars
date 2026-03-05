import { Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Button, Card, Chip, HelperText, Text, TextInput } from "react-native-paper";

import type { SellerListingOption } from "../../../shared/lib/sellerListingOptions";
import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
import { appRadii, appSpacing } from "../../../shared/theme/tokens";
import { fontFamilies } from "../../../shared/theme/typography";

type SellerPostCarScreenProps = {
  title: string;
  subtitle: string;
  brandLabel: string;
  modelLabel: string;
  yearLabel: string;
  priceLabel: string;
  mileageLabel: string;
  rimSizeLabel: string;
  colorLabel: string;
  descriptionLabel: string;
  bodyTypeLabel: string;
  conditionLabel: string;
  fuelTypeLabel: string;
  transmissionLabel: string;
  negotiableLabel: string;
  accidentHistoryLabel: string;
  photosLabel: string;
  addPhotosLabel: string;
  photosHelperLabel: string;
  removePhotoLabel: string;
  submitLabel: string;
  backLabel: string;
  brandHelperLabel: string;
  modelHelperLabel: string;
  emptyModelsLabel: string;
  brandValue: string;
  modelValue: string;
  isModelEnabled: boolean;
  yearValue: string;
  priceValue: string;
  mileageValue: string;
  rimSizeValue: string;
  colorValue: string;
  descriptionValue: string;
  imageUris: string[];
  bodyTypeValue: string;
  conditionValue: string;
  fuelTypeValue: string;
  transmissionValue: string;
  isNegotiableValue: string;
  accidentHistoryValue: string;
  brandSuggestions: string[];
  modelSuggestions: string[];
  bodyTypeOptions: SellerListingOption<string>[];
  conditionOptions: SellerListingOption<string>[];
  fuelTypeOptions: SellerListingOption<string>[];
  transmissionOptions: SellerListingOption<string>[];
  yesNoOptions: SellerListingOption<string>[];
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
  onChangeBrand: (value: string) => void;
  onChangeModel: (value: string) => void;
  onChangeYear: (value: string) => void;
  onChangePrice: (value: string) => void;
  onChangeMileage: (value: string) => void;
  onChangeRimSize: (value: string) => void;
  onChangeColor: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onAddPhotos: () => void;
  onRemovePhoto: (imageUri: string) => void;
  onSelectBrand: (value: string) => void;
  onSelectModel: (value: string) => void;
  onSelectBodyType: (value: string) => void;
  onSelectCondition: (value: string) => void;
  onSelectFuelType: (value: string) => void;
  onSelectTransmission: (value: string) => void;
  onSelectNegotiable: (value: string) => void;
  onSelectAccidentHistory: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const OptionGroup = ({
  label,
  options,
  selectedValue,
  onSelect,
}: {
  label: string;
  options: SellerListingOption<string>[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) => (
  <View style={styles.optionGroup}>
    <Text style={styles.optionLabel}>{label}</Text>
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={selectedValue === option.value}
          onPress={() => onSelect(option.value)}
          style={styles.chip}
          selectedColor={appColors.ink}
        >
          {option.label}
        </Chip>
      ))}
    </View>
  </View>
);

const inputProps = {
  textColor: appColors.white,
  placeholderTextColor: appColors.muted,
  selectionColor: appColors.primary,
};

export const SellerPostCarScreen = ({
  title,
  subtitle,
  brandLabel,
  modelLabel,
  yearLabel,
  priceLabel,
  mileageLabel,
  rimSizeLabel,
  colorLabel,
  descriptionLabel,
  bodyTypeLabel,
  conditionLabel,
  fuelTypeLabel,
  transmissionLabel,
  negotiableLabel,
  accidentHistoryLabel,
  photosLabel,
  addPhotosLabel,
  photosHelperLabel,
  removePhotoLabel,
  submitLabel,
  brandHelperLabel,
  modelHelperLabel,
  emptyModelsLabel,
  brandValue,
  modelValue,
  isModelEnabled,
  yearValue,
  priceValue,
  mileageValue,
  rimSizeValue,
  colorValue,
  descriptionValue,
  imageUris,
  bodyTypeValue,
  conditionValue,
  fuelTypeValue,
  transmissionValue,
  isNegotiableValue,
  accidentHistoryValue,
  brandSuggestions,
  modelSuggestions,
  bodyTypeOptions,
  conditionOptions,
  fuelTypeOptions,
  transmissionOptions,
  yesNoOptions,
  isSubmitting,
  errorMessage,
  successMessage,
  onChangeBrand,
  onChangeModel,
  onChangeYear,
  onChangePrice,
  onChangeMileage,
  onChangeRimSize,
  onChangeColor,
  onChangeDescription,
  onAddPhotos,
  onRemovePhoto,
  onSelectBrand,
  onSelectModel,
  onSelectBodyType,
  onSelectCondition,
  onSelectFuelType,
  onSelectTransmission,
  onSelectNegotiable,
  onSelectAccidentHistory,
  onSubmit,
  onBack,
}: SellerPostCarScreenProps) => (
  <Pressable onPress={Keyboard.dismiss} style={styles.pressable}>
    <Card mode="elevated" style={styles.card}>
      <Card.Content style={styles.content}>
        <BackArrow onPress={onBack} />
        <Text style={styles.title}>{title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>

        <View style={styles.formArea}>
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <TextInput
            {...inputProps}
            mode="flat"
            label={brandLabel}
            value={brandValue}
            onChangeText={onChangeBrand}
            style={styles.input}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <HelperText type="info" style={styles.helper}>
            {brandHelperLabel}
          </HelperText>
          <View style={styles.chipRow}>
            {brandSuggestions.map((brand) => (
              <Chip key={brand} onPress={() => onSelectBrand(brand)} style={styles.chip}>
                {brand}
              </Chip>
            ))}
          </View>

        <TextInput
          {...inputProps}
          mode="flat"
          label={modelLabel}
          value={modelValue}
          onChangeText={onChangeModel}
          disabled={!isModelEnabled}
          style={styles.input}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <HelperText type="info" style={styles.helper}>
          {modelSuggestions.length > 0 ? modelHelperLabel : emptyModelsLabel}
        </HelperText>
        <View style={styles.chipRow}>
          {modelSuggestions.map((model) => (
            <Chip key={model} onPress={() => onSelectModel(model)} style={styles.chip}>
              {model}
            </Chip>
          ))}
        </View>

        <View style={styles.grid}>
          <TextInput
            {...inputProps}
            mode="flat"
            label={yearLabel}
            value={yearValue}
            onChangeText={onChangeYear}
            style={styles.input}
            keyboardType="number-pad"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <TextInput
            {...inputProps}
            mode="flat"
            label={priceLabel}
            value={priceValue}
            onChangeText={onChangePrice}
            style={styles.input}
            keyboardType="number-pad"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <TextInput
            {...inputProps}
            mode="flat"
            label={mileageLabel}
            value={mileageValue}
            onChangeText={onChangeMileage}
            style={styles.input}
            keyboardType="number-pad"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <TextInput
            {...inputProps}
            mode="flat"
            label={rimSizeLabel}
            value={rimSizeValue}
            onChangeText={onChangeRimSize}
            style={styles.input}
            keyboardType="number-pad"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </View>

        <TextInput
          {...inputProps}
          mode="flat"
          label={colorLabel}
          value={colorValue}
          onChangeText={onChangeColor}
          style={styles.input}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />

        <OptionGroup
          label={bodyTypeLabel}
          options={bodyTypeOptions}
          selectedValue={bodyTypeValue}
          onSelect={onSelectBodyType}
        />
        <OptionGroup
          label={conditionLabel}
          options={conditionOptions}
          selectedValue={conditionValue}
          onSelect={onSelectCondition}
        />
        <OptionGroup
          label={fuelTypeLabel}
          options={fuelTypeOptions}
          selectedValue={fuelTypeValue}
          onSelect={onSelectFuelType}
        />
        <OptionGroup
          label={transmissionLabel}
          options={transmissionOptions}
          selectedValue={transmissionValue}
          onSelect={onSelectTransmission}
        />
        <OptionGroup
          label={negotiableLabel}
          options={yesNoOptions}
          selectedValue={isNegotiableValue}
          onSelect={onSelectNegotiable}
        />
        <OptionGroup
          label={accidentHistoryLabel}
          options={yesNoOptions}
          selectedValue={accidentHistoryValue}
          onSelect={onSelectAccidentHistory}
        />

        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>{photosLabel}</Text>
          <Text variant="bodyMedium" style={styles.photosHelper}>
            {photosHelperLabel}
          </Text>
          <Button
            mode="outlined"
            onPress={onAddPhotos}
            style={styles.addPhotosButton}
            labelStyle={styles.addPhotosLabel}
          >
            {addPhotosLabel}
          </Button>
          {imageUris.length > 0 ? (
            <View style={styles.photoGrid}>
              {imageUris.map((imageUri) => (
                <View key={imageUri} style={styles.photoCard}>
                  <Image source={imageUri} style={styles.photoPreview} contentFit="cover" />
                  <Button
                    mode="text"
                    onPress={() => onRemovePhoto(imageUri)}
                    compact
                    labelStyle={styles.removePhotoLabel}
                  >
                    {removePhotoLabel}
                  </Button>
                </View>
              ))}
            </View>
          ) : null}
        </View>

          <TextInput
            {...inputProps}
            mode="flat"
            label={descriptionLabel}
            value={descriptionValue}
            onChangeText={onChangeDescription}
            multiline
            numberOfLines={5}
            style={styles.input}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />

            <HelperText type={errorMessage ? "error" : "info"} style={styles.helper}>
              {errorMessage ?? successMessage ?? " "}
            </HelperText>
          </ScrollView>
        </View>

        <Button
          mode="contained"
          onPress={onSubmit}
          disabled={isSubmitting}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {submitLabel}
        </Button>
      </Card.Content>
    </Card>
  </Pressable>
);

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    borderRadius: appRadii.xxxl,
    backgroundColor: appColors.mutedCard,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  content: {
    gap: appSpacing.lg2,
  },
  formArea: {
    maxHeight: 440,
  },
  title: {
    color: appColors.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.displayBold,
  },
  subtitle: {
    color: appColors.muted,
    lineHeight: 22,
  },
  formScroll: {
    maxHeight: 440,
  },
  formContent: {
    gap: appSpacing.lg,
    paddingBottom: appSpacing.sm,
  },
  input: {
    backgroundColor: appColors.inputBg,
    borderWidth: 1,
    borderColor: appColors.inputBorder,
    borderRadius: appRadii.xl,
  },
  helper: {
    color: appColors.muted,
    marginLeft: 0,
  },
  grid: {
    gap: appSpacing.lg,
  },
  optionGroup: {
    gap: appSpacing.md2,
  },
  optionLabel: {
    color: appColors.white,
    fontSize: 16,
    fontFamily: fontFamilies.display,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.md,
  },
  chip: {
    backgroundColor: appColors.surfaceAlt,
  },
  photosHelper: {
    color: appColors.muted,
    lineHeight: 20,
  },
  addPhotosButton: {
    borderRadius: appRadii.lg,
    borderColor: appColors.border,
  },
  addPhotosLabel: {
    color: appColors.white,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appSpacing.lg,
  },
  photoCard: {
    width: 110,
    gap: appSpacing.md,
  },
  photoPreview: {
    width: 110,
    height: 90,
    borderRadius: appRadii.md,
    backgroundColor: appColors.surfaceAlt,
  },
  removePhotoLabel: {
    color: appColors.danger,
  },
  button: {
    borderRadius: appRadii.xl,
    backgroundColor: appColors.white,
  },
  buttonContent: {
    minHeight: 56,
  },
  buttonLabel: {
    color: appColors.inkDark,
  },
});
