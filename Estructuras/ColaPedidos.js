export class ColaPedidos {
    constructor() {
        this.items = [];
    }
    
    encolar(ticket) {
        let agregado = false;
        // Lógica de prioridad: VIP va antes que Normal 
        for (let i = 0; i < this.items.length; i++) {
            if (ticket.prioridad < this.items[i].prioridad) {
                this.items.splice(i, 0, ticket);
                agregado = true;
                break;
            }
        }
        if (!agregado) {
            this.items.push(ticket);
        }
    }
    
    desencolar() {
        return this.items.shift();
    }
    
    estaVacia() {
        return this.items.length === 0;
    }
    
    obtenerTodos() {
        return this.items;
    }
}