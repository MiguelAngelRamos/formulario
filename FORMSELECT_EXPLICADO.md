# FormSelect y otros campos reutilizables

## Qué hace

[FormSelect](src/components/FormSelect.tsx) permite elegir una opción y guarda su `value` en React Hook Form. Presenta una etiqueta y los mensajes de error del formulario, usando la misma paleta que `FormInput`.

```text
Pantalla con useForm
  ├─ FormInput  → Controller → TextInput → texto escrito
  └─ FormSelect → Controller → Picker    → opción seleccionada

Esquema Zod → zodResolver → errores de RHF → cada campo muestra su error
```

Es una base útil para listas pequeñas y conocidas. Los países, categorías o tipos de cuenta se definen en las opciones de cada pantalla; el componente no conoce esas reglas de negocio.

## Ejemplo para una pantalla futura

El siguiente componente es ilustrativo: no se incorporó al login ni se agregó como ruta. Usa las dependencias del proyecto y los imports relativos de un archivo ubicado en `src/screens/`.

```tsx
import React from 'react';
import { Button, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FormSelect,
  type FormSelectOption,
} from '../components/FormSelect';

// Las opciones se definen fuera del render para no recrearlas cada vez.
const paises = [
  { label: 'Chile', value: 'CL' },
  { label: 'Argentina', value: 'AR' },
] as const satisfies readonly FormSelectOption[];

const schema = z.object({
  // '' representa "sin selección"; solo aceptamos los códigos de la lista.
  pais: z.string().refine(
    (value) => paises.some((option) => option.value === value),
    'Selecciona un país válido',
  ),
});

type FormValues = z.infer<typeof schema>;

export const PerfilEjemplo = ({
  onSave,
}: {
  onSave: (data: FormValues) => Promise<void>;
}) => {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pais: '' },
  });

  return (
    <View>
      <FormSelect
        control={control}
        name="pais"
        label="País"
        placeholder="Selecciona tu país"
        options={paises}
      />
      <Button
        title="Guardar"
        onPress={handleSubmit(onSave)}
        disabled={isSubmitting}
      />
    </View>
  );
};
```

Si eliges **Chile**, el envío contiene `{ pais: 'CL' }`. La etiqueta visible no se guarda. Si dejas el placeholder, Zod rechaza `''` y `FormSelect` muestra el error.

## Contrato y límites

- Define `defaultValues` para el campo. Usa `''` para empezar sin selección o un valor que exista en `options` para una selección inicial.
- Las opciones usan valores de texto únicos y no vacíos. Reserva `''` para el placeholder, que también permite limpiar la selección.
- Los campos deben tener tipo `string` o una unión de textos. Si usas literales, incluye `''` en el tipo de entrada cuando quieras admitir el placeholder. Las opciones se comprueban contra el tipo del campo.
- Si tus IDs son numéricos, pásalos como texto y conviértelos al preparar el envío. Este componente no maneja objetos, arrays ni números como valor del campo.
- Mantén los valores del formulario y las opciones sincronizados si cambian las listas: por ejemplo, al cambiar país, limpia una ciudad que ya no pertenezca a ese país usando `setValue` desde la pantalla.
- Con `disabled`, RHF omite el campo de los datos enviados. No uses esa propiedad si necesitas conservarlo en el envío mientras lo muestras bloqueado: ese caso requeriría añadir una opción de solo lectura.
- El campo se marca tocado al seleccionar. Android y web también notifican la salida con `onBlur`; iOS no ofrece el mismo evento. Por eso `mode: 'onBlur'` también puede validar al seleccionar.
- El manejo programático de foco del Picker nativo está documentado para Android; no presupongas que `setFocus` abrirá el selector en iOS.

El control presenta un desplegable en Android, una rueda en iOS y un select en web. No incluye búsqueda, carga remota ni selección múltiple. Para cientos o miles de opciones, conviene evaluar un componente con búsqueda y lista virtualizada cuando exista ese requisito. Estas diferencias de plataforma están descritas en la [documentación del Picker](https://github.com/react-native-picker/picker#usage).

Se instaló `@react-native-picker/picker` con `expo install` para resolver la versión compatible con el SDK del proyecto. La [documentación de Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/picker/) indica que está incluido en Expo Go. Si usas una compilación de desarrollo propia creada antes de instalarlo, tendrás que recompilarla para incluir el módulo nativo.

## Qué otros componentes conviene identificar

| Necesidad futura | Componente posible | ¿Hace falta crearlo ahora? |
| --- | --- | --- |
| Nombre, correo, teléfono, contraseña | `FormInput` existente | Ya está disponible; máscaras y conversiones requieren adaptación. |
| Descripción o comentario de varias líneas | `FormInput` con `multiline` | No necesitas otro componente todavía. |
| Elegir una opción de una lista pequeña | `FormSelect` | Ya está disponible. |
| Activar notificaciones o una preferencia | `FormSwitch` con valor booleano | Cuando aparezca esa preferencia. |
| Aceptar términos o marcar una casilla | `FormCheckbox` con valor booleano | Cuando exista ese flujo. |
| Fecha de nacimiento o fecha de reserva | `FormDatePicker` | Cuando puedas definir formato, límites y zona horaria necesarios. |
| Varias categorías o intereses | `FormMultiSelect` con array de valores | Cuando necesites selección múltiple. |
| Buscar una ciudad o un cliente en una lista grande | `FormAutocomplete` | Cuando necesites búsqueda local o remota. |

Mi recomendación es mantener `FormInput` y `FormSelect` como bases pequeñas. El siguiente candidato habitual es `FormSwitch` o `FormCheckbox`, según la interfaz requerida. Crear todos de antemano obliga a decidir comportamientos sin conocer los formularios que los usarán.

Si más adelante repites muchas veces etiqueta, ayuda y error entre componentes, puedes extraer esa presentación a un `FormField`. Los valores y eventos de texto, selector, booleano y fecha seguirán teniendo sus propias conexiones con RHF.
