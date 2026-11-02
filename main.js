const API_DRIVE = "/api/drive";
const API_AUTH = "/api/auth";
const API_SOCIAL = "/api/social";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
let documentosCache = [];
let chatInterval = null;
let salaActivaId = null;
let salaInterval = null;

// Utilidad Debounce para optimizar rendimiento
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'bx-info-circle';
    if (type === 'success') icon = 'bx-check-circle';
    if (type === 'error') icon = 'bx-error-circle';
    
    toast.innerHTML = `<i class='bx ${icon}'></i> <span>${escapeHTML(msg)}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==================== AUTENTICACIÓN ====================
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

if (signUpButton && signInButton && container) {
    signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
    signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
}

function cambiarPanel() { 
    if (container) container.classList.toggle("right-panel-active"); 
}

async function registrarUsuario() {
    const pin = document.getElementById('reg-pin')?.value.trim();
    const user = document.getElementById('reg-user')?.value.trim();
    const pass = document.getElementById('reg-pass')?.value.trim();
    const btn = document.getElementById('btn-reg');

    if (!pin || !user || !pass) {
        showToast("Todos los campos son obligatorios.", "error");
        return;
    }

    if (btn) btn.disabled = true;

    try {
        const res = await fetch(API_AUTH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "register", usuario: user, password: pass, pin: pin })
        });

        const data = await res.json();

        if (res.ok && data.result === "success") {
            showToast("Cuenta creada con éxito. Inicie sesión.", "success");
            if (container) container.classList.remove("right-panel-active");
            document.getElementById('reg-pin').value = "";
            document.getElementById('reg-user').value = "";
            document.getElementById('reg-pass').value = "";
        } else {
            showToast(data.error || "Error al registrar usuario.", "error");
        }
    } catch (e) {
        showToast("Error de conexión con el servidor.", "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function iniciarSesion() {
    const user = document.getElementById('log-user')?.value.trim();
    const pass = document.getElementById('log-pass')?.value.trim();
    const btn = document.getElementById('btn-login');

    if (!user || !pass) { 
        showToast("Ingrese usuario y contraseña.", "error");
        return; 
    } 
    
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(API_AUTH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", usuario: user, password: pass })
        });

        const data = await res.json();

        if (res.ok && data.result === "success") {
            localStorage.setItem('usuarioActivo', data.usuario);
            aplicarNombreUsuario(data.usuario);
            
            if (data.avatar_url) {
                localStorage.setItem('fotoUsuario', data.avatar_url);
                cargarAvatar();
            }
            
            const overlay = document.getElementById('login-overlay');
            if (overlay) overlay.style.display = 'none';
            showToast(`Bienvenido, ${data.usuario}`, "success");
            cargarChatGlobal(true);
            cargarSalasJuego(true);
        } else {
            showToast(data.error || "Credenciales incorrectas.", "error");
        }
    } catch (e) { 
        showToast("Error de conexión con el servidor.", "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}

function aplicarNombreUsuario(nombre) {
    const safeName = escapeHTML(nombre);
    ['nombre-sidebar', 'nombre-header', 'nombre-ajustes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = safeName;
    });
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('fotoUsuario');
    location.reload();
}

function cargarAvatar() {
    const fotoLocal = localStorage.getItem('fotoUsuario') || DEFAULT_AVATAR;
    const img = document.getElementById('img-avatar');
    if (img) img.src = fotoLocal;
}

async function subirFotoPerfil() {
    const input = document.getElementById('input-avatar');
    const img = document.getElementById('img-avatar');
    const usuario = localStorage.getItem('usuarioActivo');

    if (!usuario || !input || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    if (img) img.style.opacity = "0.4";

    reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        try {
            const res = await fetch(API_DRIVE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "upload_avatar",
                    usuario: usuario,
                    filename: `avatar_${usuario}_${Date.now()}.${file.name.split('.').pop()}`,
                    mimeType: file.type,
                    file: base64
                })
            });

            const data = await res.json();
            if (data.result === "success" && data.publicUrl) {
                if (img) img.src = data.publicUrl;
                localStorage.setItem('fotoUsuario', data.publicUrl);
                showToast("Foto de perfil actualizada.", "success");
            }
        } catch (e) {
            showToast("Error al actualizar la foto.", "error");
        } finally {
            if (img) img.style.opacity = "1";
        }
    };

    reader.readAsDataURL(file);
}

// ==================== NAVEGACIÓN Y TEMAS ====================
function mostrarMateria(id, btn) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    
    const targetSection = document.getElementById(id);
    if (targetSection) targetSection.style.display = 'block';
    
    document.querySelectorAll('.toque').forEach(b => b.classList.remove('activo'));
    if (btn) btn.classList.add('activo');

    // Control de polling inteligente según sección abierta
    if (id === 'seccion-chat') {
        cargarChatGlobal();
        if (!chatInterval) chatInterval = setInterval(() => cargarChatGlobal(true), 4000);
    } else {
        if (chatInterval) { clearInterval(chatInterval); chatInterval = null; }
    }

    if (id === 'seccion-juegos') {
        cargarSalasJuego();
        if (!salaInterval) salaInterval = setInterval(() => cargarSalasJuego(true), 3500);
    } else {
        if (salaInterval) { clearInterval(salaInterval); salaInterval = null; }
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('temaDavis', isLight ? 'light' : 'dark');
    
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isLight ? 'bx bx-moon' : 'bx bx-sun';
}

function setAccentColor(color) {
    document.body.classList.remove('theme-pink', 'theme-green', 'theme-red', 'theme-purple');
    document.querySelectorAll('.color-dot').forEach(dot => dot.classList.remove('active'));
    
    if (color !== 'cyan') {
        document.body.classList.add(`theme-${color}`);
    }
    
    const targetDot = document.querySelector(`.color-${color}`);
    if (targetDot) targetDot.classList.add('active');
    
    localStorage.setItem('acentoDavis', color);
}

// ==================== RELOJ Y POMODORO ====================
function actualizarReloj() {
    const r = document.getElementById('reloj-digital');
    const f = document.getElementById('fecha-actual');
    const ahora = new Date();
    if (r) r.innerText = ahora.toLocaleTimeString('es-SV', { hour12: true });
    if (f) {
        f.innerText = ahora.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
}
setInterval(actualizarReloj, 1000);

let pomoSegundos = 25 * 60;
let pomoTimer = null;
let pomoCorriendo = false;

function actualizarVistaPomodoro() {
    const el = document.getElementById('pomo-timer');
    if (!el) return;
    const m = String(Math.floor(pomoSegundos / 60)).padStart(2, '0');
    const s = String(pomoSegundos % 60).padStart(2, '0');
    el.innerText = `${m}:${s}`;
}

function togglePomodoro() {
    const btn = document.getElementById('btn-pomo-toggle');
    if (pomoCorriendo) {
        clearInterval(pomoTimer);
        pomoCorriendo = false;
        if (btn) btn.innerHTML = "<i class='bx bx-play'></i>";
    } else {
        pomoCorriendo = true;
        if (btn) btn.innerHTML = "<i class='bx bx-pause'></i>";
        pomoTimer = setInterval(() => {
            if (pomoSegundos > 0) {
                pomoSegundos--;
                actualizarVistaPomodoro();
            } else {
                clearInterval(pomoTimer);
                pomoCorriendo = false;
                if (btn) btn.innerHTML = "<i class='bx bx-play'></i>";
                showToast("¡Tiempo de enfoque terminado! Toma un descanso.", "success");
            }
        }, 1000);
    }
}

function resetPomodoro(minutos = 25) {
    clearInterval(pomoTimer);
    pomoCorriendo = false;
    pomoSegundos = minutos * 60;
    actualizarVistaPomodoro();
    const btn = document.getElementById('btn-pomo-toggle');
    if (btn) btn.innerHTML = "<i class='bx bx-play'></i>";
}

// ==================== TAREAS CON PROGRESO ====================
let tareas = JSON.parse(localStorage.getItem('tareasDavis')) || [];

function agregarTarea() { 
    const input = document.getElementById('input-tarea'); 
    if (!input) return;
    const val = input.value.trim();
    if (val) { 
        tareas.push({ id: Date.now(), txt: val, done: false }); 
        input.value = ""; 
        guardarTareas(); 
        showToast("Tarea agregada.", "success");
    } 
}

function handleTareaKeyPress(e) {
    if (e.key === 'Enter') agregarTarea();
}

function toggleTarea(id) {
    tareas = tareas.map(t => t.id === id ? { ...t, done: !t.done } : t);
    guardarTareas();
}

function borrarTarea(id) { 
    tareas = tareas.filter(t => t.id !== id); 
    guardarTareas(); 
    showToast("Tarea eliminada.", "info");
}

function limpiarTareasCompletadas() {
    const prevCount = tareas.length;
    tareas = tareas.filter(t => !t.done);
    if (tareas.length < prevCount) {
        guardarTareas();
        showToast("Tareas completadas limpiadas.", "info");
    }
}

function guardarTareas() { 
    localStorage.setItem('tareasDavis', JSON.stringify(tareas)); 
    renderTareas(); 
}

function renderTareas() { 
    const lista = document.getElementById('lista-tareas'); 
    const barra = document.getElementById('progreso-tareas');
    const contador = document.getElementById('contador-tareas');
    if (!lista) return; 

    lista.innerHTML = ""; 
    const completadas = tareas.filter(t => t.done).length;
    const porcentaje = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

    if (barra) barra.style.width = `${porcentaje}%`;
    if (contador) contador.innerText = `${completadas}/${tareas.length} (${porcentaje}%)`;

    tareas.forEach(t => { 
        const li = document.createElement('li');
        if (t.done) li.classList.add('tarea-completada');
        li.innerHTML = `
            <div class="tarea-izq" onclick="toggleTarea(${t.id})">
                <div class="tarea-check">${t.done ? "<i class='bx bx-check'></i>" : ""}</div>
                <span>${escapeHTML(t.txt)}</span>
            </div>
            <button class="aro" onclick="borrarTarea(${t.id})" style="width: 32px; height: 32px; font-size: 14px; color: var(--error);" title="Eliminar">
                <i class='bx bx-trash'></i>
            </button>
        `;
        lista.appendChild(li);
    }); 
}

// ==================== BLOC DE NOTAS MEJORADO ====================
const notas = document.getElementById('mi-bloc-notas');
if (notas) {
    notas.value = localStorage.getItem('notasDavis') || "";
    const guardarNotaDebounce = debounce(() => {
        localStorage.setItem('notasDavis', notas.value);
        const estado = document.getElementById('estado-notas');
        if (estado) {
            estado.style.opacity = '1';
            setTimeout(() => estado.style.opacity = '0', 1200);
        }
    }, 400);

    notas.addEventListener('input', guardarNotaDebounce);
}

function exportarNotasTxt() {
    if (!notas || !notas.value.trim()) {
        showToast("El bloc de notas está vacío.", "error");
        return;
    }
    const blob = new Blob([notas.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Notas_Davis_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Notas descargadas en .txt", "success");
}

// ==================== CALCULADORA CON SOPORTE DE TECLADO ====================
const pant = document.getElementById('calc-screen');

function appendCalc(v) { 
    if (pant) pant.value += v; 
}

function limpiarCalc() { 
    if (pant) pant.value = ""; 
}

function borrarUno() { 
    if (pant) pant.value = pant.value.slice(0, -1); 
}

function calcularResult() { 
    if (!pant || !pant.value) return;
    try {
        const sanitizeExp = pant.value.replace(/[^0-9+\-*/.%()]/g, '');
        const res = Function(`'use strict'; return (${sanitizeExp})`)();
        pant.value = Number.isFinite(res) ? res : "Error";
    } catch { 
        pant.value = "Error"; 
    } 
}

// ==================== WIDGETS DE INFORMACIÓN ====================
async function obtenerClima() { 
    try { 
        const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.6929&longitude=-89.2182&current_weather=true'); 
        const d = await r.json(); 
        const tempEl = document.getElementById('temp-actual');
        const descEl = document.getElementById('clima-desc');
        if (tempEl) tempEl.innerText = `${Math.round(d.current_weather.temperature)}°C`; 
        if (descEl) descEl.innerText = "San Salvador, SV";
    } catch (e) {} 
}

async function obtenerBitcoin() { 
    try { 
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'); 
        const d = await r.json(); 
        const btcEl = document.getElementById('btc-price');
        if (btcEl) btcEl.innerText = `$${d.bitcoin.usd.toLocaleString()}`; 
    } catch (e) {} 
}

async function obtenerInfoRed() { 
    try { 
        const r = await fetch('https://ipapi.co/json/'); 
        const d = await r.json(); 
        const ipEl = document.getElementById('my-ip');
        const ispEl = document.getElementById('my-isp');
        if (ipEl) ipEl.innerText = d.ip; 
        if (ispEl) ispEl.innerText = d.org; 
    } catch (e) {} 
}

// ==================== GESTIÓN DE DOCUMENTOS (DRIVE) ====================
function obtenerIconoArchivo(nombre = "") {
    const ext = nombre.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'bxs-file-pdf';
    if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'bxs-file-doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bxs-spreadsheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'bxs-file-image';
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) return 'bxs-file-archive';
    if (['js', 'py', 'html', 'css', 'cs', 'sql', 'json'].includes(ext)) return 'bx-code-block';
    return 'bxs-file-blank';
}

async function loadDocuments(isBackground = false) {
    const lista = document.getElementById("documents-list");
    if (!lista) return;

    if (!isBackground && documentosCache.length === 0) {
        lista.innerHTML = "<li class='text-center'>Cargando lista de documentos...</li>";
    }

    try {
        const res = await fetch(API_DRIVE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "read" })
        });
        const data = await res.json();
        
        if (data.result !== "success") { 
            if (!isBackground) lista.innerHTML = "<li class='text-center'>Error al cargar documentos.</li>"; 
            return; 
        }

        documentosCache = data.items || [];
        renderizarDocumentosFiltrados();
    } catch (e) {
        if (!isBackground) lista.innerHTML = "<li class='text-center'>Error de comunicación con el servidor.</li>";
    }
}

function renderizarDocumentosFiltrados() {
    const lista = document.getElementById("documents-list");
    const searchInput = document.getElementById("search-docs");
    if (!lista) return;

    const termino = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let archivos = [...documentosCache];

    if (termino !== "") {
        archivos = archivos.filter(a => 
            a.name.toLowerCase().includes(termino) || 
            (a.folder && a.folder.toLowerCase().includes(termino))
        );
    }

    lista.innerHTML = ""; 
    if (archivos.length === 0) { 
        lista.innerHTML = "<li class='text-center'>No se encontraron registros.</li>"; 
        return; 
    }

    const grupos = {};
    archivos.forEach(a => {
        const carpeta = a.folder || "General";
        if (!grupos[carpeta]) grupos[carpeta] = [];
        grupos[carpeta].push(a);
    });

    for (const folder in grupos) {
        const title = document.createElement("h4");
        title.innerHTML = `<i class='bx bxs-folder-open'></i> ${escapeHTML(folder)} <span class="chico" style="color:var(--suave);">(${grupos[folder].length})</span>`;
        title.style.marginTop = "15px";
        title.style.color = "var(--brillo)";
        lista.appendChild(title);

        grupos[folder].forEach(a => {
            const li = document.createElement("li");
            const match = a.url ? a.url.match(/\/d\/(.+?)\//) : null;
            const download = match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : a.url;
            const icono = obtenerIconoArchivo(a.name);

            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class='bx ${icono}' style="font-size:1.35rem; color:var(--brillo);"></i>
                    <span style="font-weight:500;">${escapeHTML(a.name)}</span>
                </div>
                <div style="display:flex; gap:8px;">
                    <a href="${a.url}" target="_blank" rel="noopener" class="aro" style="width:32px; height:32px; font-size:14px;" title="Ver"><i class='bx bx-show'></i></a>
                    <a href="${download}" class="aro" style="width:32px; height:32px; font-size:14px; color:var(--exito);" title="Descargar"><i class='bx bx-download'></i></a>
                    <button onclick="deleteDocument('${a.id}')" class="aro" style="width:32px; height:32px; font-size:14px; color:var(--error);" title="Eliminar"><i class='bx bx-trash'></i></button>
                </div>
            `;
            lista.appendChild(li);
        });
    }
}

const filtrarArchivos = debounce(() => {
    renderizarDocumentosFiltrados();
}, 200);

async function uploadDocument() {
    const fileInput = document.getElementById("document-file");
    const nameInput = document.getElementById("document-name");
    const folderSelect = document.getElementById("folder-select");
    const newFolder = document.getElementById("new-folder-input");
    const status = document.getElementById("upload-status");

    const file = fileInput?.files[0];
    const name = nameInput?.value.trim() || file?.name;
    let folder = folderSelect ? folderSelect.value : "General";
    if (folder === "nueva" && newFolder) folder = newFolder.value.trim();

    if (!file || !name) { 
        showToast("Debe adjuntar un archivo y definir un nombre.", "error");
        return; 
    }

    if (status) {
        status.innerText = "Transfiriendo archivo..."; 
        status.style.color = "var(--brillo)";
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        try {
            const res = await fetch(API_DRIVE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "upload", filename: name, mimeType: file.type, folderName: folder, file: base64 })
            });

            const data = await res.json();
            if (data.result === "success") {
                showToast("Archivo subido con éxito.", "success");
                if (status) status.innerText = "";
                fileInput.value = ""; 
                if (nameInput) nameInput.value = ""; 
                if (newFolder) newFolder.value = "";
                loadDocuments(false); 
                loadFolders(); 
            } else { 
                showToast("Fallo en la carga del archivo.", "error");
                if (status) status.innerText = "";
            }
        } catch (e) { 
            showToast("Error de conexión de red.", "error");
            if (status) status.innerText = "";
        }
    };
}

async function deleteDocument(id) {
    if (!confirm("¿Seguro que deseas eliminar este archivo?")) return;
    try {
        const res = await fetch(API_DRIVE, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id }) 
        });
        const data = await res.json();
        if (data.result === "success") { 
            showToast("Archivo eliminado.", "info");
            loadDocuments(false); 
        } else { 
            showToast("No se pudo eliminar el archivo.", "error");
        }
    } catch(e) {}
}

async function loadFolders() {
    const select = document.getElementById("folder-select");
    if (!select) return;
    const seleccionPrevia = select.value;

    try {
        const res = await fetch(API_DRIVE, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "read" }) 
        });
        const data = await res.json();
        if (data.result !== "success") return;

        select.innerHTML = `<option value="General">General</option><option value="nueva" style="font-weight:600;">+ Crear Nueva Carpeta...</option>`;

        if (data.folders && data.folders.length > 0) {
            data.folders.forEach(c => {
                if (c !== "General") {
                    const o = document.createElement("option");
                    o.value = c; 
                    o.innerText = c;
                    select.insertBefore(o, select.firstChild);
                }
            });
        }
        if (seleccionPrevia && seleccionPrevia !== "nueva") {
            const existe = Array.from(select.options).some(op => op.value === seleccionPrevia);
            if (existe) select.value = seleccionPrevia;
        }
    } catch (e) {}
}

function verificarCarpeta() { 
    const s = document.getElementById('folder-select'); 
    const i = document.getElementById('new-folder-input'); 
    if (i && s) i.style.display = (s.value === 'nueva') ? 'block' : 'none'; 
}

// ==================== CHAT GLOBAL (TABLA chat_global) ====================
async function cargarChatGlobal(silencioso = false) {
    const contenedor = document.getElementById('chat-global-mensajes');
    if (!contenedor) return;

    try {
        const res = await fetch(API_SOCIAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "get_chat_global" })
        });
        const data = await res.json();
        if (data.result !== "success") return;

        const usuarioActual = localStorage.getItem('usuarioActivo') || "Invitado";
        const estabaAbajo = contenedor.scrollHeight - contenedor.scrollTop <= contenedor.clientHeight + 60;

        contenedor.innerHTML = "";
        (data.mensajes || []).forEach(m => {
            const esMio = m.usuario === usuarioActual;
            const div = document.createElement('div');
            div.className = `msg-item ${esMio ? 'msg-propio' : 'msg-ajeno'}`;

            const fecha = m.created_at ? new Date(m.created_at).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }) : '';
            const avatar = m.avatar_url || DEFAULT_AVATAR;

            div.innerHTML = `
                <img src="${escapeHTML(avatar)}" class="msg-avatar" alt="avatar" onerror="this.src='${DEFAULT_AVATAR}'">
                <div class="msg-burbuja">
                    <span class="msg-autor">${escapeHTML(m.usuario)}</span>
                    <div class="msg-texto">${escapeHTML(m.mensaje)}</div>
                    ${m.imagen_url ? `<img src="${escapeHTML(m.imagen_url)}" class="msg-img" onclick="window.open(this.src, '_blank')">` : ''}
                    <span class="msg-hora">${fecha}</span>
                </div>
            `;
            contenedor.appendChild(div);
        });

        if (estabaAbajo || !silencioso) {
            contenedor.scrollTop = contenedor.scrollHeight;
        }
    } catch (e) {}
}

async function enviarMensajeGlobal() {
    const inputMsg = document.getElementById('input-chat-global');
    const inputImg = document.getElementById('input-chat-img-url');
    if (!inputMsg) return;

    const texto = inputMsg.value.trim();
    const imgUrl = inputImg ? inputImg.value.trim() : null;
    const usuario = localStorage.getItem('usuarioActivo');
    const avatar = localStorage.getItem('fotoUsuario') || DEFAULT_AVATAR;

    if (!usuario) {
        showToast("Inicia sesión para chatear.", "error");
        return;
    }
    if (!texto && !imgUrl) return;

    inputMsg.value = "";
    if (inputImg) {
        inputImg.value = "";
        inputImg.style.display = "none";
    }

    try {
        const res = await fetch(API_SOCIAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "send_chat_global",
                usuario,
                mensaje: texto,
                avatar_url: avatar,
                imagen_url: imgUrl || null
            })
        });
        const data = await res.json();
        if (data.result === "success") {
            cargarChatGlobal(false);
        } else {
            showToast("No se pudo enviar el mensaje.", "error");
        }
    } catch (e) {
        showToast("Error al conectar con el chat.", "error");
    }
}

function toggleInputImagenChat() {
    const el = document.getElementById('input-chat-img-url');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ==================== SALAS DE JUEGO (TABLA salas_juego) ====================
let estadoTableroLocal = Array(9).fill("");
let turnoActual = "X";

async function cargarSalasJuego(silencioso = false) {
    const lista = document.getElementById('lista-salas-juego');
    if (!lista) return;

    try {
        const res = await fetch(API_SOCIAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "get_salas" })
        });
        const data = await res.json();
        if (data.result !== "success") return;

        lista.innerHTML = "";
        const salas = data.salas || [];
        if (salas.length === 0) {
            lista.innerHTML = "<li class='text-center'>No hay salas activas. ¡Crea una!</li>";
            return;
        }

        salas.forEach(s => {
            const li = document.createElement('li');
            const ganoAlguien = s.ganador ? `🏆 Ganador: ${escapeHTML(s.ganador)}` : `Estado: ${escapeHTML(s.estado)}`;
            li.innerHTML = `
                <div>
                    <strong>${escapeHTML(s.jugador1)}</strong> vs <strong>${escapeHTML(s.jugador2 || 'Esperando...')}</strong>
                    <p class="chico">${ganoAlguien}</p>
                </div>
                <div style="display:flex; gap:8px;">
                    <span class="badge-estado">${escapeHTML(s.estado)}</span>
                    ${!s.ganador ? `<button class="aro" style="width:32px; height:32px;" onclick="unirseSala('${s.id}', '${escapeHTML(s.jugador1)}', '${escapeHTML(s.jugador2 || '')}')" title="Entrar"><i class='bx bx-play'></i></button>` : ''}
                </div>
            `;
            lista.appendChild(li);
        });
    } catch (e) {}
}

async function crearSalaJuego() {
    const usuario = localStorage.getItem('usuarioActivo');
    const rivalInput = document.getElementById('input-rival-juego');
    const rival = rivalInput?.value.trim() || "Esperando rival";

    if (!usuario) {
        showToast("Debes iniciar sesión.", "error");
        return;
    }

    try {
        const res = await fetch(API_SOCIAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "create_sala",
                jugador1: usuario,
                jugador2: rival
            })
        });
        const data = await res.json();
        if (data.result === "success") {
            showToast("Sala creada con éxito.", "success");
            if (rivalInput) rivalInput.value = "";
            cargarSalasJuego();
            if (data.sala) unirseSala(data.sala.id, data.sala.jugador1, data.sala.jugador2);
        }
    } catch (e) {
        showToast("Error al crear sala.", "error");
    }
}

function unirseSala(id, j1, j2) {
    salaActivaId = id;
    estadoTableroLocal = Array(9).fill("");
    turnoActual = "X";
    const info = document.getElementById('info-partida-actual');
    if (info) info.innerText = `Sala activa: ${j1} (X) vs ${j2 || 'Rival'} (O)`;
    renderizarTableroGato();
}

function renderizarTableroGato() {
    const cont = document.getElementById('tablero-gato');
    if (!cont) return;
    cont.innerHTML = "";
    estadoTableroLocal.forEach((val, idx) => {
        const celda = document.createElement('div');
        celda.className = `celda-gato ${val ? 'ocupada' : ''}`;
        celda.innerText = val;
        celda.onclick = () => jugarCelda(idx);
        cont.appendChild(celda);
    });
}

async function jugarCelda(idx) {
    if (estadoTableroLocal[idx] !== "") return;
    estadoTableroLocal[idx] = turnoActual;
    renderizarTableroGato();

    const ganadorSimbolo = verificarGanadorGato();
    if (ganadorSimbolo) {
        const usuario = localStorage.getItem('usuarioActivo') || ganadorSimbolo;
        showToast(`¡Partida finalizada! Ganó ${usuario}`, "success");
        if (salaActivaId) {
            await fetch(API_SOCIAL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "finish_sala",
                    id: salaActivaId,
                    ganador: usuario
                })
            });
            cargarSalasJuego();
        }
        return;
    }

    if (!estadoTableroLocal.includes("")) {
        showToast("¡Empate!", "info");
        return;
    }

    turnoActual = turnoActual === "X" ? "O" : "X";
}

function verificarGanadorGato() {
    const lineas = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (const [a, b, c] of lineas) {
        if (estadoTableroLocal[a] && estadoTableroLocal[a] === estadoTableroLocal[b] && estadoTableroLocal[a] === estadoTableroLocal[c]) {
            return estadoTableroLocal[a];
        }
    }
    return null;
}

// ==================== INICIALIZACIÓN ====================
window.onload = () => {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    if (usuarioGuardado) {
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.style.display = 'none';
        aplicarNombreUsuario(usuarioGuardado);
        cargarAvatar();
    }

    const temaGuardado = localStorage.getItem('temaDavis');
    if (temaGuardado === 'light') {
        document.body.classList.add('light-mode');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = 'bx bx-moon';
    } else {
        document.body.classList.remove('light-mode');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = 'bx bx-sun';
    }

    const acentoGuardado = localStorage.getItem('acentoDavis');
    if (acentoGuardado) {
        setAccentColor(acentoGuardado);
    }

    // Autocompletar nombre de archivo al seleccionarlo
    const fileInput = document.getElementById("document-file");
    const nameInput = document.getElementById("document-name");
    if (fileInput && nameInput) {
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0 && !nameInput.value.trim()) {
                nameInput.value = fileInput.files[0].name;
            }
        });
    }

    actualizarReloj();
    actualizarVistaPomodoro();
    renderTareas();
    renderizarTableroGato();
    obtenerClima();
    obtenerBitcoin();
    obtenerInfoRed();
    loadDocuments(false);
    loadFolders();
    cargarChatGlobal(true);
    cargarSalasJuego(true);
};
