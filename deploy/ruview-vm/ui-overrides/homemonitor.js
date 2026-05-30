const GROUPS = [
  {
    id: 'monitoring',
    pages: [
      { id: 'home', label: 'Дом сейчас' },
      { id: 'signal', label: 'WiFi-сигнал / Sensing' },
      { id: 'metrics', label: 'Операционные метрики' }
    ]
  },
  {
    id: 'configuration',
    pages: [
      { id: 'hardware', label: 'Оборудование' },
      { id: 'training', label: 'Обучение / Training' }
    ]
  },
  {
    id: 'help',
    pages: [
      { id: 'help', label: 'Как устроено' }
    ]
  }
];

const DEMO_KEY = 'homemonitor-demo-data-enabled';
const PRESENCE_HOLD_KEY = 'homemonitor-presence-hold-enabled';
const PRESENCE_HOLD_MS = 7000;
const LIVE_STICKY_MS = 9000;
const POLL_MS = 3000;
const MAX_HISTORY = 90;

const state = {
  activeGroup: 'monitoring',
  activePage: 'home',
  health: null,
  status: null,
  summary: null,
  apiError: null,
  wsConnected: false,
  wsError: null,
  rendered: new Map(),
  timeline: [],
  rssiHistory: [],
  lastPresenceAt: 0,
  lastPresenceSnapshot: null,
  lastIgnoredDemoAt: 0,
  lastAcceptedOrigin: null,
  lastAcceptedScore: 0,
  demoEnabled: readBool(DEMO_KEY, false),
  presenceHoldEnabled: readBool(PRESENCE_HOLD_KEY, true),
  renderQueued: false
};

function readBool(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value === 'true';
  } catch {
    return fallback;
  }
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // noop
  }
}

function safeNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function pickFirst(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function isDemoSource(source) {
  return ['simulated', 'simulate', 'server-simulated', 'mock'].includes(String(source || '').toLowerCase());
}

function isEsp32Source(source) {
  return String(source || '').toLowerCase().startsWith('esp32');
}

function displayMotionLevel(value) {
  const level = String(value || '').toLowerCase();
  if (level.includes('moving') || level.includes('motion') || level.includes('active')) return 'motion';
  if (level.includes('present') || level.includes('still')) return 'present_still';
  if (level.includes('absent') || level.includes('none')) return 'absent';
  return level || 'absent';
}

function motionLabel(value, presence = false) {
  const level = displayMotionLevel(value);
  if (level === 'motion') return 'Движение';
  if (level === 'present_still' || presence) return 'Присутствие';
  return 'Нет присутствия';
}

function motionDetail(value) {
  const level = displayMotionLevel(value);
  if (level === 'motion') return 'motion: движение';
  if (level === 'present_still') return 'motion: присутствие без грубого движения';
  return 'motion: нет';
}

function normalizeClassification(classification = {}) {
  const motion = displayMotionLevel(classification.motion_level || classification.motion);
  return {
    ...classification,
    motion_level: motion,
    motion,
    presence: classification.presence === true || (classification.presence !== false && motion !== 'absent')
  };
}

function looksEmptyClassification(classification) {
  const confidence = safeNumber(classification.confidence, 0);
  return confidence === 0 && classification.presence !== true && displayMotionLevel(classification.motion_level || classification.motion) === 'absent';
}

function normalizeFrame(frame, context = {}) {
  if (!frame || typeof frame !== 'object') return null;

  const source = pickFirst(frame.source, context.source, state.status?.source, state.health?.source, 'unknown');
  if (!state.demoEnabled && (frame._simulated === true || isDemoSource(source))) {
    return {
      ignored: true,
      demoBlocked: true,
      source,
      receivedAt: Date.now(),
      hasData: false
    };
  }

  const nodes = Array.isArray(frame.nodes) ? frame.nodes : [];
  const nodeFeatures = Array.isArray(frame.node_features) ? frame.node_features : [];
  const firstNode = nodes[0] || {};
  const firstFeature = nodeFeatures[0] || {};
  const globalClassification = normalizeClassification(frame.classification || {});
  const nodeClassification = normalizeClassification(firstFeature.classification || {});
  const useNodeClassification = looksEmptyClassification(globalClassification) && (
    nodeClassification.presence === true ||
    safeNumber(nodeClassification.confidence, 0) > 0 ||
    displayMotionLevel(nodeClassification.motion_level) !== 'absent'
  );
  const classification = useNodeClassification ? nodeClassification : globalClassification;
  const featureValues = {
    ...(firstFeature.features || {}),
    ...(frame.features || {})
  };
  const vitals = frame.vital_signs || {};
  const nodeIds = [...new Set([
    ...nodes.map(node => node.node_id),
    ...nodeFeatures.map(node => node.node_id)
  ].filter(value => value !== undefined && value !== null))];
  const hasRawCsi = nodes.some(node => {
    const subcarriers = safeNumber(node.subcarrier_count, 0);
    const amplitude = Array.isArray(node.amplitude) ? node.amplitude.length : 0;
    const phase = Array.isArray(node.phase) ? node.phase.length : 0;
    return subcarriers > 0 || amplitude > 0 || phase > 0;
  });
  const receivedAt = Date.now();
  const rssi = pickFirst(featureValues.mean_rssi, firstFeature.rssi_dbm, firstNode.rssi_dbm);
  const summary = {
    source,
    hasData: nodes.length > 0 || nodeFeatures.length > 0 || Object.keys(vitals).length > 0,
    receivedAt,
    timestamp: pickFirst(frame.timestamp, firstNode.timestamp, context.timestamp),
    tick: pickFirst(frame.tick, context.tick, state.health?.tick),
    clients: pickFirst(context.clients, state.health?.clients),
    nodes,
    nodeFeatures,
    nodeIds,
    nodeCount: nodeIds.length || nodes.length || nodeFeatures.length || 0,
    rssi,
    features: featureValues,
    classification,
    presence: classification.presence,
    motion: classification.motion_level,
    confidence: classification.confidence,
    hasRawCsi,
    breathing: pickFirst(vitals.respiration_bpm, vitals.breathing_rate_bpm, vitals.breathing_bpm, firstFeature.respiration_bpm),
    breathingConfidence: pickFirst(vitals.breathing_confidence, vitals.respiration_confidence, firstFeature.respiration_confidence),
    heartRate: pickFirst(vitals.heart_rate_bpm, vitals.hr_bpm, firstFeature.heart_rate_bpm),
    frameRate: pickFirst(firstFeature.frame_rate_hz, frame.frame_rate_hz),
    subcarriers: pickFirst(firstNode.subcarrier_count, frame.subcarrier_count),
    stale: firstFeature.stale === true
  };

  return stabilizePresence(summary);
}

function stabilizePresence(summary) {
  if (!summary || !summary.hasData || !isEsp32Source(summary.source)) return summary;

  const now = Date.now();
  if (summary.presence === true || displayMotionLevel(summary.motion) !== 'absent') {
    state.lastPresenceAt = now;
    state.lastPresenceSnapshot = {
      presence: true,
      motion: summary.motion,
      confidence: summary.confidence
    };
    return summary;
  }

  if (state.presenceHoldEnabled && state.lastPresenceAt && now - state.lastPresenceAt <= PRESENCE_HOLD_MS) {
    const heldConfidence = Math.max(safeNumber(state.lastPresenceSnapshot?.confidence, 0), safeNumber(summary.confidence, 0));
    return {
      ...summary,
      presence: true,
      motion: state.lastPresenceSnapshot?.motion || 'present_still',
      confidence: heldConfidence,
      held: true
    };
  }

  return summary;
}

function hasRecentSummary(windowMs = LIVE_STICKY_MS) {
  return Boolean(state.summary?.receivedAt && Date.now() - state.summary.receivedAt <= windowMs);
}

function summaryScore(summary, origin = 'poll') {
  if (!summary || summary.ignored || summary.demoBlocked || !summary.hasData) return -100;

  let score = 0;
  if (isEsp32Source(summary.source)) score += 12;
  if (origin === 'ws') score += 4;
  if (summary.nodeCount > 0) score += Math.min(8, summary.nodeCount * 2);
  if (safeNumber(summary.rssi) !== null) score += 4;
  if (summary.classification && !looksEmptyClassification(summary.classification)) score += 5;
  if (Object.keys(summary.features || {}).some(key => safeNumber(summary.features[key]) !== null)) score += 2;
  if (safeNumber(summary.frameRate) !== null) score += 2;
  if (summary.hasRawCsi) score += 4;
  return score;
}

function shouldKeepCurrentSummary(next, origin) {
  if (!state.summary || !hasRecentSummary()) return false;
  if (!next?.hasData) return true;

  const nextScore = summaryScore(next, origin);
  const currentScore = summaryScore(state.summary, state.lastAcceptedOrigin || 'poll');
  const currentLooksPresent = state.summary.presence === true || displayMotionLevel(state.summary.motion) !== 'absent';
  const nextLooksAbsent = next.presence !== true && displayMotionLevel(next.motion) === 'absent';

  if (currentLooksPresent && nextLooksAbsent && nextScore <= currentScore + 2) return true;
  return nextScore + 5 < currentScore;
}

function mergeLiveValue(previous, next, key) {
  const value = next[key];
  if (value !== undefined && value !== null && value !== '') return value;
  return hasRecentSummary() ? previous?.[key] : value;
}

function mergeMetadataOnly(next = {}) {
  if (!state.summary) return;
  state.summary = {
    ...state.summary,
    clients: next.clients ?? state.health?.clients ?? state.summary.clients,
    tick: next.tick ?? state.health?.tick ?? state.summary.tick
  };
}

function formatPercent(value) {
  const number = safeNumber(value);
  if (number === null) return '-';
  const percent = number <= 1 ? number * 100 : number;
  return `${percent.toFixed(0)}%`;
}

function formatRssi(value) {
  const number = safeNumber(value);
  return number === null ? '-- dBm' : `${number.toFixed(1)} dBm`;
}

function formatNumber(value, digits = 3) {
  const number = safeNumber(value, 0);
  return number.toFixed(digits);
}

function rssiQuality(value) {
  const rssi = safeNumber(value);
  if (rssi === null) return 'качество: -';
  if (rssi >= -55) return 'качество: хороший';
  if (rssi >= -67) return 'качество: нормальный';
  if (rssi >= -80) return 'качество: слабый';
  return 'качество: плохой';
}

function freshnessText(summary) {
  if (!summary?.receivedAt) return 'нет данных';
  const seconds = Math.max(0, Math.round((Date.now() - summary.receivedAt) / 1000));
  if (seconds < 2) return 'только что';
  return `${seconds} с назад`;
}

function mode(summary = state.summary) {
  if (state.apiError && !summary?.hasData) return { text: 'Нет связи', className: 'status-bad' };
  if (summary?.demoBlocked || (!summary?.hasData && Date.now() - state.lastIgnoredDemoAt < 5000)) return { text: 'Только live', className: 'status-warn' };
  if (isEsp32Source(summary?.source) && summary?.hasData) return { text: 'LIVE ESP32', className: 'status-live' };
  if (isEsp32Source(summary?.source)) return { text: 'Жду ESP32', className: 'status-wait' };
  if (state.demoEnabled && isDemoSource(summary?.source)) return { text: 'DEMO', className: 'status-warn' };
  return { text: 'Подключение', className: 'status-wait' };
}

function updateText(name, value) {
  const next = String(value ?? '-');
  for (const element of document.querySelectorAll(`[data-bind="${name}"]`)) {
    if (element.textContent !== next) element.textContent = next;
  }
}

function setPill(name, value, className) {
  for (const element of document.querySelectorAll(`[data-bind="${name}"]`)) {
    if (element.textContent !== value) element.textContent = value;
    element.classList.remove('status-live', 'status-wait', 'status-warn', 'status-bad');
    if (className) element.classList.add(className);
  }
}

function setBar(name, value, max) {
  const number = safeNumber(value, 0);
  const percent = Math.max(0, Math.min(100, max > 0 ? (number / max) * 100 : 0));
  for (const element of document.querySelectorAll(`[data-bar="${name}"]`)) {
    const width = `${percent.toFixed(2)}%`;
    if (element.style.width !== width) element.style.width = width;
  }
}

function setPage(pageId) {
  const page = GROUPS.flatMap(group => group.pages).find(candidate => candidate.id === pageId) || GROUPS[0].pages[0];
  const group = GROUPS.find(candidate => candidate.pages.some(item => item.id === page.id)) || GROUPS[0];
  state.activeGroup = group.id;
  state.activePage = page.id;
  history.replaceState(null, '', `#${page.id}`);
  renderNavigation();
  for (const element of document.querySelectorAll('.page')) {
    element.classList.toggle('active', element.dataset.page === page.id);
  }
  scheduleRender();
}

function renderNavigation() {
  for (const button of document.querySelectorAll('.group-button')) {
    button.classList.toggle('active', button.dataset.group === state.activeGroup);
  }

  const group = GROUPS.find(candidate => candidate.id === state.activeGroup) || GROUPS[0];
  const host = document.querySelector('.page-nav');
  const signature = `${state.activeGroup}:${state.activePage}`;
  if (host.dataset.signature !== signature) {
    host.innerHTML = group.pages.map(page => (
      `<button class="page-button ${page.id === state.activePage ? 'active' : ''}" type="button" data-page-target="${page.id}">${page.label}</button>`
    )).join('');
    host.dataset.signature = signature;
  }
}

function render() {
  state.renderQueued = false;
  const summary = state.summary;
  const currentMode = mode(summary);

  setPill('modeLabel', currentMode.text, currentMode.className);
  setPill('sourceBadge', currentMode.text, currentMode.className);
  setPill('signalMode', currentMode.text, currentMode.className);
  updateText('clock', new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  updateText('freshness', freshnessText(summary));

  if (!summary || !summary.hasData) {
    renderEmpty(summary);
    drawSignalCanvas(summary);
    drawRssiCanvas();
    return;
  }

  const presence = summary.presence === true;
  const motion = displayMotionLevel(summary.motion);
  const confidence = formatPercent(summary.confidence);
  const breathing = safeNumber(summary.breathing);
  const orb = document.querySelector('[data-presence-orb]');
  if (orb) {
    orb.classList.toggle('present', presence && motion !== 'motion');
    orb.classList.toggle('motion', motion === 'motion');
  }

  updateText('presenceWord', motionLabel(motion, presence));
  updateText('homeSummary', motion === 'motion' ? 'В доме есть движение' : presence ? 'В доме есть присутствие' : 'Присутствие не видно');
  updateText('homeDetail', detailText(summary));
  updateText('presence', presence ? 'Да' : 'Нет');
  updateText('motion', motionDetail(motion));
  updateText('confidence', confidence);
  updateText('rssi', formatRssi(summary.rssi));
  updateText('rssiQuality', rssiQuality(summary.rssi));
  updateText('breathing', breathing === null ? 'Недоступно' : `${breathing.toFixed(1)} bpm`);
  updateText('breathingReason', breathing === null ? 'нет raw CSI/vitals' : `confidence ${formatPercent(summary.breathingConfidence)}`);
  updateText('sensingRssi', formatRssi(summary.rssi));
  updateText('sensingSource', summary.source);
  updateText('sensingNodes', summary.nodeCount);
  updateText('sensingClass', motionLabel(motion, presence));
  updateText('sensingConfidence', confidence);
  updateText('sensingFreshness', freshnessText(summary));
  updateText('variance', formatNumber(summary.features.variance));
  updateText('motionBand', formatNumber(summary.features.motion_band_power));
  updateText('breathBand', formatNumber(summary.features.breathing_band_power));
  updateText('spectralPower', formatNumber(summary.features.spectral_power));
  updateText('apiStatus', state.apiError ? 'ошибка' : 'ok');
  updateText('wsStatus', state.wsConnected ? 'connected' : 'reconnect');
  updateText('clients', summary.clients ?? '-');
  updateText('tick', summary.tick ?? '-');
  updateText('dataMode', summary.hasRawCsi ? 'raw CSI' : 'feature_state');
  updateText('rawCsi', summary.hasRawCsi ? 'есть' : 'нет');
  updateText('frameRate', summary.frameRate === undefined || summary.frameRate === null ? '-' : `${safeNumber(summary.frameRate, 0).toFixed(1)} Hz`);
  updateText('subcarriers', summary.subcarriers ?? '0');
  updateText('hardwareSummary', summary.nodeCount ? `${summary.nodeCount} ESP32 node(s), ${formatRssi(summary.rssi)}` : 'Жду live ESP32.');
  updateText('rawCsiTraining', summary.hasRawCsi ? 'есть' : 'нет');
  updateText('multiNodeTraining', summary.nodeCount > 1 ? 'есть' : 'нет');

  setBar('variance', summary.features.variance, 10);
  setBar('motionBand', summary.features.motion_band_power, 0.5);
  setBar('breathBand', summary.features.breathing_band_power, 0.3);
  setBar('spectralPower', summary.features.spectral_power, 2);
  renderNodes(summary);
  renderTimeline();
  drawSignalCanvas(summary);
  drawRssiCanvas();
  updateTrainingFlags(summary);
}

function renderEmpty(summary) {
  const demoOnly = summary?.demoBlocked || Date.now() - state.lastIgnoredDemoAt < 5000;
  const orb = document.querySelector('[data-presence-orb]');
  if (orb) {
    orb.classList.remove('present', 'motion');
  }
  const text = demoOnly ? 'Демо-данные выключены' : 'Жду ESP32';
  updateText('presenceWord', 'Нет данных');
  updateText('homeSummary', text);
  updateText('homeDetail', demoOnly ? 'Simulated/mock кадры игнорируются. Включи демо в настройках только для проверки UI.' : 'Проверь питание ESP32, WiFi и UDP порт 5005.');
  for (const name of ['presence', 'confidence', 'rssi', 'sensingRssi', 'sensingClass', 'sensingConfidence']) updateText(name, '-');
  updateText('motion', 'motion: -');
  updateText('rssiQuality', 'качество: -');
  updateText('breathing', 'Недоступно');
  updateText('breathingReason', 'нет raw CSI');
  updateText('sensingSource', summary?.source || '-');
  updateText('sensingNodes', '0');
  updateText('sensingFreshness', freshnessText(summary));
  updateText('apiStatus', state.apiError ? 'ошибка' : 'ok');
  updateText('wsStatus', state.wsConnected ? 'connected' : 'reconnect');
  updateText('rawCsi', 'нет');
  updateText('dataMode', '-');
  updateText('frameRate', '-');
  updateText('subcarriers', '0');
  updateText('hardwareSummary', 'Жду live ESP32.');
  updateText('rawCsiTraining', 'нет');
  updateText('multiNodeTraining', 'нет');
  renderNodes(summary);
  renderTimeline();
  updateTrainingFlags({ hasRawCsi: false, nodeCount: 0 });
}

function detailText(summary) {
  const parts = [
    `${formatRssi(summary.rssi)}`,
    `confidence ${formatPercent(summary.confidence)}`,
    freshnessText(summary)
  ];
  if (summary.held) parts.push('presence hold');
  if (!summary.hasRawCsi) parts.push('raw CSI нет');
  return parts.join(' · ');
}

function pushTimeline(summary) {
  if (!summary || !summary.hasData) return;
  const key = `${summary.presence}:${displayMotionLevel(summary.motion)}:${Math.round(safeNumber(summary.confidence, 0) * 100)}`;
  if (state.timeline[0]?.key === key) return;
  state.timeline.unshift({
    key,
    time: new Date(),
    text: `${motionLabel(summary.motion, summary.presence)} · ${formatRssi(summary.rssi)} · ${formatPercent(summary.confidence)}`
  });
  state.timeline = state.timeline.slice(0, 12);
}

function renderTimeline() {
  const host = document.getElementById('timeline');
  if (!host) return;
  const signature = state.timeline.map(item => `${item.key}:${item.time.getTime()}`).join('|');
  if (host.dataset.signature === signature) return;
  host.innerHTML = state.timeline.length
    ? state.timeline.map(item => `<li><span>${item.text}</span><time>${item.time.toLocaleTimeString('ru-RU')}</time></li>`).join('')
    : '<li><span>Событий пока нет</span><time>-</time></li>';
  host.dataset.signature = signature;
}

function renderNodes(summary) {
  const host = document.getElementById('nodeGrid');
  if (!host) return;
  const nodeFeatures = summary?.nodeFeatures || [];
  const nodes = summary?.nodes || [];
  const ids = [...new Set([
    ...nodes.map(node => node.node_id),
    ...nodeFeatures.map(node => node.node_id)
  ].filter(value => value !== undefined && value !== null))];
  const signature = ids.join('|') || 'empty';
  if (host.dataset.signature !== signature) {
    host.innerHTML = ids.length
      ? ids.map(id => `<article class="node-card" data-node="${id}">
          <h4>ESP32 node ${id}</h4>
          <dl>
            <dt>RSSI</dt><dd data-node-field="rssi">-</dd>
            <dt>Presence</dt><dd data-node-field="presence">-</dd>
            <dt>Motion</dt><dd data-node-field="motion">-</dd>
            <dt>Frame rate</dt><dd data-node-field="frameRate">-</dd>
          </dl>
        </article>`).join('')
      : '<article class="node-card"><h4>ESP32 не виден</h4><p>Жду UDP пакеты на VM.</p></article>';
    host.dataset.signature = signature;
  }

  for (const id of ids) {
    const card = host.querySelector(`[data-node="${CSS.escape(String(id))}"]`);
    if (!card) continue;
    const node = nodes.find(item => String(item.node_id) === String(id)) || {};
    const feature = nodeFeatures.find(item => String(item.node_id) === String(id)) || {};
    const classification = normalizeClassification(feature.classification || {});
    setNodeField(card, 'rssi', formatRssi(pickFirst(feature.rssi_dbm, node.rssi_dbm)));
    setNodeField(card, 'presence', classification.presence ? 'да' : 'нет');
    setNodeField(card, 'motion', motionLabel(classification.motion_level, classification.presence));
    setNodeField(card, 'frameRate', feature.frame_rate_hz === undefined || feature.frame_rate_hz === null ? '-' : `${safeNumber(feature.frame_rate_hz, 0).toFixed(1)} Hz`);
  }
}

function setNodeField(card, name, value) {
  const element = card.querySelector(`[data-node-field="${name}"]`);
  if (element && element.textContent !== String(value)) element.textContent = String(value);
}

function updateTrainingFlags(summary) {
  const raw = document.querySelector('[data-ready="raw"]');
  const nodes = document.querySelector('[data-ready="nodes"]');
  if (raw) raw.dataset.ok = summary.hasRawCsi ? 'true' : 'false';
  if (nodes) nodes.dataset.ok = summary.nodeCount > 1 ? 'true' : 'false';
}

function drawSignalCanvas(summary) {
  const canvas = document.getElementById('signalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fbfa';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#dbe2dd';
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, height - 24);
    ctx.stroke();
  }
  for (let y = 52; y < height; y += 62) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
  }

  const confidence = safeNumber(summary?.confidence, 0);
  const rssi = safeNumber(summary?.rssi, -80);
  const motion = displayMotionLevel(summary?.motion);
  const radius = 42 + Math.max(0, Math.min(1, confidence <= 1 ? confidence : confidence / 100)) * 80;
  const x = width * 0.5 + Math.sin(Date.now() / 1600) * 28;
  const y = height * 0.52 + Math.cos(Date.now() / 1900) * 18;
  const color = motion === 'motion' ? [180, 66, 75] : summary?.presence ? [47, 143, 98] : [22, 131, 145];
  const gradient = ctx.createRadialGradient(x, y, 6, x, y, radius);
  gradient.addColorStop(0, `rgba(${color.join(',')}, 0.42)`);
  gradient.addColorStop(0.6, `rgba(${color.join(',')}, 0.14)`);
  gradient.addColorStop(1, `rgba(${color.join(',')}, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#18343a';
  ctx.font = '700 18px system-ui';
  ctx.fillText(summary?.hasData ? motionLabel(motion, summary.presence) : 'Нет live данных', 28, 34);
  ctx.fillStyle = '#66747a';
  ctx.font = '500 14px system-ui';
  ctx.fillText(`RSSI ${formatRssi(rssi)} · ${formatPercent(confidence)}`, 28, 58);
}

function drawRssiCanvas() {
  const canvas = document.getElementById('rssiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fbfa';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#dbe2dd';
  ctx.lineWidth = 1;
  for (let y = 36; y < height; y += 44) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
  }

  const values = state.rssiHistory;
  if (values.length < 2) {
    ctx.fillStyle = '#66747a';
    ctx.font = '500 15px system-ui';
    ctx.fillText('История появится после нескольких live пакетов', 28, 42);
    return;
  }

  const min = -95;
  const max = -35;
  ctx.strokeStyle = '#168391';
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = 24 + (index / Math.max(1, values.length - 1)) * (width - 48);
    const y = height - 26 - ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * (height - 52);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function scheduleRender() {
  if (state.renderQueued) return;
  state.renderQueued = true;
  requestAnimationFrame(render);
}

function mergeSummary(summary, origin = 'poll') {
  if (!summary) return;
  if (summary.ignored || summary.demoBlocked) {
    state.lastIgnoredDemoAt = Date.now();
    scheduleRender();
    return;
  }

  if (shouldKeepCurrentSummary(summary, origin)) {
    mergeMetadataOnly(summary);
    scheduleRender();
    return;
  }

  if (!summary.hasData && state.summary) {
    if (hasRecentSummary()) {
      mergeMetadataOnly(summary);
    } else {
      state.summary = summary;
      state.lastAcceptedOrigin = origin;
      state.lastAcceptedScore = summaryScore(summary, origin);
    }
    scheduleRender();
    return;
  }

  const previous = state.summary || {};
  const merged = {
    ...previous,
    ...summary,
    clients: summary.clients ?? state.health?.clients ?? previous.clients,
    tick: summary.tick ?? state.health?.tick ?? previous.tick,
    features: {
      ...(hasRecentSummary() ? previous.features || {} : {}),
      ...(summary.features || {})
    },
    nodes: summary.nodes?.length ? summary.nodes : hasRecentSummary() ? previous.nodes || [] : [],
    nodeFeatures: summary.nodeFeatures?.length ? summary.nodeFeatures : hasRecentSummary() ? previous.nodeFeatures || [] : [],
    nodeIds: summary.nodeIds?.length ? summary.nodeIds : hasRecentSummary() ? previous.nodeIds || [] : [],
    nodeCount: summary.nodeCount || (hasRecentSummary() ? previous.nodeCount || 0 : 0)
  };

  for (const key of ['rssi', 'confidence', 'motion', 'breathing', 'breathingConfidence', 'heartRate', 'frameRate', 'subcarriers']) {
    merged[key] = mergeLiveValue(previous, summary, key);
  }

  if (!summary.classification || looksEmptyClassification(summary.classification)) {
    if (hasRecentSummary()) {
      merged.classification = previous.classification || summary.classification;
      merged.presence = previous.presence ?? summary.presence;
      merged.motion = previous.motion ?? summary.motion;
      merged.confidence = previous.confidence ?? summary.confidence;
    } else {
      merged.classification = summary.classification;
    }
  }

  state.summary = merged;
  state.lastAcceptedOrigin = origin;
  state.lastAcceptedScore = summaryScore(merged, origin);
  const rssi = safeNumber(state.summary.rssi);
  if (rssi !== null) {
    state.rssiHistory.push(rssi);
    state.rssiHistory = state.rssiHistory.slice(-MAX_HISTORY);
  }
  pushTimeline(state.summary);
  scheduleRender();
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function poll() {
  try {
    const [health, status, latest] = await Promise.allSettled([
      fetchJson('/health'),
      fetchJson('/api/v1/status'),
      fetchJson('/api/v1/sensing/latest')
    ]);
    state.health = health.status === 'fulfilled' ? health.value : state.health;
    state.status = status.status === 'fulfilled' ? status.value : state.status;
    state.apiError = latest.status === 'rejected' && health.status === 'rejected' && status.status === 'rejected'
      ? latest.reason
      : null;
    if (latest.status === 'fulfilled') {
      mergeSummary(normalizeFrame(latest.value, {
        source: state.status?.source || state.health?.source,
        clients: state.health?.clients,
        tick: state.health?.tick
      }), 'poll');
    } else {
      scheduleRender();
    }
  } catch (error) {
    state.apiError = error;
    scheduleRender();
  }
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws/sensing`;
  let ws;
  try {
    ws = new WebSocket(url);
  } catch (error) {
    state.wsConnected = false;
    state.wsError = error;
    scheduleRender();
    setTimeout(connectWebSocket, 3000);
    return;
  }

  ws.addEventListener('open', () => {
    state.wsConnected = true;
    state.wsError = null;
    scheduleRender();
  });

  ws.addEventListener('message', event => {
    try {
      const frame = JSON.parse(event.data);
      const summary = normalizeFrame(frame, {
        source: state.status?.source || state.health?.source,
        clients: state.health?.clients,
        tick: state.health?.tick
      });
      mergeSummary(summary, 'ws');
    } catch (error) {
      state.wsError = error;
    }
  });

  ws.addEventListener('close', () => {
    state.wsConnected = false;
    scheduleRender();
    setTimeout(connectWebSocket, 2500);
  });

  ws.addEventListener('error', () => {
    state.wsConnected = false;
    scheduleRender();
  });
}

function bindEvents() {
  document.querySelector('.group-nav')?.addEventListener('click', event => {
    const button = event.target.closest('[data-group]');
    if (!button) return;
    const group = GROUPS.find(candidate => candidate.id === button.dataset.group);
    if (group) setPage(group.pages[0].id);
  });

  document.querySelector('.page-nav')?.addEventListener('click', event => {
    const button = event.target.closest('[data-page-target]');
    if (button) setPage(button.dataset.pageTarget);
  });

  window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '');
    if (page) setPage(page);
  });

  const dialog = document.getElementById('settingsDialog');
  document.getElementById('settingsButton')?.addEventListener('click', () => {
    if (dialog?.showModal) dialog.showModal();
    else dialog?.setAttribute('open', '');
  });

  const demoToggle = document.getElementById('demoToggle');
  if (demoToggle) {
    demoToggle.checked = state.demoEnabled;
    demoToggle.addEventListener('change', () => {
      state.demoEnabled = demoToggle.checked;
      writeBool(DEMO_KEY, state.demoEnabled);
      if (!state.demoEnabled && state.summary && isDemoSource(state.summary.source)) {
        state.summary = null;
        state.timeline = [];
        state.rssiHistory = [];
        state.lastAcceptedOrigin = null;
        state.lastAcceptedScore = 0;
      }
      poll();
    });
  }

  const presenceHoldToggle = document.getElementById('presenceHoldToggle');
  if (presenceHoldToggle) {
    presenceHoldToggle.checked = state.presenceHoldEnabled;
    presenceHoldToggle.addEventListener('change', () => {
      state.presenceHoldEnabled = presenceHoldToggle.checked;
      writeBool(PRESENCE_HOLD_KEY, state.presenceHoldEnabled);
    });
  }
}

function disableOldServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
      .catch(() => {});
  }

  if ('caches' in window) {
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('ruview-')).map(key => caches.delete(key))))
      .catch(() => {});
  }
}

function startClock() {
  setInterval(() => {
    updateText('clock', new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateText('freshness', freshnessText(state.summary));
  }, 1000);
}

function init() {
  disableOldServiceWorker();
  bindEvents();
  renderNavigation();
  const initialPage = window.location.hash.replace('#', '') || 'home';
  setPage(initialPage);
  startClock();
  poll();
  connectWebSocket();
  setInterval(poll, POLL_MS);
}

init();
