class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.pokedexElement = document.getElementById("pokedex-counter");
    this.pokemons = [];
    this.pokedex = new Set();
    this.nivelActual = 0;
    this.pokeballActiva = false;

    this.niveles = [
      ["Torchic", "Treecko", "Mudkip"],
      ["poochyena", "zigzagoon", "wurmple"],
      ["seedot", "shroomish", "slakoth"],
    ];

    this.totalPokemon = this.niveles.flat().length;
    this.crearNivel();

    this.container.addEventListener("click", (e) => {
      if (this.pokeballActiva) return;

      const rect = this.container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      new Pokeball(clickX, clickY, this);
      this.pokeballActiva = true;
    });
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
        y = Math.random() * (400 - 80 - 20) + 10;
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
    el.style.filter = "brightness(4)";

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

      if (this.pokemons.length === 0) {
        this.nivelActual++;
        if (this.nivelActual < this.niveles.length) {
          setTimeout(() => this.crearNivel(), 1000);
        } else {
          alert("¡Has completado todos los niveles!");
        }
      }
    }, 600);
  }

  actualizarPokedex() {
    if (this.pokedexElement) {
      this.pokedexElement.textContent = `Pokédex: ${this.pokedex.size}/${this.totalPokemon}`;
    }
  }
}

class Pokeball {
  constructor(xObjetivo, yObjetivo, game) {
    this.x = 0;
    this.y = 380;
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
    typingInterval = setInterval(typeLine, 40);
  } else {
    introModal.style.display = "none";
    new Game();
  }
}

startButton.addEventListener("click", (e) => {
  e.stopPropagation(); // evita que se lance una Pokéball
  currentLine++;
  showNextLine();
});

window.addEventListener("DOMContentLoaded", () => {
  showNextLine();
});
