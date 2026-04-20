# 🌱 Plantagochi

Un videojuego de mascota virtual basado en plantas, inspirado en el Tamagotchi. Cuida tu planta, mantenla viva y ayúdala a crecer jugando minijuegos y personalizándola con accesorios.

---

## 📖 Descripción

Plantagochi es un juego de navegador desarrollado con **Phaser 3** donde el jugador adopta una planta y debe mantenerla viva en tiempo real. La planta tiene tres estadísticas que decaen constantemente — agua, sol y fertilizante — y el jugador debe gestionarlas para evitar que lleguen a cero. Si cualquier estadística llega a 0%, la planta muere.

El juego combina mecánicas de cuidado de mascotas virtuales con minijuegos de acción y un sistema de personalización con cosméticos.

---

## 🎮 Cómo jugar

### Flujo principal

```
Menú → Política de privacidad → Cómo jugar → Selección de planta → Interior → Exterior → Minijuegos
```

### Controles

| Acción | Control |
|--------|---------|
| Regar la planta | Clic en el ícono de regadera (interior) |
| Fertilizar | Clic en el ícono de fertilizante (exterior) |
| Mover al exterior | Clic en el ícono de puerta |
| Abrir tienda | Clic en el ícono de bolsa |
| Abrir guardarropa | Clic en el ícono de armario |
| Ver info de minijuegos | Clic en el ícono de libreta |
| Ir a minijuegos | Clic en el ícono de gamepad (exterior) |
| Recoger soles | Clic en los soles que caen (exterior) |

---

## 🌿 Plantas disponibles

| Planta | Origen | Agua inicial | Sol inicial | Fertilizante inicial |
|--------|--------|:---:|:---:|:---:|
| **Cactus** | México / Mesoamérica | 80% | 60% | 40% |
| **Snake Plant** | África Occidental | 60% | 50% | 50% |
| **Sunflower** | América del Norte | 70% | 90% | 60% |

Cada planta tiene resistencias distintas. El cactus necesita menos agua pero más fertilizante; el girasol necesita mucho sol.

---

## 📊 Sistema de estadísticas

Las tres estadísticas decaen automáticamente cada **10 segundos**:

| Estadística | Ícono | Cómo subirla |
|-------------|-------|--------------|
| 💧 Agua | Gota azul | Botón de regadera (interior) |
| ☀️ Sol | Sol amarillo | Recoger soles que caen (exterior) |
| 🌱 Fertilizante | Bolsa verde | Botón de fertilizante (exterior, requiere stock) |

### Efectos del clima (exterior)

El clima cambia automáticamente cada 30-60 segundos y afecta el decay:

| Clima | Agua | Sol | Fertilizante |
|-------|:----:|:---:|:------------:|
| ☀️ Soleado | ×1.5 | ×0.5 | ×1.0 |
| ☁️ Nublado | ×1.0 | ×1.5 | ×1.0 |
| 🌧️ Lluvioso | ×0.0 | ×2.0 | ×0.8 |
| ❄️ Nevado | ×0.5 | ×2.0 | ×1.5 |

> Un multiplicador de 0.0 significa que ese stat **no baja** con ese clima. La lluvia repone el agua automáticamente.

---

## 🌱 Sistema de crecimiento

La planta pasa por **3 etapas**:

```
🌰 Semilla  →  🌿 Brote  →  🌺 Planta adulta
```

**Condición para crecer:** El promedio de las tres estadísticas debe ser ≥ 70% durante **30 segundos acumulados**. El tiempo acumulado no se pierde si los stats bajan — solo deja de acumular.

---

## ☀️ Soles en el exterior

En el patio caen soles cada **1.5 a 3 segundos** (cuando no está nublado ni nevando). Al hacer clic en un sol:
- Se suma **+20% de sol** a la estadística
- El sol desaparece con un efecto visual
- Si no se recoge, cae al suelo y desaparece

---

## 🎯 Minijuegos

Los minijuegos son la única forma de ganar **monedas** para comprar cosméticos.

### 🌿 Catch the Fertilizer

Mueve la planta de lado a lado para atrapar las bolsas de fertilizante que caen desde arriba.

- **Recompensa:** 10 monedas + 1 bolsa de fertilizante por bolsa atrapada
- **Vidas:** 3 (se pierde una por cada bolsa que toca el suelo)
- **Dificultad:** Aumenta cada 5 bolsas atrapadas (más velocidad, menos tiempo entre bolsas)
- **Controles:** Mouse (arrastrar) o flechas del teclado

### 🐛 Kill the Bugs

Haz clic en los insectos antes de que lleguen a tu planta para eliminarlos.

- **Recompensa:** 12 monedas por bug eliminado
- **Vidas:** 3 corazones (se pierde uno por cada bug que toca la planta)
- **Dificultad:** Aumenta cada 10 bugs eliminados (más velocidad, más frecuencia)
- **Controles:** Clic del mouse

---

## 🛍️ Tienda y Guardarropa

### Tienda (Shop)

Compra cosméticos con las monedas ganadas en los minijuegos:

| Categoría | Items | Precio |
|-----------|-------|--------|
| **Sombreros** | Cowboy Hat, Party Hat, UTBis Cap | 50 / 75 / 100 🪙 |
| **Macetas** | Terracotta, Decorative, Yoplait | 60 / 80 / 40 🪙 |
| **Regaderas** | Basic Can, Blue Can, Golden Can | 30 / 50 / 100 🪙 |

> La regadera equipada cambia el ícono del botón de regar en el interior.

### Guardarropa (Wardrobe)

Equipa o desequipa los cosméticos que ya compraste. Los cambios se aplican inmediatamente a la planta en pantalla.

---

## 🗺️ Pantallas del juego

| Pantalla | Descripción |
|----------|-------------|
| **Menú principal** | Pantalla de inicio con botón de play |
| **Política de privacidad** | Información sobre el uso de datos |
| **Cómo jugar** | Instrucciones básicas del juego |
| **Selección de planta** | Elige entre Cactus, Snake Plant o Sunflower |
| **Interior (GameScene)** | Habitación donde vive la planta; regar, tienda, guardarropa |
| **Exterior (YardScene)** | Patio con clima dinámico; soles, fertilizante, minijuegos |
| **Menú de minijuegos** | Selección entre los dos minijuegos disponibles |
| **Game Over** | Pantalla de muerte con opciones de reintentar o volver al menú |

---

## 💾 Guardado automático

El juego guarda automáticamente en **localStorage** del navegador:
- Cada 30 segundos mientras juegas
- Al cambiar de escena (interior ↔ exterior)
- Al salir de un minijuego
- Al comprar o equipar un cosmético

No se requiere cuenta ni conexión a internet. El progreso persiste entre sesiones del navegador.

---

## 🛠️ Tecnología

| Tecnología | Uso |
|------------|-----|
| **Phaser 3** | Motor de juego principal |
| **JavaScript ES6+** | Lenguaje de programación |
| **Vite** | Servidor de desarrollo y bundler |
| **localStorage** | Persistencia de datos del juego |
| **Web Audio API** | Sistema de sonido (vía Phaser) |

### Resolución

El juego corre a **1280×720** píxeles con escalado automático (`Phaser.Scale.FIT`) para adaptarse a cualquier tamaño de pantalla.

---

## 📁 Estructura del proyecto

```
plantagochi/
├── index.html
├── src/
│   ├── main.js                    # Configuración de Phaser y registro de escenas
│   ├── constants.js               # Variables de balance del juego (editable)
│   ├── data/
│   │   ├── plants.js              # Datos de las 3 plantas
│   │   └── items.js               # Datos de cosméticos (sombreros, macetas, regaderas)
│   ├── scenes/
│   │   ├── BootScene.js           # Carga de assets
│   │   ├── MenuScene.js           # Menú principal + privacidad + cómo jugar
│   │   ├── SelectScene.js         # Selección de planta
│   │   ├── GameScene.js           # Interior (gameplay principal)
│   │   ├── YardScene.js           # Exterior (clima, soles, fertilizante)
│   │   ├── GameOverScene.js       # Pantalla de muerte
│   │   ├── MinigamesMenuScene.js  # Menú de minijuegos
│   │   └── minigames/
│   │       ├── FertilizerScene.js # Minijuego: Catch the Fertilizer
│   │       └── BugDefenseScene.js # Minijuego: Kill the Bugs
│   ├── objects/
│   │   ├── Plant.js               # Clase planta (sprite, cara, animaciones)
│   │   ├── StatsManager.js        # Gestión de estadísticas y crecimiento
│   │   ├── UIElements.js          # HUD del interior (barras, botones, monedas)
│   │   └── panels/
│   │       ├── StorePanel.js      # Panel de tienda
│   │       ├── WardrobePanel.js   # Panel de guardarropa
│   │       └── NotebookPanel.js   # Panel de info de la planta
│   └── services/
│       ├── SaveService.js         # Lectura/escritura de localStorage
│       ├── GameState.js           # Singleton de estado global en memoria
│       └── EventBus.js            # Sistema de eventos entre escenas
└── public/
    └── assets/                    # Sprites, fondos, sonidos, UI
```

---

## ⚙️ Variables de balance

Todas las variables de balance están centralizadas en `src/constants.js` y pueden modificarse sin tocar la lógica del juego:

```js
// Velocidad de decay de stats
STATS.DECAY_INTERVAL = 10000  // cada 10 segundos
STATS.DECAY_AMOUNT   = 6      // -6% por tick

// Crecimiento de la planta
GROWTH.STAGE_TIME_REQUIRED  = 30000  // 30s acumulados con promedio ≥ 70%
GROWTH.GROWTH_AVG_THRESHOLD = 70     // promedio mínimo para crecer

// Minijuego fertilizante
MINIGAME_FERTILIZER.COINS_PER_BAG = 10

// Minijuego bugs
MINIGAME_BUGS.COINS_PER_BUG = 12
```

---

## 🚀 Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

El juego se abre en `http://localhost:5173` (o el puerto que indique Vite).

---

## 👥 Créditos

Desarrollado como proyecto académico.

- **Motor:** [Phaser 3](https://phaser.io/)
- **Arte:** Pixel-cartoon 2D, estilo kawaii
- **Audio:** Efectos de sonido y música de fondo incluidos

---

## 📋 Política de privacidad

Plantagochi no recopila datos personales. La única información almacenada es el progreso del juego, guardado localmente en el navegador del usuario mediante `localStorage`. Esta información no se comparte con terceros.
