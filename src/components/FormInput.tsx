import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { colors } from '../theme';

interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
}

export function FormInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  style,
  onFocus,
  onBlur: onInputBlur,
  ...textInputProps
}: FormInputProps<TFieldValues>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value, ref },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur();
              onInputBlur?.(e);
            }}
            placeholderTextColor={colors.text.muted}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              error && styles.inputError,
              style,
            ]}
            {...textInputProps}
          />
          {error?.message ? (
            <Text style={styles.errorText}>{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.border.focus,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.border.error,
    backgroundColor: colors.status.errorBackground,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.status.error,
  },
});
