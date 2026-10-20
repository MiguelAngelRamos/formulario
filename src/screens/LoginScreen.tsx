/**
 * Pantalla de login. Aquí se CREA el formulario; FormInput solo lo consume.
 *
 * Flujo completo:
 *   1. useForm() crea el store del formulario (valores, errores, estados).
 *   2. Cada <FormInput> recibe `control` y un `name`, y se conecta a su campo.
 *   3. El usuario escribe → el valor se guarda en el store de RHF.
 *   4. Al pulsar "Entrar", handleSubmit valida TODO con Zod:
 *        - Si hay errores → los guarda en el store y cada FormInput los muestra.
 *        - Si todo es válido → llama a onSubmit(data) con los datos ya tipados.
 *
 * Ver CONCEPTOS.md, secciones 2 y 6.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, // Spinner de carga nativo.
  KeyboardAvoidingView, // Evita que el teclado tape los inputs.
  Platform, // Permite saber si estamos en iOS o Android.
  Pressable, // Botón táctil que expone si está presionado.
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm } from 'react-hook-form';
// Adaptador que permite a RHF validar usando un schema de Zod.
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from '../components/FormInput';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { colors } from '../theme';

export const LoginScreen = () => {
  // Estado de la pantalla (no del formulario): email que se envió con éxito,
  // para mostrar el banner verde. `string | null` = puede ser texto o nada.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  /*
   * useForm<LoginFormValues>(...) crea el formulario.
   * El genérico <LoginFormValues> le dice a RHF la forma de los datos, así
   * `control`, `setFocus('password')` y `data` en onSubmit quedan tipados.
   *
   * De todo lo que devuelve useForm tomamos solo lo que usamos:
   *   - control:      llave al store; se pasa a cada FormInput.
   *   - handleSubmit: envuelve onSubmit para validar antes de llamarlo.
   *   - setFocus:     mueve el foco a un campo por su nombre.
   *   - formState:    estado general; isSubmitting es true mientras
   *                   onSubmit (que es async) no ha terminado.
   */
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    // resolver: QUIÉN valida. En vez de reglas sueltas en cada input,
    // delegamos toda la validación al schema de Zod.
    resolver: zodResolver(loginSchema),
    // Valores iniciales. Importante darlos: así los inputs empiezan como
    // controlados ('' en vez de undefined) y RHF puede saber si algo cambió.
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Solo se ejecuta si la validación pasó. `data` ya viene limpio y tipado
  // (por ejemplo, el email ya pasó por .trim() del schema).
  const onSubmit = async (data: LoginFormValues) => {
    setSubmittedEmail(null);
    // Simulación de petición asíncrona de autenticación
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmittedEmail(data.email);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      // iOS y Android manejan el teclado distinto; cada uno funciona mejor con un modo.
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>
          Ingresa tus credenciales para continuar
        </Text>

        {/*
          control y name son las props propias de FormInput.
          Todo lo demás (placeholder, keyboardType...) son props normales de
          TextInput que FormInput deja pasar gracias a `extends Omit<TextInputProps, ...>`.
        */}
        <FormInput
          control={control}
          name="email" // Debe ser una clave de LoginFormValues; TS lo verifica.
          label="Correo electrónico"
          placeholder="nombre@empresa.com"
          keyboardType="email-address" // Teclado con @ y .com
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email" // Autocompletado del sistema (Android).
          textContentType="emailAddress" // Autocompletado del sistema (iOS).
          returnKeyType="next" // La tecla "Enter" muestra "Siguiente".
          // Al pulsar "Siguiente", RHF mueve el foco al campo password.
          // Funciona porque FormInput pasa el `ref` de Controller al TextInput.
          onSubmitEditing={() => setFocus('password')}
          submitBehavior="submit" // No cierra el teclado al pasar al siguiente campo.
        />

        <FormInput
          control={control}
          name="password"
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          secureTextEntry // Oculta los caracteres (••••).
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          // Pulsar "Listo" en el teclado envía el formulario igual que el botón.
          onSubmitEditing={handleSubmit(onSubmit)}
        />

        <Pressable
          // style puede ser una función: Pressable nos dice si está presionado.
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
          // handleSubmit(onSubmit) NO ejecuta onSubmit ahora: devuelve una
          // función nueva que, al pulsar, valida y luego llama a onSubmit.
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting} // Evita doble envío mientras "carga".
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        {submittedEmail ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              Sesión validada correctamente para {submittedEmail}
            </Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1, // Ocupa todo el espacio disponible.
    backgroundColor: colors.background,
    justifyContent: 'center', // Centra la tarjeta verticalmente.
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  button: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  successBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.status.successBackground,
  },
  successText: {
    color: colors.status.success,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
