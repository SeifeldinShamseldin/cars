import { Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Button, Card, Chip, HelperText, Text, TextInput } from "react-native-paper";

import type { SellerListingOption } from "../../../shared/lib/sellerListingOptions";
import { BackArrow } from "../../../shared/components/BackArrow";
import { appColors } from "../../../shared/theme/paperTheme";
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
  backLabel,
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
        <BackArrow label={backLabel} onPress={onBack} />
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
    borderRadius: 24,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.ice,
  },
  content: {
    gap: 14,
  },
  formArea: {
    maxHeight: 440,
  },
  title: {
    color: appColors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.displayBold,
  },
  subtitle: {
    color: appColors.inkSoft,
    lineHeight: 22,
  },
  formScroll: {
    maxHeight: 440,
  },
  formContent: {
    gap: 12,
    paddingBottom: 6,
  },
  input: {
    backgroundColor: appColors.surfaceAlt,
    borderRadius: 18,
  },
  helper: {
    color: appColors.inkSoft,
    marginLeft: 0,
  },
  grid: {
    gap: 12,
  },
  optionGroup: {
    gap: 10,
  },
  optionLabel: {
    color: appColors.ink,
    fontSize: 16,
    fontFamily: fontFamilies.display,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: appColors.surfaceAlt,
  },
  photosHelper: {
    color: appColors.inkSoft,
    lineHeight: 20,
  },
  addPhotosButton: {
    borderRadius: 16,
    borderColor: appColors.ice,
  },
  addPhotosLabel: {
    color: appColors.ink,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoCard: {
    width: 110,
    gap: 8,
  },
  photoPreview: {
    width: 110,
    height: 90,
    borderRadius: 14,
    backgroundColor: appColors.surfaceAlt,
  },
  removePhotoLabel: {
    color: appColors.danger,
  },
  button: {
    borderRadius: 18,
    backgroundColor: appColors.primary,
  },
  buttonContent: {
    minHeight: 56,
  },
});
