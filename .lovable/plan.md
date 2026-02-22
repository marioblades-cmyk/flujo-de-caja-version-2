
# Gestion de Turnos - Ver, Editar y Reabrir

## Resumen
Agregar una nueva pagina "/historial" donde se pueda ver el detalle completo de cada turno cerrado, editar transacciones (modificar concepto, monto o tipo, y eliminar), y reabrir un turno que se cerro por error.

## Funcionalidades

### 1. Pagina de Historial de Turnos
- Nueva ruta `/historial` con lista de todos los turnos (abiertos y cerrados)
- Cada turno muestra: fecha, responsable, turno, hora apertura/cierre, saldo final
- Filtros basicos por responsable y fecha
- Boton para ver detalle de cada turno

### 2. Vista de Detalle de Turno
- Al hacer clic en un turno se abre una vista con todos sus movimientos
- Muestra resumen: monto inicial, total ingresos, total egresos, saldo final
- Lista completa de transacciones con hora, concepto, tipo y monto

### 3. Editar Transacciones
- Boton de editar en cada transaccion del detalle
- Dialog/modal para modificar concepto, tipo (ingreso/egreso) y monto
- Boton para eliminar una transaccion con confirmacion
- Solo disponible en turnos cerrados (los abiertos ya se editan en la vista activa)

### 4. Reabrir Turno
- Boton "Reabrir Caja" en el detalle de un turno cerrado
- Confirmacion con AlertDialog antes de reabrir
- Solo se puede reabrir si no hay otro turno abierto actualmente
- Al reabrir, se quita hora_cierre y se marca cerrado=false
- Redirige a la pagina principal donde aparece como turno activo

### 5. Navegacion
- Agregar un enlace/boton "Historial" en el header de la app
- Enlace para volver a la pagina principal desde el historial

---

## Detalles Tecnicos

### Archivos nuevos
- `src/pages/ShiftHistoryPage.tsx` - Pagina con lista de turnos y detalle
- `src/components/ShiftDetailDialog.tsx` - Dialog con detalle completo del turno, edicion de transacciones y boton reabrir

### Archivos modificados
- `src/App.tsx` - Agregar ruta `/historial`
- `src/pages/Index.tsx` - Agregar link de navegacion al historial en el header
- `src/hooks/useCashFlow.ts` - Agregar funciones:
  - `reopenShift(shiftId)` - UPDATE shifts SET cerrado=false, hora_cierre=null
  - `updateTransaction(txId, data)` - UPDATE transactions
  - `deleteTransaction(txId)` - DELETE from transactions
  - `loadAllShifts()` - Cargar todos los turnos con sus transacciones para la pagina de historial

### Flujo de reabrir turno
1. Usuario entra a /historial
2. Selecciona un turno cerrado
3. Presiona "Reabrir Caja"
4. Sistema verifica que no haya turno abierto
5. UPDATE en la base de datos (cerrado=false, hora_cierre=null)
6. Redirige a "/" donde aparece el turno como activo
