# Login App — React Native + Expo (SDK 57)

Aplicación móvil construida con **React Native**, **Expo SDK 57** y **TypeScript**, implementando las mejores prácticas profesionales para el manejo de formularios (**React Hook Form + Zod**) y un sistema de diseño con colores centralizados (`src/theme`).

---

## 1. Creación del proyecto

El proyecto fue inicializado utilizando la plantilla oficial de TypeScript para Expo SDK 57:

```bash
npx create-expo-app@latest login --template blank-typescript@sdk-57
```

---

## 2. Manejo de Formularios (Estándar Profesional)

En el ecosistema profesional de React Native + Expo, la combinación estándar para crear formularios escalables, tipados y de alto rendimiento es **React Hook Form + Zod**:

- **`react-hook-form`**: Gestiona el estado del formulario mediante `<Controller />`, aislando los re-renders únicamente al input que cambia y facilitando el manejo nativo del foco (`setFocus`).
- **`zod`**: Define esquemas de validación declarativos e infiere automáticamente los tipos estáticos de TypeScript (`z.infer`).
- **`@hookform/resolvers`**: Conecta los esquemas de `zod` con `react-hook-form`.

### Comando de instalación en Expo

Siempre se utiliza `npx expo install` para garantizar versiones compatibles con el SDK actual:

```bash
npx expo install react-hook-form zod @hookform/resolvers
```

---

## 3. Estructura de Carpetas Profesional

El código fuente está organizado dentro del directorio `src/` siguiendo una separación clara de responsabilidades:

```text
login/
├── src/
│   ├── components/
│   │   └── FormInput.tsx        # Input reutilizable conectado a React Hook Form (<Controller />)
│   ├── schemas/
│   │   └── login.schema.ts      # Esquema Zod y tipos inferidos para el formulario de Login
│   ├── screens/
│   │   └── LoginScreen.tsx      # Pantalla principal de inicio de sesión
│   └── theme/
│       ├── colors.ts            # Paleta de colores semántica y centralizada (Design Tokens)
│       └── index.ts             # Barrel export del tema
├── App.tsx                      # Punto de entrada de la UI
├── index.ts                     # Registro raíz de Expo
├── package.json
└── tsconfig.json
```

---

## 4. Centralización de Colores (`src/theme/colors.ts`)

Para evitar valores hexadecimales *hardcodeados* en las hojas de estilo (`StyleSheet.create`), todos los colores se centralizan de forma semántica en `src/theme/colors.ts`:

```ts
import { colors } from '../theme';

// Uso en estilos:
// backgroundColor: colors.background
// color: colors.text.primary
// borderColor: colors.border.error
```

Categorías disponibles en `colors`:
- **`primary` / `primaryDark` / `primaryLight`**: Colores de marca e interacción principal.
- **`background` / `surface`**: Fondos de pantalla y tarjetas/contenedores.
- **`text`**: Jerarquía tipográfica (`primary`, `secondary`, `muted`, `inverse`).
- **`border`**: Estados de bordes (`default`, `focus`, `error`).
- **`status`**: Estados de feedback (`error`, `errorBackground`, `success`, `successBackground`, `warning`).

---

## 5. Comandos de Desarrollo

```bash
# Iniciar el servidor de desarrollo de Expo
npx expo start

# Ejecutar en Android / iOS / Web
npx expo start --android
npx expo start --ios
npx expo start --web

# Verificar tipos de TypeScript
npx tsc --noEmit
```
