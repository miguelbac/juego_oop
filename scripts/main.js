class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.puntosElement = document.getElementById("puntos");
    this.pokemons = [];
    this.pokedex = new Set();
    this.nivelActual = 0;

    this.niveles = [
      ["Torchic", "Treecko", "Mudkip"],
      ["poochyena", "zigzagoon", "wurmple"],
      ["seedot", "shroomish", "slakoth"]
    ];

    this.totalPokemon = this.niveles.flat().length;
    this.crearNivel();

    this.container.addEventListener("click", (e) => {
      const rect = this.container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      new Pokeball(clickX, clickY, this);
    });


  }

  crearNivel() {
    this.limpiarEscenario();
    this.container.className = "";
    this.container.classList.add(`fondo-nivel-${this.nivelActual}`);

    const nombres = this.niveles[this.nivelActual];
    nombres.forEach(nombre => {
      const pokemon = new Pokemon(nombre, this.container);
      this.pokemons.push(pokemon);
    });

    this.actualizarPokedex();
  }


  limpiarEscenario() {
    this.pokemons.forEach(p => this.container.removeChild(p.element));
    this.pokemons = [];
  }

  capturarPokemon(nombre, pokemonObj) {
    if (!this.pokedex.has(nombre)) {
      this.pokedex.add(nombre);
      this.actualizarPokedex();
    }

    this.container.removeChild(pokemonObj.element);
    this.pokemons = this.pokemons.filter(p => p !== pokemonObj);

    if (this.pokemons.length === 0) {
      this.nivelActual++;
      if (this.nivelActual < this.niveles.length) {
        setTimeout(() => this.crearNivel(), 1000);
      } else {
        alert("¡Has completado todos los niveles!");
      }
    }
  }

  actualizarPokedex() {
    this.puntosElement.textContent = `Pokédex: ${this.pokedex.size}/${this.totalPokemon}`;
  }

}

class Pokeball {
  constructor(xObjetivo, yObjetivo, game) {
    this.x = 0;
    this.y = 380; // desde esquina inferior izquierda
    this.vx = (xObjetivo - this.x) / 30;
    this.vy = (yObjetivo - this.y) / 30 - 5; // curva hacia arriba
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
      this.vy += 0.5; // gravedad
      this.y += this.vy;

      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;

      for (const pokemon of this.game.pokemons) {
        if (this.colisionaCon(pokemon)) {
          clearInterval(intervalo);
          this.game.capturarPokemon(pokemon.nombre, pokemon);
          this.element.remove();
          return;
        }
      }

      if (this.y > 400 || this.x > 800 || this.x < 0) {
        clearInterval(intervalo);
        this.element.remove();
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

    const img = document.createElement("img");
    img.src = `../img/${nombre}.png`;
    img.alt = nombre;
    img.style.width = "100%";
    img.style.height = "100%";

    this.element.appendChild(img);
    container.appendChild(this.element);

    this.actualizarPosicion();
  }

  actualizarPosicion() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }
}

const juego = new Game();