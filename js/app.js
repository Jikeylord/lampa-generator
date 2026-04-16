// Инициализация переменных
let scene, camera, renderer, controls, lampMesh;

// Параметры по умолчанию
const params = {
    height: 150,
    radiusBottom: 40,
    radiusTop: 30,
    segments: 32,
    curvature: 10, // Насколько тонкая "талия" у вазы
    pattern: 'smooth',
    depth: 0.5
};

// Запуск при загрузке страницы
window.addEventListener('load', init);
window.addEventListener('resize', onResize);

function init() {
    // 1. Сцена
    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x121212); // Фон задан в CSS, здесь прозрачный

    // 2. Камера
    const viewport = document.getElementById('viewport');
    camera = new THREE.PerspectiveCamera(45, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
    camera.position.set(150, 150, 150);
    camera.lookAt(0, 50, 0);

    // 3. Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    viewport.appendChild(renderer.domElement);

    // 4. Управление мышкой
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 5. Свет (Чтобы вазу было видно!)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);
    
    const dirLight2 = new THREE.DirectionalLight(0xffaa00, 0.3); // Теплый свет сзади
    dirLight2.position.set(-100, 100, -100);
    scene.add(dirLight2);

    // 6. Сетка на полу
    const gridHelper = new THREE.GridHelper(300, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // 7. Привязка интерфейса
    bindUI();

    // 8. Создание первой лампы
    generateLamp();

    // 9. Цикл анимации
    animate();
}

function generateLamp() {
    // Если лампа уже есть, удаляем её
    if (lampMesh) {
        scene.remove(lampMesh);
        lampMesh.geometry.dispose();
        lampMesh.material.dispose();
    }

    // Создаем точки профиля (форму вазы)
    const points = [];
    const steps = 20;
    
    // Рисуем профиль вазы линиями
    for (let i = 0; i <= steps; i++) {
        const t = i / steps; // от 0 до 1
        const y = t * params.height;
        
        // Рассчитываем радиус в зависимости от высоты
        let r;
        if (t < 0.5) {
            // Нижняя часть: от дна до талии
            r = params.radiusBottom - (params.radiusBottom - params.curvature) * (t * 2);
        } else {
            // Верхняя часть: от талии до верха
            r = params.curvature + (params.radiusTop - params.curvature) * ((t - 0.5) * 2);
        }
        
        // Защита от отрицательного радиуса
        if (r < 1) r = 1;
        
        points.push(new THREE.Vector2(r, y));
    }

    // Создаем геометрию вращения (Lathe) - это делает из линий вазу
    const geometry = new THREE.LatheGeometry(points, params.segments);
    
    // Если выбран узор, модифицируем геометрию
    if (params.pattern !== 'smooth') {
        applyPattern(geometry);
    }

    // Материал (Розово-красный, матовый пластик)
    const material = new THREE.MeshStandardMaterial({
        color: 0xff4757,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide // Чтобы было видно и снаружи и внутри
    });

    lampMesh = new THREE.Mesh(geometry, material);
    
    // Центрируем вазу по центру сцены
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    box.getCenter(center);
    lampMesh.position.y = -center.y; // Сдвигаем вниз, чтобы стояла на сетке
    
    scene.add(lampMesh);
    document.getElementById('status-text').innerText = 'Генерация завершена';
}

// Функция для создания узоров (Волны, Спирали и т.д.)
function applyPattern(geometry) {
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);

        const angle = Math.atan2(vertex.z, vertex.x);
        const y = vertex.y;
        let noise = 0;

        if (params.pattern === 'waves') {
            noise = Math.sin(y * 0.2) * params.depth;
        } else if (params.pattern === 'twist') {
            noise = Math.sin(angle * 5 + y * 0.1) * params.depth;
        } else if (params.pattern === 'hex') {
            noise = (Math.sin(angle * 6) + Math.cos(y * 0.3)) * params.depth * 0.5;
        }

        // Применяем искажение к радиусу
        if (noise !== 0) {
            const currentRadius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
            const newRadius = currentRadius + noise;
            const ratio = newRadius / currentRadius;
            
            vertex.x *= ratio;
            vertex.z *= ratio;
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals(); // Пересчитываем нормали для правильного света
}

// Привязка ползунков и кнопок
function bindUI() {
    const inputs = ['height', 'radiusBottom', 'radiusTop', 'segments', 'curvature', 'depth'];
    inputs.forEach(id => {
        const el = document.getElementById('param-' + id);
        const span = document.getElementById('val-' + id);
        el.addEventListener('input', (e) => {
            params[id] = parseFloat(e.target.value);
            span.innerText = e.target.value;
            generateLamp();
        });
    });

    document.getElementById('param-pattern').addEventListener('change', (e) => {
        params.pattern = e.target.value;
        generateLamp();
    });

    // Кнопка Рандом
    document.getElementById('btn-random').addEventListener('click', () => {
        params.height = 100 + Math.random() * 100;
        params.radiusBottom = 30 + Math.random() * 40;
        params.radiusTop = 20 + Math.random() * 30;
        params.curvature = Math.random() * 40;
        params.pattern = ['smooth', 'waves', 'twist', 'hex'][Math.floor(Math.random()*4)];
        updateUI();
        generateLamp();
    });

    // Кнопка Сброс
    document.getElementById('btn-reset').addEventListener('click', () => {
        params.height = 150; params.radiusBottom = 40; params.radiusTop = 30; 
        params.segments = 32; params.curvature = 10; params.pattern = 'smooth';
        updateUI();
        generateLamp();
    });
    
    // Экспорт в STL (3D печать)
    document.getElementById('btn-export').addEventListener('click', () => {
        if(!lampMesh) return;
        const exporter = new THREE.STLExporter();
        const result = exporter.parse(lampMesh);
        const blob = new Blob([result], { type: 'application/sla' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'lamp.stl';
        link.click();
    });
}

function updateUI() {
    document.getElementById('param-height').value = params.height;
    document.getElementById('val-height').innerText = params.height;
    document.getElementById('param-radius-bottom').value = params.radiusBottom;
    document.getElementById('val-radius-bottom').innerText = params.radiusBottom;
    document.getElementById('param-radius-top').value = params.radiusTop;
    document.getElementById('val-radius-top').innerText = params.radiusTop;
    document.getElementById('param-segments').value = params.segments;
    document.getElementById('val-segments').innerText = params.segments;
    document.getElementById('param-curvature').value = params.curvature;
    document.getElementById('val-curvature').innerText = params.curvature;
    document.getElementById('param-depth').value = params.depth;
    document.getElementById('val-depth').innerText = params.depth;
    document.getElementById('param-pattern').value = params.pattern;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onResize() {
    const viewport = document.getElementById('viewport');
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
}
