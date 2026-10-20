// useState: hook para recordar si el input está enfocado (cambia el borde).
import React, { useState } from 'react';
// Componentes nativos de React Native y el tipo de props de TextInput.
import {
  StyleSheet, // Crea un objeto de estilos reutilizable (mejor que inline).
  Text, // Texto estático: label y mensaje de error.
  TextInput, // Campo de texto nativo (iOS/Android).
  type TextInputProps, // Tipo de todas las props que acepta TextInput.
  View, // Contenedor (equivalente a un <div> en web).
} from 'react-native';
// React Hook Form: conecta este input al estado del formulario.
import {
  Controller, // Puente entre RHF y un input no controlado por RHF.
  type Control, // Tipo del objeto que "controla" todos los campos del form.
  type FieldPath, // Tipo: nombre válido de un campo (ej. "email" | "password").
  type FieldValues, // Tipo base: un objeto con los valores del formulario.
} from 'react-hook-form';
// Paleta de colores del proyecto (evita hardcodear hex en cada componente).
import { colors } from '../theme';

// Props del componente. Es genérico: TFieldValues es la forma del formulario
// (ej. { email: string; password: string }). Así name y control quedan tipados.
interface FormInputProps<TFieldValues extends FieldValues>
  // Hereda todas las props de TextInput EXCEPTO value y onChangeText:
  // esas las maneja React Hook Form, no el padre.
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<TFieldValues>; // Instancia del form (viene de useForm).
  name: FieldPath<TFieldValues>; // Qué campo registra este input ("email", etc.).
  label: string; // Texto visible encima del campo.
}

// Componente genérico: sirve para cualquier formulario tipado, no solo login.
export const FormInput = <TFieldValues extends FieldValues>({
  control, // Controlador del form (quién guarda email/password, etc.).
  name, // Nombre del campo que este input representa.
  label, // Etiqueta que se muestra al usuario.
  style, // Estilo extra que el padre puede pasar (se mezcla al final).
  onFocus, // Callback opcional del padre cuando el input gana foco.
  onBlur: onInputBlur, // onBlur del padre, renombrado para no chocar con RHF.
  ...textInputProps // Resto de props nativas: placeholder, secureTextEntry, etc.
}: FormInputProps<TFieldValues>) => {
  // Estado local de UI: true mientras el usuario está escribiendo aquí.
  // Solo afecta el estilo del borde, no el valor del formulario.
  const [isFocused, setIsFocused] = useState(false);

  return (
    // Controller: RHF llama a render() cada vez que cambia este campo.
    <Controller
      control={control} // Formulario al que pertenece este campo.
      name={name} // Clave dentro de los values (debe coincidir con el schema).
      render={({
        field: { onChange, onBlur, value, ref }, // API del campo de RHF.
        fieldState: { error }, // error?.message si Zod/RHF falló la validación.
      }) => (
        // Contenedor vertical: label + input + (opcional) error.
        <View style={styles.container}>
          {/* Título del campo, siempre visible. */}
          <Text style={styles.label}>{label}</Text>
          <TextInput
            ref={ref} // Permite setFocus('email') desde LoginScreen.
            value={value} // Valor actual que guarda React Hook Form.
            onChangeText={onChange} // Cada tecla actualiza el form state.
            onFocus={(e) => {
              setIsFocused(true); // Activa el borde de "foco".
              onFocus?.(e); // Encadena el onFocus que haya pasado el padre.
            }}
            onBlur={(e) => {
              setIsFocused(false); // Quita el borde de foco.
              onBlur(); // Avisa a RHF: el campo se tocó (útil para validar).
              onInputBlur?.(e); // Encadena el onBlur nativo del padre, si existe.
            }}
            placeholderTextColor={colors.text.muted} // Color del placeholder.
            style={[
              styles.input, // Estilo base (siempre).
              isFocused && styles.inputFocused, // Si hay foco: borde destacado.
              error && styles.inputError, // Si hay error: borde/fondo rojo.
              style, // Override del padre (última prioridad).
            ]}
            {...textInputProps} // keyboardType, secureTextEntry, placeholder...
          />
          {/* Solo muestra el texto de error si Zod/RHF produjo un mensaje. */}
          {error?.message ? (
            <Text style={styles.errorText}>{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
};

// Estilos estáticos: se crean una vez, no en cada render.
const styles = StyleSheet.create({
  container: {
    marginBottom: 18, // Separación entre un FormInput y el siguiente.
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6, // Espacio entre el label y el input.
  },
  input: {
    height: 48, // Altura táctil cómoda en móvil (~48dp).
    borderWidth: 1,
    borderColor: colors.border.default, // Borde neutro en reposo.
    borderRadius: 10,
    paddingHorizontal: 14, // Respiro interno a izquierda/derecha.
    fontSize: 16, // 16 evita zoom automático en iOS al enfocar.
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.border.focus, // Destaca el campo activo.
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.border.error, // Feedback visual de validación.
    backgroundColor: colors.status.errorBackground,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.status.error,
  },
});
