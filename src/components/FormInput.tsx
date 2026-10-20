/**
 * FormInput: un TextInput "conectado" a React Hook Form (RHF).
 *
 * Sirve para reutilizar campos de texto con etiqueta, estilos de foco y
 * mensajes de error, sin repetir la conexión con RHF en cada pantalla.
 * Es un componente opcional del proyecto: usar RHF y Zod no obliga a crearlo.
 * Zod define las reglas en el esquema; FormInput muestra los errores que
 * recibe de RHF, sin depender directamente de Zod.
 *
 * Se puede usar para correo, nombre, contraseña y otros valores de texto.
 * También admite un área de texto mediante `multiline` y un estilo de altura.
 * Un teclado numérico sigue entregando texto; las conversiones y máscaras
 * requieren lógica adicional. Para un select/combobox se necesita otro
 * componente que conecte el selector con RHF, porque este usa un TextInput.
 * Ese selector reutilizable está disponible en FormSelect.tsx.
 *
 * Idea general:
 *   LoginScreen crea el formulario con useForm() y obtiene `control`.
 *   Le pasa `control` + `name` a este componente, y aquí <Controller> se
 *   encarga de leer/escribir el valor de ESE campo en el store de RHF.
 *
 *   LoginScreen ──control, name="email"──▶ FormInput ──▶ <Controller> ──▶ <TextInput>
 *                                                         ▲          │
 *                                                         └─ value ──┘ (onChange al escribir)
 *
 * Ver CONCEPTOS.md (secciones 2, 3 y 4) para la teoría completa.
 * Ver FORMINPUT_EXPLICADO.md para ejemplos y criterios de reutilización.
 */
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  // `type` delante indica que solo importamos un TIPO de TypeScript.
  // No existe en tiempo de ejecución: desaparece al compilar.
  type TextInputProps, // Todas las props que acepta <TextInput>: placeholder, keyboardType, etc.
  View,
} from 'react-native';
import {
  // Componente que conecta un input "externo" (como TextInput de RN) con RHF.
  // En web se puede usar register(); en React Native se usa Controller porque
  // TextInput no expone un DOM nativo al que RHF pueda engancharse.
  Controller,
  type Control, // Tipo del objeto `control` que devuelve useForm(). Es la "llave" al store.
  type FieldPath, // Tipo que calcula los nombres de campo válidos: "email" | "password".
  type FieldValues, // Tipo base de RHF: "cualquier objeto con valores de formulario".
} from 'react-hook-form';
import { colors } from '../theme';

/*
 * ───────────────────────────── LAS PROPS ─────────────────────────────
 *
 * Leamos la declaración por partes:
 *
 *   interface FormInputProps<TFieldValues extends FieldValues>
 *
 *   1) <TFieldValues ...>  → GENÉRICO: un "parámetro de tipo". Igual que una
 *      función recibe parámetros de valor, la interfaz recibe un tipo.
 *      Cuando LoginScreen use <FormInput control={control} .../>, TypeScript
 *      deducirá TFieldValues = LoginFormValues = { email: string; password: string }.
 *
 *   2) extends FieldValues → RESTRICCIÓN del genérico: "TFieldValues puede ser
 *      cualquier tipo, SIEMPRE QUE sea un objeto de valores de formulario".
 *      Aquí `extends` significa "debe ser compatible con".
 *
 *   extends Omit<TextInputProps, 'value' | 'onChangeText'>
 *
 *   3) Este segundo `extends` es HERENCIA de interfaz: "FormInputProps tiene
 *      todas las propiedades de este otro tipo, más las que declaro abajo".
 *
 *   4) Omit<T, K> → tipo utilitario de TypeScript: "T sin las claves K".
 *      Tomamos todas las props de TextInput y QUITAMOS value y onChangeText,
 *      porque esas las controla RHF. Así, si alguien escribe
 *      <FormInput value="x" />, TypeScript da error: el padre no debe tocarlas.
 *
 * Resultado: FormInputProps = (props de TextInput − value − onChangeText)
 *                             + control + name + label
 */
interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  // El objeto que devuelve useForm(). Contiene el store con los valores,
  // errores y reglas. Sin él, Controller no sabe a qué formulario pertenece.
  control: Control<TFieldValues>;
  // Nombre del campo dentro del formulario. Gracias a FieldPath, solo se
  // aceptan claves reales: name="email" ✅, name="emial" ❌ (error de TS).
  name: FieldPath<TFieldValues>;
  // Texto que se muestra encima del input.
  label: string;
}

/*
 * El componente también es genérico: <TFieldValues extends FieldValues>.
 * Así sirve para cualquier formulario (login, registro, perfil...) y en
 * cada uso TypeScript sabe exactamente qué nombres de campo son válidos.
 *
 * En los parámetros usamos DESESTRUCTURACIÓN: sacamos de `props` las que
 * necesitamos tratar aparte, y el resto se agrupa en `textInputProps`.
 */
export const FormInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  style, // Lo sacamos para aplicarlo AL FINAL del array de estilos (ver abajo).
  onFocus, // Lo sacamos porque necesitamos ejecutar lógica propia además de la del padre.
  // `onBlur: onInputBlur` = "toma la prop onBlur y guárdala con el nombre onInputBlur".
  // Lo renombramos porque Controller también nos da un `onBlur` y chocarían.
  onBlur: onInputBlur,
  // "Rest operator": todas las demás props (placeholder, keyboardType,
  // secureTextEntry...) quedan en este objeto para pasarlas tal cual al TextInput.
  ...textInputProps
}: FormInputProps<TFieldValues>) => {
  // Estado LOCAL de UI, no del formulario: solo sirve para pintar el borde azul.
  // RHF no necesita saber si el input tiene foco, por eso usamos useState.
  const [isFocused, setIsFocused] = useState(false);

  return (
    /*
     * <Controller> se suscribe al campo `name` dentro del store de RHF.
     * Cada vez que ese campo cambia (valor o error), vuelve a llamar a
     * `render` con datos frescos. Solo se re-renderiza ESTE campo,
     * no todo el formulario: esa es una de las ventajas de RHF.
     */
    <Controller
      control={control}
      name={name}
      render={({
        /*
         * `field`: lo necesario para conectar el input al store.
         *   - value:    valor actual del campo guardado en RHF.
         *   - onChange: función para guardar un valor nuevo en RHF.
         *   - onBlur:   avisa a RHF que el usuario salió del campo ("touched").
         *   - ref:      referencia al input, permite que RHF le dé foco (setFocus).
         */
        field: { onChange, onBlur, value, ref },
        /*
         * `fieldState`: el estado de validación de este campo.
         *   - error: existe si Zod rechazó el valor; error.message es el
         *            texto definido en login.schema.ts.
         */
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            ref={ref}
            // Input CONTROLADO: lo que se ve en pantalla es siempre lo que
            // hay en el store de RHF.
            value={value}
            // Al escribir, TextInput llama onChangeText(texto) y nosotros
            // lo enviamos directo a RHF con onChange(texto).
            onChangeText={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              // `?.()` = llamar solo si existe. El padre puede no haber pasado onFocus.
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur(); // El de RHF: marca el campo como "tocado".
              onInputBlur?.(e); // El del padre, si lo pasó.
            }}
            placeholderTextColor={colors.text.muted}
            // En React Native `style` acepta un array: los estilos se
            // aplican en orden y los posteriores sobrescriben a los anteriores.
            // `condición && estilo` da `false` si no se cumple, y RN ignora los `false`.
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              error && styles.inputError,
              style, // El del padre va último para que pueda sobrescribir todo.
            ]}
            // Spread: reparte aquí el resto de props recibidas
            // (placeholder, keyboardType, secureTextEntry, returnKeyType...).
            {...textInputProps}
          />
          {/* Renderizado condicional: el mensaje solo aparece si hay error. */}
          {error?.message ? (
            <Text style={styles.errorText}>{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
};

// StyleSheet.create se ejecuta una sola vez al cargar el archivo,
// no en cada render, y React Native puede optimizarlo.
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
    height: 48, // Tamaño táctil mínimo recomendado en móvil (~48dp).
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16, // Con menos de 16, iOS hace zoom automático al enfocar.
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
