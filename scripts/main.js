class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.puntosElement = document.getElementById("puntos");
    this.pokemons = [];
    this.pokedex = new Set();
    this.nivelActual = 0;
    this.pokeballActiva = false;

    this.niveles = [
      ["Torchick", "Treecko", "Mudkip"],
      ["poochyena", "zigzagoon", "wurmple"],
      ["seedot", "shroomish", "slakoth"]
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

    const nombres = this.niveles[this.nivelActual];
    for (const nombre of nombres) {
      let nuevo;
      let intentos = 0;
      do {
        nuevo = new Pokemon(nombre, this.container);
        intentos++;
      } while (this.solapaMucho(nuevo) && intentos < 20);
      this.pokemons.push(nuevo);
    }

    this.actualizarPokedex();
  }

  solapaMucho(nuevo) {
    return this.pokemons.some(p => {
      const dx = nuevo.x - p.x;
      const dy = nuevo.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 60; // distancia mínima entre Pokémon
    });
  }

  limpiarEscenario() {
    this.pokemons.forEach(p => this.container.removeChild(p.element));
    this.pokemons = [];
  }

  capturarPokemon(nombre, pokemonObj, pokeball) {
    if (!this.pokedex.has(nombre)) {
      this.pokedex.add(nombre);
      this.actualizarPokedex();
    }

    const el = pokemonObj.element;
    el.style.transition = "filter 0.2s ease, transform 0.3s ease 0.2s, opacity 0.3s ease 0.2s";
    el.style.filter = "brightness(4)";

    setTimeout(() => {
      el.style.transform = "scale(0)";
      el.style.opacity = "0";
    }, 200);

    // efecto de rebote de la pokeball
    if (pokeball?.element) {
      pokeball.element.style.animation = "rebote 0.5s ease";
    }

    setTimeout(() => {
      this.container.removeChild(el);
      if (pokeball?.element) {
        pokeball.element.remove();
      }
      this.pokemons = this.pokemons.filter(p => p !== pokemonObj);
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
    this.puntosElement.textContent = `Pokédex: ${this.pokedex.size}/${this.totalPokemon}`;
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
  constructor(nombre, container) {
    this.nombre = nombre;
    this.x = Math.random() * 550 + 50;
    this.y = Math.random() * 200 + 50;
    this.width = 40;
    this.height = 40;

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
  }
}

const juego = new Game();
