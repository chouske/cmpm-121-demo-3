import leaflet from "leaflet";

interface Cell {
  readonly i: number;
  readonly j: number;
}
export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;
  constructor(tileWidth: number, tileVisibilityRadius: number) {
    // ...
    this.knownCells = new Map();
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    if (this.knownCells.get(key) == undefined) {
      this.knownCells.set(key, { i, j });
    }
    // ...
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({ i: point.lat, j: point.lng });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    // ...
    const { i, j } = cell;
    let bottomLeft = leaflet.latLng(i - 0.00005, j - 0.00005);
    let topRight = leaflet.latLng(i + 0.00005, j + 0.00005);
    return leaflet.latLngBounds(bottomLeft, topRight);
  }
  // ??
  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    //const originCell = this.getCellForPoint(point);
    //console.log("player pos:");
    //console.log(point);
    this.knownCells.forEach((value) => {
      let tempLat = value.i * this.tileWidth + 36.9995;
      let tempLng = value.j * this.tileWidth - 122.0533;
      /*console.log(
        "point: i: " +
          tempLat +
          " j: " +
          tempLng +
          " which is: " +
          value.i +
          " " +
          value.j
      );*/
      //console.log(Math.abs(point.lat - tempLat));
      //console.log(Math.abs(point.lng - tempLng));
      if (
        Math.abs(point.lat - tempLat) <
          this.tileVisibilityRadius * this.tileWidth &&
        Math.abs(point.lng - tempLng) <
          this.tileVisibilityRadius * this.tileWidth
      ) {
        resultCells.push(value);
      }
    });
    // ...
    //console.log(this.knownCells);
    return resultCells;
  }
}
