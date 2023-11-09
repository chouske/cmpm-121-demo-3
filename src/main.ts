import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
//import { Board } from "./board";
const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);
const sensorButton = document.querySelector("#sensor")!;
sensorButton.addEventListener("click", () => {
  navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  });
});

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";
interface Coin {
  origin: Geocache;
  serialNum: number;
}
class Geocache {
  coins: Coin[] = [];
  location: leaflet.LatLng;
  initialCoins: number;
  constructor(location: leaflet.LatLng, initialCoins: number) {
    this.location = location;
    this.initialCoins = initialCoins;
    for (let i = 0; i < initialCoins; i++) {
      this.coins.push({ origin: this, serialNum: i });
    }
  }
  removeCoin() {
    return this.coins.pop();
  }
  addCoin(addedCoin: Coin) {
    return this.coins.push(addedCoin);
  }
}
let allCaches: Geocache[] = [];
let playerCoins: Coin[] = [];
function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [
      MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + j * TILE_DEGREES,
    ],
    [
      MERRILL_CLASSROOM.lat + (i + 1) * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + (j + 1) * TILE_DEGREES,
    ],
  ]);

  const pit = leaflet.rectangle(bounds) as leaflet.Layer;
  pit.bindPopup(() => {
    let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    let tempCache = new Geocache(leaflet.latLng(i, j), value);
    allCaches.push(tempCache);
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                <button id="poke">poke</button>
                <button id="deposit">deposit</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    poke.addEventListener("click", () => {
      if (value > 0) {
        value--;
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();
        let removedCoin = tempCache.removeCoin();
        if (removedCoin != undefined) {
          console.log(removedCoin);
          playerCoins.push(removedCoin);
        }
        points++;
        statusPanel.innerHTML = `${points} points accumulated`;
      }
    });
    deposit.addEventListener("click", () => {
      if (points > 0) {
        let addedCoin = playerCoins.pop();
        if (addedCoin != undefined) {
          console.log(addedCoin);
          tempCache.addCoin(addedCoin);
        }
        value++;
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();
        points--;
        statusPanel.innerHTML = `${points} points accumulated`;
      }
    });
    return container;
  });

  pit.addTo(map);
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(i, j);
    }
  }
}
