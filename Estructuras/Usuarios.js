// --- ABSTRACCIÓN Y ENCAPSULAMIENTO ---
export class Usuario {
    constructor(usuario, rol, direccion) {
        this._usuario = usuario; // Atributos protegidos con guion bajo
        this._rol = rol;
        this._direccion = direccion;
    }

    // Métodos Getters para leer los datos de forma segura
    get usuario() { return this._usuario; }
    get rol() { return this._rol; }
    get direccion() { return this._direccion; }

    // Método plantilla que cambiará según el rol
    obtenerConfiguracionVista() { 
        throw new Error("Este método debe implementarse en la clase hija"); 
    }
}

// --- HERENCIA ---
export class Cliente extends Usuario {
    constructor(usuario, direccion) {
        super(usuario, 'cliente', direccion);
    }

    // --- POLIMORFISMO ---
    obtenerConfiguracionVista() {
        return {
            titulo: "Panel de Usuario",
            vistaInicial: 'vista-pedidos',
            menuCliente: 'block',
            menuDelivery: 'none'
        };
    }
}

export class Repartidor extends Usuario {
    constructor(usuario) {
        super(usuario, 'delivery', 'Central Operativa');
    }

    // --- POLIMORFISMO ---
    obtenerConfiguracionVista() {
        return {
            titulo: "Panel de Operaciones",
            vistaInicial: 'vista-panel-delivery',
            menuCliente: 'none',
            menuDelivery: 'block'
        };
    }
}