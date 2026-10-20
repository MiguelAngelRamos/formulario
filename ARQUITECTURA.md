# Arquitectura del proyecto Login

Diagramas para entender **dónde vive cada cosa** y **cómo viajan los datos**.
Complementa a [CONCEPTOS.md](CONCEPTOS.md), que explica la teoría.

> Los diagramas usan **Mermaid**. Se ven en GitHub directamente; en VS Code
> instala la extensión *Markdown Preview Mermaid Support* y abre la vista
> previa (`Ctrl+Shift+V`).

---

## 1. ¿Dónde vive el almacén (store)?

**Respuesta corta:** dentro de `LoginScreen`, en la memoria del componente.

- `useForm()` ([LoginScreen.tsx](src/screens/LoginScreen.tsx)) crea el store la
  primera vez que se renderiza la pantalla y lo guarda en un `useRef` interno
  (en el código de RHF: `const _formControl = React.useRef(...)`).
- Un `useRef` sobrevive a los re-renders, pero **no** dispara re-renders al
  cambiar. Por eso escribir en un input no vuelve a pintar toda la pantalla.
- **No es global** (no es Redux, ni Context, ni Zustand): si desmontas
  `LoginScreen`, el store desaparece.
- **No se persiste**: al cerrar la app los datos se pierden (no hay
  AsyncStorage ni SecureStore).
- La única forma de llegar al store desde fuera es el objeto **`control`**,
  que `LoginScreen` pasa por props a cada `FormInput`.

```mermaid
flowchart TB
    subgraph LS["LoginScreen (componente)"]
        direction TB
        UF["useForm()"]
        subgraph REF["useRef  ➜  EL ALMACÉN de RHF"]
            direction TB
            V["_formValues<br/>{ email: '', password: '' }"]
            S["_formState<br/>errors, isSubmitting, touchedFields…"]
            F["_fields<br/>refs de cada input (para setFocus)"]
            SUB["_subjects<br/>suscriptores que avisan cambios"]
        end
        US["useState: submittedEmail<br/>(estado de la PANTALLA, no del form)"]
        UF --> REF
        UF -- devuelve --> C(["control · handleSubmit · setFocus · formState"])
    end

    C -- "prop control" --> FI1["FormInput name='email'"]
    C -- "prop control" --> FI2["FormInput name='password'"]

    subgraph FI1L["dentro de cada FormInput"]
        CT["&lt;Controller&gt;<br/>se suscribe a SU campo"]
        LOC["useState: isFocused<br/>(estado LOCAL de UI)"]
    end
    FI1 --> FI1L
    CT -. "lee / escribe" .-> V
    CT -. "lee error" .-> S
```

### Tres tipos de estado, tres lugares distintos

| Estado | Dónde vive | Quién lo usa | Por qué ahí |
|---|---|---|---|
| Valores y errores del formulario | Store de RHF (`useRef` en `useForm`) | `Controller` de cada `FormInput` | Lo comparten varios campos y la validación |
| `submittedEmail` (banner verde) | `useState` en `LoginScreen` | Solo `LoginScreen` | Es resultado del envío, no un campo |
| `isFocused` (borde azul) | `useState` en `FormInput` | Solo ese input | Es pura apariencia; RHF no lo necesita |

---

## 2. Mapa de archivos e imports

```mermaid
flowchart LR
    IDX["index.ts<br/>registerRootComponent"] --> APP["App.tsx<br/>StatusBar + LoginScreen"]
    APP --> LS["screens/LoginScreen.tsx<br/>CREA el formulario"]
    LS --> FI["components/FormInput.tsx<br/>input reutilizable"]
    LS --> SCH["schemas/login.schema.ts<br/>reglas Zod + tipo"]
    LS --> TH["theme/index.ts<br/>(barrel)"]
    FI --> TH
    APP --> TH
    TH --> COL["theme/colors.ts<br/>paleta"]

    LS -. usa .-> RHF[("react-hook-form")]
    LS -. usa .-> RES[("@hookform/resolvers")]
    FI -. usa .-> RHF
    SCH -. usa .-> ZOD[("zod")]
    RES -. conecta .-> ZOD
```

---

## 3. Árbol de componentes en pantalla

```mermaid
flowchart TB
    App --> View["View (fondo)"]
    View --> SB["StatusBar"]
    View --> LS["LoginScreen"]
    LS --> KAV["KeyboardAvoidingView"]
    KAV --> Card["View (tarjeta)"]
    Card --> T["Text: Iniciar sesión"]
    Card --> FE["FormInput email"]
    Card --> FP["FormInput password"]
    Card --> BTN["Pressable: Entrar / spinner"]
    Card --> BAN["Banner éxito (si submittedEmail)"]
    FE --> CE["Controller → Text + TextInput + error"]
    FP --> CP["Controller → Text + TextInput + error"]
```

---

## 4. Qué pasa cuando el usuario escribe

```mermaid
sequenceDiagram
    actor U as Usuario
    participant TI as TextInput
    participant CT as Controller (FormInput)
    participant ST as Store RHF (useRef)

    U->>TI: escribe "a"
    TI->>CT: onChangeText("a")
    CT->>ST: field.onChange("a")
    ST-->>CT: avisa SOLO al suscriptor del campo "email"
    CT->>TI: re-render con value="a"
    Note over ST: LoginScreen NO se re-renderiza
```

---

## 5. Qué pasa al pulsar "Entrar"

```mermaid
sequenceDiagram
    actor U as Usuario
    participant BTN as Pressable
    participant HS as handleSubmit
    participant ZR as zodResolver(loginSchema)
    participant ST as Store RHF
    participant OS as onSubmit
    participant FI as FormInput(s)

    U->>BTN: pulsa "Entrar"
    BTN->>HS: onPress
    HS->>ST: lee _formValues
    HS->>ZR: valida { email, password }
    alt hay errores
        ZR-->>HS: errors
        HS->>ST: guarda errors en _formState
        ST-->>FI: cada campo con error se re-pinta en rojo
    else todo válido
        ZR-->>HS: datos limpios (email con trim)
        HS->>ST: isSubmitting = true (spinner)
        HS->>OS: onSubmit(data)
        OS->>OS: espera 800 ms (simula API)
        OS->>OS: setSubmittedEmail(data.email)
        HS->>ST: isSubmitting = false
        Note over OS: aparece el banner verde
    end
```

---

## 6. Resumen en una frase

> `useForm()` guarda el formulario en un **ref privado de `LoginScreen`**;
> `control` es la llave que se reparte a cada `FormInput`; cada `Controller`
> solo escucha **su** campo; y Zod decide qué es válido cuando se pulsa
> **Entrar**.
