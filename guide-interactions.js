(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  let initial = {};
  try { initial = JSON.parse(byId('guide-page-data')?.textContent || '{}'); } catch {}
  let mediaMap = new Map((initial.media || []).map(slot => [slot.id, slot]));
  let currentStep = 0;
  const safeLink = value => {
    try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  };

  const dialog = document.createElement('dialog');
  dialog.className = 'media-dialog';
  dialog.id = 'media-dialog';
  dialog.setAttribute('aria-label', 'Image detail');
  dialog.innerHTML = '<div class="dialog-header"><h2 id="dialog-title"></h2><button type="button" id="dialog-close">Close ×</button></div><img id="dialog-image" alt=""><p id="dialog-caption"></p>';
  document.body.append(dialog);
  byId('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  function openImage(slot) {
    byId('dialog-title').textContent = slot.alt || slot.label || 'Image detail';
    byId('dialog-image').src = slot.src;
    byId('dialog-image').alt = slot.alt || slot.label || 'Guide image';
    const caption = byId('dialog-caption');
    caption.replaceChildren();
    caption.textContent = [slot.caption, slot.credit ? 'Image: ' + slot.credit : ''].filter(Boolean).join(' · ');
    const href = safeLink(slot.sourceUrl || '');
    if (slot.sourceUrl && href) {
      caption.append(' · ');
      const source = document.createElement('a'); source.href = href; source.textContent = 'Source'; caption.append(source);
    }
    dialog.showModal();
  }
  function enhanceMedia(container) {
    const anchor = container.querySelector('[data-enlarge-image]');
    const image = container.querySelector('img');
    if (!anchor || !image || anchor.dataset.imageEnhanced) return;
    anchor.dataset.imageEnhanced = 'true';
    anchor.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      const slot = mediaMap.get(container.dataset.mediaSlot) || {src: image.getAttribute('src'), alt: image.alt, caption: container.querySelector('figcaption')?.textContent || ''};
      if (!safeLink(slot.src)) return;
      event.preventDefault(); openImage(slot);
    });
  }
  function renderMedia(container) {
    const slot = mediaMap.get(container.dataset.mediaSlot);
    if (!slot?.src || !safeLink(slot.src)) { enhanceMedia(container); return; }
    const existing = container.querySelector('img');
    const figure = document.createElement('figure');
    const anchor = document.createElement('a');
    anchor.href = slot.src; anchor.className = 'media-preview-button'; anchor.dataset.enlargeImage = '';
    anchor.setAttribute('aria-label', 'Enlarge ' + (slot.alt || slot.label || 'guide image'));
    const image = document.createElement('img');
    image.src = slot.src; image.alt = slot.alt || slot.label || 'Guide image'; image.loading = 'lazy'; image.decoding = 'async';
    if (existing?.getAttribute('src') === slot.src) {
      for (const dimension of ['width', 'height']) if (existing.hasAttribute(dimension)) image.setAttribute(dimension, existing.getAttribute(dimension));
    }
    const zoom = document.createElement('span'); zoom.className = 'zoom-label'; zoom.textContent = 'View image ↗';
    anchor.append(image, zoom);
    const caption = document.createElement('figcaption'); caption.className = 'media-caption';
    const text = document.createElement('span'); text.textContent = container.closest('.reward-card') ? 'Game asset · ' + slot.credit : slot.caption; caption.append(text);
    if (!container.closest('.reward-card') && slot.credit) {
      const credit = document.createElement('span'); credit.textContent = 'Image: ' + slot.credit; caption.append(credit);
    }
    const sourceUrl = safeLink(slot.sourceUrl || '');
    if (slot.sourceUrl && sourceUrl) {
      const source = document.createElement('a'); source.href = sourceUrl; source.textContent = 'Image source'; caption.append(source);
    }
    figure.append(anchor, caption); container.replaceChildren(figure); enhanceMedia(container);
    image.addEventListener('error', () => {
      const message = document.createElement('p'); message.className = 'media-caption'; message.textContent = 'Image unavailable. The written instructions remain available.'; container.append(message);
    }, {once: true});
  }
  document.querySelectorAll('[data-media-slot]').forEach(enhanceMedia);

  function chooseStep(index, focusTab = false) {
    const panels = [...document.querySelectorAll('[data-step-panel]')];
    if (!panels.length) return;
    currentStep = Math.max(0, Math.min(panels.length - 1, index));
    panels.forEach((panel, i) => {
      panel.hidden = i !== currentStep; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'step-tab-' + i); panel.tabIndex = 0;
    });
    document.querySelectorAll('[data-step]').forEach(button => {
      const selected = Number(button.dataset.step) === currentStep; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) button.focus();
    });
    byId('step-prev').disabled = currentStep === 0;
    byId('step-next').disabled = currentStep === panels.length - 1;
    byId('step-counter').textContent = 'Step ' + (currentStep + 1) + ' of ' + panels.length;
    document.querySelectorAll('[data-step-controls]').forEach(control => { control.hidden = false; });
  }
  document.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => chooseStep(Number(button.dataset.step)));
    button.addEventListener('keydown', event => {
      let next = currentStep;
      if (event.key === 'ArrowRight') next++; else if (event.key === 'ArrowLeft') next--;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = document.querySelectorAll('[data-step-panel]').length - 1;
      else return;
      event.preventDefault(); chooseStep(next, true);
    });
  });
  byId('step-prev')?.addEventListener('click', () => chooseStep(currentStep - 1));
  byId('step-next')?.addEventListener('click', () => chooseStep(currentStep + 1));
  chooseStep(0);

  function enhanceGroup(buttonSelector, panelSelector, buttonKey, panelKey, controlsSelector, first) {
    const buttons = [...document.querySelectorAll(buttonSelector)], panels = [...document.querySelectorAll(panelSelector)];
    if (!buttons.length || !panels.length) return;
    function choose(value) {
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset[buttonKey] === value)));
      panels.forEach(panel => { panel.hidden = panel.dataset[panelKey] !== value; });
    }
    buttons.forEach(button => button.addEventListener('click', () => choose(button.dataset[buttonKey])));
    choose(first); document.querySelectorAll(controlsSelector).forEach(control => { control.hidden = false; });
  }
  enhanceGroup('[data-milestone]', '[data-milestone-panel]', 'milestone', 'milestonePanel', '[data-timeline-controls]', '0');
  enhanceGroup('[data-profile-view]', '[data-profile-panel]', 'profileView', 'profilePanel', '[data-profile-controls]', '0');
  enhanceGroup('[data-purchase]', '[data-purchase-panel]', 'purchase', 'purchasePanel', '[data-purchase-controls]', 'pass');

  const boxes = [...document.querySelectorAll('[data-reward]')]; let collected = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem('zz-teto-rewards') || '[]');
    if (Array.isArray(raw)) collected = new Set(raw.filter(value => /^\d+$/.test(String(value)) && Number(value) < 15).map(String));
  } catch {}
  function syncChecklist() {
    boxes.forEach(box => { box.checked = collected.has(box.dataset.reward); });
    document.querySelectorAll('[data-reward-card]').forEach(card => card.classList.toggle('is-collected', collected.has(card.dataset.rewardCard)));
    const status = byId('check-status'); if (status) status.textContent = collected.size + ' / 15 marked collected on this browser.';
  }
  function saveChecklist() { try { localStorage.setItem('zz-teto-rewards', JSON.stringify([...collected])); } catch {} syncChecklist(); }
  boxes.forEach(box => box.addEventListener('change', () => { if (box.checked) collected.add(box.dataset.reward); else collected.delete(box.dataset.reward); saveChecklist(); }));
  byId('reset')?.addEventListener('click', () => { collected.clear(); saveChecklist(); }); syncChecklist();

  let pageFilter = 0;
  function filterRewards() {
    const type = byId('reward-type')?.value || 'all'; let count = 0;
    document.querySelectorAll('[data-reward-card]').forEach(card => {
      const show = (!pageFilter || Number(card.dataset.passPage) === pageFilter) && (type === 'all' || card.dataset.kind === type); card.hidden = !show; if (show) count++;
    });
    if (byId('gallery-count')) byId('gallery-count').textContent = count + ' reward ' + (count === 1 ? 'entry' : 'entries');
  }
  document.querySelectorAll('[data-page-filter]').forEach(button => button.addEventListener('click', () => {
    pageFilter = Number(button.dataset.pageFilter); document.querySelectorAll('[data-page-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button))); filterRewards();
  }));
  byId('reward-type')?.addEventListener('change', filterRewards);

  function balance() {
    const input = byId('vb-balance'); if (!input) return;
    const raw = input.value.trim(), value = Number(raw);
    if (raw === '' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value) || value > 1000000) { byId('vb-result').textContent = 'Enter a whole-number balance between 0 and 1,000,000 V-Bucks.'; return; }
    const gap = Math.max(0, 1000 - value);
    byId('vb-result').textContent = gap ? 'You need ' + gap.toLocaleString('en-US') + ' more V-Bucks to reach the pass price.' : 'Your entered balance covers the announced 1,000 V-Bucks pass price.';
  }
  byId('vb-balance')?.addEventListener('input', balance); balance();

  // HTML already contains the complete guide and pictures. This optional refresh
  // supports local-editor changes without erasing the page on request failure.
  fetch('/guide-media.json').then(response => {
    if (!response.ok) throw Error('Image manifest unavailable'); return response.json();
  }).then(manifest => {
    if (!Array.isArray(manifest.slots)) return;
    mediaMap = new Map(manifest.slots.map(slot => [slot.id, slot]));
    document.querySelectorAll('[data-media-slot]').forEach(renderMedia);
  }).catch(() => {});
})();

