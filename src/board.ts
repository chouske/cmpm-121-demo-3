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
    this.knownCells.forEach((value) => {
      let tempLat = value.i;
      let tempLng = value.j;
      if (
        Math.abs(point.lat - tempLat) < 0.0002 &&
        Math.abs(point.lng - tempLng) < 0.0002
      ) {
        resultCells.push(value);
      }
    });

    // ...
    return resultCells;
  }
}
