// Estructuras/ArbolBusqueda.js

class NodoArbol {
    constructor(producto) {
        this.producto = producto;
        this.izq = null;
        this.der = null;
    }
}

export class ArbolBusquedaMenu {
    constructor() {
        this.raiz = null;
    }

    // Insertamos ordenando alfabéticamente por el nombre del producto
    insertar(producto) {
        const nuevoNodo = new NodoArbol(producto);
        if (this.raiz === null) {
            this.raiz = nuevoNodo;
        } else {
            this._insertarNodo(this.raiz, nuevoNodo);
        }
    }

    _insertarNodo(nodo, nuevoNodo) {
        if (nuevoNodo.producto.n < nodo.producto.n) {
            if (nodo.izq === null) nodo.izq = nuevoNodo;
            else this._insertarNodo(nodo.izq, nuevoNodo);
        } else {
            if (nodo.der === null) nodo.der = nuevoNodo;
            else this._insertarNodo(nodo.der, nuevoNodo);
        }
    }

    // Recorrido In-Order: Obtiene los productos filtrados y ordenados alfabéticamente
    filtrarPorCategoria(categoria) {
        let resultados = [];
        this._recorridoInOrder(this.raiz, categoria, resultados);
        return resultados;
    }

    _recorridoInOrder(nodo, categoria, resultados) {
        if (nodo !== null) {
            this._recorridoInOrder(nodo.izq, categoria, resultados);
            
            // Si la categoría es 'Todas' o coincide con la del producto, lo agregamos
            if (categoria === 'Todas' || nodo.producto.cat === categoria) {
                resultados.push(nodo.producto);
            }
            
            this._recorridoInOrder(nodo.der, categoria, resultados);
        }
    }

    // Limpiar el árbol cuando cambiamos de restaurante
    limpiar() {
        this.raiz = null;
    }
}