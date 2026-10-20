/**
 * FormSelect: selector de UNA opción conectado a React Hook Form (RHF).
 *
 * Reutiliza la conexión del selector con RHF, su etiqueta y sus errores,
 * igual que FormInput lo hace para las cajas de texto. No crea un formulario:
 * recibe `control` y `name` desde la pantalla que ejecuta useForm().
 *
 * Usa @react-native-picker/picker: desplegable en Android, rueda en iOS y
 * select en web. No incluye búsqueda, escritura libre ni selección múltiple.
 * Está pensado para listas pequeñas, como país, categoría o tipo de cuenta.
 *
 * Cada opción tiene `label` (texto visible) y `value` (texto guardado en RHF).
 * Los valores deben ser únicos; reserva '' para el placeholder y configura
 * defaultValues en useForm, por ejemplo { pais: '' }. Para IDs numéricos,
 * usa su representación como texto y convierte al preparar el envío.
 *
 * Zod se configura en el resolver del formulario, no aquí. Este componente
 * solo presenta el error recibido de RHF. Ver FORMSELECT_EXPLICADO.md para
 * un ejemplo completo y sugerencias de otros componentes de formulario.
 */
import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';
import {
  Controller,
  type Control,
  type FieldPathByValue,
  type FieldPathValue,
  type FieldValues,
} from 'react-hook-form';
import { colors } from '../theme';

export interface FormSelectOption<TValue extends string = string> {
  label: string;
  value: TValue;
}

export interface FormSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> {
  control: Control<TFieldValues>;
  // Solo admite campos cuyo valor sea texto: excluye booleanos, arrays, etc.
  name: TName;
  label: string;
  // Vincula las opciones al tipo del campo, incluso si usa literales como 'CL'.
  // NoInfer hace que el nombre del campo determine el tipo de las opciones.
  options: readonly FormSelectOption<
    Extract<FieldPathValue<TFieldValues, NoInfer<TName>>, string>
  >[];
  placeholder?: string;
  // Al deshabilitarlo, RHF omite este campo de los datos enviados.
  disabled?: boolean;
  testID?: string;
}

export const FormSelect = <
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  label,
  options,
  placeholder = 'Selecciona una opción',
  disabled,
  testID,
}: FormSelectProps<TFieldValues, TName>) => (
  <Controller
    control={control}
    name={name}
    disabled={disabled}
    render={({ field, fieldState: { error } }) => {
      const selectedOption = options.find((option) => option.value === field.value);

      return (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <View
            style={[
              styles.selectContainer,
              error && styles.selectError,
              field.disabled && styles.disabled,
            ]}
          >
            {field.disabled ? (
              // En iOS Picker no admite enabled=false de forma uniforme.
              // Mostramos texto estático para impedir también cambios con VoiceOver.
              <Text
                testID={testID}
                accessibilityLabel={`${label}: ${selectedOption?.label ?? placeholder}`}
                accessibilityState={{ disabled: true }}
                style={styles.disabledValue}
              >
                {selectedOption?.label ?? placeholder}
              </Text>
            ) : (
              <Picker<string>
                // RHF puede solicitar foco; el Picker nativo lo soporta en Android.
                ref={field.ref}
                testID={testID}
                accessibilityLabel={label}
                accessibilityHint={error?.message}
                // RHF es la fuente del valor: reset/setValue actualizan el selector.
                selectedValue={typeof field.value === 'string' ? field.value : ''}
                onValueChange={(nextValue) => {
                  field.onChange(nextValue);
                  // iOS no emite el mismo onBlur que Android. Consideramos el
                  // campo tocado al seleccionar, también para validar en modo onBlur.
                  field.onBlur();
                }}
                // En Android/web, salir sin cambiar también marca el campo tocado.
                onBlur={field.onBlur}
                mode="dropdown"
                style={styles.picker}
                itemStyle={styles.item}
                dropdownIconColor={colors.text.secondary}
              >
                {/* '' permite representar o volver al estado "sin selección". */}
                <Picker.Item label={placeholder} value="" color={colors.text.secondary} />
                {options.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    color={colors.text.primary}
                  />
                ))}
              </Picker>
            )}
          </View>
          {error?.message ? (
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              {error.message}
            </Text>
          ) : null}
        </View>
      );
    }}
  />
);

// Compartimos la paleta de FormInput. No forzamos una altura de 48 en iOS:
// la rueda nativa necesita más espacio que un input o un desplegable Android.
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
  selectContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  selectError: {
    borderColor: colors.border.error,
    backgroundColor: colors.status.errorBackground,
  },
  picker: {
    width: '100%',
    minHeight: 48,
    color: colors.text.primary,
    fontSize: 16,
  },
  item: {
    fontSize: 16,
    color: colors.text.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  disabledValue: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.status.error,
  },
});
