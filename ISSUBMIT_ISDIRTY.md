En el contexto de React Hook Form (RHF), tanto en React Native como en React web, los traduciría así:

| Propiedad      | Traducción recomendada | Significado                                                                                              |
| -------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `isSubmitting` | Está enviando          | Indica si el formulario está ejecutando el proceso de envío.                                             |
| `isDirty`      | Ha sido modificado     | Indica si los valores actuales del formulario son diferentes de sus valores iniciales (`defaultValues`). |

### 1. `isSubmitting` — Está enviando

Es un booleano que indica si el formulario se encuentra en proceso de envío.

- `true`: el envío está en curso.
- `false`: no se está ejecutando un envío.

Se utiliza habitualmente para deshabilitar botones o mostrar un indicador de carga.

### 2. `isDirty` — Ha sido modificado

Es un booleano que indica si el formulario tiene valores diferentes de los iniciales.

- `true`: al menos un valor es diferente del inicial.
- `false`: los valores coinciden con los iniciales.

Importante: si el usuario modifica un campo y después vuelve a dejarlo con su valor original, `isDirty` vuelve a `false`.

### Ejemplo en React Native

```
const {
  control,
  handleSubmit,
  formState: { isSubmitting, isDirty },
} = useForm({
  defaultValues: {
    email: "",
  },
});
```

Y para un botón:

```
<Button
  title={isSubmitting ? "Enviando..." : "Guardar"}
  onPress={handleSubmit(onSubmit)}
  disabled={!isDirty || isSubmitting}
/>
```

Aquí el botón estará deshabilitado cuando no existan modificaciones o cuando el formulario se esté enviando.

Para enseñarlo en tus clases de React Native, utilizaría estas definiciones:

- `isSubmitting`: estado de envío del formulario.
- `isDirty`: estado de modificación del formulario.

Son traducciones naturales y técnicamente precisas para explicar React Hook Form.