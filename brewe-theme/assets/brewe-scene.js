// BREWÉ — procedural 3D hero: espresso cup, crema, steam and floating beans.
// Everything is generated in code, so the theme ships no 3D model files.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const COLORS = {
  espresso: 0x171513,
  cream: 0xf3ede2,
  brown: 0x6b4632,
  gold: 0xb8945a,
  offwhite: 0xfaf8f3,
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

// ---------- geometry builders ----------

function buildCup() {
  const group = new THREE.Group();

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: COLORS.cream,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.55,
  });
  const saucerMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f0d0c,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 0.28,
  });
  const inner = new THREE.MeshPhysicalMaterial({
    color: COLORS.offwhite,
    roughness: 0.35,
    clearcoat: 0.6,
    envMapIntensity: 0.4,
    side: THREE.BackSide,
  });
  const gold = new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 1, roughness: 0.22 });

  // Cup body: tulip-shaped espresso cup profile, revolved.
  const profile = [
    [0.0, 0.0], [0.42, 0.0], [0.5, 0.04], [0.56, 0.18], [0.66, 0.5],
    [0.76, 0.86], [0.82, 1.12], [0.84, 1.2],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 96);
  const body = new THREE.Mesh(bodyGeo, ceramic);
  group.add(body);

  const innerProfile = profile.slice(1).map((v) => new THREE.Vector2(Math.max(v.x - 0.05, 0.001), v.y + 0.06));
  const innerMesh = new THREE.Mesh(new THREE.LatheGeometry(innerProfile, 96), inner);
  group.add(innerMesh);

  // Gold rim.
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.815, 0.028, 24, 128), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.2;
  group.add(rim);

  // Thin gold band near the foot.
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.535, 0.012, 16, 128), gold);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.16;
  group.add(band);

  // Handle: partial torus.
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 24, 64, Math.PI * 1.25), ceramic);
  handle.position.set(0.82, 0.66, 0);
  handle.rotation.z = -Math.PI * 0.62;
  group.add(handle);

  // Espresso surface with crema swirl (canvas texture).
  const crema = new THREE.Mesh(
    new THREE.CircleGeometry(0.77, 96),
    new THREE.MeshPhysicalMaterial({
      map: cremaTexture(),
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    }),
  );
  crema.rotation.x = -Math.PI / 2;
  crema.position.y = 1.08;
  group.add(crema);
  group.userData.crema = crema;

  // Saucer.
  const saucerProfile = [
    [0.0, -0.08], [1.25, -0.08], [1.42, 0.02], [1.48, 0.06], [1.42, 0.05],
    [1.2, -0.02], [0.6, -0.02], [0.0, -0.02],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerProfile, 128), saucerMat);
  group.add(saucer);
  const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.465, 0.018, 16, 160), gold);
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.position.y = 0.055;
  group.add(saucerRim);

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

function cremaTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#c99a64');
  grad.addColorStop(0.55, '#a36c3e');
  grad.addColorStop(0.85, '#6b4632');
  grad.addColorStop(1, '#3a2418');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);

  // Latte-art style rosetta swirl.
  g.translate(size / 2, size / 2);
  g.strokeStyle = 'rgba(243, 237, 226, 0.55)';
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const r = 40 + i * 24;
    g.lineWidth = 9 - i * 0.8;
    g.beginPath();
    g.ellipse(0, -i * 10 + 30, r, r * 0.55, 0, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();
  }
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(0, -170);
  g.lineTo(0, 140);
  g.stroke();

  // Fine crema speckle.
  for (let i = 0; i < 1400; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * size * 0.48;
    g.fillStyle = `rgba(${200 + Math.random() * 40}, ${150 + Math.random() * 40}, 100, ${Math.random() * 0.18})`;
    g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildBeanGeometry() {
  // Elongated ellipsoid with a crease pressed into its flat side.
  const geo = new THREE.SphereGeometry(1, 32, 24);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x *= 0.72;
    v.y *= 1.0;
    v.z *= 0.5;
    if (v.z > 0) {
      v.z *= 0.75; // flatter front side
      const crease = Math.exp(-(v.x * v.x) / 0.008) * 0.16;
      v.z -= crease * (1 - Math.abs(v.y) * 0.6);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildBeans(count) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: COLORS.brown,
    roughness: 0.42,
    clearcoat: 0.7,
    clearcoatRoughness: 0.3,
    sheen: 0.4,
    sheenColor: new THREE.Color(COLORS.gold),
  });
  const mesh = new THREE.InstancedMesh(buildBeanGeometry(), mat, count);
  mesh.castShadow = true;

  const beans = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.2 + Math.random() * 3.8;
    beans.push({
      base: new THREE.Vector3(Math.cos(angle) * radius, (Math.random() - 0.3) * 5, Math.sin(angle) * radius - 1.5),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4),
      scale: 0.09 + Math.random() * 0.09,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      depth: 0.4 + Math.random() * 1.2, // scroll parallax strength
    });
  }
  mesh.userData.beans = beans;
  return mesh;
}

function buildSteam(count) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random();
    positions[i * 3] = (Math.random() - 0.5) * 0.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(COLORS.cream) },
      uStrength: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        float life = fract(seed + uTime * (0.08 + seed * 0.05));
        vec3 p = position;
        p.y = 1.15 + life * 2.4;
        float sway = sin(life * 6.0 + seed * 20.0 + uTime * 0.6);
        p.x += sway * 0.25 * life;
        p.z += cos(life * 5.0 + seed * 12.0) * 0.18 * life;
        vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.45, 1.0, life));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (220.0 + life * 520.0) * uPixelRatio / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = pow(smoothstep(0.5, 0.0, d), 2.2) * vAlpha * 0.075 * uStrength;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  return new THREE.Points(geo, mat);
}

function buildDust(count) {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * 16;
    p[i * 3 + 1] = (Math.random() - 0.5) * 10;
    p[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: COLORS.gold, size: 0.02, transparent: true, opacity: 0.55, depthWrite: false }),
  );
}

// ---------- scene ----------

function initScene(container) {
  const canvas = container.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 2.4, 7.8);

  // Lights: warm key, gold rim, soft fill.
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.radius = 6;
  scene.add(key);

  const rimLight = new THREE.PointLight(COLORS.gold, 40, 12, 2);
  rimLight.position.set(-3, 2.5, -2.5);
  scene.add(rimLight);
  scene.add(new THREE.HemisphereLight(0xf3ede2, 0x171513, 0.35));

  // Stage: cup + soft shadow catcher.
  const stage = new THREE.Group();
  scene.add(stage);
  const cup = buildCup();
  stage.add(cup);

  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.45 }),
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.085;
  shadowCatcher.receiveShadow = true;
  stage.add(shadowCatcher);

  // Gold orbit ring behind the cup.
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.006, 8, 200),
    new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.55 }),
  );
  halo.position.set(0, 1.1, -0.8);
  scene.add(halo);
  const halo2 = halo.clone();
  halo2.scale.setScalar(1.25);
  halo2.material = halo.material.clone();
  halo2.material.opacity = 0.22;
  scene.add(halo2);

  const steam = buildSteam(90);
  cup.add(steam);

  const isSmall = window.innerWidth < 760;
  const beans = buildBeans(isSmall ? 26 : 48);
  scene.add(beans);
  const dust = buildDust(isSmall ? 120 : 260);
  scene.add(dust);

  // Intro: cup rises and spins in.
  stage.position.y = -3;
  stage.rotation.y = -Math.PI * 0.9;

  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();
  let scrollProgress = 0;
  let scrollSmooth = 0;
  const clock = new THREE.Clock();
  const dummy = new THREE.Object3D();
  let introT = reduceMotion ? 1 : 0;
  let visible = true;

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on portrait screens so the cup stays framed.
    camera.fov = camera.aspect < 0.8 ? 46 : 32;
    camera.updateProjectionMatrix();
    // On wide screens offset the cup to the right of the headline.
    const wide = camera.aspect > 1.15;
    stage.userData.offsetX = wide ? 1.55 : 0;
    stage.userData.offsetY = wide ? 0 : 2.05;
    stage.scale.setScalar(wide ? 1 : 0.68);
  }

  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function onScroll() {
    const rect = container.getBoundingClientRect();
    scrollProgress = THREE.MathUtils.clamp(-rect.top / rect.height, 0, 1);
  }

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (introT < 1) introT = Math.min(introT + dt / 2.4, 1);
    const intro = easeOutExpo(introT);

    pointerSmooth.lerp(pointer, 0.05);
    scrollSmooth += (scrollProgress - scrollSmooth) * 0.08;

    const ox = stage.userData.offsetX || 0;
    const oy = stage.userData.offsetY || 0;

    // Cup: float, slow turntable, pointer tilt, scroll push-back.
    stage.position.set(
      ox,
      THREE.MathUtils.lerp(-3, oy, intro) + Math.sin(t * 0.9) * 0.06 - scrollSmooth * 0.8,
      -scrollSmooth * 2.5,
    );
    stage.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.9, 0, intro) + t * 0.18 + pointerSmooth.x * 0.35 + scrollSmooth * 1.4;
    stage.rotation.x = pointerSmooth.y * 0.08 + scrollSmooth * 0.25;
    stage.rotation.z = -pointerSmooth.x * 0.04;

    cup.userData.crema.rotation.z = t * 0.05;
    steam.material.uniforms.uTime.value = t;
    steam.material.uniforms.uStrength.value = intro * (1 - scrollSmooth);

    halo.position.x = halo2.position.x = ox;
    halo.position.y = halo2.position.y = 1.1 * stage.scale.y + oy;
    halo.scale.setScalar(stage.scale.x);
    halo2.scale.setScalar(stage.scale.x * 1.25);
    halo.rotation.set(Math.PI / 2.3 + pointerSmooth.y * 0.2, pointerSmooth.x * 0.3, t * 0.1);
    halo2.rotation.set(Math.PI / 2.1 - pointerSmooth.y * 0.15, -pointerSmooth.x * 0.25, -t * 0.07);
    halo.material.opacity = 0.55 * intro;
    halo2.material.opacity = 0.22 * intro;

    // Beans: drift, spin, parallax with scroll and pointer.
    const list = beans.userData.beans;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      dummy.position.set(
        b.base.x + ox * 0.4 + pointerSmooth.x * b.depth * 0.3,
        b.base.y + Math.sin(t * b.speed + b.phase) * 0.25 + scrollSmooth * b.depth * 3 - (1 - intro) * 4,
        b.base.z,
      );
      dummy.rotation.set(b.rot.x + t * b.spin.x, b.rot.y + t * b.spin.y, b.rot.z + t * b.spin.z);
      dummy.scale.setScalar(b.scale * intro);
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
    }
    beans.instanceMatrix.needsUpdate = true;

    dust.rotation.y = t * 0.015;
    dust.position.y = scrollSmooth * 1.5;

    camera.position.x = pointerSmooth.x * 0.35;
    camera.position.y = 2.4 - pointerSmooth.y * 0.2;
    camera.position.z = 7.8;
    camera.lookAt(stage.position.x * 0.55, 0.9, 0);

    renderer.render(scene, camera);
  }

  function loop() {
    if (visible) render();
    if (!reduceMotion) requestAnimationFrame(loop);
  }

  resize();
  onScroll();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(container);

  if (reduceMotion) {
    render();
    window.addEventListener('resize', () => render());
  } else {
    loop();
  }
  container.classList.add('is-ready');
}

document.querySelectorAll('[data-brewe-scene]').forEach((el) => {
  if (!webglAvailable()) {
    el.classList.add('no-webgl');
    return;
  }
  try {
    initScene(el);
  } catch (err) {
    console.error('[BREWÉ] 3D scene failed', err);
    el.classList.add('no-webgl');
  }
});
