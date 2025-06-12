// ====== Audio Setup ======
const sounds = {
  throw: new Audio('./audio/throw.mp3'),
  capture: new Audio('./audio/capture.mp3'),
  littleroot: new Audio('./audio/littleroot.mp3'),
  route101: new Audio('./audio/route101.mp3')
};

const VOLUMES = {
  throw: 0.08,
  capture: 0.08,
  littleroot: 0.05,
  route101: 0.01,
};

// Fijamos volúmenes iniciales
for (const key in sounds) {
  sounds[key].volume = VOLUMES[key];
}

sounds.littleroot.loop = true;
sounds.route101.loop = true;

// Forzamos que el volumen no cambie inesperadamente
function fixVolume(audio, volume) {
  Object.defineProperty(audio, 'volume', {
    get() { return volume; },
    set(_) { /* ignorar set */ },
    configurable: true
  });
}
fixVolume(sounds.littleroot, VOLUMES.littleroot);
fixVolume(sounds.route101, VOLUMES.route101);

// Control visibilidad pestaña
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!sounds.littleroot.paused) sounds.littleroot.pause();
    if (!sounds.route101.paused) sounds.route101.pause();
  } else {
    // Reanuda sólo el que corresponde en ese momento
    if (introModal.style.display !== "none") {
      sounds.littleroot.play().catch(() => {});
    } else {
      sounds.route101.play().catch(() => {});
    }
  }
});

class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.pokedexElement = document.getElementById("pokedex-counter");
    this.pokemons = [];
    this.pokedex = new Set();
    this.nivelActual = 0;
    this.pokeballActiva = false;

    // --- Añadido: referencia al sprite lanzador
    this.throwerSprite = document.getElementById("thrower-sprite");
    this.spriteFrames = 5;
    this.spriteCurrentFrame = 1;
    this.spriteInterval = null;

    this.niveles = [
      ["Torchic", "Treecko", "Mudkip"],
      ["poochyena", "zigzagoon", "wurmple"],
      ["seedot", "shroomish", "slakoth"],
    ];

    this.totalPokemon = this.niveles.flat().length;
    this.crearNivel();

    this.clickTarget = null; // guardamos el objetivo de click para la pokeball

    this.container.addEventListener("click", (e) => {
      if (this.pokeballActiva) return;

      const rect = this.container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Guardamos el objetivo para lanzar pokeball en frame 4
      this.clickTarget = { x: clickX, y: clickY };

      this.animarSprite();

      this.pokeballActiva = true;
    });

    this.resetSprite();

    window.gameInstance = this;
  }

  animarSprite() {
    if (this.spriteInterval) return; // si ya hay animación, no hacer nada

    this.spriteCurrentFrame = 1;
    this.actualizarSprite();

    let pokeballLanzada = false;

    this.spriteInterval = setInterval(() => {
      this.spriteCurrentFrame++;
      if (this.spriteCurrentFrame > this.spriteFrames) {
        clearInterval(this.spriteInterval);
        this.spriteInterval = null;
        this.resetSprite();
      } else {
        this.actualizarSprite();

        if (this.spriteCurrentFrame === 4 && !pokeballLanzada) {
          pokeballLanzada = true;

          // Posición inicial de la pokeball justo encima/derecha del sprite lanzador
          const startX = this.throwerSprite.offsetLeft + this.throwerSprite.clientWidth - 20;
          const startY = this.throwerSprite.offsetTop + 20;

          if (this.clickTarget) {
            new Pokeball(startX, startY, this.clickTarget.x, this.clickTarget.y, this);
            sounds.throw.currentTime = 0;
            sounds.throw.play();
          }
        }
      }
    }, 110); // velocidad más lenta (antes 110ms)
  }

  actualizarSprite() {
    this.throwerSprite.style.backgroundImage = `url('./img/sprite-${this.spriteCurrentFrame}.png')`;
  }

  resetSprite() {
    this.spriteCurrentFrame = 1;
    this.actualizarSprite();
  }

  crearNivel() {
    this.limpiarEscenario();
    this.container.className = "";
    this.container.classList.add(`fondo-nivel-${this.nivelActual}`);

    this.pokemons = [];

    const nombres = this.niveles[this.nivelActual];

    for (const nombre of nombres) {
      let x,
        y,
        intentos = 0;
      do {
        x = Math.random() * (800 - 80 - 20) + 10;
        y = Math.random() * (300 - 80 - 20) + 10;
        intentos++;
      } while (this.posicionSolapa(x, y) && intentos < 100);

      const nuevo = new Pokemon(nombre, this.container, x, y);
      this.pokemons.push(nuevo);
    }

    this.actualizarPokedex();
  }

  posicionSolapa(x, y) {
    return this.pokemons.some((p) => {
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 80;
    });
  }

  limpiarEscenario() {
    this.pokemons.forEach((p) => this.container.removeChild(p.element));
    this.pokemons = [];
  }

  capturarPokemon(nombre, pokemonObj, pokeball) {
    if (!this.pokedex.has(nombre)) {
      this.pokedex.add(nombre);
      this.actualizarPokedex();
    }

    const el = pokemonObj.element;
    el.style.transition =
      "filter 0.2s ease, transform 0.3s ease 0.2s, opacity 0.3s ease 0.2s";
    el.style.filter = "brightness(400)";

    sounds.capture.currentTime = 0;
    sounds.capture.play();

    setTimeout(() => {
      el.style.transform = "scale(0)";
      el.style.opacity = "0";
    }, 200);

    if (pokeball?.element) {
      pokeball.element.style.animation = "rebote 0.5s ease";
    }

    setTimeout(() => {
      this.container.removeChild(el);
      if (pokeball?.element) {
        pokeball.element.remove();
      }
      this.pokemons = this.pokemons.filter((p) => p !== pokemonObj);
      this.pokeballActiva = false;

      this.resetSprite();

      if (this.pokemons.length === 0) {
        this.nivelActual++;
        if (this.nivelActual < this.niveles.length) {
          setTimeout(() => this.crearNivel(), 1000);
        } else {
          this.mostrarModalVictoria();
        }
      }
    }, 600);
  }

  actualizarPokedex() {
    if (this.pokedexElement) {
      this.pokedexElement.textContent = `Pokédex: ${this.pokedex.size}/${this.totalPokemon}`;
    }
  }

  mostrarModalVictoria() {
    const modal = document.getElementById("win-modal");
    modal.classList.remove("hidden");
  }

  reiniciarJuego() {
    this.nivelActual = 0;
    this.pokedex.clear();
    this.actualizarPokedex();

    sounds.route101.currentTime = 0;
    sounds.route101.play();

    this.crearNivel();

    const modal = document.getElementById("win-modal");
    modal.classList.add("hidden");

    this.resetSprite();
  }
}

class Pokeball {
  constructor(xInicio, yInicio, xObjetivo, yObjetivo, game) {
    this.x = xInicio;
    this.y = yInicio;
    this.vx = (xObjetivo - this.x) / 30;
    this.vy = (yObjetivo - this.y) / 30 - 5;
    this.radius = 15;
    this.element = document.createElement("div");
    this.element.classList.add("pokeball");
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    game.container.appendChild(this.element);
    this.game = game;

    this.animar();
  }

  animar() {
    const intervalo = setInterval(() => {
      this.x += this.vx;
      this.vy += 0.5;
      this.y += this.vy;

      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;

      for (const pokemon of this.game.pokemons) {
        if (this.colisionaCon(pokemon)) {
          clearInterval(intervalo);
          this.element.style.left = `${this.x}px`;
          this.element.style.top = `${this.y}px`;
          this.game.capturarPokemon(pokemon.nombre, pokemon, this);
          return;
        }
      }

      if (this.y > 400 || this.x > 800 || this.x < 0) {
        clearInterval(intervalo);
        this.element.remove();
        this.game.pokeballActiva = false;
        this.game.resetSprite();
      }
    }, 20);
  }

  colisionaCon(pokemon) {
    return (
      this.x + this.radius > pokemon.x &&
      this.x < pokemon.x + pokemon.width &&
      this.y + this.radius > pokemon.y &&
      this.y < pokemon.y + pokemon.height
    );
  }
}

class Pokemon {
  constructor(nombre, container, x, y) {
    this.nombre = nombre;
    this.width = 80;
    this.height = 80;
    this.x = x;
    this.y = y;

    this.element = document.createElement("div");
    this.element.classList.add("pokemon");
    this.element.style.opacity = "0";
    this.element.style.transform = "scale(0.5)";
    this.element.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const img = document.createElement("img");
    img.src = `./img/${nombre.toLowerCase()}.png`;
    img.alt = nombre;
    img.style.width = "100%";
    img.style.height = "100%";

    this.element.appendChild(img);
    container.appendChild(this.element);
    this.actualizarPosicion();

    setTimeout(() => {
      this.element.style.opacity = "1";
      this.element.style.transform = "scale(1)";
    }, 50);
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
  }
}

// ============================
// Intro animada tipo Pokémon
// ============================

const introLines = [
  "¡Hola! Me llamo Abedul, pero todos me llaman Profesor Pokémon.",
  "¡Prepárate para comenzar tu aventura!",
  "Captura todos los Pokémon de cada ruta para avanzar a la siguiente, cuanto más lejos apuntes, más fuerte tirarás la Pokeball.",
];

let currentLine = 0;
let currentChar = 0;
let typingInterval;

const dialogueText = document.getElementById("dialogue-text");
const startButton = document.getElementById("start-button");
const introModal = document.getElementById("intro-modal");

function typeLine() {
  if (currentChar < introLines[currentLine].length) {
    dialogueText.textContent += introLines[currentLine].charAt(currentChar);
    currentChar++;
  } else {
    clearInterval(typingInterval);
    startButton.classList.add("visible");
  }
}

function showNextLine() {
  startButton.classList.remove("visible");
  dialogueText.textContent = "";
  currentChar = 0;

  if (currentLine < introLines.length) {
    typingInterval = setInterval(typeLine, 20);
  } else {
    introModal.style.display = "none";

    sounds.littleroot.pause();
    sounds.route101.currentTime = 0;
    sounds.route101.play();

    new Game();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  sounds.littleroot.load();

  showNextLine();
});

startButton.addEventListener("click", (e) => {
  e.stopPropagation();
  currentLine++;

  if (currentLine === 1) {
    sounds.littleroot.currentTime = 0;
    sounds.littleroot.play().catch(() => {
      console.log("Autoplay bloqueado");
    });
  }

  showNextLine();
});

// Botón reiniciar modal victoria
document.getElementById("restart-button").addEventListener("click", () => {
  if (window.gameInstance) {
    window.gameInstance.reiniciarJuego();
  }
});
