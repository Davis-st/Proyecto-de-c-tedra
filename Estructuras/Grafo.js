// Estructuras/Grafo.js

export class GrafoRutas {
    constructor() {
        this._nodos = new Set();
        this._adyacencias = new Map();
    }

    get nodos() { return Array.from(this._nodos); }
    get adyacencias() { return this._adyacencias; }

    agregarNodo(nodoId) {
        if (!this._nodos.has(nodoId)) {
            this._nodos.add(nodoId);
            this._adyacencias.set(nodoId, []);
        }
    }

    agregarArista(origen, destino, peso) {
        this.agregarNodo(origen);
        this.agregarNodo(destino);
        this._adyacencias.get(origen).push({ nodo: destino, peso: peso });
        this._adyacencias.get(destino).push({ nodo: origen, peso: peso });
    }

    // Algoritmo puro de Dijkstra entre dos puntos
    calcularRutaMasCorta(inicio, fin) {
        const distancias = new Map();
        const previos = new Map();
        const noVisitados = new Set(this._nodos);

        this._nodos.forEach(n => { distancias.set(n, Infinity); previos.set(n, null); });
        distancias.set(inicio, 0);

        while (noVisitados.size > 0) {
            let actual = null;
            let minDist = Infinity;
            noVisitados.forEach(n => {
                if (distancias.get(n) < minDist) { minDist = distancias.get(n); actual = n; }
            });

            if (actual === null || actual === fin) break;
            noVisitados.delete(actual);

            this._adyacencias.get(actual).forEach(vecino => {
                if (noVisitados.has(vecino.nodo)) {
                    let nuevaDist = distancias.get(actual) + vecino.peso;
                    if (nuevaDist < distancias.get(vecino.nodo)) {
                        distancias.set(vecino.nodo, nuevaDist);
                        previos.set(vecino.nodo, actual);
                    }
                }
            });
        }

        const ruta = [];
        let cur = fin;
        while (cur !== null) { ruta.unshift(cur); cur = previos.get(cur); }
        return { distanciaTotal: distancias.get(fin), ruta: distancias.get(fin) === Infinity ? [] : ruta };
    }
}