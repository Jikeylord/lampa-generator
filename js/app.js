// Глобальные переменные
let scene, camera, renderer, controls, lampMesh;

// Параметры
let params = {
    height: 150,
    radiusBottom: 40,
    radiusTop: 30,
    segments: 32,
    curvature: 10,
    pattern: 'smooth',
    depth: 0.5
};

// Ждём загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Страница загрузилась, начинаю инициализацию...');
    init();
});

function init() {
    try {
        // Проверяем, существует ли контейнер
        const viewport = document.getElementById('viewport');
        if (!viewport) {
            console.error('❌ Не найден div с id="viewport"');
            alert('Ошибка: не найден viewport!');
            return;
        }
        console.log('✅ Viewport найден');

        // Проверяем Three.js
        if (typeof THREE === 'undefined') {
            console.error('❌ Three.js не загружен!');
            alert('Ошибка: Three.js не загрузился!');
            return;
        }
        console.log('✅ Three.js загружен, версия:', THREE.REVISION);

        // Создаём сцену
        scene = new THREE.Scene();
        console.log('✅ Сцена создана');

        // Камера
        const width = viewport.clientWidth;
        const height = viewport.clientHeight;
        console.log('📐 Размер viewport:', width, 'x', height);
        
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(200, 200, 200);
        camera.lookAt(0, 75, 0);
        console.log('✅ Камера создана');

        // Рендерер
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x121212, 1); // Тёмный фон
        viewport.innerHTML = ''; // Очищаем контейнер
        viewport.appendChild(renderer.domElement);
        console.log('✅ Рендерер создан и добавлен в DOM');

        // Контролы
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            console.log('✅ Контролы добавлены');
        } else {
            console.warn('⚠️ OrbitControls не загружен');
        }

        // СВЕТ - очень важно!
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
        light1.position.set(100, 200, 100);
        scene.add(light1);
        
        const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
        light2.position.set(-100, 100, -100);
        scene.add(light2);
        console.log('✅ Свет добавлен');

        // Сетка
        const grid = new THREE.GridHelper(300, 20, 0xff4757, 0x444444);
        scene.add(grid);
        console.log('✅ Сетка добавлена');

        // Привязываем интерфейс
        bindUI();
        console.log('✅ Интерфейс привязан');

        // Создаём первую лампу
        generateLamp();
        console.log('✅ Первая лампа создана');

        // Запускаем анимацию
        animate();
        console.log('🎬 Анимация запущена');
        
    } catch (error) {
        console.error('❌ Критическая ошибка при инициализации:', error);
        alert('Ошибка: ' + error.message);
    }
}

function generateLamp() {
    if (!scene) {
        console.error('❌ Сцена не инициализирована');
        return;
    }

    // Удаляем старую лампу
    if (lampMesh) {
        scene.remove(lampMesh);
        if (lampMesh.geometry) lampMesh.geometry.dispose();
        if (lampMesh.material) lampMesh.material.dispose();
    }

    try {
        // Создаём профиль вазы
        const points = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const y = t * params.height;
            
            let radius;
            if (t < 0.5) {
                radius = params.radiusBottom - (params.radiusBottom - params.curvature) * (t * 2);
            } else {
                radius = params.curvature + (params.radiusTop - params.curvature) * ((t - 0.5) * 2);
            }
            
            if (radius < 1) radius = 1;
            points.push(new THREE.Vector2(radius, y));
        }

        // Создаём геометрию
        const geometry = new THREE.LatheGeometry(points, params.segments);
        
        // Применяем узор если нужно
        if (params.pattern !== 'smooth') {
            applyPattern(geometry);
        }

        // Материал
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4757,
            roughness: 0.4,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        lampMesh = new THREE.Mesh(geometry, material);
        
        // Центрируем
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        lampMesh.position.y = -center.y;
        
        scene.add(lampMesh);
        console.log('✅ Лампа создана и добавлена на сцену');
        
    } catch (error) {
        console.error('❌ Ошибка при создании лампы:', error);
    }
}

function applyPattern(geometry) {
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        const angle = Math.atan2(vertex.z, vertex.x);
        let noise = 0;

        if (params.pattern === 'waves') {
            noise = Math.sin(vertex.y * 0.2) * params.depth;
        } else if (params.pattern === 'twist') {
            noise = Math.sin(angle * 5 + vertex.y * 0.1) * params.depth;
        }

        if (noise !== 0) {
            const r = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
            if (r > 0.1) {
                const ratio = (r + noise) / r;
                vertex.x *= ratio;
                vertex.z *= ratio;
                positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
        }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
}

function bindUI() {
    const inputs = ['height', 'radiusBottom', 'radiusTop', 'segments', 'curvature', 'depth'];
    inputs.forEach(id => {
        const el = document.getElementById('param-' + id);
        const span = document.getElementById('val-' + id);
        if (el && span) {
            el.addEventListener('input', (e) => {
                params[id] = parseFloat(e.target.value);
                span.innerText = e.target.value;
                generateLamp();
            });
        }
    });

    const patternSelect = document.getElementById('param-pattern');
    if (patternSelect) {
        patternSelect.addEventListener('change', (e) => {
            params.pattern = e.target.value;
            generateLamp();
        });
    }

    document.getElementById('btn-random')?.addEventListener('click', () => {
        params.height = 100 + Math.random() * 100;
        params.radiusBottom = 30 + Math.random() * 40;
        params.radiusTop = 20 + Math.random() * 30;
        params.curvature = Math.random() * 40;
        updateUI();
        generateLamp();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
        params = { height: 150, radiusBottom: 40, radiusTop: 30, segments: 32, curvature: 10, pattern: 'smooth', depth: 0.5 };
        updateUI();
        generateLamp();
    });
}

function updateUI() {
    const map = {
        'height': params.height,
        'radiusBottom': params.radiusBottom,
        'radiusTop': params.radiusTop,
        'segments': params.segments,
        'curvature': params.curvature,
        'depth': params.depth
    };
    
    for (let [key, value] of Object.entries(map)) {
        const el = document.getElementById('param-' + key);
        const span = document.getElementById('val-' + key);
        if (el) el.value = value;
        if (span) span.innerText = Math.round(value);
    }
    
    const patternEl = document.getElementById('param-pattern');
    if (patternEl) patternEl.value = params.pattern;
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Ресайз окна
window.addEventListener('resize', () => {
    const viewport = document.getElementById('viewport');
    if (!viewport || !camera || !renderer) return;
    
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});
