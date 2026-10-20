/**
 * Esquema de validación del login con Zod.
 *
 * Un "schema" describe la FORMA y las REGLAS que deben cumplir los datos.
 * Tiene dos usos en este proyecto:
 *   1) En tiempo de ejecución: zodResolver (en LoginScreen) lo usa para
 *      validar lo que escribe el usuario y producir los mensajes de error.
 *   2) En tiempo de compilación: de él sacamos el tipo LoginFormValues,
 *      así reglas y tipos nunca se desincronizan.
 *
 * Ver CONCEPTOS.md, sección 5.
 */
import { z } from 'zod';

export const loginSchema = z.object({
  // Las reglas se encadenan y se evalúan en orden.
  // El texto de cada regla es el error.message que mostrará FormInput.
  email: z
    .string()
    .trim() // Transforma: quita espacios al inicio/fin antes de validar.
    .min(1, 'El correo electrónico es obligatorio') // min(1) = "no vacío".
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/*
 * z.infer genera un tipo TypeScript a partir del schema:
 *   LoginFormValues = { email: string; password: string }
 *
 * `typeof loginSchema` = "el tipo de la variable loginSchema" (el schema),
 * y z.infer lo convierte en "el tipo de los datos que ese schema acepta".
 * Si mañana agregas un campo al schema, este tipo se actualiza solo.
 */
export type LoginFormValues = z.infer<typeof loginSchema>;
