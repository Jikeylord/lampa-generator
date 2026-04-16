// 🎯 Lamp Generator 3D — ИСПРАВЛЕННАЯ ВЕРСИЯ 2.0
let scene, camera, renderer, controls, lampMesh;

// Параметры по умолчанию
const params = {
    height: 150,
    radiusBottom: 40,
    radiusTop: 30,
    segments: 32,
    curvature: 20, // Минимум 20 чтобы было дно
    pattern: 'smooth',
    depth: 0.5
};

// Маппинг ID
const ID_MAP = {
    height: { input: 'param-height', val: 'val-height' },
    radiusBottom: { input: 'param-radius-bottom', val: 'val-radius-bottom' },
    radiusTop: { input: 'param-radius-top', val: 'val-radius-top' },
    segments: { input: 'param-segments', val: 'val-segments' },
    curvature: { input: 'param-curvature', val: 'val-curvature' },
    depth: { input: 'param-depth', val: 'val-depth' }
};

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', onResize);

function init() {
    console.log('🚀 Lamp Generator starting...');
    
    const viewport = document.getElementById('viewport');
    if (!viewport) { console.error('❌ viewport not found'); return; }
    if (typeof THREE === 'undefined') { console.error('❌ THREE not loaded'); return; }
    
    // Сцена
    scene = new THREE.Scene();
    
    // Камера
    camera = new THREE.PerspectiveCamera(45, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
    camera.position.set(200, 150, 200);
    camera.lookAt(0, 75, 0);
    
    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.setClearColor(0x121212, 1);
    viewport.innerHTML = '';
    viewport.appendChild(renderer.domElement);
    
    // Контролы
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Свет
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
    light1.position.set(100, 200, 100);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-100, 100, -100);
    scene.add(light2);
    
    // Сетка
    scene.add(new THREE.GridHelper(300, 20, 0xff4757, 0x444444));
    
    // Интерфейс
    bindUI();
    
    // Генерация
    generateLamp();
    
    // Анимация
    animate();
    console.log('✅ Ready!');
}

function generateLamp() {
    if (lampMesh) {
        scene.remove(lampMesh);
        lampMesh.geometry?.dispose();
        lampMesh.material?.dispose();
    }
    
    // Создаём профиль вазы С ДНОМ
    const points = [];
    const steps = 30;
    
    // Минимальный радиус в центре (талия) - не меньше 10
    const minRadius = Math.max(10, params.curvature);
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps; // 0 to 1
        const y = t * params.height;
        
        // Используем плавную кривую (синусоида) для естественной формы
        // Начинаем с radiusBottom, проходим через minRadius, заканчиваем radiusTop
        let r;
        
        if (t < 0.5) {
            // Нижняя половина: от дна до талии
            const localT = t * 2; // 0 to 1
            r = params.radiusBottom + (minRadius - params.radiusBottom) * localT;
        } else {
            // Верхняя половина: от талии до верха
            const localT = (t - 0.5) * 2; // 0 to 1
            r = minRadius + (params.radiusTop - minRadius) * localT;
        }
        
        // Гарантируем минимальный радиус 5
        r = Math.max(5, r);
        points.push(new THREE.Vector2(r, y));
    }
    
    // Добавляем дно (замыкаем внизу)
    points.unshift(new THREE.Vector2(0, 0));
    
    const geometry = new THREE.LatheGeometry(points, params.segments);
    
    if (params.pattern !== 'smooth') applyPattern(geometry);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0xff4757,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    lampMesh = new THREE.Mesh(geometry, material);
    
    // Центрирование
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    lampMesh.position.y = -center.y;
    
    scene.add(lampMesh);
    console.log('🔄 Lamp regenerated');
}

function applyPattern(geometry) {
    const pos = geometry.attributes.position;
    const v = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const angle = Math.atan2(v.z, v.x);
        let noise = 0;
        
        if (params.pattern === 'waves') {
            noise = Math.sin(v.y * 0.2) * params.depth;
        } else if (params.pattern === 'twist') {
            noise = Math.sin(angle * 5 + v.y * 0.1) * params.depth;
        } else if (params.pattern === 'hex') {
            noise = (Math.sin(angle * 6) + Math.cos(v.y * 0.3)) * params.depth * 0.5;
        }
        
        if (noise !== 0) {
            const r = Math.sqrt(v.x*v.x + v.z*v.z);
            if (r > 0.1) {
                const ratio = (r + noise) / r;
                v.x *= ratio;
                v.z *= ratio;
                pos.setXYZ(i, v.x, v.y, v.z);
            }
        }
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
}

function bindUI() {
    console.log('🔧 Binding UI...');
    
    // Привязка ВСЕХ ползунков
    for (const [key, ids] of Object.entries(ID_MAP)) {
        const input = document.getElementById(ids.input);
        const span = document.getElementById(ids.val);
        
        if (input) {
            console.log(`✅ Bound: ${key} -> ${ids.input}`);
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                params[key] = val;
                if (span) span.innerText = val;
                generateLamp();
            });
        } else {
            console.error(`❌ Not found: ${ids.input}`);
        }
    }
    
    // Select узора
    const patternSel = document.getElementById('param-pattern');
    if (patternSel) {
        patternSel.addEventListener('change', (e) => {
            params.pattern = e.target.value;
            generateLamp();
        });
    }
    
    // Кнопка Рандом
    const btnRandom = document.getElementById('btn-random');
    if (btnRandom) {
        btnRandom.addEventListener('click', () => {
            params.height = 100 + Math.random() * 100;
            params.radiusBottom = 30 + Math.random() * 40;
            params.radiusTop = 20 + Math.random() * 30;
            params.curvature = 15 + Math.random() * 30;
            params.pattern = ['smooth','waves','twist','hex'][Math.floor(Math.random()*4)];
            updateUI();
            generateLamp();
        });
    }
    
    // Кнопка Сброс
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            Object.assign(params, {
                height: 150, radiusBottom: 40, radiusTop: 30,
                segments: 32, curvature: 20, pattern: 'smooth', depth: 0.5
            });
            updateUI();
            generateLamp();
        });
    }
    
    // Экспорт STL
    const btnExport = document.getElementById('btn-export');
    if (btnExport && typeof THREE.STLExporter !== 'undefined') {
        btnExport.addEventListener('click', () => {
            if (!lampMesh) return;
            const exporter = new THREE.STLExporter();
            const stl = exporter.parse(lampMesh);
            const blob = new Blob([stl], { type: 'application/sla' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'lamp.stl';
            link.click();
        });
    }
    
    console.log('✅ UI bound');
}

function updateUI() {
    for (const [key, ids] of Object.entries(ID_MAP)) {
        const input = document.getElementById(ids.input);
        const span = document.getElementById(ids.val);
        if (input) {
            input.value = params[key];
            // Триггерим событие input чтобы обновить span
            input.dispatchEvent(new Event('input'));
        }
    }
    const patternSel = document.getElementById('param-pattern');
    if (patternSel) patternSel.value = params.pattern;
}

function animate() {
    requestAnimationFrame(animate);
    controls?.update();
    renderer?.render(scene, camera);
}

function onResize() {
    const viewport = document.getElementById('viewport');
    if (!viewport || !camera || !renderer) return;
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
}
