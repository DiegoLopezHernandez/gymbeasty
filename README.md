# 🏋️ GymBeast

App de seguimiento de entrenamiento para Android. Construida con Expo + React Native.

---

## Stack

| Tecnología | Versión |
|---|---|
| Expo | ~52.0.46 |
| React Native | 0.76.9 |
| expo-router | ~4.0.20 |
| Zustand | ^4.5.5 |
| CommunityToolkit MVVM | — |

---

## Estructura del proyecto

```
gymapp2/
├── app/
│   ├── _layout.tsx             # Root stack
│   ├── index.tsx               # Redirect → /tabs
│   ├── tabs/
│   │   ├── _layout.tsx         # Tab bar (5 tabs)
│   │   ├── index.tsx           # 🏠 Inicio — dashboard + avatar
│   │   ├── routines.tsx        # 📋 Rutinas — CRUD de rutinas
│   │   ├── bigthree.tsx        # 🏋️ Big 3 — Press, Sentadilla, Peso muerto
│   │   ├── history.tsx         # 📊 Historial — entrenos + estadísticas
│   │   └── body.tsx            # ⚖️ Cuerpo — peso corporal + composición
│   └── workout/
│       ├── active.tsx          # Entreno activo en curso
│       ├── start.tsx           # Pantalla de inicio de entreno
│       ├── manual.tsx          # Añadir entreno manual
│       └── [id].tsx            # Detalle de entreno
└── src/
    ├── components/
    │   ├── AthleteAvatar.tsx   # Avatar con 30 niveles + figura evolutiva
    │   ├── BodyMap.tsx         # Mapa muscular HUD
    │   ├── ConfigScreen.tsx    # Ajustes — ejercicios custom, tema, datos
    │   └── ui.tsx              # Componentes base (Card, Button, Badge...)
    ├── constants/
    │   ├── exercises.ts        # Base de datos de ejercicios
    │   ├── achievements.ts     # Logros
    │   └── theme.ts            # Tema dark/light
    ├── store/
    │   └── gymStore.ts         # Estado global (Zustand + AsyncStorage)
    ├── types/
    │   └── index.ts            # Tipos TypeScript
    └── utils/
        └── calculations.ts     # XP, niveles, 1RM, fechas...
```

---

## Funcionalidades

### 🏠 Inicio
- Dashboard con estadísticas rápidas (entrenos, volumen, nivel, tiempo)
- **Avatar evolutivo** con 30 niveles y 6 etapas físicas
  - Nivel 1→4: Principiante | 5→9: En forma | 10→14: Atlético | 15→19: Musculado | 20→24: Poderoso | 25→30: Bestia
  - El emoji del nivel es el identificador visual — el nombre del rango es **secreto**
  - Barra de XP con el siguiente nivel como `???`
- Últimos entrenos recientes
- Acceso rápido a empezar entreno y añadir manual

### 📋 Rutinas
- Crear, editar y eliminar rutinas
- Picker de ejercicios con búsqueda y filtro por músculo
- Incluye ejercicios base **y ejercicios custom** creados por el usuario
- Configurar series y reps objetivo por ejercicio
- Iniciar entreno directamente desde la rutina

### 🏋️ Big 3
- Registro de récords en Press Banca, Sentadilla y Peso Muerto
- Cálculo de 1RM estimado (fórmula de Epley)
- Insignias de nivel por ejercicio
- Historial de evolución

### 📊 Historial
**Tab Entrenos**
- Lista completa de entrenamientos con delete
- Badge "Manual" para los añadidos manualmente

**Tab Stats — 4 sub-secciones:**
- **General** — KPIs de sesión, frecuencia semanal (12 semanas), día favorito de la semana
- **Músculos** — distribución % de sesiones por grupo muscular, tendencia 8 semanas por músculo
- **Ejercicios** — ranking por sesiones, carga máxima, carga media, progresión de peso, % de mejora total
- **Tiempo** — día de la semana, entrenos por mes (6 meses), distribución de duración, récords personales

### ⚖️ Cuerpo
**Tab Peso**
- Registro diario de peso
- IMC calculado automáticamente (solo necesita altura, sin objetivo)
- Escala visual de IMC con gradiente y categoría
- Objetivo: perder / ganar / mantener con barra de progreso
- Gráfica de evolución (últimas 10 mediciones)

**Tab Composición**
- Registro opcional de datos de báscula inteligente
- Campos: % grasa, masa muscular, % agua, masa ósea, grasa visceral, metabolismo basal, edad metabólica
- Todos los campos son opcionales — solo rellenas lo que tenga tu báscula
- Historial editable con edit + delete

### ⚙️ Configuración (desde 🏠 → botón esquina)
- **Ejercicios** — crear, editar y eliminar ejercicios personalizados
- **Datos** — exportar CSV, **reset de fábrica** (borra todo y restaura estado inicial)
- Toggle de tema dark/light

---

## Sistema de niveles

30 niveles con coste de XP progresivo. Los primeros cambios son rápidos para enganchar:

| Nivel | XP requerido | Coste del escalón |
|---|---|---|
| 1 | 0 | — |
| 2 | 200 | 200 |
| 5 | 1.100 | 350 |
| 10 | 4.200 | 900 |
| 15 | 13.000 | 2.500 |
| 20 | 33.000 | 5.000 |
| 25 | 73.000 | 10.000 |
| 30 | 153.000 | 20.000 |

**XP por entreno:** 60 base + 1 por minuto (máx 120) + 12 por ejercicio + 120 si hay PR nuevo.

---

## Build — APK Android

El build se lanza automáticamente vía **GitHub Actions** al hacer push a `main`.

```
.github/workflows/build-apk.yml
```

**Stack de build:**
- Node 20 · Java 17 (Temurin) · Android SDK
- `npm install --legacy-peer-deps`
- `npx expo prebuild --platform android`
- `./gradlew assembleRelease`

**Artefacto:** `gymbeast-apk` — disponible 30 días en la pestaña Actions de GitHub.

Para lanzar el build manualmente: GitHub → Actions → Build Android APK → Run workflow.

> ⚠️ Aviso de Node 20 deprecated en Actions: no afecta al build actualmente. Caducará en junio 2026.

---

## Persistencia de datos

Zustand + AsyncStorage. Clave del store: `gym-store-v4`.

El reset de fábrica (⚙️ → Datos → Eliminar todo) borra:
- Todos los entrenos y récords
- Objetivos y composición corporal
- Rutinas y ejercicios personalizados
- Stats y XP

Y restaura los ejercicios base originales.
