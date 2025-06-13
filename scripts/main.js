
// ============================
// 1. CONFIGURACIÓN DE AUDIO
// ============================

/**
 * Configuración de todos los sonidos del juego
 * - throw: sonido al lanzar pokeball
 * - capture: sonido al capturar pokémon
 * - littleroot: música de fondo del menú inicial
 * - route101: música de fondo durante el juego
 */
const sounds = {
  throw: new Audio('./audio/throw.mp3'),
  capture: new Audio('./audio/capture.mp3'),
  littleroot: new Audio('./audio/littleroot.mp3'),
  route101: new Audio('./audio/route101.mp3')
};

/*
 * Volúmenes específicos para cada sonido
 */
const VOLUMES = {
  throw: 0.08,
  capture: 0.08,
  littleroot: 0.05,
  route101: 0.01,
};

/**
 * Inicialización de volúmenes y configuración de loops
 */
function initializeAudio() {
  // Aplicar volúmenes iniciales a todos los sonidos
  for (const key in sounds) {
    sounds[key].volume = VOLUMES[key];
  }

  // Configurar música de fondo para que se repita en bucle
  sounds.littleroot.loop = true;
  sounds.route101.loop = true;

function fixVolume(audio, volume) {
  Object.defineProperty(audio, 'volume', {
    get() { return volume; },
    set(_) { /* ignorar cualquier intento de cambio */ },
    configurable: true
  });
}

  // Fijar volúmenes para evitar cambios inesperados
  fixVolume(sounds.littleroot, VOLUMES.littleroot);
  fixVolume(sounds.route101, VOLUMES.route101);
}

/**
 * Función para fijar el volumen de un audio y prevenir modificaciones
 * @param {HTMLAudioElement} audio - Elemento de audio
 * @param {number} volume - Volumen fijo a mantener
 */


// ============================
// 2. CONTROL DE VISIBILIDAD DE PESTAÑA
// ============================

/**
 * GESTIÓN DE MÚSICA AL CAMBIAR DE PESTAÑA
 * Pausa la música cuando el usuario sale de la pestaña y la reanuda al volver
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pestaña oculta: pausar toda la música activa
    if (!sounds.littleroot.paused) sounds.littleroot.pause();
    if (!sounds.route101.paused) sounds.route101.pause();
  } else {
    // Pestaña visible: reanudar la música correspondiente al estado actual
    if (introModal.style.display !== "none") {
      // Si estamos en el menú inicial, reproducir música de Littleroot
      sounds.littleroot.play().catch(() => {});
    } else {
      // Si estamos en el juego, reproducir música de Route 101
      sounds.route101.play().catch(() => {});
    }
  }
});

// ============================
// 3. CLASE PRINCIPAL DEL JUEGO
// ============================

class Game {
  constructor() {
    // Referencias a elementos DOM principales
    this.container = document.getElementById("game-container");
    this.pokedexElement = document.getElementById("pokedex-counter");
    
    // Estado del juego
    this.pokemons = [];           // Array de pokémon activos en pantalla
    this.pokedex = new Set();     // Set de pokémon capturados (evita duplicados)
    this.nivelActual = 0;         // Índice del nivel actual
    this.pokeballActiva = false;  // Flag para evitar múltiples lanzamientos

    // Referencias para animación del sprite lanzador
    this.throwerSprite = document.getElementById("thrower-sprite");
    this.spriteFrames = 5;        // Total de frames de animación
    this.spriteCurrentFrame = 1;  // Frame actual
    this.spriteInterval = null;   // Interval para animación

    /**
     * CONFIGURACIÓN DE NIVELES
     * Cada nivel contiene un array con los nombres de los pokémon a capturar
     */
    this.niveles = [
      ["Torchic", "Treecko", "Mudkip"],        // Nivel 1: Starters
      ["poochyena", "zigzagoon", "wurmple"],   // Nivel 2: Pokémon comunes
      ["seedot", "shroomish", "slakoth"],      // Nivel 3: Pokémon del bosque
    ];

    // Calcular total de pokémon para el contador del pokédex
    this.totalPokemon = this.niveles.flat().length;
    
    // Inicializar el primer nivel
    this.crearNivel();

    // Variable para almacenar el objetivo del click (coordenadas)
    this.clickTarget = null;

    // Configurar event listener para clicks en el contenedor
    this.setupClickHandler();
    
    // Resetear sprite a estado inicial
    this.resetSprite();

    // Hacer la instancia globalmente accesible
    window.gameInstance = this;
  }

  /**
   * Configura el manejador de eventos para clicks en el área de juego
   */
  setupClickHandler() {
    this.container.addEventListener("click", (e) => {
      // Prevenir múltiples lanzamientos simultáneos
      if (this.pokeballActiva) return;

      // Calcular coordenadas relativas al contenedor
      const rect = this.container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Guardar objetivo para usar en frame 4 de la animación
      this.clickTarget = { x: clickX, y: clickY };

      // Iniciar animación del sprite lanzador
      this.animarSprite();

      // Marcar pokeball como activa
      this.pokeballActiva = true;
    });
  }

  /**
   * ANIMACIÓN DEL SPRITE LANZADOR
   * Controla la secuencia de 5 frames del personaje lanzando la pokeball
   * En el frame 4 se ejecuta el lanzamiento de la pokeball
   */
  animarSprite() {
    // Prevenir múltiples animaciones simultáneas
    if (this.spriteInterval) return;

    // Inicializar animación desde el frame 1
    this.spriteCurrentFrame = 1;
    this.actualizarSprite();

    let pokeballLanzada = false; // Flag para evitar múltiples lanzamientos

    this.spriteInterval = setInterval(() => {
      this.spriteCurrentFrame++;
      
      if (this.spriteCurrentFrame > this.spriteFrames) {
        // Animación completada: limpiar interval y resetear sprite
        clearInterval(this.spriteInterval);
        this.spriteInterval = null;
        this.resetSprite();
      } else {
        // Actualizar frame actual
        this.actualizarSprite();

        // FRAME 4: MOMENTO DEL LANZAMIENTO
        if (this.spriteCurrentFrame === 4 && !pokeballLanzada) {
          pokeballLanzada = true;

          // Calcular posición inicial de la pokeball (junto al sprite)
          const startX = this.throwerSprite.offsetLeft + this.throwerSprite.clientWidth - 20;
          const startY = this.throwerSprite.offsetTop + 20;

          // Crear y lanzar pokeball hacia el objetivo
          if (this.clickTarget) {
            new Pokeball(startX, startY, this.clickTarget.x, this.clickTarget.y, this);
            
            // Reproducir sonido de lanzamiento
            sounds.throw.currentTime = 0;
            sounds.throw.play();
          }
        }
      }
    }, 95); // Velocidad de animación: 95ms por frame
  }

  /**
   * Actualiza la imagen del sprite según el frame actual
   */
  actualizarSprite() {
    this.throwerSprite.style.backgroundImage = `url('./img/sprite-${this.spriteCurrentFrame}.png')`;
  }

  /**
   * Resetea el sprite al frame inicial
   */
  resetSprite() {
    this.spriteCurrentFrame = 1;
    this.actualizarSprite();
  }

  /**
   * CREACIÓN DE NIVELES
   * Este método es responsable de generar cada nivel del juego:
   * 1. Limpia el escenario anterior
   * 2. Cambia el fondo según el nivel
   * 3. Posiciona los pokémon aleatoriamente evitando solapamientos
   */
  crearNivel() {
    // Limpiar pokémon del nivel anterior
    this.limpiarEscenario();
    
    // Cambiar fondo del contenedor según el nivel actual
    this.container.className = "";
    this.container.classList.add(`fondo-nivel-${this.nivelActual}`);

    // Reinicializar array de pokémon
    this.pokemons = [];

    // Obtener nombres de pokémon para el nivel actual
    const nombres = this.niveles[this.nivelActual];

    // Crear cada pokémon con posición aleatoria
    for (const nombre of nombres) {
      let x, y, intentos = 0;
      
      // ALGORITMO DE POSICIONAMIENTO SIN SOLAPAMIENTO
      do {
        // Generar posición aleatoria dentro de los límites del contenedor
        // Márgenes: 10px desde bordes, 80px de espacio para el pokémon
        x = Math.random() * (800 - 80 - 20) + 10;
        y = Math.random() * (300 - 80 - 20) + 10;
        intentos++;
      } while (this.posicionSolapa(x, y) && intentos < 100);
      // Máximo 100 intentos para evitar bucles infinitos

      // Crear nuevo pokémon en la posición calculada
      const nuevo = new Pokemon(nombre, this.container, x, y);
      this.pokemons.push(nuevo);
    }

    // Actualizar contador del pokédex
    this.actualizarPokedex();
  }

  /**
   * Verifica si una posición se solapa con pokémon existentes
   * @param {number} x - Coordenada X a verificar
   * @param {number} y - Coordenada Y a verificar
   * @returns {boolean} - True si hay solapamiento
   */
  posicionSolapa(x, y) {
    return this.pokemons.some((p) => {
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 80; // Distancia mínima entre pokémon
    });
  }

  /**
   * Limpia todos los pokémon del escenario actual
   */
  limpiarEscenario() {
    this.pokemons.forEach((p) => this.container.removeChild(p.element));
    this.pokemons = [];
  }

  /**
   * LÓGICA DE CAPTURA DE POKÉMON
   * Maneja todo el proceso cuando una pokeball impacta con un pokémon:
   * 1. Añade al pokédex si es nuevo
   * 2. Reproduce animaciones y sonidos
   * 3. Elimina el pokémon del escenario
   * 4. Verifica si el nivel está completo
   */
  capturarPokemon(nombre, pokemonObj, pokeball) {
    // Añadir al pokédex si es la primera captura
    if (!this.pokedex.has(nombre)) {
      this.pokedex.add(nombre);
      this.actualizarPokedex();
    }

    // ANIMACIÓN DE CAPTURA
    const el = pokemonObj.element;
    el.style.transition = 
      "filter 0.2s ease, transform 0.3s ease 0.2s, opacity 0.3s ease 0.2s";
    el.style.filter = "brightness(400)"; // Flash brillante

    // Reproducir sonido de captura
    sounds.capture.currentTime = 0;
    sounds.capture.play();

    // Animación de desaparición (escala y opacidad)
    setTimeout(() => {
      el.style.transform = "scale(0)";
      el.style.opacity = "0";
    }, 200);

    // Animación de rebote de la pokeball
    if (pokeball?.element) {
      pokeball.element.style.animation = "rebote 0.5s ease";
    }

    // LIMPIEZA Y PROGRESIÓN DEL JUEGO
    setTimeout(() => {
      // Eliminar elementos del DOM
      this.container.removeChild(el);
      if (pokeball?.element) {
        pokeball.element.remove();
      }
      
      // Actualizar estado del juego
      this.pokemons = this.pokemons.filter((p) => p !== pokemonObj);
      this.pokeballActiva = false;
      this.resetSprite();

      // VERIFICAR PROGRESIÓN DE NIVEL
      if (this.pokemons.length === 0) {
        // Nivel completado: avanzar al siguiente
        this.nivelActual++;
        if (this.nivelActual < this.niveles.length) {
          // Crear siguiente nivel después de 1 segundo
          setTimeout(() => this.crearNivel(), 1000);
        } else {
          // Juego completado: mostrar modal de victoria
          this.mostrarModalVictoria();
        }
      }
    }, 600);
  }

  /**
   * Actualiza el contador del pokédex en la interfaz
   */
  actualizarPokedex() {
    if (this.pokedexElement) {
      this.pokedexElement.textContent = `Pokédex: ${this.pokedex.size}/${this.totalPokemon}`;
    }
  }

  /**
   * Muestra el modal de victoria al completar todos los niveles
   */
  mostrarModalVictoria() {
    const modal = document.getElementById("win-modal");
    modal.classList.remove("hidden");
  }

  /**
   * Reinicia el juego completo al estado inicial
   */
  reiniciarJuego() {
    // Resetear estado del juego
    this.nivelActual = 0;
    this.pokedex.clear();
    this.actualizarPokedex();

    // Cambiar música de fondo
    sounds.route101.currentTime = 0;
    sounds.route101.play();

    // Crear primer nivel
    this.crearNivel();

    // Ocultar modal de victoria
    const modal = document.getElementById("win-modal");
    modal.classList.add("hidden");

    // Resetear sprite
    this.resetSprite();
  }
}

// ============================
// 4. CLASE POKEBALL - FÍSICA Y MOVIMIENTO
// ============================

class Pokeball {
  /**
   * CONSTRUCTOR DE POKEBALL
   * Inicializa una pokeball con física realista de proyectil
   * @param {number} xInicio - Posición X inicial
   * @param {number} yInicio - Posición Y inicial  
   * @param {number} xObjetivo - Posición X objetivo
   * @param {number} yObjetivo - Posición Y objetivo
   * @param {Game} game - Referencia al juego principal
   */
  constructor(xInicio, yInicio, xObjetivo, yObjetivo, game) {
    // Posición inicial
    this.x = xInicio;
    this.y = yInicio;
    
    /**
     * CÁLCULO DE VELOCIDAD INICIAL
     * La velocidad se calcula para que la pokeball llegue al objetivo
     * Se divide la distancia por 30 frames para suavidad
     * Se resta 5 a vy para crear un arco parabólico natural
     */
    this.vx = (xObjetivo - this.x) / 30;  // Velocidad horizontal constante
    this.vy = (yObjetivo - this.y) / 30 - 5;  // Velocidad vertical inicial (hacia arriba)
    
    this.radius = 15;  // Radio para detección de colisiones
    
    // Crear elemento DOM de la pokeball
    this.element = document.createElement("div");
    this.element.classList.add("pokeball");
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    
    // Añadir al contenedor del juego
    game.container.appendChild(this.element);
    this.game = game;

    // Iniciar animación de movimiento
    this.animar();
  }

  /**
   * SIMULACIÓN FÍSICA DE LA POKEBALL
   * Implementa un sistema de física realista con:
   * - Movimiento parabólico (gravedad)
   * - Detección de colisiones con pokémon
   * - Límites de pantalla
   */
  animar() {
    const intervalo = setInterval(() => {
      // ACTUALIZACIÓN DE POSICIÓN
      this.x += this.vx;           // Movimiento horizontal constante
      this.vy += 0.5;              // GRAVEDAD: acelera hacia abajo
      this.y += this.vy;           // Aplicar velocidad vertical

      // Actualizar posición visual
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;

      // DETECCIÓN DE COLISIONES CON POKÉMON
      for (const pokemon of this.game.pokemons) {
        if (this.colisionaCon(pokemon)) {
          // Colisión detectada: detener movimiento y capturar
          clearInterval(intervalo);
          this.element.style.left = `${this.x}px`;
          this.element.style.top = `${this.y}px`;
          this.game.capturarPokemon(pokemon.nombre, pokemon, this);
          return;
        }
      }

      // LÍMITES DE PANTALLA
      if (this.y > 400 || this.x > 800 || this.x < 0) {
        // Pokeball fuera de límites: limpiar y resetear estado
        clearInterval(intervalo);
        this.element.remove();
        this.game.pokeballActiva = false;
        this.game.resetSprite();
      }
    }, 20); // 20ms = ~50 FPS para movimiento suave
  }

  /**
   * DETECCIÓN DE COLISIÓN RECTANGULAR
   * Verifica si la pokeball (circular) intersecta con un pokémon (rectangular)
   * @param {Pokemon} pokemon - Pokémon a verificar
   * @returns {boolean} - True si hay colisión
   */
  colisionaCon(pokemon) {
    return (
      this.x + this.radius > pokemon.x &&              // Borde derecho pokeball > borde izquierdo pokémon
      this.x < pokemon.x + pokemon.width &&            // Borde izquierdo pokeball < borde derecho pokémon
      this.y + this.radius > pokemon.y &&              // Borde inferior pokeball > borde superior pokémon
      this.y < pokemon.y + pokemon.height              // Borde superior pokeball < borde inferior pokémon
    );
  }
}

// ============================
// 5. CLASE POKEMON
// ============================

class Pokemon {
  /**
   * Constructor de Pokémon individual
   * @param {string} nombre - Nombre del pokémon
   * @param {HTMLElement} container - Contenedor donde añadir el pokémon
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   */
  constructor(nombre, container, x, y) {
    this.nombre = nombre;
    this.width = 80;
    this.height = 80;
    this.x = x;
    this.y = y;

    // Crear elemento DOM con animación de aparición
    this.element = document.createElement("div");
    this.element.classList.add("pokemon");
    
    // Estado inicial para animación de entrada
    this.element.style.opacity = "0";
    this.element.style.transform = "scale(0.5)";
    this.element.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    // Crear imagen del pokémon
    const img = document.createElement("img");
    img.src = `./img/${nombre.toLowerCase()}.png`;
    img.alt = nombre;
    img.style.width = "100%";
    img.style.height = "100%";

    // Ensamblar elementos
    this.element.appendChild(img);
    container.appendChild(this.element);
    this.actualizarPosicion();

    // Animación de aparición suave
    setTimeout(() => {
      this.element.style.opacity = "1";
      this.element.style.transform = "scale(1)";
    }, 50);
  }

  /**
   * Actualiza la posición visual del pokémon
   */
  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
  }
}

// ============================
// 6. SISTEMA DE INTRODUCCIÓN ANIMADA
// ============================

/**
 * Textos de la introducción tipo Pokémon
 * Simula el diálogo característico de los juegos de la serie
 */
const introLines = [
  "¡Hola! Me llamo Abedul, pero todos me llaman Profesor Pokémon.",
  "¡Prepárate para comenzar tu aventura!",
  "Captura todos los Pokémon de cada ruta para avanzar a la siguiente, cuanto más lejos apuntes, más fuerte tirarás la Pokeball.",
];

// Variables de control para el sistema de texto
let currentLine = 0;    // Línea actual del diálogo
let currentChar = 0;    // Carácter actual siendo escrito
let typingInterval;     // Interval para efecto de escritura

// Referencias DOM para la introducción
const dialogueText = document.getElementById("dialogue-text");
const startButton = document.getElementById("start-button");
const introModal = document.getElementById("intro-modal");

/**
 * EFECTO DE ESCRITURA MÁQUINA
 * Simula el texto escribiéndose carácter por carácter
 */
function typeLine() {
  if (currentChar < introLines[currentLine].length) {
    // Añadir siguiente carácter
    dialogueText.textContent += introLines[currentLine].charAt(currentChar);
    currentChar++;
  } else {
    // Línea completada: mostrar botón para continuar
    clearInterval(typingInterval);
    startButton.classList.add("visible");
  }
}

/**
 * Avanza a la siguiente línea del diálogo o inicia el juego
 */
function showNextLine() {
  // Ocultar botón y limpiar texto
  startButton.classList.remove("visible");
  dialogueText.textContent = "";
  currentChar = 0;

  if (currentLine < introLines.length) {
    // Hay más líneas: continuar con efecto de escritura
    typingInterval = setInterval(typeLine, 20); // 20ms entre caracteres
  } else {
    // Introducción completada: iniciar juego
    introModal.style.display = "none";

    // Cambio de música: de intro a juego
    sounds.littleroot.pause();
    sounds.route101.currentTime = 0;
    sounds.route101.play();

    // Crear instancia del juego
    new Game();
  }
}

// ============================
// 7. INICIALIZACIÓN DEL DOM
// ============================

/**
 * CARGA INICIAL DEL JUEGO
 * Se ejecuta cuando todo el DOM está cargado
 * Inicializa audio y comienza la secuencia de introducción
 */
window.addEventListener("DOMContentLoaded", () => {
  // Inicializar sistema de audio
  initializeAudio();
  
  // Precargar música de fondo del menú
  sounds.littleroot.load();

  // Comenzar secuencia de introducción
  showNextLine();
});

// ============================
// 8. EVENT LISTENERS GLOBALES
// ============================

/**
 * Botón para avanzar en la introducción
 */
startButton.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevenir propagación del evento
  currentLine++;

  // En la segunda línea, iniciar música de fondo
  if (currentLine === 1) {
    sounds.littleroot.currentTime = 0;
    sounds.littleroot.play().catch(() => {
      console.log("Autoplay bloqueado por el navegador");
    });
  }

  showNextLine();
});

/**
 * Botón de reinicio en el modal de victoria
 */
document.getElementById("restart-button").addEventListener("click", () => {
  if (window.gameInstance) {
    window.gameInstance.reiniciarJuego();
  }
});

// ============================
// FIN DEL SCRIPT PRINCIPAL
// ============================