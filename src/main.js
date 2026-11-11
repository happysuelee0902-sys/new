
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ======================================
// 1. 데이터
// ======================================

const STORAGE_KEY = 'our-waste-city-records-v1';
const SOCIAL_KEY = 'our-waste-city-social-v1';

// 서울시 자원순환시행계획의 2020년 자료
// 총량은 인구 x 1인당 발생량으로 계산한 추정치
const REGION_DATA = {
  '강남구': {
    population: 544055,
    kgPerPerson: 1.28,
    year: 2020
  },
  '마포구': {
    population: 381858,
    kgPerPerson: 0.86,
    year: 2020
  },
  '서초구': {
    population: 429025,
    kgPerPerson: 1.18,
    year: 2020
  }
};

const REGIONS = Object.keys(REGION_DATA);

const TYPES = {
  plastic: {
    name: '플라스틱',
    emoji: '🧴',
    color: 0x82cbd6
  },
  paper: {
    name: '종이',
    emoji: '📦',
    color: 0xe3bb84
  },
  cloth: {
    name: '의류',
    emoji: '👕',
    color: 0xb7a2df
  },
  metal: {
    name: '금속',
    emoji: '🥫',
    color: 0xa9c3c2
  },
  other: {
    name: '기타',
    emoji: '🗑️',
    color: 0xb6ca9c
  }
};

const REASONS = [
  '일회용 사용',
  '고장',
  '사용기한 경과',
  '유행 또는 취향 변화',
  '더 이상 필요 없음',
  '기타'
];

function getTonPerDay(region) {
  const data = REGION_DATA[region];

  return (
    data.population * data.kgPerPerson / 1000
  );
}

function readStorage(key, fallback) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(key) || 'null'
    );

    return saved ?? fallback;
  } catch {
    return fallback;
  }
}

let records = readStorage(STORAGE_KEY, []);

if (!Array.isArray(records)) records = [];

let social = readStorage(SOCIAL_KEY, {
  likes: {},
  comments: {}
});

if (!social || typeof social !== 'object') {
  social = { likes: {}, comments: {} };
}

social.likes ||= {};
social.comments ||= {};

let currentRegion = '강남구';
let currentPage = 'home';
let communityRegion = '전체';
let selectedProfile = 'all';

function saveRecords() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records)
  );
}

function saveSocial() {
  localStorage.setItem(
    SOCIAL_KEY,
    JSON.stringify(social)
  );
}

function safe(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]
  );
}

function notify(message) {
  document.querySelector('.toast')?.remove();

  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;

  document.body.append(element);

  setTimeout(() => element.remove(), 3000);
}

// ======================================
// 2. 시연용 커뮤니티 데이터
// ======================================

const DEMO_PEOPLE = [
  {
    id: 'minji',
    name: '민지',
    region: '강남구',
    avatar: '🌷',
    color: '#ffe3e9'
  },
  {
    id: 'junho',
    name: '준호',
    region: '마포구',
    avatar: '🐻',
    color: '#f4e4c9'
  },
  {
    id: 'sora',
    name: '소라',
    region: '서초구',
    avatar: '🌼',
    color: '#fff1c9'
  },
  {
    id: 'yujin',
    name: '유진',
    region: '강남구',
    avatar: '🍀',
    color: '#e0efd9'
  },
  {
    id: 'haneul',
    name: '하늘',
    region: '마포구',
    avatar: '🦋',
    color: '#e5e3ff'
  },
  {
    id: 'jiwoo',
    name: '지우',
    region: '서초구',
    avatar: '🐱',
    color: '#fbe5d8'
  }
];

const DEMO_POSTS = [
  {
    id: 'demo1',
    authorId: 'minji',
    name: '아이스커피 플라스틱 컵',
    type: 'plastic',
    reason: '일회용 사용',
    story: '카페에서 커피를 마셨는데 오늘도 일회용 컵을 버렸어요. 우리 동네에 다회용 컵 반납소가 있으면 좋겠어요.',
    emoji: '🥤',
    likes: 12,
    date: '2026. 11. 11.'
  },
  {
    id: 'demo2',
    authorId: 'junho',
    name: '택배 종이상자',
    type: 'paper',
    reason: '더 이상 필요 없음',
    story: '일주일 동안 받은 택배 상자들을 모아봤는데 생각보다 정말 많네요.',
    emoji: '📦',
    likes: 8,
    date: '2026. 11. 10.'
  },
  {
    id: 'demo3',
    authorId: 'sora',
    name: '오래된 티셔츠',
    type: 'cloth',
    reason: '유행 또는 취향 변화',
    story: '옷을 버리기 전에 친구와 교환하거나 수선할 수 있었겠다는 생각이 들었어요.',
    emoji: '👕',
    likes: 16,
    date: '2026. 11. 10.'
  },
  {
    id: 'demo4',
    authorId: 'yujin',
    name: '생수 페트병',
    type: 'plastic',
    reason: '일회용 사용',
    story: '텀블러를 깜빡해서 생수를 샀어요. 다음에는 꼭 챙겨야겠어요.',
    emoji: '🧴',
    likes: 21,
    date: '2026. 11. 9.'
  },
  {
    id: 'demo5',
    authorId: 'haneul',
    name: '음료수 캔',
    type: 'metal',
    reason: '일회용 사용',
    story: '평소에는 그냥 버렸는데 기록해보니 매일 비슷한 캔이 생기네요.',
    emoji: '🥫',
    likes: 7,
    date: '2026. 11. 9.'
  },
  {
    id: 'demo6',
    authorId: 'jiwoo',
    name: '고장 난 탁상시계',
    type: 'other',
    reason: '고장',
    story: '고장 나서 버렸는데 우리 동네에도 수리센터가 있으면 좋겠어요.',
    emoji: '⏰',
    likes: 10,
    date: '2026. 11. 8.'
  }
];

// ======================================
// 3. 기본 홈페이지 구조
// ======================================

document.querySelector('#app').innerHTML = `
  <nav>
    <div class="logo">
      우리가 <span>버린 것들</span>
    </div>

    <div class="nav-buttons">
      <button data-page="home" class="active">홈</button>
      <button data-page="record">기록하기</button>
      <button data-page="city">3D 쓰레기 도시</button>
      <button data-page="community">커뮤니티</button>
      <button data-page="archive">나의 아카이브</button>
    </div>
  </nav>

  <main id="content"></main>

  <footer>
    우리 동네가 버린 것들 · 공동체 미술 프로젝트
    <br>
    지역별 공식 통계 기반 시각화 + 개인 참여 기록
  </footer>
`;

const content = document.querySelector('#content');

function setPage(page, options = {}) {
  destroy3D();

  currentPage = page;

  document.querySelectorAll('[data-page]').forEach(
    button => {
      button.classList.toggle(
        'active',
        button.dataset.page === page
      );
    }
  );

  if (page === 'home') renderHome();
  if (page === 'record') renderRecord();
  if (page === 'city') renderCity(options);
  if (page === 'community') renderCommunity();
  if (page === 'archive') renderArchive();

  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-page]').forEach(
  button => {
    button.addEventListener('click', () => {
      setPage(button.dataset.page);
    });
  }
);

// ======================================
// 4. 홈
// ======================================

function renderHome() {
  content.innerHTML = `
    <section class="hero">
      <div class="kicker">OUR WASTE, OUR CITY</div>

      <h1>
        우리가 버린 물건들은<br>
        어디로 사라질까요?
      </h1>

      <p>
        버린 물건 하나가 우리 동네의 풍경이 됩니다.
        당신의 일상을 폐기물로 기록하고,
        함께 새로운 도시를 만들어보세요.
      </p>

      <div class="button-row">
        <button class="primary" id="startRecord">
          나의 폐기물 기록하기 →
        </button>

        <button class="secondary" id="showCity">
          3D 쓰레기 도시 보기
        </button>
      </div>
    </section>

    <div class="grid">
      <div class="panel feature">
        <div class="feature-icon">📷</div>
        <div class="kicker">01 / ARCHIVE</div>
        <h2>버린 것을 기록하다</h2>
        <p>일상 속 폐기물의 사진과 이야기를 남깁니다.</p>
      </div>

      <div class="panel feature">
        <div class="feature-icon">🏙️</div>
        <div class="kicker">02 / VISUALIZE</div>
        <h2>쓰레기 도시 만들기</h2>
        <p>기록이 3D 오브제가 되어 도시 위에 쌓입니다.</p>
      </div>

      <div class="panel feature">
        <div class="feature-icon">💬</div>
        <div class="kicker">03 / CONNECT</div>
        <h2>이야기를 나누다</h2>
        <p>다른 주민의 폐기 경험을 보고 함께 이야기합니다.</p>
      </div>

      <div class="panel feature">
        <div class="feature-icon">🌱</div>
        <div class="kicker">04 / REIMAGINE</div>
        <h2>우리가 바라는 도시</h2>
        <p>폐기물을 줄이는 공동체의 미래를 상상합니다.</p>
      </div>
    </div>
  `;

  document.querySelector('#startRecord').onclick =
    () => setPage('record');

  document.querySelector('#showCity').onclick =
    () => setPage('city');
}

// ======================================
// 5. 사진 압축 및 기록 등록
// ======================================

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('사진을 읽을 수 없습니다.'));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(new Error('이미지를 처리할 수 없습니다.'));
      };

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;

        const ratio = Math.min(
          1,
          maxSize / Math.max(image.width, image.height)
        );

        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function renderRecord() {
  content.innerHTML = `
    <div class="kicker">PERSONAL WASTE ARCHIVE</div>

    <h1>오늘 무엇을 버렸나요?</h1>

    <p class="muted">
      사진과 간단한 이야기를 기록하면
      해당 자치구의 3D 쓰레기산에 새로운 오브제가 쌓입니다.
    </p>

    <div class="grid">
      <section class="panel">
        <form id="wasteForm">

          <label>버린 물건 이름 *</label>
          <input
            id="wasteName"
            placeholder="예: 생수 페트병"
            maxlength="60"
            required
          >

          <label>물건 사진</label>
          <input
            id="wastePhoto"
            type="file"
            accept="image/*"
          >

          <div
            id="photoPreview"
            class="photo-placeholder"
          >
            📷 사진을 선택해주세요
          </div>

          <label>어느 자치구에서 버렸나요?</label>
          <select id="wasteRegion">
            ${REGIONS.map(region => `
              <option
                value="${region}"
                ${region === currentRegion ? 'selected' : ''}
              >
                ${region}
              </option>
            `).join('')}
          </select>

          <label>폐기물 종류</label>
          <select id="wasteType">
            ${Object.entries(TYPES).map(
              ([key, type]) => `
                <option value="${key}">
                  ${type.name}
                </option>
              `
            ).join('')}
          </select>

          <label>버린 이유</label>
          <select id="wasteReason">
            ${REASONS.map(reason => `
              <option>${reason}</option>
            `).join('')}
          </select>

          <label>이 물건에 대한 이야기</label>
          <textarea
            id="wasteStory"
            maxlength="300"
            placeholder="왜 버리게 되었나요?"
          ></textarea>

          <button
            class="primary"
            id="submitRecord"
            type="submit"
            style="width:100%;margin-top:20px"
          >
            🚀 나의 기록을 3D 도시에 보내기
          </button>
        </form>
      </section>

      <section class="panel">
        <div class="kicker">HOW IT WORKS</div>

        <h2>하나의 기록이<br>도시가 되는 과정</h2>

        <p>📷 1. 버린 물건을 촬영합니다.</p>
        <p>📝 2. 버린 이유와 지역을 기록합니다.</p>
        <p>🚀 3. 3D 오브제가 도시로 날아갑니다.</p>
        <p>🏙️ 4. 지역의 쓰레기산에 쌓입니다.</p>
        <p>💬 5. 나의 기록이 커뮤니티에 표시됩니다.</p>

        <div class="empty">
          내가 버린 작은 물건 하나가<br>
          우리 동네의 풍경을 변화시킵니다.
        </div>
      </section>
    </div>
  `;

  const photoInput = document.querySelector('#wastePhoto');
  const preview = document.querySelector('#photoPreview');

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];

    if (!file) {
      preview.textContent = '📷 사진을 선택해주세요';
      return;
    }

    if (!file.type.startsWith('image/')) {
      notify('이미지 파일을 선택해주세요.');
      photoInput.value = '';
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    preview.innerHTML = '';

    const image = document.createElement('img');
    image.className = 'photo-preview';
    image.src = imageUrl;
    image.alt = '선택한 폐기물 사진';

    image.onload = () => URL.revokeObjectURL(imageUrl);

    preview.appendChild(image);
  });

  document.querySelector('#wasteForm').addEventListener(
    'submit',
    async event => {
      event.preventDefault();

      const button = document.querySelector('#submitRecord');
      button.disabled = true;

      try {
        const name = document.querySelector('#wasteName')
          .value.trim();

        if (!name) {
          throw new Error('물건 이름을 입력해주세요.');
        }

        const file = photoInput.files[0];

        const photo = file
          ? await compressImage(file)
          : null;

        const record = {
          id: crypto.randomUUID(),
          authorId: 'me',
          name,
          region: document.querySelector('#wasteRegion').value,
          type: document.querySelector('#wasteType').value,
          reason: document.querySelector('#wasteReason').value,
          story: document.querySelector('#wasteStory').value.trim(),
          photo,
          date: new Date().toLocaleDateString('ko-KR')
        };

        let nextRecords = [...records, record];

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextRecords)
          );
        } catch {
          // 브라우저 저장 공간 부족 시 사진 없이 저장
          record.photo = null;
          nextRecords = [...records, record];

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextRecords)
          );

          notify('저장 공간이 부족해 사진 없이 저장했어요.');
        }

        records = nextRecords;
        currentRegion = record.region;

        setPage('city', {
          flyingId: record.id
        });

      } catch (error) {
        console.error(error);
        notify(error.message || '기록 저장에 실패했습니다.');
      } finally {
        button.disabled = false;
      }
    }
  );
}

// ======================================
// 6. THREE.JS 3D 도시
// ======================================

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let mountain = null;
let itemGroup = null;
let frameId = null;
let observer = null;
let flyingObjects = [];

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.05,
    ...options
  });
}

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  return result;
}

// 페트병
function makeBottle() {
  const group = new THREE.Group();

  const transparent = mat(0x91d6df, {
    transparent: true,
    opacity: 0.78,
    roughness: 0.2
  });

  group.add(mesh(
    new THREE.CylinderGeometry(0.25, 0.27, 0.9, 16),
    transparent,
    0, 0.48, 0
  ));

  group.add(mesh(
    new THREE.CylinderGeometry(0.12, 0.24, 0.22, 16),
    transparent,
    0, 1.04, 0
  ));

  group.add(mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16),
    transparent,
    0, 1.21, 0
  ));

  group.add(mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.13, 16),
    mat(0x549dab),
    0, 1.36, 0
  ));

  // 라벨
  group.add(mesh(
    new THREE.CylinderGeometry(0.275, 0.275, 0.2, 16),
    mat(0xe0f7ef, {
      transparent: true,
      opacity: 0.8
    }),
    0, 0.58, 0
  ));

  return group;
}

// 종이상자
function makeBox() {
  const group = new THREE.Group();

  group.add(mesh(
    new THREE.BoxGeometry(0.9, 0.8, 0.85),
    mat(0xd9b37f),
    0, 0.4, 0
  ));

  group.add(mesh(
    new THREE.BoxGeometry(0.12, 0.02, 0.87),
    mat(0xf6dfb7),
    0, 0.81, 0
  ));

  return group;
}

// 옷 더미
function makeCloth() {
  const group = new THREE.Group();
  const colors = [0xbba7e3, 0x9f93d6, 0xd2b6e4];

  for (let i = 0; i < 3; i++) {
    const part = mesh(
      new THREE.SphereGeometry(0.4, 14, 10),
      mat(colors[i], { roughness: 0.95 }),
      (i - 1) * 0.2,
      0.23 + i * 0.09,
      i * 0.05
    );

    part.scale.set(1.2, 0.55, 0.85);
    group.add(part);
  }

  return group;
}

// 음료 캔
function makeCan() {
  const group = new THREE.Group();

  group.add(mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.75, 18),
    mat(0xaac5c3, {
      metalness: 0.65,
      roughness: 0.3
    }),
    0, 0.39, 0
  ));

  group.add(mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.04, 18),
    mat(0xe5eeee, { metalness: 0.8 }),
    0, 0.79, 0
  ));

  return group;
}

function makeWasteObject(type) {
  if (type === 'plastic') return makeBottle();
  if (type === 'paper') return makeBox();
  if (type === 'cloth') return makeCloth();
  if (type === 'metal') return makeCan();
  return makeBox();
}

// 쓰레기 총량을 산의 크기로 변환
function getMountainSize(region) {
  const tons = getTonPerDay(region);
  const max = Math.max(...REGIONS.map(getTonPerDay));

  const ratio = tons / max;

  // 입체적 크기(부피)를 기준으로 완만하게 비례
  const scale = Math.cbrt(ratio);

  return {
    radius: 5.2 * scale,
    height: 4.6 * scale
  };
}

// 산 표면의 높이 계산
function surfaceHeight(x, z) {
  const { radius, height } = mountain.userData;

  const r2 = x * x + z * z;

  return height * Math.sqrt(
    Math.max(0, 1 - r2 / (radius * radius))
  );
}

function addDecorations() {
  const { radius } = mountain.userData;

  const colors = [
    0xf0cfb5,
    0xb6d8c1,
    0xd0b7e8,
    0xa5d8da,
    0xf1dba7
  ];

  // 산 표면에 파스텔 장식
  for (let i = 0; i < 24; i++) {
    const angle = i * 2.39996;
    const distance = radius * (0.2 + (i % 5) * 0.12);

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = surfaceHeight(x, z);

    const decoration = mesh(
      new THREE.SphereGeometry(0.26, 12, 10),
      mat(colors[i % colors.length]),
      x, y, z
    );

    decoration.scale.set(1.5, 0.35, 1.2);
    mountain.add(decoration);
  }

  // 산 위의 작은 폐기물 오브제
  for (let i = 0; i < 23; i++) {
    const typeList = ['plastic', 'paper', 'cloth', 'metal'];
    const item = makeWasteObject(typeList[i % 4]);

    const angle = i * 2.39996;
    const distance = radius * (0.25 + (i % 4) * 0.12);

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    item.position.set(x, surfaceHeight(x, z), z);
    item.rotation.y = angle;
    item.scale.setScalar(0.3);

    mountain.add(item);
  }
}

function createMountain() {
  const { radius, height } = getMountainSize(currentRegion);

  mountain = new THREE.Group();
  mountain.userData = { radius, height };

  // 둥근 반구형 쓰레기산
  const geometry = new THREE.SphereGeometry(
    radius,
    48,
    28,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );

  const mound = mesh(
    geometry,
    mat(0xb8d8bf, {
      roughness: 0.95,
      side: THREE.DoubleSide
    })
  );

  mound.scale.y = height / radius;
  mountain.add(mound);

  scene.add(mountain);

  addDecorations();
}

function getRecordPosition(index) {
  const { radius } = mountain.userData;

  const angle = index * 2.399963;

  const ring = Math.min(
    radius * 0.75,
    0.7 + Math.sqrt(index) * 0.36
  );

  const x = Math.cos(angle) * ring;
  const z = Math.sin(angle) * ring;

  return new THREE.Vector3(
    x,
    surfaceHeight(x, z),
    z
  );
}

function addRecordsToCity(flyingId) {
  const localRecords = records.filter(
    record => record.region === currentRegion
  );

  localRecords.forEach((record, index) => {
    const object = makeWasteObject(record.type);

    const target = getRecordPosition(index);
    const scale = 0.55;

    object.scale.setScalar(scale);

    if (record.reason === '고장') {
      object.rotation.z = 0.2;
    }

    itemGroup.add(object);

    if (record.id === flyingId) {
      const start = new THREE.Vector3(-7, 9, 5);

      object.position.copy(start);

      flyingObjects.push({
        object,
        start,
        target,
        started: null,
        duration: 1900,
        scale
      });
    } else {
      object.position.copy(target);
    }
  });
}

function init3D(flyingId = null) {
  const container = document.querySelector('#cityCanvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0f0eb);

  camera = new THREE.PerspectiveCamera(
    45, 1, 0.1, 100
  );

  camera.position.set(12, 10, 15);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // 조명
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));

  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(7, 14, 9);
  scene.add(sun);

  // 받침대
  const platform = mesh(
    new THREE.CylinderGeometry(8, 8.4, 0.5, 64),
    mat(0xf0e6d3),
    0, -0.3, 0
  );

  scene.add(platform);

  // 산
  createMountain();

  // 주민 기록
  itemGroup = new THREE.Group();
  scene.add(itemGroup);

  addRecordsToCity(flyingId);

  // 마우스로 회전
  controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;
  controls.minDistance = 7;
  controls.maxDistance = 35;
  controls.maxPolarAngle = Math.PI / 2.02;

  controls.target.set(0, 2, 0);
  controls.update();

  function resize() {
    if (!renderer || !camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();

  observer = new ResizeObserver(resize);
  observer.observe(container);

  function animate(time) {
    frameId = requestAnimationFrame(animate);

    flyingObjects.forEach(item => {
      if (item.started === null) item.started = time;

      const progress = Math.min(
        (time - item.started) / item.duration,
        1
      );

      const ease = 1 - Math.pow(1 - progress, 3);

      item.object.position.lerpVectors(
        item.start,
        item.target,
        ease
      );

      item.object.position.y +=
        Math.sin(Math.PI * progress) * 2.2;

      item.object.rotation.y += 0.035;

      item.object.scale.setScalar(
        item.scale * (0.65 + ease * 0.35)
      );

      if (progress >= 1) {
        item.object.position.copy(item.target);
      }
    });

    flyingObjects = flyingObjects.filter(
      item => item.started === null ||
        time - item.started < item.duration
    );

    controls.update();
    renderer.render(scene, camera);
  }

  frameId = requestAnimationFrame(animate);
}

function destroy3D() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  observer?.disconnect();
  observer = null;

  controls?.dispose();
  controls = null;

  if (scene) {
    scene.traverse(object => {
      object.geometry?.dispose();

      if (object.material) {
        const list = Array.isArray(object.material)
          ? object.material
          : [object.material];

        list.forEach(material => material.dispose());
      }
    });
  }

  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }

  renderer = null;
  scene = null;
  camera = null;
  mountain = null;
  itemGroup = null;
  flyingObjects = [];
}

// ======================================
// 7. 3D 도시 페이지
// ======================================

function renderCity(options = {}) {
  const data = REGION_DATA[currentRegion];

  const tons = getTonPerDay(currentRegion);
  const count = records.filter(
    record => record.region === currentRegion
  ).length;

  content.innerHTML = `
    <div class="kicker">COLLECTIVE WASTE CITY</div>

    <h1>우리가 버린 도시 🏙️</h1>

    <p class="muted">
      자치구별 생활계폐기물의 규모를
      파스텔톤의 3D 쓰레기산으로 시각화했습니다.
    </p>

    <div class="region-buttons">
      ${REGIONS.map(region => `
        <button
          data-region="${region}"
          class="${region === currentRegion ? 'active' : ''}"
        >
          ${region}
        </button>
      `).join('')}
    </div>

    <div class="city-layout">

      <section>
        <div id="cityCanvas">
          <div class="scene-label">
            <strong>${currentRegion} / WASTE MOUNTAIN</strong>
            <br>
            우리의 폐기 기록이 쌓이는 공간
          </div>

          <div class="scene-hint">
            드래그: 회전 · 스크롤: 확대/축소
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="kicker">DISTRICT DATA</div>

        <h2>${currentRegion}의 쓰레기산</h2>

        <div class="stats">
          <div class="stat">
            <strong>${data.kgPerPerson}</strong>
            <small>1인당 배출량 (kg/일)</small>
          </div>

          <div class="stat">
            <strong>${Math.round(tons)}</strong>
            <small>일평균 추정 발생량 (톤)</small>
          </div>

          <div class="stat">
            <strong>
              ${data.population.toLocaleString()}
            </strong>
            <small>기준 주민 수</small>
          </div>

          <div class="stat">
            <strong>${count}</strong>
            <small>내가 등록한 기록</small>
          </div>
        </div>

        <div class="legend">
          <span>
            <i class="dot" style="background:#82cbd6"></i>
            플라스틱
          </span>
          <span>
            <i class="dot" style="background:#e3bb84"></i>
            종이
          </span>
          <span>
            <i class="dot" style="background:#b7a2df"></i>
            의류
          </span>
          <span>
            <i class="dot" style="background:#a9c3c2"></i>
            금속
          </span>
        </div>

        <p class="muted">
          2020년 기준 공개 통계의 주민 수와
          1인당 발생량을 활용한 시각화입니다.
          산에 놓인 기본 장식은 실제 개별 폐기물
          기록 수를 의미하지 않습니다.
        </p>

        <button
          class="primary"
          id="addRecordToCity"
          style="width:100%;margin-top:15px"
        >
          + 이 지역에 폐기물 기록하기
        </button>
      </section>
    </div>

    <section class="panel" style="margin-top:20px">
      <div class="kicker">ABOUT THIS CITY</div>

      <h2>우리가 무의식적으로 만든 도시</h2>

      <p>
        물건을 버리면 우리의 눈에서는 사라지지만,
        환경과 사회에서 그 흔적까지 사라지는 것은 아닙니다.
      </p>

      <p>
        개인이 기록한 폐기물들이 하나씩 쌓여가는
        모습을 통해 우리가 만들어낸 공동체의
        풍경을 생각해볼 수 있습니다.
      </p>
    </section>
  `;

  document.querySelectorAll('[data-region]').forEach(
    button => {
      button.addEventListener('click', () => {
        currentRegion = button.dataset.region;
        setPage('city');
      });
    }
  );

  document.querySelector('#addRecordToCity').onclick =
    () => setPage('record');

  try {
    init3D(options.flyingId);

    if (options.flyingId) {
      notify(
        `🚀 ${currentRegion}의 쓰레기산에 기록이 추가됐어요!`
      );
    }
  } catch (error) {
    console.error('3D 오류:', error);
    destroy3D();

    document.querySelector('#cityCanvas').innerHTML = `
      <div style="padding:28px;color:#315b45">
        3D 도시를 표시할 수 없습니다.
        브라우저의 WebGL 지원을 확인해주세요.
      </div>
    `;
  }
}

// ======================================
// 8. 나의 폐기 아카이브
// ======================================

function renderArchive() {
  content.innerHTML = `
    <div class="kicker">PERSONAL ARCHIVE</div>
    <h1>나의 폐기 아카이브</h1>

    <p class="muted">
      내가 버렸던 물건들에도 나의 일상이 남아 있습니다.
    </p>

    <div class="panel">
      <strong>나의 기록: ${records.length}개</strong>

      <p class="muted">
        이 브라우저에 저장된 기록을 보여줍니다.
      </p>

      <button class="primary" id="addArchive">
        + 새로운 기록하기
      </button>
    </div>

    ${records.length === 0 ? `
      <div class="empty">
        아직 기록이 없습니다.
        첫 번째 폐기물을 등록해보세요!
      </div>
    ` : `
      <div class="card-grid">
        ${[...records].reverse().map(record => `
          <article class="archive-card">
            <div class="archive-photo">
              ${record.photo ? `
                <img
                  src="${record.photo}"
                  alt="폐기물 사진"
                >
              ` : TYPES[record.type]?.emoji || '🗑️'}
            </div>

            <div class="archive-content">
              <span class="badge">
                ${safe(record.region)}
              </span>

              <h3 style="margin-top:12px">
                ${safe(record.name)}
              </h3>

              <p>종류: ${safe(TYPES[record.type]?.name)}</p>
              <p>버린 이유: ${safe(record.reason)}</p>
              <p>${safe(record.story)}</p>
              <p>${safe(record.date)}</p>

              <button
                class="secondary delete-record"
                data-id="${safe(record.id)}"
              >
                기록 삭제
              </button>
            </div>
          </article>
        `).join('')}
      </div>
    `}
  `;

  document.querySelector('#addArchive').onclick =
    () => setPage('record');

  document.querySelectorAll('.delete-record').forEach(
    button => {
      button.addEventListener('click', () => {
        if (!confirm('이 기록을 삭제할까요?')) return;

        records = records.filter(
          record => record.id !== button.dataset.id
        );

        saveRecords();
        renderArchive();
        notify('기록을 삭제했어요.');
      });
    }
  );
}

// ======================================
// 9. 커뮤니티 게시물 데이터
// ======================================

function getAllPosts() {
  const myPosts = records.map(record => ({
    ...record,
    authorId: 'me',
    emoji: TYPES[record.type]?.emoji || '🗑️',
    likes: 0,
    isMine: true
  }));

  const demoPosts = DEMO_POSTS.map(post => ({
    ...post,
    isMine: false
  }));

  return [...myPosts].reverse().concat(demoPosts);
}

function getProfile(post) {
  if (post.authorId === 'me') {
    return {
      id: 'me',
      name: '나',
      region: post.region,
      avatar: '🌱',
      color: '#dcefe1'
    };
  }

  return DEMO_PEOPLE.find(
    person => person.id === post.authorId
  );
}

function postRegion(post) {
  return getProfile(post)?.region || '기타';
}

function postLikes(post) {
  return (post.likes || 0) +
    (social.likes[post.id] ? 1 : 0);
}

function postComments(post) {
  const comments = social.comments[post.id];

  return Array.isArray(comments) ? comments : [];
}

// ======================================
// 10. 커뮤니티 페이지
// ======================================

function renderCommunity() {
  const allPosts = getAllPosts();

  const shownPosts = allPosts.filter(post => {
    const regionMatch =
      communityRegion === '전체' ||
      postRegion(post) === communityRegion;

    const profileMatch =
      selectedProfile === 'all' ||
      selectedProfile === post.authorId;

    return regionMatch && profileMatch;
  });

  const people = [
    {
      id: 'me',
      name: '나',
      region: '나의 기록',
      avatar: '🌱',
      color: '#dcefe1'
    },
    ...DEMO_PEOPLE
  ];

  content.innerHTML = `
    <section class="community-header">
      <div class="kicker">OUR COMMUNITY</div>

      <h1>우리 동네의 버린 이야기들 🌿</h1>

      <p>
        내가 버린 물건이 다른 사람의 이야기와 만나는 공간.
        <br>
        서로의 기록을 통해 공동체의 폐기 습관을 발견해보세요.
      </p>

      <span class="badge">
        다른 주민들의 기록은 현재 시연용 예시입니다
      </span>
    </section>

    <section class="panel">
      <h2>함께 기록하는 주민들</h2>

      <div class="profile-scroll">
        ${people.map(person => {
          const count = allPosts.filter(
            post => post.authorId === person.id
          ).length;

          return `
            <button
              class="profile-card ${
                selectedProfile === person.id ? 'selected' : ''
              }"
              data-profile="${person.id}"
            >
              <span
                class="avatar"
                style="background:${person.color}"
              >
                ${person.avatar}
              </span>

              <strong>${safe(person.name)}</strong>
              <small>${safe(person.region)}</small>
              <small>기록 ${count}개</small>
            </button>
          `;
        }).join('')}
      </div>
    </section>

    <div class="community-layout">

      <section>
        <div class="kicker">COMMUNITY FEED</div>

        <h2>우리 동네 폐기 아카이브</h2>

        <div class="filter-buttons">
          ${['전체', ...REGIONS].map(region => `
            <button
              data-filter="${region}"
              class="${
                communityRegion === region ? 'active' : ''
              }"
            >
              ${region}
            </button>
          `).join('')}
        </div>

        ${selectedProfile !== 'all' ? `
          <button
            class="secondary"
            id="showAll"
            style="margin-bottom:18px"
          >
            ← 모든 주민 기록 보기
          </button>
        ` : ''}

        ${shownPosts.length === 0 ? `
          <div class="empty">
            조건에 맞는 기록이 아직 없습니다.
          </div>
        ` : shownPosts.map(post => {
          const person = getProfile(post);
          const comments = postComments(post);
          const liked = !!social.likes[post.id];

          return `
            <article class="feed-post">

              <div class="feed-head">
                <div
                  class="feed-avatar"
                  style="background:${person.color}"
                >
                  ${person.avatar}
                </div>

                <div class="feed-author">
                  <strong>${safe(person.name)}</strong>
                  <small>
                    ${safe(postRegion(post))} ·
                    ${safe(post.date)}
                  </small>
                </div>

                <span class="badge">
                  ${safe(TYPES[post.type]?.name || '기타')}
                </span>
              </div>

              <div class="feed-photo">
                ${post.photo ? `
                  <img
                    src="${post.photo}"
                    alt="폐기물 사진"
                  >
                ` : post.emoji || '🗑️'}

                ${post.isMine ? '' : `
                  <span class="sample-tag">
                    예시 게시물
                  </span>
                `}
              </div>

              <div class="feed-content">
                <div class="feed-actions">
                  <button
                    class="like-button ${liked ? 'liked' : ''}"
                    data-like="${safe(post.id)}"
                  >
                    ${liked ? '♥' : '♡'}
                    공감 ${postLikes(post)}
                  </button>

                  <span>
                    💬 댓글 ${comments.length}
                  </span>
                </div>

                <h3>${safe(post.name)}</h3>

                <div class="tags">
                  <span>
                    #${safe(TYPES[post.type]?.name || '기타')}
                  </span>
                  <span>#${safe(post.reason)}</span>
                </div>

                <p>${safe(post.story)}</p>

                <div class="comment-list">
                  <strong>주민들의 이야기</strong>

                  ${comments.length === 0 ? `
                    <p class="muted">
                      첫 번째 댓글을 남겨보세요.
                    </p>
                  ` : comments.map(comment => `
                    <div class="comment-item">
                      🌱 <strong>나</strong>
                      ${safe(comment)}
                    </div>
                  `).join('')}

                  <form
                    class="comment-form"
                    data-comment="${safe(post.id)}"
                  >
                    <input
                      name="message"
                      placeholder="댓글을 남겨주세요"
                      maxlength="150"
                      required
                    >

                    <button class="primary" type="submit">
                      등록
                    </button>
                  </form>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </section>

      <aside>
        <div class="side-panel">
          <div class="kicker">THIS WEEK'S QUESTION</div>

          <h3>이번 주의 질문 💭</h3>

          <p>
            이번 주 버린 물건 중
            다시 사용할 수 있었던 것은 무엇인가요?
          </p>
        </div>

        <div class="side-panel">
          <div class="kicker">COMMUNITY ACTIVITY</div>

          <h3>아카이브 현황</h3>

          <p>시연용 게시물: ${DEMO_POSTS.length}개</p>
          <p>내 기록: ${records.length}개</p>
          <p>참여 지역: 3개 자치구</p>

          <button
            class="primary"
            id="communityRecord"
            style="width:100%"
          >
            + 나도 기록하기
          </button>
        </div>

        <div class="side-panel">
          <div class="kicker">OUR CITY</div>

          <h3>함께 만들어가는 도시</h3>

          <p>
            개인의 폐기 기록들이
            공동체의 3D 쓰레기산을 형성합니다.
          </p>

          <button
            class="secondary"
            id="communityCity"
            style="width:100%"
          >
            3D 도시 보러가기 →
          </button>
        </div>
      </aside>
    </div>
  `;

  // 프로필 선택
  document.querySelectorAll('[data-profile]').forEach(
    button => {
      button.addEventListener('click', () => {
        selectedProfile = button.dataset.profile;
        communityRegion = '전체';
        renderCommunity();
      });
    }
  );

  // 지역별 필터
  document.querySelectorAll('[data-filter]').forEach(
    button => {
      button.addEventListener('click', () => {
        communityRegion = button.dataset.filter;
        selectedProfile = 'all';
        renderCommunity();
      });
    }
  );

  document.querySelector('#showAll')?.addEventListener(
    'click',
    () => {
      selectedProfile = 'all';
      renderCommunity();
    }
  );

  // 좋아요
  document.querySelectorAll('[data-like]').forEach(
    button => {
      button.addEventListener('click', () => {
        const id = button.dataset.like;

        social.likes[id] = !social.likes[id];
        saveSocial();

        const scrollY = window.scrollY;
        renderCommunity();
        window.scrollTo(0, scrollY);
      });
    }
  );

  // 댓글
  document.querySelectorAll('[data-comment]').forEach(
    form => {
      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.comment;
        const message = form.elements.message.value.trim();

        if (!message) return;

        if (!Array.isArray(social.comments[id])) {
          social.comments[id] = [];
        }

        social.comments[id].push(message);
        saveSocial();

        const scrollY = window.scrollY;
        renderCommunity();
        window.scrollTo(0, scrollY);

        notify('댓글을 등록했어요!');
      });
    }
  );

  document.querySelector('#communityRecord').onclick =
    () => setPage('record');

  document.querySelector('#communityCity').onclick =
    () => setPage('city');
}

// ======================================
// 11. 웹사이트 시작
// ======================================

renderHome();
