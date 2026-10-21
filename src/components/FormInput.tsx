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
 * Declaración completa (la que está justo debajo de este bloque):
 *
 *   interface FormInputProps<TFieldValues extends FieldValues>
 *     extends Omit<TextInputProps, 'value' | 'onChangeText'> {
 *     control: Control<TFieldValues>;
 *     name: FieldPath<TFieldValues>;
 *     label: string;
 *   }
 *
 * ── 1. Dos objetos distintos: no confundirlos ──
 *
 *   TFieldValues   = los DATOS del formulario.
 *                    Ej: { email: string; password: string }
 *   FormInputProps = las PROPS del componente:
 *                    control, name, label + las heredadas de TextInput.
 *
 *   Las props heredadas (placeholder, keyboardType, secureTextEntry...)
 *   pertenecen a FormInputProps, NUNCA a TFieldValues. TFieldValues solo
 *   describe qué campos guarda el formulario y de qué tipo es cada uno.
 *
 * ── 2. Partes de la cabecera ──
 *
 *   FormInputProps            → nombre de la interfaz.
 *   <TFieldValues ...>        → PARÁMETRO DE TIPO (genérico). Igual que una
 *                               función recibe valores como parámetros, la
 *                               interfaz recibe un tipo. NO es el contenido
 *                               de la interfaz.
 *   extends FieldValues       → restricción de ese parámetro (punto 3).
 *   extends Omit<...>         → herencia de la interfaz (punto 3).
 *   { control; name; label }  → propiedades propias.
 *
 *   Contenido de la interfaz = propiedades entre llaves + propiedades heredadas.
 *
 * ── 3. Los dos `extends` hacen cosas diferentes ──
 *
 *   a) DENTRO de < >:  <TFieldValues extends FieldValues>
 *      RESTRICCIÓN del genérico: "TFieldValues puede ser cualquier tipo,
 *      SIEMPRE QUE sea un objeto de valores de formulario".
 *      FieldValues = Record<string, any> (objeto con claves string).
 *      Aquí `extends` significa "debe ser compatible con". NO agrega
 *      propiedades a FormInputProps.
 *
 *   b) FUERA de < >:   extends Omit<TextInputProps, 'value' | 'onChangeText'>
 *      HERENCIA de la interfaz: FormInputProps recibe todas las propiedades
 *      de ese tipo, además de las declaradas entre llaves. SÍ suma propiedades.
 *
 *   Regla: dentro de < > restringe; fuera de < > hereda.
 *
 * ── 4. Herencia: por qué va en la cabecera y qué produce ──
 *
 *   Va en la cabecera porque esa es la gramática de TypeScript, igual que en
 *   `class Hijo extends Padre {`. El efecto es una fusión: equivale a copiar
 *   a mano todas las props de TextInput dentro de las llaves, excepto value
 *   y onChangeText.
 *
 *   Omit<T, K> es un tipo utilitario de TypeScript: "T sin las claves K".
 *
 *   Las heredadas son casi todas opcionales (llevan ?): el padre puede no
 *   pasarlas. control, name y label no llevan ?: son obligatorias.
 *
 * ── 5. Por qué se omiten value y onChangeText ──
 *
 *   Las controla el <Controller> de RHF: value sale del store y onChangeText
 *   escribe en el store. Si el padre pudiera pasarlas, competirían con el
 *   formulario. Al omitirlas, <FormInput value="x" /> da error de TypeScript.
 *
 * ── 6. Los dos usos de < > ──
 *
 *   a) DECLARAR un genérico:  interface FormInputProps<TFieldValues ...>
 *      Crea el parámetro TFieldValues.
 *   b) PASAR un argumento de tipo a un genérico existente:  Control<TFieldValues>
 *      Control ya es genérico (lo define RHF); le pasamos TFieldValues.
 *
 *   En la línea `control: Control<TFieldValues>;`
 *     - a la izquierda de los dos puntos: el NOMBRE de la propiedad (control).
 *     - a la derecha: su TIPO (Control<TFieldValues>).
 *   control NO es de tipo TFieldValues ni string: es de tipo
 *   Control<TFieldValues>, "el objeto control de un formulario cuyos datos
 *   tienen la forma TFieldValues". Lo mismo aplica a name:
 *   FieldPath<TFieldValues> = "una de las claves de TFieldValues".
 *
 * ── 7. Esto es TypeScript general, no algo de RHF ──
 *
 *   Cualquier interfaz puede tener genéricos:
 *     interface Caja<T> { contenido: T }          → Caja<number>
 *     interface Par<T, U> { a: T; b: U }          → varios parámetros
 *     interface Lista<T extends object> { ... }   → restricción (opcional)
 *     interface Etiqueta<T = string> { valor: T } → valor por defecto
 *
 * ── 8. Para qué sirve el genérico aquí ──
 *
 *   Solo tipa las propiedades que dependen del formulario: control y name.
 *   label y las heredadas tienen tipos fijos (string, boolean...), iguales
 *   para cualquier formulario.
 *
 *   Alternativas:
 *     - Control<LoginFormValues> fijo → solo sirve para el login.
 *     - Control<FieldValues> general  → name aceptaría cualquier string;
 *                                       name="emial" no daría error.
 *     - Con genérico                  → reutilizable Y tipado en cada uso.
 *
 * ── 9. Ejemplo expandido: uso en LoginScreen ──
 *
 *   LoginScreen escribe <FormInput control={control} name="email" ... />.
 *   Como su `control` es Control<LoginFormValues>, TypeScript deduce
 *   TFieldValues = LoginFormValues = { email: string; password: string }
 *   y la interfaz queda así:
 *
 *   {
 *     control: Control<{ email: string; password: string }>;
 *     name: "email" | "password";
 *     label: string;
 *     // Heredadas de TextInputProps (todas opcionales):
 *     placeholder?: string;
 *     keyboardType?: KeyboardTypeOptions;
 *     secureTextEntry?: boolean;
 *     autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
 *     style?: StyleProp<TextStyle>;
 *     onFocus?: (e) => void;
 *     onBlur?: (e) => void;
 *     // ...resto de TextInputProps, sin value ni onChangeText.
 *   }
 *
 *   Por eso name="email" ✅ y name="emial" ❌ (error de TS).
 */
interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  // Nombre: control. Tipo: Control<TFieldValues>.
  // El objeto que devuelve useForm(). Contiene el store con los valores,
  // errores y reglas. Sin él, Controller no sabe a qué formulario pertenece.
  control: Control<TFieldValues>;
  // Nombre: name. Tipo: FieldPath<TFieldValues> (las claves de los datos).
  // Solo se aceptan claves reales: name="email" ✅, name="emial" ❌ (error de TS).
  name: FieldPath<TFieldValues>;
  // Tipo fijo, no depende del genérico. Texto que se muestra encima del input.
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
