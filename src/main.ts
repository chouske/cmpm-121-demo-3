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
let lineCoords: any[][] = [];
let showncaches: string[] = [];
const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);
const sensorButton = document.querySelector("#sensor")!;
let sensorButtonToggled = false;
let currentpos: GeolocationPosition;
navigator.geolocation.watchPosition((position) => {
  currentpos = position;
});
if (localStorage.getItem("playerpos") != null) {
  let temppos = JSON.parse(localStorage.getItem("playerpos")!);
  playerMarker.setLatLng(temppos);
  map.setView(playerMarker.getLatLng());
}
lineCoords.push([playerMarker.getLatLng().lat, playerMarker.getLatLng().lng]);
let polyline = leaflet.polyline(lineCoords, { color: "red" }).addTo(map);
sensorButton.addEventListener("click", () => {
  if (sensorButtonToggled == false) {
    sensorButtonToggled = true;
    playerMarker.setLatLng(
      leaflet.latLng(currentpos.coords.latitude, currentpos.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  } else {
    sensorButtonToggled = false;
  }
  lineCoords = [[playerMarker.getLatLng().lat, playerMarker.getLatLng().lng]];
  updateLine();
  /*navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  });
  */
});
let hiddencaches: string[] = [];
if (localStorage.getItem("hiddencaches") != null) {
  hiddencaches = JSON.parse(localStorage.getItem("hiddencaches")!);
}
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
  shownpits.forEach((shownPitsElement, index) => {
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
      shownpits.splice(index, 1);
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
  updateLine();
});
eastButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat, tempLng + 0.0001));
  map.setView(playerMarker.getLatLng());
  pitCheck();
  updateLine();
});
southButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat - 0.0001, tempLng));
  map.setView(playerMarker.getLatLng());
  pitCheck();
  updateLine();
});
northButton!.addEventListener("click", () => {
  let tempLat = playerMarker.getLatLng().lat;
  let tempLng = playerMarker.getLatLng().lng;
  playerMarker.setLatLng(leaflet.latLng(tempLat + 0.0001, tempLng));
  map.setView(playerMarker.getLatLng());
  pitCheck();
  updateLine();
});

let points = 0;
if (localStorage.getItem("points") != null) {
  points = JSON.parse(localStorage.getItem("points")!);
}
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";
if (localStorage.getItem("statusPanel.innerHTML") != null) {
  statusPanel.innerHTML = localStorage.getItem("statusPanel.innerHTML")!;
}
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
let playerCoins: Coin[] = [];
if (localStorage.getItem("playercoins") != null) {
  playerCoins = JSON.parse(localStorage.getItem("playercoins")!);
}
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
      if (localStorage.getItem("hiddencaches") == null) {
        makePit(i, j);
      }
      //makePit(i, j);
    }
  }
}
if (localStorage.getItem("hiddencaches") != null) {
  //console.log("hiddnecacheslength: " + hiddencaches.length);
  let tempCache: Geocache = new Geocache({ i: 0, j: 0 }, 0);
  hiddencaches.forEach((hiddencacheselement) => {
    tempCache.fromMomento(hiddencacheselement);
    let tempelement = hiddencacheselement;
    //hiddencaches.splice(index, 1);
    let pitResult = makePit(
      tempCache.location.i,
      tempCache.location.j,
      tempelement
    );
    pitResult.thePit.remove();
  });
}
if (localStorage.getItem("showncaches") != null) {
  let tempCache: Geocache = new Geocache({ i: 0, j: 0 }, 0);
  showncaches = JSON.parse(localStorage.getItem("showncaches")!);
  showncaches.forEach((showncacheselement) => {
    //console.log(hiddencaches.length);
    //console.log(showncaches.length);
    tempCache.fromMomento(showncacheselement);
    shownpits.push(
      makePit(tempCache.location.i, tempCache.location.j, showncacheselement)
    );
  });
}
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
        updateLine();
      }
      map.setView(playerMarker.getLatLng());
      pitCheck();
    }
    window.requestAnimationFrame(update);
  });
}
window.requestAnimationFrame(update);
function reset() {
  localStorage.clear();
  hiddencaches = [];
  navigator.geolocation.watchPosition((position) => {
    currentpos = position;
  });
  playerMarker.setLatLng(MERRILL_CLASSROOM);
  points = 0;
  statusPanel.innerHTML = "No points yet...";
  playerCoins = [];
  shownpits.forEach((shownpitselement) => {
    shownpitselement.thePit.remove();
  });
  shownpits = [];
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
        makePit(i, j);
      }
    }
  }
  map.setView(playerMarker.getLatLng());
  lineCoords = [[playerMarker.getLatLng().lat, playerMarker.getLatLng().lng]];
  updateLine();
  pitCheck();
}
function updateLine() {
  lineCoords.push([playerMarker.getLatLng().lat, playerMarker.getLatLng().lng]);
  polyline.setLatLngs(lineCoords);
}
const resetButton = document.querySelector("#reset");
resetButton!.addEventListener("click", () => {
  reset();
});

function saveState() {
  showncaches = [];
  shownpits.forEach((shownpitselement) => {
    showncaches.push(shownpitselement.theCache.toMomento());
  });

  localStorage.setItem("hiddencaches", JSON.stringify(hiddencaches));
  localStorage.setItem("showncaches", JSON.stringify(showncaches));
  localStorage.setItem("playerpos", JSON.stringify(playerMarker.getLatLng()));
  localStorage.setItem("points", JSON.stringify(points));
  localStorage.setItem("statusPanel.innerHTML", statusPanel.innerHTML);
  localStorage.setItem("playercoins", JSON.stringify(playerCoins));
  //localStorage.setItem("shownpits", JSON.stringify(shownpits[0].theCache));
  //linecoords
  window.requestAnimationFrame(saveState);
}
//localStorage.clear();
pitCheck();
window.requestAnimationFrame(saveState);
