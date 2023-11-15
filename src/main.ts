import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board } from "./board";
const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});
/*interface Cell {
  readonly i: number;
  readonly j: number;
}*/
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;
const theBoard = new Board(0.0001, 2);
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
let sensorButtonToggled = false;
let currentpos: any;
navigator.geolocation.watchPosition((position) => {
  currentpos = position;
});
sensorButton.addEventListener("click", () => {
  if (sensorButtonToggled == false) {
    sensorButtonToggled = true;
  } else {
    sensorButtonToggled = false;
  }
  /*navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  });
  */
});
let hiddencaches: string[] = [];
let shownpits: { thePit: leaflet.Layer; theCache: Geocache }[] = [];
const westButton = document.querySelector("#west");
const eastButton = document.querySelector("#east");
const northButton = document.querySelector("#north");
const southButton = document.querySelector("#south");
function pitCheck(): void {
  let nearCells = theBoard.getCellsNearPoint(playerMarker.getLatLng());
  nearCells.forEach((nearCellsElement) => {
    const { i, j } = nearCellsElement;
    hiddencaches.forEach((hiddenCachesElement, index) => {
      let compareCache: Geocache = JSON.parse(hiddenCachesElement);
      if (compareCache.location.i == i && compareCache.location.j == j) {
        hiddencaches.splice(index, 1);
        shownpits.push(makePit(i, j, hiddenCachesElement));
      }
    });
  });
  let found = false;
  shownpits.forEach((shownPitsElement) => {
    found = false;
    nearCells.forEach((nearCellsElement) => {
      const { i, j } = nearCellsElement;
      if (
        shownPitsElement.theCache.location.i == i &&
        shownPitsElement.theCache.location.j == j
      ) {
        found = true;
      }
    });
    if (found == false) {
      hiddencaches.push(shownPitsElement.theCache.toMomento());
      shownPitsElement.thePit.remove();
    }
  });
}
westButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat, tempLng - 0.0001));
  map.setView(playerMarker.getLatLng());
  pitCheck();
});
eastButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat, tempLng + 0.0001));
  map.setView(playerMarker.getLatLng());
  pitCheck();
});
southButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat - 0.0001, tempLng));
  map.setView(playerMarker.getLatLng());
  pitCheck();
});
northButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat + 0.0001, tempLng));
  map.setView(playerMarker.getLatLng());
  pitCheck();
});

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";
interface Coin {
  position: { i: number; j: number };
  serialNum: number;
}
class Geocache {
  coins: Coin[] = [];
  location: { i: number; j: number };
  initialCoins: number;
  constructor(location: { i: number; j: number }, initialCoins: number) {
    this.location = theBoard.getCellForPoint(
      leaflet.latLng(location.i, location.j)
    );
    this.initialCoins = initialCoins;
    for (let k = 0; k < initialCoins; k++) {
      this.coins.push({
        //position: { i: this.location.i, j: this.location.j },
        position: theBoard.getCellForPoint(
          leaflet.latLng(this.location.i, this.location.j)
        ),
        serialNum: k,
      });
    }
  }
  removeCoin() {
    return this.coins.pop();
  }
  addCoin(addedCoin: Coin) {
    return this.coins.push(addedCoin);
  }
  toMomento() {
    return JSON.stringify(this);
  }
  fromMomento(inputString: string) {
    let newObj = JSON.parse(inputString);
    this.location.i = newObj.location.i;
    this.location.j = newObj.location.j;
    this.initialCoins = newObj.initialCoins;
    this.coins = newObj.coins;
  }
}
//let hiddencaches: Geocache[] = [];
let playerCoins: Coin[] = [];
function makePit(i: number, j: number, pitData: any = null) {
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
  let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
  let tempCache = new Geocache({ i, j }, value);
  if (pitData != null) {
    tempCache.fromMomento(pitData);
  }
  pit.bindPopup(() => {
    //let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${tempCache.coins.length}</span>.</div>
                <button id="poke">poke</button>
                <button id="deposit">deposit</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    poke.addEventListener("click", () => {
      if (value > 0) {
        value--;
        let removedCoin = tempCache.removeCoin();
        if (removedCoin != undefined) {
          //console.log(removedCoin);
          playerCoins.push(removedCoin);
        }
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          tempCache.coins.length.toString();
        points++;
        statusPanel.innerHTML = `${points} points accumulated`;
      }
    });
    deposit.addEventListener("click", () => {
      if (points > 0) {
        let addedCoin = playerCoins.pop();
        if (addedCoin != undefined) {
          //console.log(addedCoin);
          tempCache.addCoin(addedCoin);
        }
        value++;
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          tempCache.coins.length.toString();
        points--;
        statusPanel.innerHTML = `${points} points accumulated`;
      }
    });
    return container;
  });

  pit.addTo(map);
  if (pitData == null) {
    hiddencaches.push(tempCache.toMomento());
    pit.remove();
  }
  return { thePit: pit, theCache: tempCache };
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(i, j);
    }
  }
}
pitCheck();
function update() {
  navigator.geolocation.watchPosition((position) => {
    if (
      currentpos.coords.latitude != position.coords.latitude &&
      currentpos.coords.longitude != position.coords.longitude
    ) {
      currentpos = position;
      if (sensorButtonToggled == true) {
        playerMarker.setLatLng(
          leaflet.latLng(
            currentpos.coords.latitude,
            currentpos.coords.longitude
          )
        );
      }
      map.setView(playerMarker.getLatLng());
    }
    window.requestAnimationFrame(update);
  });
}
window.requestAnimationFrame(update);
