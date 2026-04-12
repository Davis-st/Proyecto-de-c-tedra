// IMPORTACIÓN DE CLASES
import { ColaPedidos } from './Estructuras/ColaPedidos.js';
import { Cliente, Repartidor } from './Estructuras/Usuarios.js';

//  CONFIGURACIÓN DE SUPABASE 
const SUPABASE_URL = 'https://nybdoaclmzdfqeaefgxx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_JIUJgw-34pVpDNE8yxdNlQ_xz3vSxzu';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ESTRUCTURAS DE DATOS Y ESTADO GLOBAL 
const colaCentral = new ColaPedidos();
let usuarioLogueado = null; 
let carritoLocal = [];
let trackingInterval = null; 

// CATÁLOGO DE COMIDAS
const menusPorRestaurante = {
    'Pizzeria La Toscana': [
        {n: "Pizza Cuatro Quesos", p: 12.00, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80"}, 
        {n: "Pizza Pepperoni", p: 10.50, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80"}
    ], 
    'Burger House Gourmet': [
        {n: "Hamburguesa Doble Carne", p: 6.50, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"}, 
        {n: "Papas Fritas", p: 2.50, img: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80"}
    ],
    'Taquería El Pastor': [
        {n: "Orden Tacos al Pastor", p: 5.00, img: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80"}, 
        {n: "Gringas de Res", p: 5.00, img: "https://i.pinimg.com/736x/bd/1e/b9/bd1eb90a564099ae22ef5acea3d9fbb0.jpg"}
    ]
};

const datosDirecciones = {
    "San Salvador": { "San Salvador": 10, "Soyapango": 10 },
    "La Libertad": { "Santa Tecla": 10, "Antiguo Cuscatlán": 10 }
};

// --- PERSISTENCIA DE LA COLA ---
function guardarColaEnStorage() {
    localStorage.setItem('colaCentral', JSON.stringify(colaCentral.obtenerTodos()));
}

function cargarColaDeStorage() {
    const data = localStorage.getItem('colaCentral');
    if (data) colaCentral.cargarDesdeStorage(JSON.parse(data));
}

//GESTIÓN DE VISTAS
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
    // usuarioLogueado mostrarra según su clase Cliente/Repartidor
    const config = usuarioLogueado.obtenerConfiguracionVista();
    
    document.getElementById('titulo-rol').textContent = config.titulo;
    document.getElementById('menu-cliente').style.display = config.menuCliente;
    document.getElementById('menu-delivery').style.display = config.menuDelivery;
    
    cambiarVista(config.vistaInicial);
}

// --- RASTREO Y DATOS DE SUPABASE ---
async function iniciarRastreoEnVivo() {
    const icono = document.getElementById('tracking-icono');
    const texto = document.getElementById('tracking-texto');
    const desc = document.getElementById('tracking-desc');

    trackingInterval = setInterval(async () => {
        const { data } = await supabase.from('historialpedidos')
            .select('*').eq('cliente', usuarioLogueado.usuario).order('id', { ascending: false }).limit(1);

        if(data && data.length > 0) {
            let p = data[0];
            if(p.estado === 'Entregado') {
                icono.textContent = "✅"; texto.textContent = "¡Entregado!";
                desc.textContent = `Despachado por: ${p.repartidor}`;
                icono.style.color = "#10b981";
            } else {
                icono.textContent = "🛵"; texto.textContent = "En camino / Fila";
                desc.textContent = "Tu orden está en el sistema de prioridad.";
                icono.style.color = "#f59e0b";
            }
        }
    }, 3000);
}

async function cargarHistorialCliente() {
    const contenedor = document.getElementById('lista-historial-cliente');
    contenedor.innerHTML = "<p>Cargando historial...</p>";
    const { data } = await supabase.from('historialpedidos').select('*').eq('cliente', usuarioLogueado.usuario).order('id', { ascending: false });
    
    if(!data || data.length === 0) return contenedor.innerHTML = "<p>Sin registros.</p>";
    contenedor.innerHTML = data.map(p => `
        <div class="panel" style="margin-bottom:10px; padding:15px; border-left:5px solid ${p.estado==='Entregado'?'#10b981':'#f59e0b'};">
            <strong>${p.restaurante} - Orden #${p.id}</strong>
            <p style="margin:5px 0;">${p.descripcion}</p>
            <small>Estado: ${p.estado}</small>
        </div>
    `).join('');
}

async function cargarHistorialDelivery() {
    const contenedor = document.getElementById('lista-historial-delivery');
    const { data } = await supabase.from('historialpedidos').select('*').eq('repartidor', usuarioLogueado.usuario).order('id', { ascending: false });
    
    if(!data || data.length === 0) return contenedor.innerHTML = "<p>No has entregado nada aún.</p>";
    contenedor.innerHTML = data.map(p => `
        <div class="panel" style="margin-bottom:10px; padding:15px; border-left:5px solid #3b82f6;">
            <strong>Entrega #${p.id} para ${p.cliente}</strong>
            <p style="margin:5px 0;">📍 ${p.destino}</p>
        </div>
    `).join('');
}

// CENTRO DE PERACIONES: COLA
function renderizarPanelDelivery() {
    cargarColaDeStorage();
    const lista = document.getElementById('lista-pedidos-unica');
    if (colaCentral.estaVacia()) return lista.innerHTML = "<p>No hay pedidos pendientes.</p>";

    lista.innerHTML = colaCentral.obtenerTodos().map(t => {
        let esVip = t.prioridad === 1;
        return `
        <div class="tarjeta-comida" style="border-left: 6px solid ${esVip?'#f59e0b':'#3b82f6'};">
            <div class="info-comida">
                <h4>Ticket #${t.db_id} ${esVip?'⭐ VIP':''}</h4>
                <p>📍 ${t.destino} | 👤 ${t.cliente}</p>
            </div>
        </div>`;
    }).join("");
}

document.getElementById('btn-atender-siguiente')?.addEventListener('click', async () => {
    if (colaCentral.estaVacia()) return alert("Cola vacía.");
    let ticket = colaCentral.desencolar();
    guardarColaEnStorage();
    await supabase.from('historialpedidos').update({ estado: 'Entregado', repartidor: usuarioLogueado.usuario }).eq('id', ticket.db_id);
    renderizarPanelDelivery();
    alert("¡Orden entregada con éxito!");
});

// COMPRA Y CARRITO
window.agregarAlCarrito = (nombre) => {
    carritoLocal.push(nombre);
    document.getElementById('contenedor-carrito').innerHTML = carritoLocal.map(p => `<div>• ${p}</div>`).join("");
};

document.getElementById('btn-abrir-pago')?.addEventListener('click', () => {
    if(carritoLocal.length === 0) return alert("Carrito vacío.");
    document.getElementById('modal-pago').style.display = 'flex';
    document.getElementById('modal-direccion-confirm').textContent = usuarioLogueado.direccion;
});

document.getElementById('btn-cerrar-modal')?.addEventListener('click', () => document.getElementById('modal-pago').style.display = 'none');

async function procesarPago() {
    const isVip = document.getElementById('check-vip').checked;
    const rest = document.getElementById('select-restaurante').value;
    
    const { data, error } = await supabase.from('historialpedidos').insert([{
        cliente: usuarioLogueado.usuario, restaurante: rest, destino: usuarioLogueado.direccion,
        descripcion: carritoLocal.join(", "), prioridad: isVip ? 1 : 2, estado: 'Pendiente'
    }]).select();

    if(error) return alert("Error en el pago.");

    cargarColaDeStorage();
    colaCentral.encolar({ db_id: data[0].id, cliente: usuarioLogueado.usuario, prioridad: isVip ? 1 : 2, restaurante: rest, destino: usuarioLogueado.direccion });
    guardarColaEnStorage();

    carritoLocal = [];
    document.getElementById('modal-pago').style.display = 'none';
    alert("¡Pedido Pagado!");
    cambiarVista('vista-rastreo-cliente');
}

document.getElementById('btn-pago-efectivo')?.addEventListener('click', procesarPago);
document.getElementById('btn-pago-tarjeta')?.addEventListener('click', procesarPago);

// --- LOGIN Y REGISTRO ---
document.getElementById('btn-registro-submit')?.addEventListener('click', async () => {
    const u = document.getElementById('reg-usuario').value;
    const p = document.getElementById('reg-pass').value;
    const r = document.getElementById('reg-rol').value;
    const d = r === 'cliente' ? `${document.getElementById('sel-casa').value}, ${document.getElementById('sel-muni').value}` : 'Central Operativa';

    const { error } = await supabase.from('usuarios').insert([{ usuario: u, password: p, rol: r, direccion: d }]);
    if(error) alert("Error al registrar.");
    else { alert("¡Ya podés entrar, bro!"); location.reload(); }
});

document.getElementById('btn-login-submit')?.addEventListener('click', async () => {
    const u = document.getElementById('login-usuario').value;
    const p = document.getElementById('login-pass').value;
    const { data } = await supabase.from('usuarios').select('*').eq('usuario', u).eq('password', p);
    
    if(data && data.length > 0) {
        let d = data[0];

        usuarioLogueado = d.rol === 'cliente' ? new Cliente(d.usuario, d.direccion) : new Repartidor(d.usuario);
        localStorage.setItem('sesionActiva', JSON.stringify({ usuario: d.usuario, rol: d.rol, direccion: d.direccion }));
        location.reload();
    } else alert("Credenciales incorrectas.");
});

// OCULTAR DIRECCIÓN PARA DELIVERY EN LODIN
document.getElementById('reg-rol')?.addEventListener('change', (e) => {
    document.getElementById('contenedor-direccion-registro').style.display = e.target.value === 'delivery' ? 'none' : 'block';
});

// --- INICIALIZACIÓN ---
function cargarMenuFijo(id) {
    const items = menusPorRestaurante[id] || [];
    document.getElementById('contenedor-menu').innerHTML = items.map(p => `
        <div class="tarjeta-comida">
            <img src="${p.img}">
            <div class="info-comida">
                <h4>${p.n}</h4>
                <span class="precio">$${p.p.toFixed(2)}</span>
            </div>
            <button onclick="agregarAlCarrito('${p.n}')" class="btn-agregar">+</button>
        </div>
    `).join('');
}

window.onload = () => {
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion) {
        let d = JSON.parse(sesion);
        usuarioLogueado = d.rol === 'cliente' ? new Cliente(d.usuario, d.direccion) : new Repartidor(d.usuario);
        document.getElementById('pantalla-login').style.display = 'none';
        document.getElementById('pantalla-dashboard').style.display = 'flex';
        document.getElementById('user-display').textContent = usuarioLogueado.usuario;
        document.getElementById('address-display').textContent = usuarioLogueado.direccion;
        
        // Cargar Restaurantes
        const selectRest = document.getElementById('select-restaurante');
        for (let n in menusPorRestaurante) {
            let o = document.createElement('option'); o.value = n; o.textContent = n; selectRest.appendChild(o);
        }
        selectRest.addEventListener('change', (e) => cargarMenuFijo(e.target.value));
        cargarMenuFijo(selectRest.value);
        configurarDashboardPorRol();
    }
    
    // Cargar Selectores de Ubicación
    const selD = document.getElementById('sel-depto');
    for(let d in datosDirecciones) { let o = document.createElement('option'); o.value=d; o.textContent=d; selD.appendChild(o); }
    selD.addEventListener('change', () => {
        const selM = document.getElementById('sel-muni');
        selM.innerHTML = '<option>Municipio</option>'; selM.disabled = false;
        for(let m in datosDirecciones[selD.value]) { let o = document.createElement('option'); o.value=m; o.textContent=m; selM.appendChild(o); }
    });
    document.getElementById('sel-muni').addEventListener('change', () => {
        const selC = document.getElementById('sel-casa'); selC.disabled = false;
        selC.innerHTML = Array.from({length:5}, (_,i)=>`<option value="Casa ${i+1}">Casa ${i+1}</option>`).join('');
    });
};

document.getElementById('btn-logout')?.addEventListener('click', () => { localStorage.removeItem('sesionActiva'); location.reload(); });

// Animación Sliding
const container = document.getElementById('container');
document.getElementById('signUp')?.addEventListener('click', () => container.classList.add("right-panel-active"));
document.getElementById('signIn')?.addEventListener('click', () => container.classList.remove("right-panel-active"));