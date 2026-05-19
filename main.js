import { ColaPedidos } from './Estructuras/ColaPedidos.js';
import { Cliente, Repartidor } from './Estructuras/Usuarios.js';
import { ArbolBusquedaMenu } from './Estructuras/ArbolBusqueda.js';
import { GrafoRutas } from './Estructuras/Grafo.js';

// CONFIGURACIÓN E INSTANCIAS GLOBALES

// llaves supabase
const SUPABASE_URL = 'https://nybdoaclmzdfqeaefgxx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_JIUJgw-34pVpDNE8yxdNlQ_xz3vSxzu';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const arbolMenu = new ArbolBusquedaMenu();
const colaCentral = new ColaPedidos();
const mapaCiudad = new GrafoRutas(); 

let usuarioLogueado = null; 
let carritoLocal = [];
let trackingInterval = null; 


let nodesDataSet = new vis.DataSet();
let edgesDataSet = new vis.DataSet();
let networkMapa = null; 
let ordenSimuladaId = null; 
let timerSimulacion = null;

// Catálogo de Comidas
const menusPorRestaurante = {
    'Pizzeria La Toscana': [
        {n: "Pan con Ajo Supremo", p: 3.50, cat: "Entradas", img: "https://i.ytimg.com/vi/cNmckVGQ9pg/maxresdefault.jpg"},
        {n: "Palitroques con Queso", p: 4.25, cat: "Entradas", img: "https://www.kitchencenter.cl/cdn/shop/articles/1117x745_49af2c6b-1ef2-464e-bb73-9df84085e579.jpg?v=1644587557"},
        {n: "Bruschetta de Tomate", p: 4.50, cat: "Entradas", img: "https://www.midiariodecocina.com/wp-content/uploads/2014/11/Bruschetta-de-tomate-y-albahaca01.jpg"},
        {n: "Papas Gajo Italianas", p: 3.99, cat: "Entradas", img: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80"},
        {n: "Ensalada Caprese", p: 5.00, cat: "Entradas", img: "https://deliciaskitchen.b-cdn.net/wp-content/uploads/2022/07/ensalada-caprese-receta-original-italiana.jpg"},
        {n: "Pizza Cuatro Quesos", p: 12.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80"}, 
        {n: "Pizza Pepperoni", p: 10.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80"},
        {n: "Pizza Suprema", p: 14.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80"},
        {n: "Lasaña Bolognesa", p: 8.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&q=80"},
        {n: "Fettuccine Alfredo", p: 9.25, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&q=80"},
        {n: "Gaseosa Cola", p: 1.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80"},
        {n: "Té de Limón", p: 1.75, cat: "Bebidas", img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80"},
        {n: "Soda de Fresa", p: 2.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80"},
        {n: "Cerveza Corona", p: 3.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&q=80"},
        {n: "Agua Mineral", p: 1.25, cat: "Bebidas", img: "https://www.sportlife.es/uploads/s1/10/96/81/39/beneficios-de-beber-agua-con-gas.jpeg"},
        {n: "Tiramisú Clásico", p: 4.50, cat: "Postres", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80"},
        {n: "Panna Cotta", p: 4.00, cat: "Postres", img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80"},
        {n: "Calzone de Nutella", p: 5.50, cat: "Postres", img: "https://media-cdn.tripadvisor.com/media/photo-s/1a/48/38/34/nutella-calzone.jpg"},
        {n: "Gelato de Vainilla", p: 2.75, cat: "Postres", img: "https://static.bainet.es/clip/4896efa6-ec52-4ffe-ab1c-9b789353e444_source-aspect-ratio_1600w_0.jpg"},
        {n: "Cheesecake", p: 4.25, cat: "Postres", img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80"}
    ], 
    'Burger House Gourmet': [
        {n: "Aros de Cebolla", p: 3.25, cat: "Entradas", img: "https://chefeel.com/chefgeneralfiles/2024/01/arreglo-sabroso-aros-cebolla-880x844.jpg"},
        {n: "Papas con Queso", p: 4.50, cat: "Entradas", img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80"},
        {n: "Alitas BBQ", p: 5.99, cat: "Entradas", img: "https://www.labuena.com.co/wp-content/uploads/2020/10/alitas-BBQ-imagen-destacada.jpg"},
        {n: "Deditos de Queso", p: 4.00, cat: "Entradas", img: "https://alimentosochoa.com/wp-content/uploads/2025/12/Dedos-de-queso-mozzarella.jpg"},
        {n: "Nachos Cheddar", p: 4.25, cat: "Entradas", img: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80"},
        {n: "Burger Doble Carne", p: 6.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"}, 
        {n: "Monster Bacon", p: 7.99, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80"},
        {n: "Crispy Chicken", p: 5.75, cat: "Platos Fuertes", img: "https://howtofeedaloon.com/wp-content/uploads/2023/02/fried-chicken-sandwich-IG.jpg"},
        {n: "Texas Burger XL", p: 8.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=80"},
        {n: "Costillas Ahumadas", p: 11.99, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80"},
        {n: "Malteada Chocolate", p: 3.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80"},
        {n: "Malteada Fresa", p: 3.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&q=80"},
        {n: "Limonada Hierbabuena", p: 2.25, cat: "Bebidas", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80"},
        {n: "Cerveza Artesanal", p: 4.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=500&q=80"},
        {n: "Sprite Elixir", p: 1.50, cat: "Bebidas", img: "https://st2.depositphotos.com/1000647/9330/i/950/depositphotos_93303834-stock-photo-soft-drink-sprite.jpg"},
        {n: "Brownie Helado", p: 3.99, cat: "Postres", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80"},
        {n: "Apple Pie", p: 4.25, cat: "Postres", img: "https://tn.com.ar/resizer/v2/que-es-y-como-se-hace-el-apple-pie-el-postre-mas-clasico-de-estados-unidos-foto-gemini-TSNFEAROD5BAZIRPUFV7TYZTQM.jpg?auth=ca3f18ea39ad03715dffc5350780cfd0966f8c545ca0042d05ef67a31e29400e&width=1023"},
        {n: "Waffle Caramelo", p: 4.50, cat: "Postres", img: "https://thumbs.dreamstime.com/b/gafas-de-especias-calabaza-oto%C3%B1ales-con-topping-batido-caramelo-y-pecans-escena-la-mesa-contra-madera-oscura-caparaz%C3%B3n-visi%C3%B3n-198051449.jpg"},
        {n: "Churros Chocolate", p: 3.00, cat: "Postres", img: "https://delishglobe.com/wp-content/uploads/2024/10/Churros-con-Chocolate-Recipe.png"},
        {n: "Cookie Ice Cream", p: 3.75, cat: "Postres", img: "https://www.tasteofhome.com/wp-content/uploads/2024/07/Chocolate-Chip-Cookie-Ice-Cream-Sandwiches_EXPS_TOHVP24_277202_MR_07_11_2.jpg"}
    ],
    'Taquería El Pastor': [
        {n: "Totopos con Guacamole", p: 4.50, cat: "Entradas", img: "https://granvita.com/wp-content/uploads/2020/09/HEader_Guacamole.jpg"},
        {n: "Queso Fundido", p: 5.25, cat: "Entradas", img: "https://realfoodbydad.com/wp-content/uploads/2019/03/Chorizo-Queso-Fundido-Real-Food-by-Dad-683x1024.jpg"},
        {n: "Elote Loco", p: 3.00, cat: "Entradas", img: "https://www.cardamomo.news/__export/1751404434040/sites/debate/img/2025/07/01/esquite_-4-.png_423682103.png"},
        {n: "Chicharrón Queso", p: 3.75, cat: "Entradas", img: "https://enmicasa.com/wp-content/uploads/2020/07/chicharrones-de-queso_ho.jpg"},
        {n: "Sopa Tortilla", p: 4.00, cat: "Entradas", img: "https://www.unileverfoodsolutions.com.mx/dam/global-ufs/mcos/NOLA/calcmenu/recipes/MX-recipes/general/sopa-de-tortilla/main-header.jpg"},
        {n: "Tacos al Pastor", p: 5.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80"}, 
        {n: "Gringas de Res", p: 5.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500&q=80"},
        {n: "Burrito Gigante", p: 6.99, cat: "Platos Fuertes", img: "https://tb-static.uber.com/prod/image-proc/processed_images/f5311f333e73d98257dc800a20030678/1da9a9e826d15157cea1c5bb8696f248.jpeg"},
        {n: "Quesadillas Birria", p: 7.50, cat: "Platos Fuertes", img: "https://popmenucloud.com/cdn-cgi/image/width%3D1200%2Cheight%3D1200%2Cfit%3Dscale-down%2Cformat%3Dauto%2Cquality%3D60/oehdaixl/611875d7-f55c-4180-aea5-a3ccb4934453.jpg"},
        {n: "Alambre de Pollo", p: 8.99, cat: "Platos Fuertes", img: "https://cocina-casera.com/mx/wp-content/uploads/2017/11/alambre-pollo.jpg"},
        {n: "Agua Horchata", p: 2.00, cat: "Bebidas", img: "https://cdn0.recetasgratis.net/es/posts/5/7/3/agua_de_horchata_74375_1200.jpg"},
        {n: "Agua Jamaica", p: 2.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500&q=80"},
        {n: "Michelada", p: 4.50, cat: "Bebidas", img: "https://www.muydelish.com/wp-content/uploads/2023/04/michelada-beer.jpg"},
        {n: "Jarritos", p: 2.25, cat: "Bebidas", img: "https://elceo.com/wp-content/uploads/2024/04/jarritos-1.jpg"},
        {n: "Margarita Frozen", p: 5.00, cat: "Bebidas", img: "https://assets.epicurious.com/photos/642da49267d53df640581f0c/1:1/w_4436,h_4436,c_limit/FrozenMargarita_RECIPE_033123_50664.jpg"},
        {n: "Flan Napolitano", p: 3.25, cat: "Postres", img: "https://images.aws.nestle.recipes/original/9a7b5fb66b5ac1fba45399b73fe16374_flan_napolitano_ligero.jpg"},
        {n: "Tres Leches", p: 3.99, cat: "Postres", img: "https://www.modernhoney.com/wp-content/uploads/2024/10/Tres-Leches-Cake-18-500x500.jpg"},
        {n: "Chocoflan", p: 3.50, cat: "Postres", img: "https://i.ytimg.com/vi/PSZRYnzWga4/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCHU04hi1I-98p_XFtEYPNQdLdIKA"},
        {n: "Plátanos Fritos", p: 2.50, cat: "Postres", img: "https://www.cardamomo.news/__export/1710873469286/sites/debate/img/2024/03/19/platano_frito_con_crema_y_queso.png_557707261.png"},
        {n: "Helado Frito", p: 4.50, cat: "Postres", img: "https://chefeel.com/chefgeneralfiles/2025/02/round-cake-with-ice-cream-inside-880x826.jpg"}
    ],
    'Sushi Kento': [
        {n: "Edamame Salado", p: 3.50, cat: "Entradas", img: "https://i.blogs.es/0655c9/edamame/650_1200.jpg"},
        {n: "Gyozas de Cerdo", p: 5.25, cat: "Entradas", img: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&q=80"},
        {n: "Yakitori de Pollo", p: 4.50, cat: "Entradas", img: "https://static.bainet.es/clip/1b9d8d61-05ca-43b7-afa0-eedc418e922e_source-aspect-ratio_1600w_0.jpg"},
        {n: "Sopa Miso", p: 3.00, cat: "Entradas", img: "https://recetasdecocina.elmundo.es/wp-content/uploads/2025/03/sopa-de-miso-1024x683.jpg"},
        {n: "Camarones Tempura", p: 6.50, cat: "Entradas", img: "https://preview.redd.it/air-fryer-fresh-tempura-shrimps-v0-tb3gnokqlwqe1.jpg?width=640&crop=smart&auto=webp&s=7a6a2ea7a45f7ee8973ae8ebd877d147cad7e06e"},
        {n: "Roll California", p: 7.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80"},
        {n: "Roll Spicy Tuna", p: 8.50, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80"},
        {n: "Ramen Tonkotsu", p: 10.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80"},
        {n: "Yakisoba Mixto", p: 9.50, cat: "Platos Fuertes", img: "https://tofuu.getjusto.com/orioneat-local/resized2/3bF2T8G2pTokvKebE-2400-x.webp"},
        {n: "Nigiri de Salmón", p: 6.00, cat: "Platos Fuertes", img: "https://www.hosteleriasalamanca.es/fotos/14610815912.jpg"},
        {n: "Té Verde Matcha", p: 2.50, cat: "Bebidas", img: "https://aarp.widen.net/content/bhaumlurgz/jpeg/StockFood_11115230_HiRes_Matcha_tea_in_a_tea_bowl_served_with_tea_flavoured_madeleines.jpg?crop=true&anchor=17,111&q=80&color=ffffffff&u=2xkwh0&w=2006&h=1142"},
        {n: "Calpis Soda", p: 3.00, cat: "Bebidas", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80"},
        {n: "Sake Tradicional", p: 5.00, cat: "Bebidas", img: "https://neodrinks.com/wp-content/uploads/2020/09/sake-japones.jpg"},
        {n: "Cerveza Sapporo", p: 4.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&q=80"},
        {n: "Agua Evian", p: 2.00, cat: "Bebidas", img: "https://www.sportlife.es/uploads/s1/10/96/81/39/beneficios-de-beber-agua-con-gas.jpeg"},
        {n: "Mochi de Fresa", p: 4.00, cat: "Postres", img: "https://i0.wp.com/thehappening.com/wp-content/uploads/2018/06/mochi-fresa-receta.jpg?fit=1024%2C694&ssl=1"},
        {n: "Helado de Té Verde", p: 3.50, cat: "Postres", img: "https://okdiario.com/img/recetas/2017/11/05/helado-de-te-matcha.jpg"},
        {n: "Taiyaki Chocolate", p: 4.50, cat: "Postres", img: "https://japanese-snacks-republic.com/media/binary/000/017/585/17585.jpg"},
        {n: "Dorayaki Vainilla", p: 3.75, cat: "Postres", img: "https://static.bainet.es/clip/4896efa6-ec52-4ffe-ab1c-9b789353e444_source-aspect-ratio_1600w_0.jpg"},
        {n: "Cheesecake Japonés", p: 5.50, cat: "Postres", img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80"}
    ],
    'Asados Don Chepe': [
        {n: "Chorizos Parrilleros", p: 4.50, cat: "Entradas", img: "https://walmartsv.vtexassets.com/arquivos/ids/759954/50490_03.jpg?v=638871516454330000"},
        {n: "Queso Fundido", p: 5.00, cat: "Entradas", img: "https://realfoodbydad.com/wp-content/uploads/2019/03/Chorizo-Queso-Fundido-Real-Food-by-Dad-683x1024.jpg"},
        {n: "Yuca Frita", p: 3.00, cat: "Entradas", img: "https://i.ytimg.com/vi/dp6oQ7cekPc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD_uCGqj37uh-_NzS1hLcYF4KvUxA"},
        {n: "Ceviche de Chicharrón", p: 6.00, cat: "Entradas", img: "https://cloudfront-us-east-1.images.arcpublishing.com/infobae/FHCVEODO6VE6JHTFGHS6W5HIAE.jpg"},
        {n: "Empanadas de Carne", p: 4.25, cat: "Entradas", img: "https://comidasparaguayas.com/assets/images/empanada-de-carne_800x534.webp"},
        {n: "Parrillada Familiar", p: 25.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80"},
        {n: "Churrasco Especial", p: 14.50, cat: "Platos Fuertes", img: "https://progcarne.com/storage/app/uploads/public/60f/9c4/c89/60f9c4c89a68e000121704.jpg"},
        {n: "Punta Jalapeña", p: 12.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=500&q=80"},
        {n: "Pollo a la Brasa", p: 9.50, cat: "Platos Fuertes", img: "https://buenprovecho.hn/wp-content/uploads/2023/07/Pollo-a-la-brasa-1.png"},
        {n: "Costillas de Cerdo", p: 13.00, cat: "Platos Fuertes", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80"},
        {n: "Horchata Salvadoreña", p: 2.00, cat: "Bebidas", img: "https://cdn0.recetasgratis.net/es/posts/5/7/3/agua_de_horchata_74375_1200.jpg"},
        {n: "Cebada Fría", p: 2.00, cat: "Bebidas", img: "https://www.tipicosmargoth.com/wp-content/uploads/2020/05/MEDIO-GALON-CEBEDA-TIPICOS-MARGOTH.jpg"},
        {n: "Cerveza Suprema", p: 3.50, cat: "Bebidas", img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&q=80"},
        {n: "Jugo de Naranja", p: 1.50, cat: "Bebidas", img: "https://media.glamour.mx/photos/653836ba50e780930c5400e8/master/pass/tomar-jugo-de-naranja-beneficios.jpg"},
        {n: "Limonada Rosa", p: 2.50, cat: "Bebidas", img: "https://instituto.splenda.la/wp-content/uploads/2024/03/limonada-rosa.jpg"},
        {n: "Flan de Caramelo", p: 3.00, cat: "Postres", img: "https://images.aws.nestle.recipes/original/9a7b5fb66b5ac1fba45399b73fe16374_flan_napolitano_ligero.jpg"},
        {n: "Tres Leches Borracho", p: 4.50, cat: "Postres", img: "https://www.modernhoney.com/wp-content/uploads/2024/10/Tres-Leches-Cake-18-500x500.jpg"},
        {n: "Pastel de Chocolate", p: 3.75, cat: "Postres", img: "https://www.verybestbaking.com/sites/g/files/jgfbjl326/files/styles/large/public/recipe-thumbnail/103679-2020_06_09T08_18_01_mrs_ImageRecipes_1810lrg.jpg?itok=DR3HQYQ1"},
        {n: "Dulce de Leche", p: 2.50, cat: "Postres", img: "https://content-cocina.lecturas.com/medio/2018/07/19/dulce-de-leche-tradicional-con-leche-entera_712d6b64_600x600.jpg"},
        {n: "Empanadas de Leche", p: 3.00, cat: "Postres", img: "https://chefeel.com/chefgeneralfiles/2025/02/round-cake-with-ice-cream-inside-880x826.jpg"}
    ]
};

function obtenerRestauranteDePlatillo(nombrePlato) {
    for (let rest in menusPorRestaurante) {
        if (menusPorRestaurante[rest].some(p => p.n === nombrePlato)) return rest;
    }
    return "Pizzeria La Toscana"; 
}

// Topología Geográfica 
const datosDirecciones = {
    "San Salvador": { "San Salvador": 10, "Soyapango": 10, "Ilopango": 10, "Apopa": 10 },
    "La Libertad": { "Santa Tecla": 10, "Antiguo Cuscatlán": 10, "Zaragoza": 10, "Lourdes": 10 },
    "Santa Ana": { "Santa Ana": 10, "Chalchuapa": 10, "Metapán": 10, "Coatepeque": 10 },
    "San Miguel": { "San Miguel": 10, "Ciudad Barrios": 10, "Chinameca": 10, "Nueva Guadalupe": 10 }
};

function construirGrafoBase() {
    mapaCiudad.agregarNodo('Pizzeria La Toscana');
    mapaCiudad.agregarNodo('Burger House Gourmet');
    mapaCiudad.agregarNodo('Taquería El Pastor');
    mapaCiudad.agregarNodo('Sushi Kento');
    mapaCiudad.agregarNodo('Asados Don Chepe');

    mapaCiudad.agregarArista('Pizzeria La Toscana', 'San Salvador', 8);
    mapaCiudad.agregarArista('Burger House Gourmet', 'Santa Tecla', 6);
    mapaCiudad.agregarArista('Taquería El Pastor', 'Soyapango', 9);
    mapaCiudad.agregarArista('Sushi Kento', 'Santa Ana', 15);
    mapaCiudad.agregarArista('Asados Don Chepe', 'San Miguel', 20);
    
    mapaCiudad.agregarArista('San Salvador', 'Santa Tecla', 12);
    mapaCiudad.agregarArista('San Salvador', 'Soyapango', 8);
    mapaCiudad.agregarArista('Soyapango', 'Ilopango', 4);
    mapaCiudad.agregarArista('San Salvador', 'Apopa', 15);
    mapaCiudad.agregarArista('Santa Tecla', 'Antiguo Cuscatlán', 4);
    mapaCiudad.agregarArista('Santa Tecla', 'Lourdes', 20);
    mapaCiudad.agregarArista('Santa Tecla', 'Santa Ana', 60); 
    mapaCiudad.agregarArista('San Salvador', 'San Miguel', 130); 
    mapaCiudad.agregarArista('Santa Tecla', 'Zaragoza', 10);
    mapaCiudad.agregarArista('Santa Ana', 'Chalchuapa', 14);
    mapaCiudad.agregarArista('Santa Ana', 'Metapán', 45);
    mapaCiudad.agregarArista('Santa Ana', 'Coatepeque', 20);
    mapaCiudad.agregarArista('San Miguel', 'Ciudad Barrios', 25);
    mapaCiudad.agregarArista('San Miguel', 'Chinameca', 18);
    mapaCiudad.agregarArista('San Miguel', 'Nueva Guadalupe', 15);
}
construirGrafoBase();


async function inicializarMapaGlobal() {
    const contenedor = document.getElementById('mapa-nodos');
    if (!contenedor || networkMapa !== null) return; 

    const { data: usuarios } = await supabase.from('usuarios').select('*').eq('rol', 'cliente');
    if (usuarios) {
        usuarios.forEach(user => {
            const muni = user.direccion.split(", ")[1] || user.direccion;
            // Evitar duplicados en memoria en el objeto GrafoRutas
            if (!mapaCiudad.adyacencias.get(muni)?.some(v => v.nodo === user.direccion)) {
                mapaCiudad.agregarArista(muni, user.direccion, 2);
            }
        });
    }

    mapaCiudad.nodos.forEach(id => {
        let esRest = menusPorRestaurante[id] !== undefined;
        let esCasa = id.includes("Casa");
        
        let iconUrl = '';
        if (esRest) iconUrl = 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png'; 
        else if (esCasa) iconUrl = 'https://cdn-icons-png.flaticon.com/512/619/619032.png'; 
        else iconUrl = 'https://cdn-icons-png.flaticon.com/512/2942/2942076.png'; 

        nodesDataSet.add({
            id: id, label: id, shape: 'image', image: iconUrl,
            size: esRest ? 50 : (esCasa ? 18 : 35),
            font: { size: esCasa ? 12 : 16, bold: true, color: '#0f2e2a' }
        });
    });

    let aristas = new Set();
    mapaCiudad.nodos.forEach(nodoA => {
        mapaCiudad.adyacencias.get(nodoA).forEach(vecino => {
            let hash = [nodoA, vecino.nodo].sort().join("-");
            if (!aristas.has(hash)) {
                aristas.add(hash);
                edgesDataSet.add({
                    id: hash, from: nodoA, to: vecino.nodo,
                    label: `${vecino.peso}km`, font: { size: 14 },
                    color: { color: '#8bbab2' }, width: 2, dashes: true
                });
            }
        });
    });

    nodesDataSet.add({ 
        id: 'MOTO_RIDER', label: '🛵 Repartidor', shape: 'image', 
        image: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f6f5.png', 
        size: 50, hidden: true, physics: false,
        font: { size: 14, bold: true, color: '#f59e0b', background: 'rgba(255,255,255,0.9)' }
    });

    networkMapa = new vis.Network(contenedor, { nodes: nodesDataSet, edges: edgesDataSet }, {
        layout: { randomSeed: 999 }, 
        interaction: { dragNodes: false, dragView: true, zoomView: true },
        physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { springLength: 120 } }
    });

    networkMapa.once("stabilizationIterationsDone", function() {
        networkMapa.setOptions({ physics: false }); 
        networkMapa.fit(); 
    });
}


//RASTREO Y ANIMACIONES 

async function iniciarRastreoEnVivo() {
    const icono = document.getElementById('tracking-icono');
    const texto = document.getElementById('tracking-texto');
    const desc = document.getElementById('tracking-desc');


    if(trackingInterval) clearInterval(trackingInterval);

    trackingInterval = setInterval(async () => {
        const filtro = usuarioLogueado.rol === 'cliente' ? { col: 'cliente', val: usuarioLogueado.usuario } : { col: 'repartidor', val: usuarioLogueado.usuario };
        const { data } = await supabase.from('historialpedidos').select('*').eq(filtro.col, filtro.val).order('id', { ascending: false }).limit(1);

        if(data && data.length > 0) {
            let p = data[0];
            
            if(p.estado === 'En Camino' && ordenSimuladaId !== p.id) {
                ordenSimuladaId = p.id;
                let restaurantes = p.restaurante.split(" | ");
                let rutaCompleta = [];
                let distanciaTotal = 0;

                for(let i = 0; i < restaurantes.length; i++) {
                    let inicio = restaurantes[i];
                    let fin = (i === restaurantes.length - 1) ? p.destino : restaurantes[i+1];
                    let res = mapaCiudad.calcularRutaMasCorta(inicio, fin);
                    
                    if (i > 0) res.ruta.shift(); 
                    rutaCompleta = rutaCompleta.concat(res.ruta);
                    distanciaTotal += res.distanciaTotal;
                }

                animarMotoEnMapa(rutaCompleta, p.id, distanciaTotal);
                icono.textContent = "🛵"; texto.textContent = "¡Repartidor en Camino!";
                desc.textContent = `Pasando por: ${restaurantes.join(", ")} ➔ Destino.`;
            } 
            else if (p.estado === 'Entregado') {
                icono.textContent = "✅"; texto.textContent = "¡Orden Entregada!";
                desc.textContent = "Buen provecho.";
                nodesDataSet.update({ id: 'MOTO_RIDER', hidden: true }); 
            }
            else if (p.estado === 'Pendiente') {
                icono.textContent = "⏳"; texto.textContent = "En Fila de Preparación";
                desc.textContent = "Esperando que un repartidor tome la orden.";
            }
        }
    }, 3000);
}

function animarMotoEnMapa(ruta, idPedido, distanciaTotal) {
    if(timerSimulacion) clearInterval(timerSimulacion);

    edgesDataSet.forEach(edge => edgesDataSet.update({ id: edge.id, color: { color: '#8bbab2' }, width: 2, dashes: true }));
    for(let i=0; i<ruta.length-1; i++) {
        let hash1 = `${ruta[i]}-${ruta[i+1]}`; let hash2 = `${ruta[i+1]}-${ruta[i]}`;
        if(edgesDataSet.get(hash1)) edgesDataSet.update({ id: hash1, color: { color: '#4facfe' }, width: 6, dashes: false });
        if(edgesDataSet.get(hash2)) edgesDataSet.update({ id: hash2, color: { color: '#4facfe' }, width: 6, dashes: false });
    }

    let pasoActual = 0;
    nodesDataSet.update({ id: 'MOTO_RIDER', hidden: false });

    timerSimulacion = setInterval(async () => {
        if(pasoActual >= ruta.length) {
            clearInterval(timerSimulacion);
            if(usuarioLogueado.rol === 'repartidor' || usuarioLogueado.rol === 'delivery') {
                await supabase.from('historialpedidos').update({ estado: 'Entregado' }).eq('id', idPedido);
                alert("¡Has llegado al destino! Orden marcada como entregada.");
                cambiarVista('vista-panel-delivery'); 
            }
            return;
        }

        let nodoPos = ruta[pasoActual];
        let pos = networkMapa.getPositions([nodoPos])[nodoPos];
        if(pos) {
            nodesDataSet.update({ id: 'MOTO_RIDER', x: pos.x, y: pos.y - 30 }); 
        }
        pasoActual++;
    }, 2500); 
}


// GESTIÓN DE INTERFAZ Y VISTAS 

window.cambiarVista = (idVista) => {
    document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
    document.getElementById(idVista).style.display = 'block';
    
    if(trackingInterval) clearInterval(trackingInterval);

    if(idVista === 'vista-panel-delivery') renderizarPanelDelivery();
    if(idVista === 'vista-rastreo-cliente') {
        setTimeout(() => inicializarMapaGlobal(), 100); 
        iniciarRastreoEnVivo();
    }
    if(idVista === 'vista-historial-cliente') cargarHistorialCliente();
    if(idVista === 'vista-historial-delivery') cargarHistorialDelivery();
};

function configurarDashboardPorRol() {
    const config = usuarioLogueado.obtenerConfiguracionVista();
    document.getElementById('titulo-rol').textContent = config.titulo;
    document.getElementById('menu-cliente').style.display = config.menuCliente;
    document.getElementById('menu-delivery').style.display = config.menuDelivery;
    cambiarVista(config.vistaInicial);
}

// Panel Control Delivery
async function renderizarPanelDelivery() {
    const lista = document.getElementById('lista-pedidos-unica');
    lista.innerHTML = "<p>Cargando pedidos de la base de datos...</p>";

    const { data } = await supabase.from('historialpedidos').select('*').eq('estado', 'Pendiente');
    
    if (data && data.length > 0) {
        localStorage.setItem('colaCentral', JSON.stringify(data));
        colaCentral.cargarDesdeStorage(data.map(p => ({ db_id: p.id, cliente: p.cliente, prioridad: p.prioridad, restaurante: p.restaurante, destino: p.destino })));
    } else {
        colaCentral.cargarDesdeStorage([]);
    }

    if (colaCentral.estaVacia()) return lista.innerHTML = "<p>No hay pedidos pendientes.</p>";

    lista.innerHTML = colaCentral.obtenerTodos().map(t => {
        let esVip = t.prioridad === 1;
        return `
        <div class="tarjeta-comida" style="border-left: 6px solid ${esVip?'#4facfe':'#93a5ff'};">
            <div class="info-comida">
                <h4>Ticket #${t.db_id} ${esVip?'⭐ VIP':''}</h4>
                <p>📍 ${t.destino} | 👤 ${t.cliente}</p>
                <p style="font-size:0.8em; color:#666;">Restaurantes: ${t.restaurante}</p>
            </div>
        </div>`;
    }).join("");
}

document.getElementById('btn-atender-siguiente')?.addEventListener('click', async () => {
    if (colaCentral.estaVacia()) return alert("Cola vacía.");
    let ticket = colaCentral.desencolar();
    
    await supabase.from('historialpedidos').update({ estado: 'En Camino', repartidor: usuarioLogueado.usuario }).eq('id', ticket.db_id);
    cambiarVista('vista-rastreo-cliente');
});


//COMPRAS Y SISTEMA DE CARRITO

function renderizarCarritoUI() {
    const contenedor = document.getElementById('contenedor-carrito');
    if (!contenedor) return;
    if (carritoLocal.length === 0) { contenedor.innerHTML = "<p style='color:gray; padding:10px;'>Tu orden está vacía.</p>"; actualizarPreciosUI(); return; }

    contenedor.innerHTML = carritoLocal.map((item, index) => `
        <div class="item-carrito" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding:5px; border-bottom:1px solid #eee;">
            <div style="flex:1;">
                <span style="font-weight:bold; display:block;">${item.nombre}</span>
                <span style="color:#666; font-size:0.85rem;">$${(item.precio * item.cantidad).toFixed(2)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="window.cambiarCantidadItem(${index}, -1)" style="padding:2px 8px; cursor:pointer;">-</button>
                <span style="font-weight:bold; min-width:20px; text-align:center;">${item.cantidad}</span>
                <button onclick="window.cambiarCantidadItem(${index}, 1)" style="padding:2px 8px; cursor:pointer;">+</button>
                <button onclick="window.eliminarDelCarrito(${index})" style="padding:2px 6px; background:#f43f5e; color:white; border:none; border-radius:3px; cursor:pointer; margin-left:5px;">✕</button>
            </div>
        </div>
    `).join("");
    actualizarPreciosUI();
}

function actualizarPreciosUI() {
    const subtotal = carritoLocal.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
    const cargoVip = document.getElementById('check-vip')?.checked ? 2.50 : 0.00;
    document.getElementById('precio-subtotal-orden').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('precio-subtotal-modal').textContent = `$${subtotal.toFixed(2)}`; 
    document.getElementById('precio-total-orden').textContent = `$${(subtotal + cargoVip).toFixed(2)}`;
}

window.agregarAlCarrito = (n, p) => {
    const item = carritoLocal.find(i => i.nombre === n);
    if (item) item.cantidad += 1; else carritoLocal.push({ nombre: n, precio: parseFloat(p), cantidad: 1 });
    renderizarCarritoUI();
};
window.cambiarCantidadItem = (i, c) => { carritoLocal[i].cantidad += c; if(carritoLocal[i].cantidad <= 0) carritoLocal.splice(i, 1); renderizarCarritoUI(); };
window.eliminarDelCarrito = (i) => { carritoLocal.splice(i, 1); renderizarCarritoUI(); };

document.getElementById('btn-abrir-pago')?.addEventListener('click', () => {
    if(carritoLocal.length === 0) return alert("Carrito vacío.");
    document.getElementById('modal-pago').style.display = 'flex';
    document.getElementById('modal-direccion-confirm').textContent = usuarioLogueado.direccion;
    actualizarPreciosUI(); 
});
document.getElementById('btn-cerrar-modal')?.addEventListener('click', () => document.getElementById('modal-pago').style.display = 'none');
document.getElementById('check-vip')?.addEventListener('change', actualizarPreciosUI);

// Lógica de inserción centralizada en Supabase
async function procesarPago() {
    const isVip = document.getElementById('check-vip').checked;
    const restaurantesDelPedido = [...new Set(carritoLocal.map(item => obtenerRestauranteDePlatillo(item.nombre)))];
    const stringRestaurantes = restaurantesDelPedido.join(" | ");
    const descripcionOrden = carritoLocal.map(item => `${item.cantidad}x ${item.nombre}`).join(", ");
    
    const { error } = await supabase.from('historialpedidos').insert([{
        cliente: usuarioLogueado.usuario, restaurante: stringRestaurantes,  
        destino: usuarioLogueado.direccion, descripcion: descripcionOrden, 
        prioridad: isVip ? 1 : 2, estado: 'Pendiente'
    }]);

    if(error) {
        alert("Error en el pago.");
        return false;
    }

    carritoLocal = []; 
    renderizarCarritoUI(); 
    document.getElementById('modal-pago').style.display = 'none';
    alert("¡Pedido Pagado con éxito!"); 
    cambiarVista('vista-rastreo-cliente');
    return true;
}

document.getElementById('btn-pago-efectivo')?.addEventListener('click', procesarPago);
document.getElementById('btn-pago-tarjeta')?.addEventListener('click', () => {
    abrirModalPagoTarjeta();
});


//CONTROL DE USUARIOS Y MENÚS

document.getElementById('btn-registro-submit')?.addEventListener('click', async () => {
    const u = document.getElementById('reg-usuario').value.trim(); 
    const p = document.getElementById('reg-pass').value.trim();
    const r = document.getElementById('reg-rol').value;

    if (u === "" || p === "") {
        return alert("⚠️ Por favor, ingresa un nombre de usuario y una contraseña.");
    }

    if (p.length < 4) {
        return alert("⚠️ La contraseña debe tener al menos 4 caracteres por seguridad.");
    }

    let d = 'Central Operativa'; 

    if (r === 'cliente') {
        const depto = document.getElementById('sel-depto').value;
        const muni = document.getElementById('sel-muni').value;
        const casa = document.getElementById('sel-casa').value;

        if (!depto || depto === "" || depto.includes("Seleccionar")) {
            return alert("📍 Debes seleccionar un Departamento para tu entrega.");
        }
        if (!muni || muni === "" || muni.includes("Seleccionar")) {
            return alert("📍 Debes seleccionar un Municipio válido.");
        }
        if (!casa || casa === "" || casa.includes("Número de Casa") || casa.includes("ocupadas")) {
            return alert("📍 Debes seleccionar un número de Casa disponible.");
        }

        d = `${casa}, ${muni}, ${depto}`;
    }

    const { error } = await supabase.from('usuarios').insert([{ 
        usuario: u, 
        password: p, 
        rol: r, 
        direccion: d 
    }]);

    if (error) {
        alert("❌ Error al registrar: El usuario podría estar duplicado o hubo un problema de conexión.");
    } else { 
        alert("🎉 ¡Registrado con éxito! Ya puedes iniciar sesión."); 
        location.reload(); 
    }
});

document.getElementById('btn-login-submit')?.addEventListener('click', async () => {
    const u = document.getElementById('login-usuario').value.trim(); const p = document.getElementById('login-pass').value.trim();
    if (u === "" || p === "") return alert("⚠️ Ingresa tu usuario y contraseña.");
    const { data } = await supabase.from('usuarios').select('*').eq('usuario', u).eq('password', p);
    if(data && data.length > 0) {
        let d = data[0]; usuarioLogueado = d.rol === 'cliente' ? new Cliente(d.usuario, d.direccion) : new Repartidor(d.usuario);
        localStorage.setItem('sesionActiva', JSON.stringify({ usuario: d.usuario, rol: d.rol, direccion: d.direccion })); location.reload();
    } else alert("Credenciales incorrectas.");
});

document.getElementById('reg-rol')?.addEventListener('change', (e) => document.getElementById('contenedor-direccion-registro').style.display = e.target.value === 'delivery' ? 'none' : 'block');

function cargarMenu(restauranteId, categoriaFiltro = '') {
    const contenedor = document.getElementById('contenedor-menu');
    if (categoriaFiltro === '') return contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #888;"><span style="font-size: 3rem;">🍽️</span><h3>Preparate para pedir</h3><p>Selecciona una categoría.</p></div>`;
    const items = menusPorRestaurante[restauranteId] || [];
    arbolMenu.limpiar(); items.forEach(prod => arbolMenu.insertar(prod));
    const prods = arbolMenu.filtrarPorCategoria(categoriaFiltro);
    if (prods.length === 0) return contenedor.innerHTML = "<p style='text-align:center;'>No hay productos.</p>";
    contenedor.innerHTML = prods.map(p => `<div class="tarjeta-comida"><img src="${p.img}"><div class="info-comida"><h4>${p.n} <br><small>${p.cat}</small></h4><span class="precio">$${p.p.toFixed(2)}</span></div><button onclick="agregarAlCarrito('${p.n}', ${p.p})" class="btn-agregar">+</button></div>`).join('');
}

async function cargarHistorialCliente() {
    const c = document.getElementById('lista-historial-cliente');
    const { data } = await supabase.from('historialpedidos').select('*').eq('cliente', usuarioLogueado.usuario).order('id', { ascending: false });
    if(!data || data.length === 0) return c.innerHTML = "<p>Sin registros.</p>";
    c.innerHTML = data.map(p => `<div class="panel" style="margin-bottom:10px; padding:15px; border-left:5px solid ${p.estado==='Entregado'?'#27dec9':'#4facfe'};"><strong>${p.restaurante} - Orden #${p.id}</strong><p>${p.descripcion}</p><small>Estado: ${p.estado}</small></div>`).join('');
}

async function cargarHistorialDelivery() {
    const c = document.getElementById('lista-historial-delivery');
    const { data } = await supabase.from('historialpedidos').select('*').eq('repartidor', usuarioLogueado.usuario).order('id', { ascending: false });
    if(!data || data.length === 0) return c.innerHTML = "<p>No has entregado nada.</p>";
    c.innerHTML = data.map(p => `<div class="panel" style="margin-bottom:10px; padding:15px; border-left:5px solid #27dec9;"><strong>Entrega #${p.id} para ${p.cliente}</strong><p>📍 ${p.destino}</p></div>`).join('');
}


// INICIALIZACIÓN DE LA APLICACIÓN 

window.onload = () => {
    const sesion = localStorage.getItem('sesionActiva'); 
    if (sesion) { 
        let d = JSON.parse(sesion); 
        usuarioLogueado = d.rol === 'cliente' ? new Cliente(d.usuario, d.direccion) : new Repartidor(d.usuario); 
        document.getElementById('pantalla-login').style.display = 'none'; 
        document.getElementById('pantalla-dashboard').style.display = 'flex'; 
        document.getElementById('user-display').textContent = usuarioLogueado.usuario; 
        document.getElementById('address-display').textContent = usuarioLogueado.direccion; 

        document.getElementById('options-restaurante').innerHTML = Object.keys(menusPorRestaurante).map(n => `<li data-value="${n}">${n}</li>`).join('');
        document.querySelectorAll('#options-restaurante li').forEach(li => li.addEventListener('click', e => {
            document.getElementById('selected-restaurante-value').innerHTML = `🏪 ${e.target.dataset.value}`;
            document.getElementById('selected-categoria-value').innerHTML = `✨ Click aquí para abrir el menú`;
            cargarMenu(e.target.dataset.value, '');
            document.getElementById('dropdown-restaurante').classList.remove('open');
        }));

        document.querySelectorAll('#options-categoria li').forEach(li => li.addEventListener('click', e => {
            let r = document.getElementById('selected-restaurante-value').textContent.replace('🏪 ', '').trim();
            if(r.includes("Seleccione")) return alert("Selecciona restaurante primero.");
            document.getElementById('selected-categoria-value').innerHTML = `✨ ${e.target.dataset.value}`;
            cargarMenu(r, e.target.dataset.value);
            document.getElementById('dropdown-categoria').classList.remove('open');
        }));

        document.getElementById('selected-restaurante-value').addEventListener('click', e => { e.stopPropagation(); document.getElementById('dropdown-categoria').classList.remove('open'); document.getElementById('dropdown-restaurante').classList.toggle('open'); });
        document.getElementById('selected-categoria-value').addEventListener('click', e => { e.stopPropagation(); document.getElementById('dropdown-restaurante').classList.remove('open'); document.getElementById('dropdown-categoria').classList.toggle('open'); });
        document.addEventListener('click', () => { document.getElementById('dropdown-restaurante').classList.remove('open'); document.getElementById('dropdown-categoria').classList.remove('open'); });

        cargarMenu('', ''); renderizarCarritoUI(); configurarDashboardPorRol();
    }
    
    const selD = document.getElementById('sel-depto');
    for(let d in datosDirecciones) { let o = document.createElement('option'); o.value=d; o.textContent=d; selD.appendChild(o); }
    
    selD.addEventListener('change', () => {
        const selM = document.getElementById('sel-muni'); 
        selM.innerHTML = '<option value="">Seleccionar Municipio</option>'; 
        selM.disabled = false;
        document.getElementById('sel-casa').innerHTML = '<option value="">Número de Casa</option>';
        document.getElementById('sel-casa').disabled = true;
        
        for(let m in datosDirecciones[selD.value]) { 
            let o = document.createElement('option'); 
            o.value=m; 
            o.textContent=m; 
            selM.appendChild(o); 
        }
    });
    
    document.getElementById('sel-muni').addEventListener('change', async () => {
        const selC = document.getElementById('sel-casa'); 
        selC.disabled = true;
        selC.innerHTML = '<option>Cargando...</option>';
        
        const muniSeleccionado = document.getElementById('sel-muni').value;
        if (!muniSeleccionado) return;
        
        const { data } = await supabase.from('usuarios').select('direccion').ilike('direccion', `%${muniSeleccionado}%`);
        const casasOcupadas = data ? data.map(d => d.direccion.split(',')[0].trim()) : [];
        
        selC.innerHTML = '<option value="">Número de Casa</option>';
        let hayCasasLibres = false;
        
        for(let i=1; i<=10; i++) {
            let nombreCasa = `Casa ${i}`;
            if(!casasOcupadas.includes(nombreCasa)) {
                let o = document.createElement('option');
                o.value = nombreCasa;
                o.textContent = nombreCasa;
                selC.appendChild(o);
                hayCasasLibres = true;
            }
        }
        
        if(!hayCasasLibres) {
            selC.innerHTML = '<option value="">Todas las casas están ocupadas</option>';
        }
        selC.disabled = false;
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => { 
        localStorage.removeItem('sesionActiva'); 
        window.location.reload(); 
    });

    const container = document.getElementById('container');
    document.getElementById('signUp')?.addEventListener('click', () => container.classList.add("right-panel-active"));
    document.getElementById('signIn')?.addEventListener('click', () => container.classList.remove("right-panel-active"));
};

//FORMULARIO REACTIVO DE TARJETA (

const modalPago = document.getElementById('modal-pago-glass');
const btnCerrarPago = document.getElementById('btn-cerrar-pago');
const tarjetaCreditoEl = document.getElementById('tarjeta-credito');
const formPagoTarjeta = document.getElementById('form-pago-tarjeta');

const inputNumero = document.getElementById('input-numero');
const inputNombre = document.getElementById('input-nombre');
const inputExpiracion = document.getElementById('input-expiracion');
const inputCvv = document.getElementById('input-cvv');

const vistaNumero = document.getElementById('vista-numero');
const vistaNombre = document.getElementById('vista-nombre');
const vistaExpiracion = document.getElementById('vista-expiracion');
const vistaCvv = document.getElementById('vista-cvv');

function abrirModalPagoTarjeta() {
    modalPago.classList.remove('hidden');
}

btnCerrarPago.addEventListener('click', () => {
    modalPago.classList.add('hidden');
    formPagoTarjeta.reset();
    resetearTarjetaIlustrada();
});

function resetearTarjetaIlustrada() {
    vistaNumero.textContent = "•••• •••• •••• ••••";
    vistaNombre.textContent = "NOMBRE APELLIDO";
    vistaExpiracion.textContent = "MM/AA";
    vistaCvv.textContent = "•••";
    tarjetaCreditoEl.classList.remove('girar');
}

inputNumero.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, ''); 
    let valorFormateado = valor.match(/.{1,4}/g)?.join(' ') || '';
    e.target.value = valorFormateado;
    vistaNumero.textContent = valorFormateado || "•••• •••• •••• ••••";
});

inputNombre.addEventListener('input', (e) => {
    vistaNombre.textContent = e.target.value.toUpperCase() || "NOMBRE APELLIDO";
});

inputExpiracion.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    }
    e.target.value = valor;
    vistaExpiracion.textContent = valor || "MM/AA";
});

inputCvv.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    e.target.value = valor;
    vistaCvv.textContent = valor || "•••";
});

inputCvv.addEventListener('focus', () => { tarjetaCreditoEl.classList.add('girar'); });
inputCvv.addEventListener('blur', () => { tarjetaCreditoEl.classList.remove('girar'); });


formPagoTarjeta.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    alert("🚀 ¡Pago Autorizado Correctamente por el Banco! Procesando orden...");
    

    const exito = await procesarPago();
    
    if (exito) {
        modalPago.classList.add('hidden');
        formPagoTarjeta.reset();
        resetearTarjetaIlustrada();
        document.getElementById('modal-pago').style.display = 'none';
    }
});

