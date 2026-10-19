import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from '../components/FormInput';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { colors } from '../theme';

export function LoginScreen() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setSubmittedEmail(null);
    // Simulación de petición asíncrona de autenticación
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmittedEmail(data.email);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>
          Ingresa tus credenciales para continuar
        </Text>

        <FormInput
          control={control}
          name="email"
          label="Correo electrónico"
          placeholder="nombre@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('password')}
          submitBehavior="submit"
        />

        <FormInput
          control={control}
          name="password"
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit(onSubmit)}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
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
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
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
