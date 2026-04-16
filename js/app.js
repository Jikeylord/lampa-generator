/**
 * 🔧 Lamp Generator 3D
 * Параметрический генератор 3D-моделей ламп с экспортом в STL
 * Технологии: Three.js, OrbitControls, STLExporter
 * 
 * @version 1.0
 * @author Generated for GitHub Pages deployment
 */

(function() {
    'use strict';

    // ========================================
    // КОНФИГУРАЦИЯ И СОСТОЯНИЕ
    // ========================================
    
    const CONFIG = {
        colors: {
            background: 0x1a1a2e,
            grid: 0x444466,
            lamp: 0xe94560,
            lampWireframe: 0xffffff,
            light: 0xffeecc
        },
        camera: {
            fov: 45,
            near: 0.1,
            far: 1000,
            position: { x: 200, y: 150, z: 200 }
        },
        lighting: {
            ambient: 0.4,
            directional: 0.8
        },
        generation: {
            debounceMs: 150,
            maxFaces: 50000
        }
    };

    const DEFAULT_PARAMS = {
        // Форма
        height: 120,
        radiusBottom: 45,
        radiusTop: 35,
        segments: 24,
        wallThickness: 1.5,
        curvature: 0,
        // Узор
        patternType: 'solid',
        cellSize: 8,
        cutDepth: 0.8,
        spiralTurns: 5,
        // База
        innerRelief: 'none',
        baseType: 'flat',
        baseRadius: 50,
        baseHeight: 8,
        ledHole: 20,
        topLid: false,
        lidRadius: 30
    };

    const PRESETS = {
        classic: {
            height: 120, radiusBottom: 45, radiusTop: 35, segments: 24,
            wallThickness: 1.5, curvature: 0, patternType: 'solid',
            cellSize: 8, cutDepth: 0.8, baseType: 'flat', baseRadius: 50
        },
        spiral: {
            height: 140, radiusBottom: 40, radiusTop: 30, segments: 32,
            wallThickness: 1.2, curvature: 0.5, patternType: 'spiral',
            cellSize: 6, cutDepth: 1.0, spiralTurns: 8, baseType: 'rounded'
        },
        voronoi: {
            height: 100, radiusBottom: 50, radiusTop: 40, segments: 20,
            wallThickness: 2.0, curvature: -0.3, patternType: 'voronoi',
            cellSize: 12, cutDepth: 1.2, baseType: 'expanded'
        },
        geometry: {
            height: 130, radiusBottom: 42, radiusTop: 28, segments: 8,
            wallThickness: 1.8, curvature: 0, patternType: 'diamonds',
            cellSize: 10, cutDepth: 0.9, baseType: 'ring'
        },
        flower: {
            height: 110, radiusBottom: 48, radiusTop: 38, segments: 30,
            wallThickness: 1.3, curvature: 0.8, patternType: 'circles',
            cellSize: 7, cutDepth: 0.7, baseType: 'rounded', topLid: true
        },
        modern: {
            height: 150, radiusBottom: 35, radiusTop: 35, segments: 16,
            wallThickness: 1.0, curvature: 0, patternType: 'hexagons',
            cellSize: 9, cutDepth: 0.6, baseType: 'flat', ledHole: 25
        },
        tube: {
            height: 180, radiusBottom: 30, radiusTop: 30, segments: 32,
            wallThickness: 0.8, curvature: 0, patternType: 'waves',
            cellSize: 5, cutDepth: 0.5, baseType: 'ring', baseRadius: 45
        },
        lantern: {
            height: 90, radiusBottom: 55, radiusTop: 50, segments: 12,
            wallThickness: 2.5, curvature: -0.5, patternType: 'stars',
            cellSize: 15, cutDepth: 1.5, baseType: 'expanded', topLid: true
        }
    };

    let params = { ...DEFAULT_PARAMS };
    let lampMesh = null;
    let gridHelper = null;

    // Three.js компоненты
    let scene, camera, renderer, controls;

    // DOM элементы
    const dom = {};

    // Таймер для дебунса генерации
    let generationTimer = null;

    // ========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ========================================

    function init() {
        cacheDOM();
        bindEvents();
        initThreeJS();
        updateUIFromParams();
        generateLamp();
        animate();
        console.log('✅ Lamp Generator initialized');
    }

    function cacheDOM() {
        // Кнопки действий
        dom.btnRandom = document.getElementById('btn-random');
        dom.btnReset = document.getElementById('btn-reset');
        dom.btnExport = document.getElementById('btn-export');
        dom.loading = document.getElementById('loading-indicator');
        
        // Пресеты
        dom.presetBtns = document.querySelectorAll('.preset-btn');
        
        // Параметры - форма
        dom.paramHeight = document.getElementById('param-height');
        dom.paramRadiusBottom = document.getElementById('param-radius-bottom');
        dom.paramRadiusTop = document.getElementById('param-radius-top');
        dom.paramSegments = document.getElementById('param-segments');
        dom.paramWallThickness = document.getElementById('param-wall-thickness');
        dom.paramCurvature = document.getElementById('param-curvature');
        
        // Параметры - узор
        dom.paramPatternType = document.getElementById('param-pattern-type');
        dom.paramCellSize = document.getElementById('param-cell-size');
        dom.paramCutDepth = document.getElementById('param-cut-depth');
        dom.paramSpiralTurns = document.getElementById('param-spiral-turns');
        dom.labelSpiralTurns = document.getElementById('label-spiral-turns');
        
        // Параметры - база
        dom.paramInnerRelief = document.getElementById('param-inner-relief');
        dom.paramBaseType = document.getElementById('param-base-type');
        dom.paramBaseRadius = document.getElementById('param-base-radius');
        dom.paramBaseHeight = document.getElementById('param-base-height');
        dom.paramLedHole = document.getElementById('param-led-hole');
        dom.paramTopLid = document.getElementById('param-top-lid');
        dom.paramLidRadius = document.getElementById('param-lid-radius');
        dom.labelLidRadius = document.getElementById('label-lid-radius');
        
        // Значения для отображения
        dom.vals = {
            height: document.getElementById('val-height'),
            radiusBottom: document.getElementById('val-radius-bottom'),
            radiusTop: document.getElementById('val-radius-top'),
            segments: document.getElementById('val-segments'),
            wallThickness: document.getElementById('val-wall-thickness'),
            curvature: document.getElementById('val-curvature'),
            cellSize: document.getElementById('val-cell-size'),
            cutDepth: document.getElementById('val-cut-depth'),
            spiralTurns: document.getElementById('val-spiral-turns'),
            baseRadius: document.getElementById('val-base-radius'),
            baseHeight: document.getElementById('val-base-height'),
            ledHole: document.getElementById('val-led-hole'),
            lidRadius: document.getElementById('val-lid-radius')
        };
        
        // Инфо
        dom.infoFaces = document.getElementById('info-faces');
        dom.infoVolume = document.getElementById('info-volume');
    }

    function bindEvents() {
        // Кнопки действий
        dom.btnRandom.addEventListener('click', applyRandomParams);
        dom.btnReset.addEventListener('click', resetToDefaults);
        dom.btnExport.addEventListener('click', exportSTL);
        
        // Пресеты
        dom.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
        });
        
        // Параметры - форма
        bindRangeParam(dom.paramHeight, 'height');
        bindRangeParam(dom.paramRadiusBottom, 'radiusBottom');
        bindRangeParam(dom.paramRadiusTop, 'radiusTop');
        bindRangeParam(dom.paramSegments, 'segments');
        bindRangeParam(dom.paramWallThickness, 'wallThickness');
        bindRangeParam(dom.paramCurvature, 'curvature');
        
        // Параметры - узор
        dom.paramPatternType.addEventListener('change', (e) => {
            params.patternType = e.target.value;
            togglePatternSpecificControls();
            scheduleRegeneration();
        });
        bindRangeParam(dom.paramCellSize, 'cellSize');
        bindRangeParam(dom.paramCutDepth, 'cutDepth');
        bindRangeParam(dom.paramSpiralTurns, 'spiralTurns');
        
        // Параметры - база
        dom.paramInnerRelief.addEventListener('change', (e) => {
            params.innerRelief = e.target.value;
            scheduleRegeneration();
        });
        dom.paramBaseType.addEventListener('change', (e) => {
            params.baseType = e.target.value;
            scheduleRegeneration();
        });
        bindRangeParam(dom.paramBaseRadius, 'baseRadius');
        bindRangeParam(dom.paramBaseHeight, 'baseHeight');
        bindRangeParam(dom.paramLedHole, 'ledHole');
        dom.paramTopLid.addEventListener('change', (e) => {
            params.topLid = e.target.checked;
            dom.labelLidRadius.classList.toggle('visible', params.topLid);
            scheduleRegeneration();
        });
        bindRangeParam(dom.paramLidRadius, 'lidRadius');
        
        // Условная видимость контролов
        togglePatternSpecificControls();
        dom.labelLidRadius.classList.toggle('visible', params.topLid);
    }

    function bindRangeParam(input, paramKey) {
        const update = () => {
            const val = input.type === 'range' ? 
                (input.step && parseFloat(input.step) ? parseFloat(input.value) : parseInt(input.value)) : 
                input.checked;
            params[paramKey] = val;
            if (dom.vals[paramKey]) {
                dom.vals[paramKey].textContent = val;
            }
            scheduleRegeneration();
        };
        input.addEventListener('input', update);
        update();
    }

    function togglePatternSpecificControls() {
        const showSpiral = params.patternType === 'spiral';
        dom.labelSpiralTurns.classList.toggle('visible', showSpiral);
    }

    // ========================================
    // THREE.JS НАСТРОЙКА
    // ========================================

    function initThreeJS() {
        const container = document.getElementById('viewport');
        
        // Сцена
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.colors.background);
        
        // Камера
        camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            container.clientWidth / container.clientHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        camera.position.set(
            CONFIG.camera.position.x,
            CONFIG.camera.position.y,
            CONFIG.camera.position.z
        );
        
        // Рендерер
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        
        // Контролы
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 100;
        controls.maxDistance = 500;
        
        // Свет
        const ambientLight = new THREE.AmbientLight(
            CONFIG.colors.light, 
            CONFIG.lighting.ambient
        );
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(
            CONFIG.colors.light, 
            CONFIG.lighting.directional
        );
        dirLight.position.set(100, 200, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        scene.add(dirLight);
        
        // Сетка
        gridHelper = new THREE.GridHelper(300, 30, CONFIG.colors.grid, CONFIG.colors.grid);
        gridHelper.position.y = -1;
        scene.add(gridHelper);
        
        // Осевые помощники (опционально, для отладки)
        // const axesHelper = new THREE.AxesHelper(50);
        // scene.add(axesHelper);
        
        // Обработчик ресайза
        window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
        const container = document.getElementById('viewport');
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    // ========================================
    // ГЕНЕРАЦИЯ ЛАМПЫ
    // ========================================

    function scheduleRegeneration() {
        clearTimeout(generationTimer);
        dom.loading.classList.remove('hidden');
        generationTimer = setTimeout(() => {
            generateLamp();
        }, CONFIG.generation.debounceMs);
    }

    function generateLamp() {
        // Удаляем старую модель
        if (lampMesh) {
            scene.remove(lampMesh);
            if (lampMesh.geometry) lampMesh.geometry.dispose();
            if (lampMesh.material) lampMesh.material.dispose();
        }
        
        try {
            // Создаём геометрию
            const geometry = createLampGeometry(params);
            
            // Материал
            const material = new THREE.MeshStandardMaterial({
                color: CONFIG.colors.lamp,
                metalness: 0.3,
                roughness: 0.4,
                side: THREE.DoubleSide,
                wireframe: false
            });
            
            // Меш
            lampMesh = new THREE.Mesh(geometry, material);
            lampMesh.castShadow = true;
            lampMesh.receiveShadow = true;
            
            // Центрируем
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            lampMesh.position.y = -center.y;
            
            scene.add(lampMesh);
            
            // Обновляем инфо
            updateInfo(geometry);
            
            console.log('✅ Lamp generated:', {
                faces: Math.floor(geometry.attributes.position.count / 3),
                vertices: geometry.attributes.position.count
            });
            
        } catch (error) {
            console.error('❌ Generation error:', error);
            alert('Ошибка генерации: ' + error.message);
        } finally {
            dom.loading.classList.add('hidden');
        }
    }

    function createLampGeometry(p) {
        const shape = new THREE.Shape();
        const points = [];
        
        // Профиль корпуса с учётом изгиба
        const segments = Math.max(6, p.segments);
        const heightSteps = 20;
        
        for (let i = 0; i <= heightSteps; i++) {
            const t = i / heightSteps;
            const radius = lerp(p.radiusBottom, p.radiusTop, t);
            const curvatureOffset = p.curvature * Math.sin(t * Math.PI) * p.height * 0.1;
            const y = t * p.height;
            const x = radius + curvatureOffset;
            points.push(new THREE.Vector2(x, y));
        }
        
        // Создаём геометрию вращения (латхе)
        const latheGeometry = new THREE.LatheGeometry(
            points, 
            segments, 
            0, 
            Math.PI * 2
        );
        
        // Применяем узор (упрощённая реализация через модификацию вершин)
        applyPatternToGeometry(latheGeometry, p);
        
        // Добавляем толщину стенки (простой подход: дублируем и масштабируем)
        if (p.wallThickness > 0) {
            const innerGeometry = latheGeometry.clone();
            const scale = 1 - p.wallThickness / Math.max(p.radiusBottom, p.radiusTop);
            innerGeometry.scale(scale, 1, scale);
            innerGeometry.translate(0, 0, 0);
            
            // Объединяем (упрощённо - просто добавляем как отдельный меш для визуализации)
            // Для реального булева объединения нужна библиотека типа three-bvh-csg
        }
        
        // Добавляем базу
        const baseGeometry = createBaseGeometry(p);
        if (baseGeometry) {
            const merged = mergeGeometries([latheGeometry, baseGeometry]);
            return merged;
        }
        
        return latheGeometry;
    }

    function applyPatternToGeometry(geometry, p) {
        const positions = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);
            
            // Простая процедурная модификация на основе паттерна
            const angle = Math.atan2(vertex.z, vertex.x);
            const height = vertex.y;
            let offset = 0;
            
            switch (p.patternType) {
                case 'spiral':
                    offset = Math.sin(angle * p.spiralTurns + height * 0.1) * p.cutDepth;
                    break;
                case 'hexagons':
                case 'diamonds':
                    const cellAngle = (2 * Math.PI) / p.cellSize;
                    offset = Math.sin(angle / cellAngle * 3) * 
                            Math.sin(height / p.cellSize * 3) * p.cutDepth;
                    break;
                case 'circles':
                    offset = Math.sin(angle * 5) * Math.sin(height * 0.15) * p.cutDepth;
                    break;
                case 'waves':
                    offset = Math.sin(height * 0.2) * Math.cos(angle * 3) * p.cutDepth;
                    break;
                case 'stars':
                    const starFactor = Math.abs(Math.sin(angle * 6)) * 1.5;
                    offset = (starFactor - 0.5) * p.cutDepth;
                    break;
                case 'voronoi':
                    // Упрощённый "вороной" через шум
                    const noise = Math.sin(angle * 7 + height * 0.1) * 
                                 Math.cos(angle * 3 - height * 0.15);
                    offset = noise * p.cutDepth;
                    break;
                case 'solid':
                default:
                    offset = 0;
            }
            
            // Применяем смещение по нормали (упрощённо - по радиусу)
            if (offset !== 0) {
                const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
                if (radius > 0) {
                    const factor = 1 + offset / radius;
                    vertex.x *= factor;
                    vertex.z *= factor;
                    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
            }
        }
        
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    function createBaseGeometry(p) {
        switch (p.baseType) {
            case 'flat':
                return new THREE.CylinderGeometry(
                    p.baseRadius, p.baseRadius, p.baseHeight, p.segments
                );
            case 'rounded':
                return new THREE.SphereGeometry(p.baseRadius * 0.6, p.segments, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            case 'expanded':
                return new THREE.CylinderGeometry(
                    p.baseRadius * 1.3, p.baseRadius, p.baseHeight, p.segments
                );
            case 'ring':
                return new THREE.RingGeometry(
                    p.baseRadius * 0.5, p.baseRadius, p.segments
                ).rotateX(-Math.PI / 2);
            default:
                return null;
        }
    }

    function mergeGeometries(geometries) {
        // Простое объединение через BufferGeometryUtils (если доступен)
        // Или создаём новый геометрию вручную
        const merged = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        
        geometries.forEach(geo => {
            const pos = geo.attributes.position;
            const norm = geo.attributes.normal;
            for (let i = 0; i < pos.count; i++) {
                positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
                if (norm) {
                    normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
                }
            }
        });
        
        merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        if (normals.length > 0) {
            merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        }
        merged.computeVertexNormals();
        return merged;
    }

    function updateInfo(geometry) {
        // Подсчёт граней
        const faceCount = Math.floor(geometry.attributes.position.count / 3);
        dom.infoFaces.textContent = '~' + faceCount.toLocaleString();
        
        // Приблизительный объём (через bounding box)
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const volume = size.x * size.y * size.z * 0.5; // грубая оценка
        dom.infoVolume.textContent = (volume / 1000).toFixed(1);
    }

    // ========================================
    // УПРАВЛЕНИЕ ПАРАМЕТРАМИ
    // ========================================

    function updateUIFromParams() {
        Object.entries(params).forEach(([key, value]) => {
            const input = dom['param' + capitalize(key)];
            const valSpan = dom.vals[key];
            if (!input) return;
            
            if (input.type === 'checkbox') {
                input.checked = value;
            } else if (input.tagName === 'SELECT') {
                input.value = value;
            } else {
                input.value = value;
                if (valSpan) valSpan.textContent = value;
            }
        });
    }

    function applyPreset(presetName) {
        const preset = PRESETS[presetName];
        if (!preset) return;
        
        // Обновляем активную кнопку
        dom.presetBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-preset="${presetName}"]`)?.classList.add('active');
        
        // Применяем параметры
        Object.assign(params, DEFAULT_PARAMS, preset);
        updateUIFromParams();
        togglePatternSpecificControls();
        generateLamp();
    }

    function applyRandomParams() {
        params.height = rand(60, 200);
        params.radiusBottom = rand(25, 70);
        params.radiusTop = rand(15, params.radiusBottom - 5);
        params.segments = rand(8, 48, true);
        params.wallThickness = rand(0.8, 3.0, false, 0.1);
        params.curvature = rand(-1, 1, false, 0.1);
        params.patternType = Object.keys(PRESETS)[rand(0, 7, true)];
        params.cellSize = rand(3, 20, true);
        params.cutDepth = rand(0.3, 1.5, false, 0.1);
        params.spiralTurns = rand(2, 12, true);
        params.baseType = ['flat','rounded','expanded','ring'][rand(0,3,true)];
        params.baseRadius = rand(35, 80);
        params.baseHeight = rand(4, 15, true);
        params.ledHole = rand(10, 35, true);
        params.topLid = Math.random() > 0.7;
        params.lidRadius = rand(20, 50);
        
        updateUIFromParams();
        togglePatternSpecificControls();
        generateLamp();
    }

    function resetToDefaults() {
        params = { ...DEFAULT_PARAMS };
        updateUIFromParams();
        dom.presetBtns.forEach(btn => btn.classList.remove('active'));
        togglePatternSpecificControls();
        generateLamp();
    }

    // ========================================
    // ЭКСПОРТ STL
    // ========================================

    function exportSTL() {
        if (!lampMesh) {
            alert('Сначала сгенерируйте модель!');
            return;
        }
        
        try {
            dom.loading.classList.remove('hidden');
            dom.loading.textContent = '⏳ Экспорт...';
            
            const exporter = new THREE.STLExporter();
            const stlData = exporter.parse(lampMesh, { binary: true });
            
            const blob = new Blob([stlData], { type: 'application/sla' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lamp-${Date.now()}.stl`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ STL exported');
        } catch (error) {
            console.error('❌ Export error:', error);
            alert('Ошибка экспорта: ' + error.message);
        } finally {
            dom.loading.classList.add('hidden');
            dom.loading.textContent = '⏳ Генерация...';
        }
    }

    // ========================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ========================================

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    function rand(min, max, int = false, step = 1) {
        const val = min + Math.random() * (max - min);
        if (int) return Math.round(val / step) * step;
        return Math.round(val / step) * step;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ========================================
    // ЗАПУСК
    // ========================================

    // Ждём загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
