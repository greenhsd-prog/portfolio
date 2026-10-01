import * as THREE from 'three';

const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. Hero —— Three.js 实时 3D 场景
   线框二十面体 + 外层线框球 + 顶点光点 + 网格地平线
   鼠标视差：相机跟随指针轻微偏移
   滚动联动：往下滚，相机后退下沉，主体缩小
   ============================================================ */
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    console.warn('WebGL 初始化失败，Hero 使用静态背景', err);
    canvas.style.display = 'none';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0.4, 6);

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearAlpha(0);

  const lineMat = (color, opacity) =>
    new THREE.LineBasicMaterial({ color, transparent: true, opacity });

  // 主体：线框二十面体
  const coreGeo = new THREE.IcosahedronGeometry(1.7, 1);
  const core = new THREE.LineSegments(
    new THREE.WireframeGeometry(coreGeo),
    lineMat(0x4da3ff, 0.5)
  );
  scene.add(core);

  // 顶点光点：复用主体的顶点数据
  const dots = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', coreGeo.getAttribute('position')),
    new THREE.PointsMaterial({ color: 0xa8dcff, size: 0.04, transparent: true, opacity: 0.95 })
  );
  scene.add(dots);

  // 外层：低面数线框球，反向缓慢自转
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.7, 0)),
    lineMat(0x2f6fb0, 0.22)
  );
  scene.add(shell);

  // 网格地平线
  const grid = new THREE.GridHelper(44, 44, 0x1f4d7a, 0x142a3f);
  grid.position.y = -2.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.75;
  scene.add(grid);

  // 自适应尺寸 —— 读父容器实际尺寸，避免布局未完成时拿到 0 导致永不渲染
  const host = canvas.parentElement;
  function resize() {
    const rect = host.getBoundingClientRect();
    const w = Math.round(rect.width) || window.innerWidth;
    const h = Math.round(rect.height) || window.innerHeight;
    if (!w || !h) return;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);

  // 指针视差
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 2;
    target.y = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  // 滚动量
  let scrolled = 0;
  addEventListener('scroll', () => { scrolled = window.scrollY; }, { passive: true });

  // 离开视口时暂停渲染，省电
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();

  function draw(t) {
    pointer.x += (target.x - pointer.x) * 0.045;
    pointer.y += (target.y - pointer.y) * 0.045;

    core.rotation.y = t * 0.12;
    core.rotation.x = Math.sin(t * 0.18) * 0.16;
    dots.rotation.copy(core.rotation);

    shell.rotation.y = -t * 0.055;
    shell.rotation.z = t * 0.035;

    const k = Math.min(scrolled / 720, 1);
    camera.position.x = pointer.x * 0.7;
    camera.position.y = 0.4 - pointer.y * 0.32 - k * 1.3;
    camera.position.z = 6 + k * 2.6;
    camera.lookAt(0, 0, 0);

    core.scale.setScalar(1 - k * 0.16);
    dots.scale.setScalar(1 - k * 0.16);
    grid.position.y = -2.5 - k * 0.6;

    renderer.render(scene, camera);
  }

  if (prefersReduced) {
    draw(0); // 静态渲染一帧即可
  } else {
    (function loop() {
      requestAnimationFrame(loop);
      if (visible) draw(clock.getElapsedTime());
    })();
  }
}

/* ============================================================
   2. 案例筛选 —— 按技术栈过滤卡片
   ============================================================ */
function initFilter() {
  const bar = document.querySelector('[data-filter-bar]');
  if (!bar) return;

  const cards = [...document.querySelectorAll('[data-case]')];
  const empty = document.querySelector('[data-empty]');
  const count = document.querySelector('[data-count]');
  const buttons = [...bar.querySelectorAll('[data-filter]')];

  function apply(key) {
    let shown = 0;
    cards.forEach((card) => {
      const stacks = (card.dataset.stack || '').split(/\s+/);
      const hit = key === 'all' || stacks.includes(key);
      card.classList.toggle('is-hidden', !hit);
      if (hit) shown++;
    });
    buttons.forEach((b) => b.classList.toggle('is-on', b.dataset.filter === key));
    if (empty) empty.hidden = shown !== 0;
    if (count) count.textContent = shown;
  }

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (btn) apply(btn.dataset.filter);
  });

  apply('all');
}

/* ============================================================
   3. 卡片 3D 倾斜 —— 指针位置驱动 rotateX/rotateY
   纯 CSS 变量驱动，不写 style 内联样式，性能更好
   ============================================================ */
function initTilt() {
  if (prefersReduced || matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
      card.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ============================================================
   4. 滚动淡入
   ============================================================ */
function initReveal() {
  const els = [...document.querySelectorAll('.reveal')];
  if (!els.length) return;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  els.forEach((el) => io.observe(el));
}

/* ============================================================
   5. 顶栏滚动态
   ============================================================ */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const sync = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  sync();
  addEventListener('scroll', sync, { passive: true });
}

/* ============================================================
   启动
   ============================================================ */
initHero();
initFilter();
initTilt();
initReveal();
initNav();
