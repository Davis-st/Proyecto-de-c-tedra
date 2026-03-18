import { ColaPedidos } from './Estructuras/ColaPedidos.js';

// --- CONFIGURACIÓN SUPABASEEEEssssssEEE....
const SUPABASE_URL = 'https://nybdoaclmzdfqeaefgxx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_JIUJgw-34pVpDNE8yxdNlQ_xz3vSxzu';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const datosDirecciones = {
    "San Salvador": { "San Salvador": 10, "Soyapango": 10 },
    "La Libertad": { "Santa Tecla": 10, "Antiguo Cuscatlán": 10 }
};

const menusPorRestaurante = {
    'Pizzeria La Toscana': [{n: "Pizza Cuatro Quesos", p: 12.00}, {n: "Pizza Pepperoni", p: 10.50}], 
    'Burger House Gourmet': [{n: "Hamburguesa Doble Carne", p: 6.50}, {n: "Papas Fritas", p: 2.50}],
    'Taquería El Pastor': [{n: "Orden Tacos al Pastor", p: 5.00}, {n: "Gringas de Res", p: 5.00}]
};

// --- VARIABLES GLOBALES ---
let usuarioLogueado = null; 
let carritoLocal = [];
let colaCentral = new ColaPedidos();
let trackingInterval = null; 

// --- PERSISTENCIA DE LA COLA ---
function guardarColaEnStorage() {
    localStorage.setItem('colaCentral', JSON.stringify(colaCentral.obtenerTodos()));
}

function cargarColaDeStorage() {
    const data = localStorage.getItem('colaCentral');
    if (data) colaCentral.items = JSON.parse(data);
}

// --- GESTIÓN DE VISTAS ---
window.cambiarVista = (idVista) => {
    document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
    document.getElementById(idVista).style.display = 'block';
    
    if(trackingInterval) clearInterval(trackingInterval);

    if(idVista === 'vista-panel-delivery') renderizarPanelDelivery();
    if(idVista === 'vista-rastreo-cliente') iniciarRastreoEnVivo();
    if(idVista === 'vista-historial-cliente') cargarHistorialCliente();
    if(idVista === 'vista-historial-delivery') cargarHistorialDelivery();
};

function configurarDashboardPorRol() {
    const menuCliente = document.getElementById('menu-cliente');
    const menuDelivery = document.getElementById('menu-delivery');
    const titulo = document.getElementById('titulo-rol');

    if (usuarioLogueado.rol === 'delivery') {
        titulo.textContent = "Panel de Operaciones";
        menuCliente.style.display = 'none';
        menuDelivery.style.display = 'block';
        cambiarVista('vista-panel-delivery');
    } else {
        titulo.textContent = "Panel de Usuario";
        menuCliente.style.display = 'block';
        menuDelivery.style.display = 'none';
        cambiarVista('vista-pedidos');
    }
}

// --- 1. RASTREO AUTOMÁTICO (POLLING) ---
async function iniciarRastreoEnVivo() {
    const icono = document.getElementById('tracking-icono');
    const texto = document.getElementById('tracking-texto');
    const desc = document.getElementById('tracking-desc');

    icono.textContent = "🔍";
    texto.textContent = "Buscando su pedido...";

    trackingInterval = setInterval(async () => {
        const { data, error } = await supabase.from('historialpedidos')
            .select('*')
            .eq('cliente', usuarioLogueado.usuario)
            .order('id', { ascending: false })
            .limit(1);

        if(data && data.length > 0) {
            let ultimoPedido = data[0];
            if(ultimoPedido.estado === 'Entregado') {
                icono.textContent = "✅";
                texto.textContent = "¡Pedido Entregado!";
                desc.textContent = `Despachado con éxito por: ${ultimoPedido.repartidor}`;
                icono.style.color = "#10b981";
            } else {
                icono.textContent = "🛵";
                texto.textContent = "En preparación / Fila de espera";
                desc.textContent = "Su orden está en el sistema de prioridad.";
                icono.style.color = "#f59e0b";
            }
        }
    }, 3000);
}

// --- 2. CARGA DE HISTORIALES DESDE BD ---
async function cargarHistorialCliente() {
    const contenedor = document.getElementById('lista-historial-cliente');
    contenedor.innerHTML = "<p>Cargando datos...</p>";
    
    const { data, error } = await supabase.from('historialpedidos')
        .select('*').eq('cliente', usuarioLogueado.usuario).order('id', { ascending: false });

    if(error || data.length === 0) return contenedor.innerHTML = "<p>No hay registros.</p>";

    contenedor.innerHTML = data.map(p => `
        <div style="background:white; padding:15px; border-radius:8px; border-left:4px solid ${p.estado==='Entregado'?'#10b981':'#f59e0b'}; margin-bottom:10px;">
            <strong>Orden #${p.id} - ${p.restaurante}</strong>
            <p style="margin:5px 0;">Platos: ${p.descripcion}</p>
            <small>Estado: ${p.estado} ${p.repartidor ? `(Repartidor: ${p.repartidor})` : ''}</small>
        </div>
    `).join('');
}

async function cargarHistorialDelivery() {
    const contenedor = document.getElementById('lista-historial-delivery');
    contenedor.innerHTML = "<p>Cargando entregas...</p>";
    
    const { data, error } = await supabase.from('historialpedidos')
        .select('*').eq('repartidor', usuarioLogueado.usuario).order('id', { ascending: false });

    if(error || data.length === 0) return contenedor.innerHTML = "<p>No has realizado entregas.</p>";

    contenedor.innerHTML = data.map(p => `
        <div style="background:white; padding:15px; border-radius:8px; border-left:4px solid #3b82f6; margin-bottom:10px;">
            <strong>Entrega #${p.id} - Cliente: ${p.cliente}</strong>
            <p style="margin:5px 0;">Ubicación: ${p.destino}</p>
            <small>Fecha: ${new Date(p.fecha).toLocaleString()}</small>
        </div>
    `).join('');
}

// --- 3. PANEL REPARTIDOR (COLA) ---
function renderizarPanelDelivery() {
    cargarColaDeStorage();
    const divUnico = document.getElementById('lista-pedidos-unica');
    
    if (colaCentral.estaVacia()) {
        divUnico.innerHTML = "<p style='color:#666; text-align:center;'>No hay órdenes en espera.</p>";
        return;
    }

    divUnico.innerHTML = colaCentral.obtenerTodos().map(t => {
        let esVip = t.prioridad === 1;
        let colorBorde = esVip ? '#f59e0b' : '#3b82f6';
        let fondo = esVip ? '#fffaf0' : '#ffffff';
        let etiqueta = esVip ? '<span style="color:#f59e0b; font-weight:bold;">[EXPRESS VIP]</span>' : '<span style="color:#666;">[ESTÁNDAR]</span>';

        return `
        <div style="padding:15px; background:${fondo}; border-left:5px solid ${colorBorde}; border-radius:5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin:0;">Ticket #${t.db_id} ${etiqueta}</h4>
            <p style="margin:5px 0;">📍 Destino: <strong>${t.destino}</strong></p>
            <small>Cliente: ${t.cliente} | Restaurante: ${t.restaurante}</small>
        </div>`;
    }).join("");
}

const btnAtender = document.getElementById('btn-atender-siguiente');
if(btnAtender) {
    btnAtender.addEventListener('click', async () => {
        if (colaCentral.estaVacia()) return alert("No hay pedidos.");

        let ticketSale = colaCentral.desencolar();
        guardarColaEnStorage();
        
        // ACTUALIZAR BD
        await supabase.from('historialpedidos')
            .update({ estado: 'Entregado', repartidor: usuarioLogueado.usuario })
            .eq('id', ticketSale.db_id);

        renderizarPanelDelivery();
        alert(`✅ Orden atendida exitosamente.`);
    });
}

// --- 4. LÓGICA DE COMPRA ---
window.agregarAlCarrito = (nombre) => {
    carritoLocal.push(nombre);
    document.getElementById('contenedor-carrito').innerHTML = carritoLocal.map(p => `<div>• ${p}</div>`).join("");
};

document.getElementById('btn-abrir-pago').addEventListener('click', () => {
    if(carritoLocal.length === 0) return alert("Carrito vacío.");
    document.getElementById('modal-pago').style.display = 'flex';
    document.getElementById('modal-direccion-confirm').textContent = usuarioLogueado.direccion;
});
document.getElementById('btn-cerrar-modal').addEventListener('click', () => document.getElementById('modal-pago').style.display = 'none');
async function procesarPago(metodo) {
    const isVip = document.getElementById('check-vip').checked;
    const restId = document.getElementById('select-restaurante').value;
    
    // 1. GUARDAR EN BD PRIMERO
    const { data, error } = await supabase.from('historialpedidos').insert([{
        cliente: usuarioLogueado.usuario,
        restaurante: restId,
        destino: usuarioLogueado.direccion,
        descripcion: carritoLocal.join(", "),
        prioridad: isVip ? 1 : 2,
        estado: 'Pendiente'
    }]).select(); 
    
    if(error) return alert("Error al registrar en base de datos.");

    // --- AQUÍ ESTÁ EL ARREGLO ---
    cargarColaDeStorage(); // Sincronizamos con lo que el repartidor ya quitó
    // ----------------------------

    const nuevoTicket = {
        db_id: data[0].id,
        cliente: usuarioLogueado.usuario,
        prioridad: isVip ? 1 : 2, 
        restaurante: restId,
        destino: usuarioLogueado.direccion
    };

    colaCentral.encolar(nuevoTicket);
    guardarColaEnStorage();

    carritoLocal = [];
    document.getElementById('contenedor-carrito').innerHTML = "<p>Carrito vacío.</p>";
    document.getElementById('modal-pago').style.display = 'none';
    
    alert("Pedido procesado.");
    cambiarVista('vista-rastreo-cliente');

}

document.getElementById('btn-pago-efectivo').addEventListener('click', () => procesarPago('Efectivo'));
document.getElementById('btn-pago-tarjeta').addEventListener('click', () => procesarPago('Tarjeta'));

// --- 5. SISTEMA DE LOGIN Y REGISTRO (CON MINÚSCULAS) ---
document.getElementById('btn-registro-submit').addEventListener('click', async () => {
    const usuario = document.getElementById('reg-usuario').value;
    const pass = document.getElementById('reg-pass').value;
    const rol = document.getElementById('reg-rol').value;
    const selCasa = document.getElementById('sel-casa').value;
    const selMuni = document.getElementById('sel-muni').value;
    
    if(!usuario || !pass) return alert("Faltan datos.");
    const direccionFinal = rol === 'cliente' ? `${selCasa}, ${selMuni}` : 'Central Operativa';

    const { error } = await supabase.from('usuarios').insert([{
        usuario, password: pass, rol, direccion: direccionFinal
    }]);
    
    if(error) alert("Error: " + error.message);
    else { alert("Registro exitoso."); document.getElementById('container').classList.remove("right-panel-active"); }
});

document.getElementById('btn-login-submit').addEventListener('click', async () => {
    const usuario = document.getElementById('login-usuario').value;
    const pass = document.getElementById('login-pass').value;
    
    const { data, error } = await supabase.from('usuarios')
        .select('*').eq('usuario', usuario).eq('password', pass);
    
    if(data && data.length > 0) {
        usuarioLogueado = data[0]; 
        localStorage.setItem('sesionActiva', JSON.stringify(usuarioLogueado));
        location.reload(); 
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
});

// --- INICIALIZACIÓN ---
function inicializarMenu() {
    const selectRest = document.getElementById('select-restaurante');
    selectRest.innerHTML = '';
    for (let nombre in menusPorRestaurante) {
        let opt = document.createElement('option');
        opt.value = nombre; opt.textContent = nombre;
        selectRest.appendChild(opt);
    }
    selectRest.addEventListener('change', (e) => cargarMenuFijo(e.target.value));
    cargarMenuFijo(selectRest.value);
}

function cargarMenuFijo(id) {
    const items = menusPorRestaurante[id] || [];
    document.getElementById('contenedor-menu').innerHTML = items.map(p => `
        <div style="background:#fff; padding:10px; margin:5px 0; border:1px solid #ddd; border-radius:5px; display:flex; justify-content:space-between;">
            <span>${p.n} <b>$${p.p.toFixed(2)}</b></span>
            <button onclick="agregarAlCarrito('${p.n}')" style="padding:2px 10px;">+</button>
        </div>
    `).join('');
}

window.onload = () => {
    const sesionGuardada = localStorage.getItem('sesionActiva');
    if (sesionGuardada) {
        usuarioLogueado = JSON.parse(sesionGuardada);
        document.getElementById('pantalla-login').style.display = 'none';
        document.getElementById('pantalla-dashboard').style.display = 'flex';
        document.getElementById('user-display').textContent = "Usuario: " + usuarioLogueado.usuario;
        document.getElementById('address-display').textContent = usuarioLogueado.direccion;
        inicializarMenu();
        configurarDashboardPorRol();
    }
    
    // Cargar selectores de dirección (Lógica rápida)
    const selDepto = document.getElementById('sel-depto');
    for(let d in datosDirecciones) { let o = document.createElement('option'); o.value=d; o.textContent=d; selDepto.appendChild(o); }
    selDepto.addEventListener('change', () => {
        const selMuni = document.getElementById('sel-muni');
        selMuni.innerHTML = '<option>Municipio</option>'; selMuni.disabled = false;
        for(let m in datosDirecciones[selDepto.value]) { let o = document.createElement('option'); o.value=m; o.textContent=m; selMuni.appendChild(o); }
    });
    document.getElementById('sel-muni').addEventListener('change', () => {
        const selCasa = document.getElementById('sel-casa');
        selCasa.innerHTML = ''; selCasa.disabled = false;
        for(let i=1; i<=5; i++) { let o = document.createElement('option'); o.value=`Casa ${i}`; o.textContent=`Casa ${i}`; selCasa.appendChild(o); }
    });
};

document.getElementById('btn-logout').addEventListener('click', () => { 
    localStorage.removeItem('sesionActiva'); 
    location.reload(); 
});
