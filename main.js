// IMPORTACIÓN DE CLASES
import { ColaPedidos } from './Estructuras/ColaPedidos.js';
import { Cliente, Repartidor } from './Estructuras/Usuarios.js';
import { ArbolBusquedaMenu } from './Estructuras/ArbolBusqueda.js';

//  CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://nybdoaclmzdfqeaefgxx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_JIUJgw-34pVpDNE8yxdNlQ_xz3vSxzu';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const arbolMenu = new ArbolBusquedaMenu();

// ESTRUCTURAS DE DATOS Y ESTADO GLOBAL 
const colaCentral = new ColaPedidos();
let usuarioLogueado = null; 
let carritoLocal = [];
let trackingInterval = null; 

// CATÁLOGO DE COMIDAS
// CATÁLOGO DE COMIDAS COMPLETO (20 Platillos por Restaurante)
const menusPorRestaurante = {
    'Pizzeria La Toscana': [
        // --- ENTRADAS ---
        {n: "Pan con Ajo Supremo", p: 3.50, cat: "Entradas", img: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80"},
        {n: "Palitroques con Queso", p: 4.25, cat: "Entradas", img: "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=500&q=80"},
        {n: "Bruschetta de Tomate", p: 4.50, cat: "Entradas", img: "https://images.unsplash.com/photo-1572656631137-7935297eff55?w=500&q=80"},
        {n: "Papas Gajo Italianas", p: 3.99, cat: "Entradas", img: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80"},
        {n: "Ensalada Caprese", p: 5.00, cat: "Entradas", img: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&q=80"},

        // --- PLATOS FUERTES ---
        {n: "Pizza Cuatro Quesos", p: 12.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80"}, 
        {n: "Pizza Pepperoni Tradicional", p: 10.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80"},
        {n: "Pizza Suprema de la Casa", p: 14.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80"},
        {n: "Lasaña de Carne Bolognesa", p: 8.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&q=80"},
        {n: "Fettuccine Alfredo con Pollo", p: 9.25, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&q=80"},

        // --- BEBIDAS ---
        {n: "Gaseosa Cola Fría", p: 1.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80"},
        {n: "Té Frío de Limón", p: 1.75, cat: "Bebidas", img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80"},
        {n: "Soda Italiana de Fresa", p: 2.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80"},
        {n: "Cerveza Corona Extra", p: 3.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&q=80"},
        {n: "Agua Mineral Con Gas", p: 1.25, cat: "Bebidas", img: "https://images.unsplash.com/photo-1608885898957-a599fb1698d6?w=500&q=80"},

        // --- POSTRES ---
        {n: "Tiramisú Clásico", p: 4.50, cat: "Postres", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80"},
        {n: "Panna Cotta de Frutos Rojos", p: 4.00, cat: "Postres", img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80"},
        {n: "Calzone de Nutella", p: 5.50, cat: "Postres", img: "https://images.unsplash.com/photo-1517686469429-8faf88b9f7af?w=500&q=80"},
        {n: "Gelato de Vainilla", p: 2.75, cat: "Postres", img: "https://images.unsplash.com/photo-1560008511-11c63416e52d?w=500&q=80"},
        {n: "Cheesecake de Fresa", p: 4.25, cat: "Postres", img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80"}
    ], 
    'Burger House Gourmet': [
        // --- ENTRADAS ---
        {n: "Aros de Cebolla Crujientes", p: 3.25, cat: "Entradas", img: "https://images.unsplash.com/photo-1639024471283-267a3fc7752f?w=500&q=80"},
        {n: "Papas Fritas con Queso Bacon", p: 4.50, cat: "Entradas", img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80"},
        {n: "Alitas BBQ (6 unidades)", p: 5.99, cat: "Entradas", img: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&q=80"},
        {n: "Deditos de Queso Mozzarella", p: 4.00, cat: "Entradas", img: "https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?w=500&q=80"},
        {n: "Nachos Cheddar Sencillos", p: 4.25, cat: "Entradas", img: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80"},

        // --- PLATOS FUERTES ---
        {n: "Hamburguesa Doble Carne", p: 6.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"}, 
        {n: "Monster Bacon Burger", p: 7.99, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80"},
        {n: "Crispy Chicken Sandwich", p: 5.75, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1627662236973-4f8259fa2441?w=500&q=80"},
        {n: "BBQ Texas Burger XL", p: 8.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=80"},
        {n: "Costillas BBQ Ahumadas", p: 11.99, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80"},

        // --- BEBIDAS ---
        {n: "Malteada de Chocolate", p: 3.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80"},
        {n: "Malteada de Fresa", p: 3.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&q=80"},
        {n: "Limonada con Hierbabuena", p: 2.25, cat: "Bebidas", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80"},
        {n: "Cerveza Artesanal IPAs", p: 4.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=500&q=80"},
        {n: "Gaseosa Sprite Elixir", p: 1.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1625772290748-160b63241416?w=500&q=80"},

        // --- POSTRES ---
        {n: "Brownie con Helado", p: 3.99, cat: "Postres", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80"},
        {n: "Apple Pie Caliente", p: 4.25, cat: "Postres", img: "https://images.unsplash.com/photo-1519869325930-281384150729?w=500&q=80"},
        {n: "Waffle con Caramelo", p: 4.50, cat: "Postres", img: "https://images.unsplash.com/photo-1562376502-6f769499c886?w=500&q=80"},
        {n: "Churros con Chocolate", p: 3.00, cat: "Postres", img: "https://images.unsplash.com/photo-1624371414361-e6e8ea48fc4e?w=500&q=80"},
        {n: "Cookie Ice Cream Sandwich", p: 3.75, cat: "Postres", img: "https://images.unsplash.com/photo-1549589237-9e70b6be4da8?w=500&q=80"}
    ],
    'Taquería El Pastor': [
        // --- ENTRADAS ---
        {n: "Totopos con Guacamole Grande", p: 4.50, cat: "Entradas", img: "https://images.unsplash.com/photo-1570462211464-5bf36022201f?w=500&q=80"},
        {n: "Queso Fundido con Chorizo", p: 5.25, cat: "Entradas", img: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=500&q=80"},
        {n: "Elote Loco Desgranado", p: 3.00, cat: "Entradas", img: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=500&q=80"},
        {n: "Chicharrón de Queso", p: 3.75, cat: "Entradas", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80"},
        {n: "Sopa de Tortilla Crujiente", p: 4.00, cat: "Entradas", img: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=500&q=80"},

        // --- PLATOS FUERTES ---
        {n: "Orden Tacos al Pastor (3 uds)", p: 5.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80"}, 
        {n: "Gringas de Res Suprema", p: 5.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500&q=80"},
        {n: "Burrito Gigante Tex-Mex", p: 6.99, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=500&q=80"},
        {n: "Quesadillas de Birria (3 uds)", p: 7.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&q=80"},
        {n: "Alambre de Pollo Familiar", p: 8.99, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80"},

        // --- BEBIDAS ---
        {n: "Agua de Horchata Grande", p: 2.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&q=80"},
        {n: "Agua Fresca de Jamaica", p: 2.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500&q=80"},
        {n: "Michelada Mexicana Especial", p: 4.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&q=80"},
        {n: "Gaseosa Jarritos Tam", p: 2.25, cat: "Bebidas", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80"},
        {n: "Margarita Frozen clásica", p: 5.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1556855247-ca637fa45fbc?w=500&q=80"},

        // --- POSTRES ---
        {n: "Flan Napolitano de Cajeta", p: 3.25, cat: "Postres", img: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500&q=80"},
        {n: "Tres Leches Tradicional", p: 3.99, cat: "Postres", img: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&q=80"},
        {n: "Chocoflan Casero", p: 3.50, cat: "Postres", img: "https://images.unsplash.com/photo-1608756687911-a1b540c6d16b?w=500&q=80"},
        {n: "Plátanos Fritos con Crema", p: 2.50, cat: "Postres", img: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&q=80"},
        {n: "Helado Frito de la Casa", p: 4.50, cat: "Postres", img: "https://images.unsplash.com/photo-1501443769991-63e0481795b5?w=500&q=80"}
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
// Renderiza los productos en el contenedor del carrito con botones de + , - y eliminar
function renderizarCarritoUI() {
    const contenedor = document.getElementById('contenedor-carrito');
    if (!contenedor) return;

    if (carritoLocal.length === 0) {
        contenedor.innerHTML = "<p style='color:gray; padding:10px;'>Tu orden está vacía.</p>";
        actualizarPreciosUI();
        return;
    }

    contenedor.innerHTML = carritoLocal.map((item, index) => `
        <div class="item-carrito" style="display:flex; justify-content:between; align-items:center; margin-bottom:8px; padding:5px; border-bottom:1px solid #eee;">
            <div style="flex:1;">
                <span style="font-weight:bold; display:block;">${item.nombre}</span>
                <span style="color:#666; font-size:0.85rem;">$${(item.precio * item.cantidad).toFixed(2)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="window.cambiarCantidadItem(${index}, -1)" style="padding:2px 8px; cursor:pointer;">-</button>
                <span style="font-weight:bold; min-width:20px; text-align:center;">${item.cantidad}</span>
                <button onclick="window.cambiarCantidadItem(${index}, 1)" style="padding:2px 8px; cursor:pointer;">+</button>
                <button onclick="window.eliminarDelCarrito(${index})" style="padding:2px 6px; background:#ef4444; color:white; border:none; border-radius:3px; cursor:pointer; margin-left:5px;">✕</button>
            </div>
        </div>
    `).join("");

    actualizarPreciosUI();
}

// Calcula el total acumulado y actualiza las etiquetas del dinero
function actualizarPreciosUI() {
    // Suma base de los productos
    const subtotal = carritoLocal.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
    
    // Verificamos si el switch VIP existe y está marcado
    const checkVip = document.getElementById('check-vip');
    const cargoVip = (checkVip && checkVip.checked) ? 2.50 : 0.00;
    const totalFinal = subtotal + cargoVip;

    // Actualiza los contenedores de precio en tu interfaz
    // NOTA: Asegúrate de tener estos ID en tu HTML o cámbialos por los que uses
// Dentro de actualizarPreciosUI() en tu main.js, déjalo así:
const txtSubtotal = document.getElementById('precio-subtotal-orden');
const txtSubtotalModal = document.getElementById('precio-subtotal-modal'); // 🔥 AGREGA ESTA LÍNEA
const txtTotal = document.getElementById('precio-total-orden');

if (txtSubtotal) txtSubtotal.textContent = `$${subtotal.toFixed(2)}`;
if (txtSubtotalModal) txtSubtotalModal.textContent = `$${subtotal.toFixed(2)}`; // 🔥 AGREGA ESTA LÍNEA
if (txtTotal) txtTotal.textContent = `$${totalFinal.toFixed(2)}`;
}

// AGREGAR: Busca si ya existe el plato para subir cantidad, o lo añade desde cero
window.agregarAlCarrito = (nombre, precio) => {
    const itemExistente = carritoLocal.find(item => item.nombre === nombre);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carritoLocal.push({ nombre: nombre, precio: parseFloat(precio), cantidad: 1 });
    }
    renderizarCarritoUI();
};

// EDITAR CANTIDADES: Sube o baja porciones (+1 ó -1)
window.cambiarCantidadItem = (index, cambio) => {
    carritoLocal[index].cantidad += cambio;
    if (carritoLocal[index].cantidad <= 0) {
        carritoLocal.splice(index, 1); // Si llega a 0 se borra solo
    }
    renderizarCarritoUI();
};

// QUITAR COMIDA: Elimina el renglón completo sin importar la cantidad
window.eliminarDelCarrito = (index) => {
    carritoLocal.splice(index, 1);
    renderizarCarritoUI();
};

// Escucha en tiempo real si el usuario activa/desactiva el switch VIP en el modal
document.getElementById('check-vip')?.addEventListener('change', actualizarPreciosUI);

document.getElementById('btn-abrir-pago')?.addEventListener('click', () => {
    if(carritoLocal.length === 0) return alert("Carrito vacío.");
    document.getElementById('modal-pago').style.display = 'flex';
    document.getElementById('modal-direccion-confirm').textContent = usuarioLogueado.direccion;
    actualizarPreciosUI(); // Asegura el precio correcto al abrir
});

document.getElementById('btn-cerrar-modal')?.addEventListener('click', () => document.getElementById('modal-pago').style.display = 'none');

async function procesarPago() {
    const isVip = document.getElementById('check-vip').checked;
    
    // Intentar capturar el restaurante activo desde el dropdown personalizado
    const selectedRestElement = document.getElementById('selected-restaurante-value');
    let rest = selectedRestElement ? selectedRestElement.textContent.replace('🏪 ', '').trim() : '';
    if (!rest || rest.includes("Selecciona")) rest = "Restaurante Gourmet";

    // Mapeamos el carrito en texto limpio para la base de datos: "2x Pizza, 1x Gaseosa"
    const descripcionOrden = carritoLocal.map(item => `${item.cantidad}x ${item.nombre}`).join(", ");
    
    const { data, error } = await supabase.from('historialpedidos').insert([{
        cliente: usuarioLogueado.usuario, 
        restaurante: rest, 
        destino: usuarioLogueado.direccion,
        descripcion: descripcionOrden, 
        prioridad: isVip ? 1 : 2, 
        estado: 'Pendiente'
    }]).select();

    if(error) return alert("Error en el pago.");

    cargarColaDeStorage();
    colaCentral.encolar({ db_id: data[0].id, cliente: usuarioLogueado.usuario, prioridad: isVip ? 1 : 2, restaurante: rest, destino: usuarioLogueado.direccion });
    guardarColaEnStorage();

    carritoLocal = [];
    renderizarCarritoUI();
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
    else { alert("¡Registrado con esxito!"); location.reload(); }
});

document.getElementById('btn-login-submit')?.addEventListener('click', async () => {
    //para optener espacios en blancogit
    const u = document.getElementById('login-usuario').value.trim();
    const p = document.getElementById('login-pass').value.trim();
    
    // si estan vacios retornamos
    if (u === "" || p === "") {
        alert("⚠️ Por favor, ingresa tu usuario y contraseña.");
        return; 
    }

    
    const { data } = await supabase.from('usuarios').select('*').eq('usuario', u).eq('password', p);
    
    if(data && data.length > 0) {
        let d = data[0];
        usuarioLogueado = d.rol === 'cliente' ? new Cliente(d.usuario, d.direccion) : new Repartidor(d.usuario);
        localStorage.setItem('sesionActiva', JSON.stringify({ usuario: d.usuario, rol: d.rol, direccion: d.direccion }));
        location.reload();
    } else {
        alert("Credenciales incorrectas.");
    }
});

// OCULTAR DIRECCIÓN PARA DELIVERY EN LODIN
document.getElementById('reg-rol')?.addEventListener('change', (e) => {
    document.getElementById('contenedor-direccion-registro').style.display = e.target.value === 'delivery' ? 'none' : 'block';
});


function cargarMenu(restauranteId, categoriaFiltro = '') {
    const contenedor = document.getElementById('contenedor-menu');

    // 🔥 LA MEJORA: Si no ha seleccionado categoría, mostramos el estado de espera
    if (categoriaFiltro === '') {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #888;">
                <span style="font-size: 3rem;">🍽️</span>
                <h3 style="margin-top: 10px; color: var(--text-muted);">¡Tu estómago está listo!</h3>
                <p style="font-size: 0.9rem;">Selecciona una categoría arriba para empezar a ver los platillos.</p>
            </div>
        `;
        return; // Frenamos la ejecución para que no busque en el árbol
    }

    const items = menusPorRestaurante[restauranteId] || [];
    
    // Todo lo demás del árbol se queda exactamente igual, bro:
    arbolMenu.limpiar();
    items.forEach(prod => arbolMenu.insertar(prod));

    const productosFiltrados = arbolMenu.filtrarPorCategoria(categoriaFiltro);

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; color:gray;'>No hay productos en esta categoría.</p>";
        return;
    }

contenedor.innerHTML = productosFiltrados.map(p => `
    <div class="tarjeta-comida">
        <img src="${p.img}">
        <div class="info-comida">
            <h4>${p.n} <br><small style="color:#666; font-weight:normal;">${p.cat}</small></h4>
            <span class="precio">$${p.p.toFixed(2)}</span>
        </div>
        <button onclick="agregarAlCarrito('${p.n}', ${p.p})" class="btn-agregar">+</button>
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


        const dropdownRest = document.getElementById('dropdown-restaurante');
        const selectedRestValue = document.getElementById('selected-restaurante-value');
        const optionsRestList = document.getElementById('options-restaurante');

        // Elementos de Categoría
        const dropdownCat = document.getElementById('dropdown-categoria');
        const selectedCatValue = document.getElementById('selected-categoria-value');
        const optionsCatItems = document.querySelectorAll('#options-categoria li');

       
        let restauranteSeleccionadoVal = "";
        let categoriaSeleccionadaVal = "";

     
        optionsRestList.innerHTML = ""; 
        for (let n in menusPorRestaurante) { //
            let li = document.createElement('li');
            li.textContent = n;
            li.setAttribute('data-value', n);
            
          
            li.addEventListener('click', (e) => {
                const valor = e.target.getAttribute('data-value');
                
                selectedRestValue.innerHTML = `🏪 ${valor}`;
                restauranteSeleccionadoVal = valor; 

             
                categoriaSeleccionadaVal = "";
                selectedCatValue.innerHTML = `✨ Click aquí para abrir el menú`;
                
      
                cargarMenu(valor, ''); 
                
                dropdownRest.classList.remove('open');
            });
            optionsRestList.appendChild(li);
        }

    
        optionsCatItems.forEach(li => {
            li.addEventListener('click', (e) => {
              
                if (restauranteSeleccionadoVal === "") {
                    alert("⚠️ Por favor, selecciona primero un restaurante.");
                    dropdownCat.classList.remove('open');
                    return;
                }

                const valor = e.target.getAttribute('data-value');
                selectedCatValue.innerHTML = `✨ ${valor}`;
                categoriaSeleccionadaVal = valor;

          
                cargarMenu(restauranteSeleccionadoVal, categoriaSeleccionadaVal);
                
                dropdownCat.classList.remove('open');
            });
        });

    
        selectedRestValue.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownCat.classList.remove('open'); 
            dropdownRest.classList.toggle('open');
        });

        selectedCatValue.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownRest.classList.remove('open'); 
            dropdownCat.classList.toggle('open');
        });


        document.addEventListener('click', () => {
            dropdownRest.classList.remove('open');
            dropdownCat.classList.remove('open');
        });



cargarMenu('', '');
renderizarCarritoUI(); 
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
