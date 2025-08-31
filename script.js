// Variables globales
let usuarios = {};
let usuarioActual = '';
let perfilUsuario = {};
let comidasData = {};
let fechaActual = new Date().toISOString().split('T')[0];

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    inicializarEventos();
    configurarFechaActual();
    cargarUsuarios();
    actualizarCalendario();
    actualizarProgresoDiario();
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch(function(error) {
                console.log('Error al registrar Service Worker:', error);
            });
    }
    
    // Detectar si la app está instalada
    mostrarBotonInstalar();
});

// Cargar datos del localStorage
function cargarDatos() {
    const usuariosGuardados = localStorage.getItem('usuarios');
    const usuarioActualGuardado = localStorage.getItem('usuarioActual');
    
    if (usuariosGuardados) {
        usuarios = JSON.parse(usuariosGuardados);
    }
    
    if (usuarioActualGuardado && usuarios[usuarioActualGuardado]) {
        usuarioActual = usuarioActualGuardado;
        perfilUsuario = usuarios[usuarioActual].perfil || {};
        comidasData = usuarios[usuarioActual].comidas || {};
        
        if (Object.keys(perfilUsuario).length > 0) {
            llenarFormularioPerfil();
            mostrarResultadoCalorias();
        }
    }
}

// Guardar datos en localStorage
function guardarDatos() {
    if (usuarioActual) {
        usuarios[usuarioActual] = {
            perfil: perfilUsuario,
            comidas: comidasData
        };
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('usuarioActual', usuarioActual);
    }
}

// Inicializar eventos
function inicializarEventos() {
    // Navegación por pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            cambiarTab(tabId);
        });
    });
    
    // Gestión de usuarios
    document.getElementById('usuario-actual').addEventListener('change', cambiarUsuario);
    document.getElementById('nuevo-usuario').addEventListener('click', mostrarModalUsuario);
    document.getElementById('eliminar-usuario').addEventListener('click', eliminarUsuarioActual);
    document.getElementById('form-nuevo-usuario').addEventListener('submit', crearNuevoUsuario);
    document.getElementById('cerrar-modal').addEventListener('click', cerrarModal);
    document.getElementById('cancelar-usuario').addEventListener('click', cerrarModal);
    
    // Formulario de perfil
    document.getElementById('perfil-form').addEventListener('submit', calcularCalorias);
    document.getElementById('objetivo').addEventListener('change', toggleObjetivoPersonalizado);
    document.getElementById('peso-objetivo').addEventListener('input', calcularObjetivoPersonalizado);
    document.getElementById('tiempo-objetivo').addEventListener('input', calcularObjetivoPersonalizado);
    
    // Formulario de comidas
    document.getElementById('comida-form').addEventListener('submit', agregarComida);
    document.getElementById('agregar-ingrediente').addEventListener('click', agregarIngrediente);
    
    // Fecha de comidas
    document.getElementById('fecha-comida').addEventListener('change', function() {
        fechaActual = this.value;
        actualizarProgresoDiario();
        mostrarComidasDelDia();
    });
    
    // Cálculo automático de calorías de ingredientes
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('ingrediente-gramos') || 
            e.target.classList.contains('ingrediente-calorias')) {
            calcularTotalCalorias();
        }
    });
    
    // Controles del calendario
    document.getElementById('mes-anterior').addEventListener('click', () => cambiarMes(-1));
    document.getElementById('mes-siguiente').addEventListener('click', () => cambiarMes(1));
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('modal-usuario').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModal();
        }
    });
}

// Configurar fecha actual
function configurarFechaActual() {
    document.getElementById('fecha-comida').value = fechaActual;
}

// Gestión de usuarios
function cargarUsuarios() {
    const select = document.getElementById('usuario-actual');
    select.innerHTML = '<option value="">Seleccionar usuario...</option>';
    
    Object.keys(usuarios).forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
    
    if (usuarioActual) {
        select.value = usuarioActual;
    }
    
    // Mostrar/ocultar botón eliminar
    document.getElementById('eliminar-usuario').style.display = usuarioActual ? 'inline-flex' : 'none';
}

function cambiarUsuario() {
    const nuevoUsuario = document.getElementById('usuario-actual').value;
    
    if (!nuevoUsuario) {
        usuarioActual = '';
        perfilUsuario = {};
        comidasData = {};
        limpiarFormularios();
        document.getElementById('eliminar-usuario').style.display = 'none';
        return;
    }
    
    usuarioActual = nuevoUsuario;
    
    if (usuarios[usuarioActual]) {
        perfilUsuario = usuarios[usuarioActual].perfil || {};
        comidasData = usuarios[usuarioActual].comidas || {};
        
        if (Object.keys(perfilUsuario).length > 0) {
            llenarFormularioPerfil();
            mostrarResultadoCalorias();
        } else {
            limpiarFormularios();
        }
    } else {
        perfilUsuario = {};
        comidasData = {};
        limpiarFormularios();
    }
    
    localStorage.setItem('usuarioActual', usuarioActual);
    document.getElementById('eliminar-usuario').style.display = 'inline-flex';
    actualizarProgresoDiario();
    mostrarComidasDelDia();
    actualizarCalendario();
}

function mostrarModalUsuario() {
    document.getElementById('modal-usuario').classList.remove('hidden');
    document.getElementById('nombre-usuario').focus();
}

function cerrarModal() {
    document.getElementById('modal-usuario').classList.add('hidden');
    document.getElementById('nombre-usuario').value = '';
}

function crearNuevoUsuario(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-usuario').value.trim();
    
    if (!nombre) {
        alert('Por favor ingresa un nombre para el usuario');
        return;
    }
    
    if (usuarios[nombre]) {
        alert('Ya existe un usuario con ese nombre');
        return;
    }
    
    usuarios[nombre] = {
        perfil: {},
        comidas: {}
    };
    
    usuarioActual = nombre;
    perfilUsuario = {};
    comidasData = {};
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('usuarioActual', usuarioActual);
    
    cargarUsuarios();
    limpiarFormularios();
    cerrarModal();
    
    // Ir a la pestaña de perfil
    cambiarTab('perfil');
}

function eliminarUsuarioActual() {
    if (!usuarioActual) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${usuarioActual}" y todos sus datos?`)) {
        delete usuarios[usuarioActual];
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        usuarioActual = '';
        perfilUsuario = {};
        comidasData = {};
        localStorage.removeItem('usuarioActual');
        
        cargarUsuarios();
        limpiarFormularios();
    }
}

function limpiarFormularios() {
    // Limpiar formulario de perfil
    document.getElementById('perfil-form').reset();
    document.getElementById('resultado-calorias').classList.add('hidden');
    document.getElementById('objetivo-personalizado').classList.add('hidden');
    
    // Limpiar datos de comidas
    document.getElementById('lista-comidas-dia').innerHTML = '';
    document.getElementById('calorias-consumidas').textContent = '0';
    document.getElementById('calorias-objetivo').textContent = '0';
    document.getElementById('barra-progreso').style.width = '0%';
}

// Cambiar pestaña
function cambiarTab(tabId) {
    // Remover active de todos los botones y contenidos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Agregar active al botón y contenido seleccionado
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    // Actualizar datos según la pestaña
    if (tabId === 'comidas') {
        mostrarComidasDelDia();
        actualizarProgresoDiario();
    } else if (tabId === 'calendario') {
        actualizarCalendario();
    }
}

// Llenar formulario de perfil con datos guardados
function llenarFormularioPerfil() {
    if (perfilUsuario.peso) document.getElementById('peso').value = perfilUsuario.peso;
    if (perfilUsuario.altura) document.getElementById('altura').value = perfilUsuario.altura;
    if (perfilUsuario.edad) document.getElementById('edad').value = perfilUsuario.edad;
    if (perfilUsuario.genero) document.getElementById('genero').value = perfilUsuario.genero;
    if (perfilUsuario.actividad) document.getElementById('actividad').value = perfilUsuario.actividad;
    if (perfilUsuario.objetivo) document.getElementById('objetivo').value = perfilUsuario.objetivo;
    if (perfilUsuario.pesoObjetivo) document.getElementById('peso-objetivo').value = perfilUsuario.pesoObjetivo;
    if (perfilUsuario.tiempoObjetivo) document.getElementById('tiempo-objetivo').value = perfilUsuario.tiempoObjetivo;
    
    toggleObjetivoPersonalizado();
}

// Toggle objetivo personalizado
function toggleObjetivoPersonalizado() {
    const objetivo = document.getElementById('objetivo').value;
    const contenedor = document.getElementById('objetivo-personalizado');
    
    if (objetivo === 'personalizado') {
        contenedor.classList.remove('hidden');
        calcularObjetivoPersonalizado();
    } else {
        contenedor.classList.add('hidden');
    }
}

// Calcular objetivo personalizado
function calcularObjetivoPersonalizado() {
    const pesoActual = parseFloat(document.getElementById('peso').value);
    const pesoObjetivo = parseFloat(document.getElementById('peso-objetivo').value);
    const tiempoSemanas = parseFloat(document.getElementById('tiempo-objetivo').value);
    
    if (!pesoActual || !pesoObjetivo || !tiempoSemanas) {
        document.getElementById('objetivo-descripcion').innerHTML = '';
        return;
    }
    
    const diferenciaPeso = pesoObjetivo - pesoActual;
    const kgPorSemana = diferenciaPeso / tiempoSemanas;
    
    let descripcion = '';
    let tipoObjetivo = '';
    
    if (diferenciaPeso > 0) {
        tipoObjetivo = 'ganar';
        descripcion = `Objetivo: Ganar ${diferenciaPeso.toFixed(1)} kg en ${tiempoSemanas} semanas (${kgPorSemana.toFixed(2)} kg/semana)`;
    } else if (diferenciaPeso < 0) {
        tipoObjetivo = 'perder';
        descripcion = `Objetivo: Perder ${Math.abs(diferenciaPeso).toFixed(1)} kg en ${tiempoSemanas} semanas (${Math.abs(kgPorSemana).toFixed(2)} kg/semana)`;
    } else {
        tipoObjetivo = 'mantener';
        descripcion = 'Objetivo: Mantener el peso actual';
    }
    
    // Validar que el objetivo sea realista
    const kgPorSemanaAbs = Math.abs(kgPorSemana);
    if (kgPorSemanaAbs > 1) {
        descripcion += '<br><span style="color: var(--error-color);">⚠️ Objetivo muy agresivo. Recomendado: máximo 1 kg/semana</span>';
    } else if (kgPorSemanaAbs > 0.5 && kgPorSemanaAbs <= 1) {
        descripcion += '<br><span style="color: orange;">⚠️ Objetivo agresivo pero factible</span>';
    } else if (kgPorSemanaAbs > 0) {
        descripcion += '<br><span style="color: var(--success-color);">✅ Objetivo realista y saludable</span>';
    }
    
    document.getElementById('objetivo-descripcion').innerHTML = descripcion;
}

// Calcular calorías
function calcularCalorias(e) {
    e.preventDefault();
    
    if (!usuarioActual) {
        alert('Por favor selecciona o crea un usuario primero');
        return;
    }
    
    const peso = parseFloat(document.getElementById('peso').value);
    const altura = parseFloat(document.getElementById('altura').value);
    const edad = parseFloat(document.getElementById('edad').value);
    const genero = document.getElementById('genero').value;
    const actividad = parseFloat(document.getElementById('actividad').value);
    const objetivo = document.getElementById('objetivo').value;
    
    if (!peso || !altura || !edad) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    // Calcular BMR (Metabolismo Basal) usando la fórmula de Mifflin-St Jeor
    let bmr;
    if (genero === 'hombre') {
        bmr = 10 * peso + 6.25 * altura - 5 * edad + 5;
    } else {
        bmr = 10 * peso + 6.25 * altura - 5 * edad - 161;
    }
    
    // Calcular TDEE (Gasto Total Diario de Energía)
    const tdee = bmr * actividad;
    
    // Calcular objetivo según la meta
    let objetivoCalorias;
    let rangoMin, rangoMax;
    
    if (objetivo === 'personalizado') {
        const pesoObjetivo = parseFloat(document.getElementById('peso-objetivo').value);
        const tiempoSemanas = parseFloat(document.getElementById('tiempo-objetivo').value);
        
        if (!pesoObjetivo || !tiempoSemanas) {
            alert('Por favor completa el peso objetivo y el tiempo para el objetivo personalizado');
            return;
        }
        
        const diferenciaPeso = pesoObjetivo - peso;
        const kgPorSemana = diferenciaPeso / tiempoSemanas;
        
        // 1 kg = aproximadamente 7700 kcal
        const caloriasSemanales = kgPorSemana * 7700;
        const caloriasDiarias = caloriasSemanales / 7;
        
        objetivoCalorias = tdee + caloriasDiarias;
        
        // Rango más flexible para objetivos personalizados
        rangoMin = objetivoCalorias - 300;
        rangoMax = objetivoCalorias + 300;
    } else {
        switch (objetivo) {
            case 'deficit':
                objetivoCalorias = tdee - 500; // Déficit de 500 kcal para perder ~0.5kg/semana
                rangoMin = objetivoCalorias - 200;
                rangoMax = objetivoCalorias + 200;
                break;
            case 'superavit':
                objetivoCalorias = tdee + 300; // Superávit de 300 kcal para ganar peso
                rangoMin = objetivoCalorias - 200;
                rangoMax = objetivoCalorias + 200;
                break;
            default:
                objetivoCalorias = tdee; // Mantenimiento
                rangoMin = objetivoCalorias - 200;
                rangoMax = objetivoCalorias + 200;
        }
    }
    
    // Guardar perfil
    perfilUsuario = {
        peso, altura, edad, genero, actividad, objetivo,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        objetivoCalorias: Math.round(objetivoCalorias),
        rangoMin: Math.round(rangoMin),
        rangoMax: Math.round(rangoMax)
    };
    
    if (objetivo === 'personalizado') {
        perfilUsuario.pesoObjetivo = parseFloat(document.getElementById('peso-objetivo').value);
        perfilUsuario.tiempoObjetivo = parseFloat(document.getElementById('tiempo-objetivo').value);
    }
    
    guardarDatos();
    mostrarResultadoCalorias();
    actualizarProgresoDiario();
}

// Mostrar resultado de calorías
function mostrarResultadoCalorias() {
    if (!perfilUsuario.bmr) return;
    
    document.getElementById('bmr-valor').textContent = perfilUsuario.bmr;
    document.getElementById('tdee-valor').textContent = perfilUsuario.tdee;
    document.getElementById('objetivo-valor').textContent = perfilUsuario.objetivoCalorias;
    
    if (perfilUsuario.rangoMin && perfilUsuario.rangoMax) {
        document.getElementById('rango-valor').textContent = `${perfilUsuario.rangoMin} - ${perfilUsuario.rangoMax}`;
        document.getElementById('rango-objetivo').classList.remove('hidden');
    } else {
        document.getElementById('rango-objetivo').classList.add('hidden');
    }
    
    document.getElementById('resultado-calorias').classList.remove('hidden');
}

// Agregar ingrediente
function agregarIngrediente() {
    const lista = document.getElementById('ingredientes-lista');
    const nuevoIngrediente = document.createElement('div');
    nuevoIngrediente.className = 'ingrediente-item';
    nuevoIngrediente.innerHTML = `
        <div class="input-group">
            <label>Ingrediente</label>
            <input type="text" class="ingrediente-nombre" placeholder="Ej: Arroz">
        </div>
        <div class="input-group">
            <label>Gramos</label>
            <input type="number" class="ingrediente-gramos" placeholder="100">
        </div>
        <div class="input-group">
            <label>Kcal/100g</label>
            <input type="number" class="ingrediente-calorias" placeholder="130">
        </div>
        <button type="button" class="btn btn-remove" onclick="eliminarIngrediente(this)">❌</button>
    `;
    lista.appendChild(nuevoIngrediente);
}

// Eliminar ingrediente
function eliminarIngrediente(button) {
    button.parentElement.remove();
    calcularTotalCalorias();
}

// Calcular total de calorías de la comida
function calcularTotalCalorias() {
    const ingredientes = document.querySelectorAll('.ingrediente-item');
    let total = 0;
    
    ingredientes.forEach(ingrediente => {
        const gramos = parseFloat(ingrediente.querySelector('.ingrediente-gramos').value) || 0;
        const caloriasX100 = parseFloat(ingrediente.querySelector('.ingrediente-calorias').value) || 0;
        total += (gramos * caloriasX100) / 100;
    });
    
    document.getElementById('total-calorias-comida').textContent = Math.round(total);
}

// Agregar comida
function agregarComida(e) {
    e.preventDefault();
    
    if (!usuarioActual) {
        alert('Por favor selecciona o crea un usuario primero');
        return;
    }
    
    const nombreComida = document.getElementById('nombre-comida').value;
    const ingredientes = [];
    let totalCalorias = 0;
    
    if (!nombreComida.trim()) {
        alert('Por favor ingresa el nombre de la comida');
        return;
    }
    
    // Recopilar ingredientes
    document.querySelectorAll('.ingrediente-item').forEach(item => {
        const nombre = item.querySelector('.ingrediente-nombre').value;
        const gramos = parseFloat(item.querySelector('.ingrediente-gramos').value) || 0;
        const caloriasX100 = parseFloat(item.querySelector('.ingrediente-calorias').value) || 0;
        
        if (nombre && gramos > 0 && caloriasX100 > 0) {
            const calorias = (gramos * caloriasX100) / 100;
            ingredientes.push({ nombre, gramos, caloriasX100, calorias });
            totalCalorias += calorias;
        }
    });
    
    if (ingredientes.length === 0) {
        alert('Por favor agrega al menos un ingrediente válido');
        return;
    }
    
    // Agregar comida a los datos
    if (!comidasData[fechaActual]) {
        comidasData[fechaActual] = [];
    }
    
    comidasData[fechaActual].push({
        id: Date.now(),
        nombre: nombreComida,
        ingredientes: ingredientes,
        totalCalorias: Math.round(totalCalorias),
        timestamp: new Date().toISOString()
    });
    
    guardarDatos();
    limpiarFormularioComida();
    mostrarComidasDelDia();
    actualizarProgresoDiario();
    actualizarCalendario();
}

// Limpiar formulario de comida
function limpiarFormularioComida() {
    document.getElementById('nombre-comida').value = '';
    const lista = document.getElementById('ingredientes-lista');
    lista.innerHTML = `
        <div class="ingrediente-item">
            <div class="input-group">
                <label>Ingrediente</label>
                <input type="text" class="ingrediente-nombre" placeholder="Ej: Arroz">
            </div>
            <div class="input-group">
                <label>Gramos</label>
                <input type="number" class="ingrediente-gramos" placeholder="100">
            </div>
            <div class="input-group">
                <label>Kcal/100g</label>
                <input type="number" class="ingrediente-calorias" placeholder="130">
            </div>
            <button type="button" class="btn btn-remove" onclick="eliminarIngrediente(this)">❌</button>
        </div>
    `;
    document.getElementById('total-calorias-comida').textContent = '0';
}

// Mostrar comidas del día
function mostrarComidasDelDia() {
    const lista = document.getElementById('lista-comidas-dia');
    const comidasDelDia = comidasData[fechaActual] || [];
    
    if (comidasDelDia.length === 0) {
        lista.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 2rem;">No hay comidas registradas para este día</p>';
        return;
    }
    
    lista.innerHTML = comidasDelDia.map(comida => `
        <div class="comida-item">
            <div class="comida-header">
                <span class="comida-nombre">${comida.nombre}</span>
                <span class="comida-calorias">${comida.totalCalorias} kcal</span>
                <button class="btn btn-remove" onclick="eliminarComida('${fechaActual}', ${comida.id})">🗑️</button>
            </div>
            <div class="ingredientes-lista">
                ${comida.ingredientes.map(ing => 
                    `${ing.nombre}: ${ing.gramos}g (${Math.round(ing.calorias)} kcal)`
                ).join(', ')}
            </div>
        </div>
    `).join('');
}

// Eliminar comida
function eliminarComida(fecha, id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta comida?')) {
        comidasData[fecha] = comidasData[fecha].filter(comida => comida.id !== id);
        if (comidasData[fecha].length === 0) {
            delete comidasData[fecha];
        }
        guardarDatos();
        mostrarComidasDelDia();
        actualizarProgresoDiario();
        actualizarCalendario();
    }
}

// Actualizar progreso diario
function actualizarProgresoDiario() {
    const comidasDelDia = comidasData[fechaActual] || [];
    const caloriasConsumidas = comidasDelDia.reduce((total, comida) => total + comida.totalCalorias, 0);
    const caloriasObjetivo = perfilUsuario.objetivoCalorias || 2000;
    
    const porcentaje = Math.min((caloriasConsumidas / caloriasObjetivo) * 100, 100);
    
    document.getElementById('calorias-consumidas').textContent = caloriasConsumidas;
    document.getElementById('calorias-objetivo').textContent = caloriasObjetivo;
    document.getElementById('barra-progreso').style.width = `${porcentaje}%`;
}

// Variables del calendario
let fechaCalendario = new Date();

// Actualizar calendario
function actualizarCalendario() {
    const año = fechaCalendario.getFullYear();
    const mes = fechaCalendario.getMonth();
    
    // Actualizar título del mes
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    document.getElementById('mes-actual').textContent = `${meses[mes]} ${año}`;
    
    // Crear grid del calendario
    const grid = document.getElementById('calendario-grid');
    grid.innerHTML = '';
    
    // Días de la semana
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    diasSemana.forEach(dia => {
        const elemento = document.createElement('div');
        elemento.className = 'dia-semana';
        elemento.textContent = dia;
        grid.appendChild(elemento);
    });
    
    // Primer día del mes y días en el mes
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    
    // Ajustar el primer día para que lunes sea 0
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
        const dia = ultimoDiaMesAnterior - i;
        const elemento = crearElementoDia(dia, 'otro-mes');
        grid.appendChild(elemento);
    }
    
    // Días del mes actual
    const hoy = new Date();
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const esHoy = hoy.getFullYear() === año && hoy.getMonth() === mes && hoy.getDate() === dia;
        
        let clases = '';
        if (esHoy) clases += ' hoy';
        
        // Verificar si se cumplió el objetivo
        const comidasDelDia = comidasData[fecha] || [];
        const caloriasConsumidas = comidasDelDia.reduce((total, comida) => total + comida.totalCalorias, 0);
        
        if (comidasDelDia.length > 0) {
            // Usar el rango personalizado si está disponible
            const rangoMin = perfilUsuario.rangoMin || (perfilUsuario.objetivoCalorias - 200);
            const rangoMax = perfilUsuario.rangoMax || (perfilUsuario.objetivoCalorias + 200);
            
            if (caloriasConsumidas >= rangoMin && caloriasConsumidas <= rangoMax) {
                clases += ' cumplido';
            } else {
                clases += ' no-cumplido';
            }
        } else if (fecha < new Date().toISOString().split('T')[0]) {
            // Días pasados sin datos
            clases += ' no-cumplido';
        } else {
            clases += ' sin-datos';
        }
        
        const elemento = crearElementoDia(dia, clases, fecha);
        grid.appendChild(elemento);
    }
    
    // Días del mes siguiente
    const diasMostrados = primerDiaSemana + diasEnMes;
    const diasRestantes = 42 - diasMostrados; // 6 semanas × 7 días
    for (let dia = 1; dia <= diasRestantes && diasRestantes < 7; dia++) {
        const elemento = crearElementoDia(dia, 'otro-mes');
        grid.appendChild(elemento);
    }
}

// Crear elemento de día del calendario
function crearElementoDia(dia, clases = '', fecha = null) {
    const elemento = document.createElement('div');
    elemento.className = `dia-calendario ${clases}`;
    elemento.textContent = dia;
    
    if (fecha) {
        elemento.addEventListener('click', () => {
            fechaActual = fecha;
            document.getElementById('fecha-comida').value = fecha;
            cambiarTab('comidas');
        });
    }
    
    return elemento;
}

// Cambiar mes del calendario
function cambiarMes(direccion) {
    fechaCalendario.setMonth(fechaCalendario.getMonth() + direccion);
    actualizarCalendario();
}

// Funciones de utilidad
function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

// PWA: Mostrar botón de instalación
let deferredPrompt;

function mostrarBotonInstalar() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Crear botón de instalación si no existe
        if (!document.getElementById('install-button')) {
            const installButton = document.createElement('button');
            installButton.id = 'install-button';
            installButton.className = 'btn btn-primary install-btn';
            installButton.innerHTML = '📱 Instalar App';
            installButton.addEventListener('click', instalarApp);
            
            // Agregar al header
            const header = document.querySelector('.header');
            header.appendChild(installButton);
        }
    });
}

function instalarApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuario aceptó instalar la app');
                document.getElementById('install-button').style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
}

// Detectar cuando la app está instalada
window.addEventListener('appinstalled', (evt) => {
    console.log('App instalada con éxito');
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Datos de ingredientes comunes (opcional para autocompletado)
const ingredientesComunes = {
    'Arroz': 130,
    'Pollo (pechuga)': 165,
    'Pasta': 131,
    'Pan blanco': 265,
    'Huevo': 155,
    'Leche entera': 42,
    'Yogur natural': 59,
    'Manzana': 52,
    'Plátano': 89,
    'Brócoli': 34,
    'Patata': 77,
    'Salmón': 208,
    'Atún': 144,
    'Queso': 113,
    'Aceite de oliva': 884,
    'Almendras': 579,
    'Avena': 389
};

// Autocompletado de ingredientes (funcionalidad futura)
function setupAutocompletado() {
    // Esta función se puede expandir para agregar autocompletado
    // basado en ingredientesComunes
}
