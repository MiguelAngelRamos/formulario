# Conceptos del proyecto Login

Guía para entender este proyecto desde cero. Léela en orden: cada sección se apoya en la anterior.

1. [Mapa del proyecto](#1-mapa-del-proyecto)
2. [React Hook Form: la idea central](#2-react-hook-form-la-idea-central)
3. [Controller: conectar inputs de React Native](#3-controller-conectar-inputs-de-react-native)
4. [TypeScript: genéricos, `extends` y `Omit`](#4-typescript-genéricos-extends-y-omit)
5. [Zod: validación con schemas](#5-zod-validación-con-schemas)
6. [El recorrido completo de un login](#6-el-recorrido-completo-de-un-login)
7. [JavaScript moderno que aparece en el código](#7-javascript-moderno-que-aparece-en-el-código)
8. [Glosario rápido](#8-glosario-rápido)

---

## 1. Mapa del proyecto

```
index.ts                     → Registra <App /> como punto de entrada
App.tsx                      → Componente raíz, muestra LoginScreen
src/
  screens/LoginScreen.tsx    → CREA el formulario con useForm()
  components/FormInput.tsx   → Input reutilizable conectado al formulario
  schemas/login.schema.ts    → Reglas de validación (Zod) + tipo de los datos
  theme/colors.ts            → Paleta de colores
  theme/index.ts             → Re-exporta el tema (barrel file)
```

Las librerías clave son tres:

| Librería | Para qué sirve |
|---|---|
| `react-hook-form` (RHF) | Guarda los valores del formulario, sus errores y su estado |
| `zod` | Define las reglas: "el email es obligatorio y tiene formato válido" |
| `@hookform/resolvers` | Adaptador que permite que RHF valide usando Zod |

---

## 2. React Hook Form: la idea central

### ¿Qué problema resuelve?

Sin una librería, cada campo necesita su propio `useState`, su propio manejo de errores, su lógica de "¿ya lo tocó el usuario?", etc. Con muchos campos esto crece rápido.

```tsx
// Sin RHF: todo a mano
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);
const [password, setPassword] = useState('');
const [passwordError, setPasswordError] = useState<string | null>(null);
// ...y validar, limpiar errores, evitar doble envío...
```

RHF centraliza todo eso.

### El "store" (sobre el "storage")

Dices que RHF usa un *storage*; la idea va por ahí, pero hay que precisarla:

- **No** es `localStorage` ni `AsyncStorage`. No guarda nada en disco y los datos se pierden al cerrar la app.
- Es un **store en memoria**: un objeto interno que RHF crea cuando llamas a `useForm()`. Ahí viven:
  - los **valores** de cada campo (`{ email: '...', password: '...' }`)
  - los **errores** de validación
  - estados como `isSubmitting`, `isDirty` (¿cambió algo?), `touchedFields` (¿qué campos se visitaron?)
- RHF guarda ese store en **refs**, no en `useState`. Por eso escribir en un campo **no re-renderiza toda la pantalla**: solo se actualizan los componentes que están "suscritos" a ese campo. Es su principal ventaja de rendimiento.

```
            useForm()
               │
               ▼
   ┌───────────────────────────┐
   │   STORE (en memoria)      │
   │  values: { email, pass }  │
   │  errors: { email?: ... }  │
   │  isSubmitting: false      │
   └───────────────────────────┘
        ▲               ▲
        │ control       │ control
  FormInput "email"   FormInput "password"
```

### ¿Qué devuelve `useForm()`?

```tsx
const { control, handleSubmit, setFocus, formState } = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
});
```

| Pieza | Qué es |
|---|---|
| `control` | La "llave" del store. Se pasa a cada input para que pueda leer y escribir en él. |
| `handleSubmit(fn)` | Devuelve una función que **primero valida** y, solo si todo está bien, llama a `fn(data)`. |
| `setFocus('campo')` | Pone el cursor en un campo por su nombre. |
| `formState` | Estado general: `isSubmitting`, `errors`, `isValid`, `isDirty`... |
| `resolver` | Quién valida. Aquí: el schema de Zod. |
| `defaultValues` | Valores iniciales. Conviene darlos siempre (`''` en vez de `undefined`). |

> **Ojo con `handleSubmit(onSubmit)`**: no ejecuta `onSubmit` en ese momento. Crea una función nueva que se ejecutará al pulsar el botón. Por eso se puede escribir directamente en `onPress={handleSubmit(onSubmit)}`.

---

## 3. Controller: conectar inputs de React Native

En la web, RHF suele usar `register('email')`, que se engancha directamente al `<input>` del navegador. En React Native **no hay DOM**, así que `<TextInput>` no puede registrarse así. Por eso se usa `<Controller>`.

`Controller` funciona como un **adaptador**:

```tsx
<Controller
  control={control}     // ¿A qué formulario pertenezco?
  name="email"          // ¿Qué campo del store manejo?
  render={({ field, fieldState }) => (
    <TextInput
      value={field.value}           // leer del store
      onChangeText={field.onChange} // escribir en el store
      onBlur={field.onBlur}         // avisar "el usuario salió del campo"
      ref={field.ref}               // permite setFocus('email')
    />
  )}
/>
```

`render` es una función que Controller llama cada vez que ese campo cambia. Recibe:

- **`field`**: lo necesario para conectar el input (`value`, `onChange`, `onBlur`, `ref`).
- **`fieldState`**: el estado de validación del campo (`error`, `isTouched`, `isDirty`).

`FormInput.tsx` es justamente esto, empaquetado en un componente reutilizable y con estilos, label y mensaje de error.

### `onFocus` y `onBlur`: entrar y salir de un campo

Un campo de texto siempre está en uno de dos estados: **con foco** (el cursor está ahí, el teclado está abierto y lo que escribes va a ese campo) o **sin foco**.

- **Focus** = el campo **gana** el foco. Se dispara `onFocus`.
- **Blur** = el campo **pierde** el foco. Se dispara `onBlur`.

"Blur" en inglés significa "desenfocar": la palabra viene de la web, donde el elemento activo queda "desenfocado" cuando pasas a otro. Es simplemente lo contrario de focus.

```
  (sin foco)  ──toca el campo──▶  (CON FOCO)  ──sale del campo──▶  (sin foco)
                     │                                  │
                  onFocus                             onBlur
```

#### ¿Cuándo pierde el foco un `TextInput` en React Native?

- El usuario toca **otro** input (el primero recibe `onBlur`, el segundo `onFocus`).
- Se cierra el teclado (por ejemplo con `Keyboard.dismiss()`).
- Pulsa la tecla de retorno del teclado y el input está configurado para soltar el foco al enviar.
- El código llama a `ref.current?.blur()` o mueve el foco con `setFocus('otroCampo')`.

> Tocar una zona vacía de la pantalla **no** quita el foco por sí solo en React Native. Si quieres ese comportamiento, se envuelve la pantalla en un `Pressable`/`TouchableWithoutFeedback` que llame a `Keyboard.dismiss()`.

#### ¿Para qué sirve en este proyecto?

En `FormInput`, el `onBlur` del `TextInput` hace **tres cosas**:

```tsx
onBlur={(e) => {
  setIsFocused(false); // 1. UI: quitar el borde azul
  onBlur();            // 2. RHF: marcar el campo como "tocado"
  onInputBlur?.(e);    // 3. Padre: ejecutar su onBlur si pasó uno
}}
```

1. **Estado visual.** `isFocused` es un `useState` local que pinta el borde azul mientras escribes. Al salir, vuelve a `false`.
2. **Avisar a React Hook Form.** `field.onBlur()` le dice al store: *"el usuario ya visitó este campo y lo dejó"*. RHF lo marca como **touched** (`fieldState.isTouched = true`, y aparece en `formState.touchedFields`).
3. **Respetar al padre.** Como `FormInput` acepta todas las props de `TextInput`, el padre podría pasar su propio `onBlur` (por ejemplo, para formatear un teléfono al salir). Por eso se renombra a `onInputBlur` y se llama también; si no, se perdería en silencio.

#### "Touched" y cuándo se valida

Marcar un campo como *touched* importa porque RHF puede usarlo para decidir **cuándo** mostrar errores. Se configura con la opción `mode` de `useForm`:

| `mode` | ¿Cuándo valida? | Sensación para el usuario |
|---|---|---|
| `'onSubmit'` (por defecto, el de este proyecto) | Al pulsar "Entrar" | No ves errores hasta intentar enviar |
| `'onBlur'` | Cada vez que sales de un campo | El error aparece al pasar al siguiente campo |
| `'onTouched'` | En el primer blur, y luego en cada cambio | Muy usado: no molesta mientras escribes la primera vez, pero corrige al instante después |
| `'onChange'` | En cada tecla | Inmediato, pero puede resultar agresivo ("email inválido" al escribir la primera letra) |

```tsx
useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  mode: 'onTouched', // ejemplo: validar al salir del campo
});
```

Con `'onBlur'` u `'onTouched'`, **si no llamaras a `field.onBlur()`**, RHF nunca se enteraría de que saliste del campo y esa validación no ocurriría jamás. Es el error más típico al conectar inputs a mano con `Controller`.

#### Ejemplo de recorrido (con `mode: 'onTouched'`)

```
1. Toca "Email"            → onFocus  → borde azul
2. Escribe "ana@"          → onChange → store.values.email = "ana@"   (aún sin validar)
3. Toca "Contraseña"       → onBlur en Email
                               ├─ borde azul fuera
                               ├─ email marcado como touched
                               └─ Zod valida → "Ingresa un correo electrónico válido"
4. Vuelve y escribe ".com" → onChange → como ya está touched, revalida en cada tecla
                               → el error desaparece al instante
```

---

## 4. TypeScript: genéricos, `extends` y `Omit`

Esta es la parte que más cuesta. Vamos a desarmar la interfaz:

```ts
interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
}
```

### 4.1 `interface`: describir la forma de un objeto

Una interfaz dice qué propiedades debe tener un objeto y de qué tipo.

```ts
interface Persona {
  nombre: string;
  edad: number;
}
```

En React se usa para describir las **props** de un componente.

### 4.2 Genéricos: `<TFieldValues>`

Un genérico es un **parámetro de tipo**. Igual que una función recibe valores, un tipo puede recibir otros tipos.

```ts
// Función normal: recibe un VALOR
function saludar(nombre: string) { ... }

// Tipo genérico: recibe un TIPO
interface Caja<T> {
  contenido: T;
}

const cajaDeTexto: Caja<string> = { contenido: 'hola' };
const cajaDeNumero: Caja<number> = { contenido: 42 };
```

En nuestro caso, `TFieldValues` representa **la forma del formulario**. Cuando LoginScreen usa `<FormInput control={control} ... />`, TypeScript lo deduce solo:

```
TFieldValues = LoginFormValues = { email: string; password: string }
```

Gracias a eso, el mismo `FormInput` sirve para un formulario de login, uno de registro, etc., y en cada caso sabe qué campos existen.

### 4.3 Los dos significados de `extends`

`extends` aparece **dos veces** y significa cosas distintas según dónde esté.

**a) Dentro de `< >`: restricción de un genérico**

```ts
<TFieldValues extends FieldValues>
```

Se lee: *"TFieldValues puede ser cualquier tipo, **siempre que** sea compatible con `FieldValues`"* (o sea, un objeto con valores de formulario). Evita que alguien pase algo absurdo como `FormInput<number>`.

```ts
function largo<T extends { length: number }>(x: T) {
  return x.length;
}
largo('hola');    // ✅ string tiene length
largo([1, 2, 3]); // ✅ array tiene length
largo(42);        // ❌ number no tiene length
```

**b) Después del nombre de la interfaz: herencia**

```ts
interface FormInputProps<...> extends Omit<TextInputProps, ...> { ... }
```

Se lee: *"FormInputProps tiene **todas** las propiedades de este otro tipo, **más** las que declaro entre llaves"*.

```ts
interface Animal { nombre: string }
interface Perro extends Animal { raza: string }
// Perro = { nombre: string; raza: string }
```

### 4.4 `Omit<T, K>`: quitar propiedades

`Omit` es un tipo utilitario incluido en TypeScript. Crea un tipo nuevo igual a `T` pero **sin** las claves `K`.

```ts
interface Usuario { id: number; nombre: string; password: string }

type UsuarioPublico = Omit<Usuario, 'password'>;
// = { id: number; nombre: string }
```

En el proyecto:

```ts
Omit<TextInputProps, 'value' | 'onChangeText'>
```

= "todas las props de `TextInput` (placeholder, keyboardType, secureTextEntry, onFocus...) **excepto** `value` y `onChangeText`".

**¿Por qué quitarlas?** Porque esas dos las maneja React Hook Form a través de Controller. Si el padre pudiera pasar su propio `value`, habría dos fuentes de verdad peleándose. Al quitarlas, TypeScript da error si alguien lo intenta:

```tsx
<FormInput control={control} name="email" label="Email" value="x" />
//                                                       ^^^^^ ❌ error de TS
```

> El `|` en `'value' | 'onChangeText'` es una **unión**: "value **o** onChangeText". Aquí sirve para listar varias claves a quitar.

### 4.5 Resultado final

```
FormInputProps = (todas las props de TextInput − value − onChangeText)
                 + control + name + label
```

Por eso en LoginScreen puedes pasarle a `FormInput` cosas como `placeholder`, `secureTextEntry` o `returnKeyType`: vienen "heredadas" de `TextInputProps`.

### 4.6 Los tipos de React Hook Form

| Tipo | Qué representa | Ejemplo con login |
|---|---|---|
| `FieldValues` | Cualquier objeto de valores de formulario | — (es la base) |
| `Control<T>` | El objeto `control` de un formulario con forma `T` | `Control<LoginFormValues>` |
| `FieldPath<T>` | Los nombres de campo válidos de `T` | `'email' \| 'password'` |

`FieldPath` es lo que hace que `name="emial"` (con typo) dé error antes de ejecutar la app.

### 4.7 `type` en los imports

```ts
import { Controller, type Control } from 'react-hook-form';
```

`type` marca que `Control` es **solo un tipo**: existe para que TypeScript revise el código, pero se borra al compilar. `Controller`, en cambio, es código real que se ejecuta.

---

## 5. Zod: validación con schemas

Un **schema** es la descripción de cómo deben ser los datos:

```ts
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'El correo electrónico es obligatorio').email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria').min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
```

- Las reglas se **encadenan** y se revisan en orden; la primera que falla define el mensaje.
- El texto de cada regla es exactamente el `error.message` que muestra `FormInput`.
- `.trim()` no valida, **transforma**: quita espacios antes de seguir.

### Un schema, dos usos

```ts
export type LoginFormValues = z.infer<typeof loginSchema>;
// = { email: string; password: string }
```

- `typeof loginSchema` → "el tipo de la variable `loginSchema`".
- `z.infer<...>` → "el tipo de los datos que ese schema acepta".

Así las **reglas** (en ejecución) y el **tipo** (en compilación) salen de la misma fuente y nunca se desincronizan.

### `zodResolver`: el puente

```ts
useForm({ resolver: zodResolver(loginSchema) })
```

Cuando RHF necesita validar, le pasa los valores al resolver; este ejecuta Zod y traduce los errores al formato que RHF guarda en su store.

---

## 6. El recorrido completo de un login

```
 Usuario escribe "ana@"           ┌────────────────────────┐
 en el input de email  ─────────▶ │ TextInput.onChangeText │
                                  └───────────┬────────────┘
                                              ▼
                                  field.onChange("ana@")   (Controller)
                                              ▼
                                  STORE.values.email = "ana@"
                                              ▼
                                  Controller vuelve a llamar render()
                                  → el input muestra "ana@"

 Usuario pulsa "Entrar"  ───────▶ handleSubmit(onSubmit)
                                              ▼
                                  zodResolver valida con loginSchema
                                   ┌──────────┴───────────┐
                              ❌ inválido              ✅ válido
                                   ▼                      ▼
                     STORE.errors.email =        isSubmitting = true
                     "Ingresa un correo..."      onSubmit(data) se ejecuta
                                   ▼                      ▼
                     FormInput recibe            botón muestra spinner
                     fieldState.error            ...800 ms...
                     → borde rojo + mensaje      isSubmitting = false
                                                 banner verde
```

Detalle importante: con la configuración por defecto (`mode: 'onSubmit'`), RHF **no** valida mientras escribes la primera vez. Valida al enviar; después de un intento fallido, revalida en cada cambio para que el error desaparezca en cuanto lo corriges.

---

## 7. JavaScript moderno que aparece en el código

### Desestructuración

```ts
const { control, handleSubmit } = useForm(...);
// equivale a:
const resultado = useForm(...);
const control = resultado.control;
const handleSubmit = resultado.handleSubmit;
```

### Renombrar al desestructurar

```ts
({ onBlur: onInputBlur }) => { ... }
// "toma la prop onBlur y llámala onInputBlur"
```

En `FormInput` se usa porque Controller también da un `onBlur` y los nombres chocarían.

### Rest (`...`) y spread (`{...}`)

```ts
({ control, name, label, ...textInputProps }) => { ... }
// rest: todo lo que NO nombré queda agrupado en textInputProps

<TextInput {...textInputProps} />
// spread: reparte esas props sobre el TextInput
```

### Encadenamiento opcional `?.`

```ts
onFocus?.(e);       // llama a onFocus solo si existe
error?.message      // lee message solo si error existe
```

### Renderizado condicional

```tsx
{error?.message ? <Text>{error.message}</Text> : null}
```

### Arrays de estilos

```tsx
style={[styles.input, isFocused && styles.inputFocused, style]}
```

Se aplican de izquierda a derecha; los últimos sobrescriben a los primeros. `isFocused && ...` da `false` cuando no aplica, y React Native ignora los `false`.

### `as const`

```ts
export const colors = { primary: '#2563EB' } as const;
```

Hace el objeto de solo lectura y conserva los valores literales exactos en el tipo.

---

## 8. Glosario rápido

| Término | Significado |
|---|---|
| **Hook** | Función de React que empieza con `use` (`useState`, `useForm`) y da "poderes" a un componente. |
| **Store** | Lugar central donde se guarda estado. En RHF, un objeto en memoria con valores y errores. |
| **Input controlado** | Input cuyo valor siempre viene del estado (`value={...}`), no de sí mismo. |
| **Schema** | Descripción de la forma y reglas de unos datos (Zod). |
| **Resolver** | Adaptador que conecta una librería de validación con RHF. |
| **Genérico** | Parámetro de tipo: `Caja<T>`. |
| **`extends` (en `<>`)** | Restricción: "T debe ser compatible con...". |
| **`extends` (en interface)** | Herencia: "incluye todo lo de...". |
| **`Omit<T, K>`** | "T sin las claves K". |
| **Unión `A \| B`** | "A o B". |
| **Focus / `onFocus`** | El campo gana el foco (cursor y teclado van a él). |
| **Blur / `onBlur`** | El campo pierde el foco: el usuario salió de él. Lo contrario de focus. |
| **Touched** | Campo que el usuario ya visitó y abandonó (blur). |
| **Dirty** | Campo cuyo valor cambió respecto a `defaultValues`. |

---

### Para seguir aprendiendo

- React Hook Form: https://react-hook-form.com/get-started
- Controller: https://react-hook-form.com/docs/usecontroller/controller
- Zod: https://zod.dev
- TypeScript, genéricos: https://www.typescriptlang.org/docs/handbook/2/generics.html
- TypeScript, tipos utilitarios (`Omit`, `Pick`...): https://www.typescriptlang.org/docs/handbook/utility-types.html
