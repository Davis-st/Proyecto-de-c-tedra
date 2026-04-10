export class ColaPedidos {
    constructor() {
        this._items = []; // Encapsulamiento (privado)
    }
    
    encolar(ticket) {
        let agregado = false;
        // Lógica de prioridad: VIP va antes que Normal 
        for (let i = 0; i < this._items.length; i++) {
            if (ticket.prioridad < this._items[i].prioridad) {
                this._items.splice(i, 0, ticket);
                agregado = true;
                break;
            }
        }
        if (!agregado) {
            this._items.push(ticket);
        }
    }
    
    desencolar() {
        return this._items.shift();
    }
    
    estaVacia() {
        return this._items.length === 0;
    }
    
    obtenerTodos() {
        return [...this._items]; // Retornamos copia para proteger el original
    }

    cargarDesdeStorage(datos) {
        if(datos) this._items = datos;
    }
}