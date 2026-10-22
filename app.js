/**
 * ==========================================================================
 * EXPRESSIVE MODEL MAKING CO. — OFFICIAL FRONTEND LOGIC (MULTI-PAGE)
 * ==========================================================================
 * Handles theme switching, mobile drawer navigation, active link matching,
 * dynamic gallery rendering, lightbox, testimonials, and contact submissions.
 */

// --- SAFE STORAGE WRAPPER (Protects against file:// or private browsing exceptions) ---
const SafeStorage = {
  get: function (key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set: function (key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  },
  remove: function (key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

// Immediate pre-render theme application to avoid any white flash
(function preapplyTheme() {
  const saved = SafeStorage.get('emm_theme') || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);
  if (document.body) document.body.setAttribute('data-theme', saved);
})();

// --- 1. THEME SWITCHER (Light / Dark) ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (document.body) document.body.setAttribute('data-theme', theme);

  const isDark = theme === 'dark';
  const sunSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.classList.add('theme-animating');
    setTimeout(() => btn.classList.remove('theme-animating'), 420);

    const iconWrap = btn.querySelector('.theme-icon-wrap');
    if (iconWrap) {
      iconWrap.innerHTML = isDark ? sunSvg : moonSvg;
      const textLabel = btn.querySelector('.theme-mode-label');
      if (textLabel) {
        textLabel.textContent = isDark ? 'Dark Theme (Active)' : 'Light Theme (Active)';
      }
    } else {
      btn.innerHTML = isDark ? sunSvg : moonSvg;
    }
    const labelText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    btn.setAttribute('title', labelText);
    btn.setAttribute('aria-label', labelText);
  });

  try {
    window.dispatchEvent(new CustomEvent('emm-theme-change', { detail: { theme: theme, isDark: isDark } }));
  } catch (e) {}
}

function initTheme() {
  const currentTheme = SafeStorage.get('emm_theme') || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(currentTheme);

  let lastToggleTime = 0;
  function handleThemeToggle(e) {
    const now = Date.now();
    if (now - lastToggleTime < 250) return; // Prevent double trigger on touch+click
    lastToggleTime = now;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    SafeStorage.set('emm_theme', newTheme);
  }

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = 'true';

    btn.addEventListener('click', handleThemeToggle);
  });
}

// --- 2. MOBILE DRAWER NAVIGATION & STICKY NAVBAR ---
function initMobileNavigation() {
  const headerNav = document.getElementById('headerNav');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerClose = document.getElementById('drawerClose');

  if (headerNav && !headerNav.dataset.scrollBound) {
    headerNav.dataset.scrollBound = 'true';

    // Inject reading scroll progress bar into header nav
    let progressBar = headerNav.querySelector('.nav-scroll-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'nav-scroll-progress';
      headerNav.appendChild(progressBar);
    }

    // Inject live status dot into brand tagline
    document.querySelectorAll('.brand-tagline').forEach(tag => {
      if (!tag.querySelector('.brand-tagline-dot')) {
        const dot = document.createElement('span');
        dot.className = 'brand-tagline-dot';
        tag.prepend(dot);
      }
    });

    function updateNavScroll() {
      const scrollY = window.scrollY;
      const topBar = document.querySelector('.top-bar');
      const triggerHeight = (topBar && topBar.offsetHeight > 0) ? Math.max(10, topBar.offsetHeight - 4) : 20;
      if (scrollY > triggerHeight) {
        headerNav.classList.add('scrolled');
      } else {
        headerNav.classList.remove('scrolled');
      }

      // Update scroll progress width
      if (progressBar) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const pct = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollY / maxScroll) * 100)) : 0;
        progressBar.style.width = pct + '%';
      }
    }

    let scrollTicking = false;
    window.addEventListener('scroll', function () {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          updateNavScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    // Execute immediately on load so navbar is purely transparent when at top
    updateNavScroll();
  }

  function openDrawer(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (mobileDrawer) mobileDrawer.classList.add('open');
    if (drawerBackdrop) drawerBackdrop.classList.add('open');
    if (mobileToggle) mobileToggle.classList.add('active');
    document.body.classList.add('drawer-open-lock');
    document.documentElement.classList.add('drawer-open-lock');
  }

  function closeDrawer(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (mobileDrawer) mobileDrawer.classList.remove('open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('open');
    if (mobileToggle) mobileToggle.classList.remove('active');
    document.body.classList.remove('drawer-open-lock');
    document.documentElement.classList.remove('drawer-open-lock');
  }

  if (mobileToggle && !mobileToggle.dataset.toggleBound) {
    mobileToggle.dataset.toggleBound = 'true';
    mobileToggle.addEventListener('click', function (e) {
      if (mobileDrawer && mobileDrawer.classList.contains('open')) {
        closeDrawer(e);
      } else {
        openDrawer(e);
      }
    });
  }

  if (drawerClose && !drawerClose.dataset.closeBound) {
    drawerClose.dataset.closeBound = 'true';
    drawerClose.addEventListener('click', closeDrawer);
  }

  if (drawerBackdrop && !drawerBackdrop.dataset.backdropBound) {
    drawerBackdrop.dataset.backdropBound = 'true';
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  // Close drawer upon clicking any link inside it
  document.querySelectorAll('.drawer-links a, .drawer-footer-actions a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

// --- 3. MINIMAL QUICK EMAIL POPUP MODAL ---
function ensureEmailModal() {
  let modal = document.getElementById('emailQuickModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'emailQuickModal';
  modal.className = 'email-modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="email-modal-card">
      <div class="email-modal-header">
        <div class="email-modal-title-group">
          <span class="email-badge-icon">✉️</span>
          <div>
            <h3 class="email-modal-title">Email Expressive Model Making</h3>
            <p class="email-modal-subtitle">Direct Studio Correspondence • Mumbai</p>
          </div>
        </div>
        <button type="button" class="email-modal-close" id="closeEmailModalBtn" aria-label="Close modal">&times;</button>
      </div>

      <p class="email-quick-prompt">
        Would you like to open Gmail to email us directly? You can add your contact details below or write them in Gmail.
      </p>

      <form id="emailQuickForm" onsubmit="return false;">
        <div class="email-form-grid">
          <div class="email-input-group">
            <label class="email-input-label" for="quickEmailName">Your Name (Optional)</label>
            <input type="text" id="quickEmailName" class="email-input-control" placeholder="e.g. Rahul Sharma" autocomplete="name">
          </div>
          <div class="email-input-group">
            <label class="email-input-label" for="quickEmailPhone">Phone / WhatsApp (Optional)</label>
            <input type="text" id="quickEmailPhone" class="email-input-control" placeholder="e.g. +91 98199 69376" autocomplete="tel">
          </div>
        </div>

        <div class="email-input-group">
          <label class="email-input-label" for="quickEmailNotes">Project Requirements (Optional)</label>
          <textarea id="quickEmailNotes" class="email-input-control" rows="2" placeholder="e.g. Commercial architectural presentation model, Mumbai..."></textarea>
        </div>

        <div class="email-guide-tip">
          <span>💡</span>
          <div>Add your contact details above or simply click <strong>Open Gmail</strong> below. A clean email composer addressed to <strong>expressivemodel@gmail.com</strong> will open without any long template.</div>
        </div>

        <div class="email-modal-actions">
          <button type="button" class="btn-open-gmail" id="btnOpenGmailConfirm">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
            <span>Open Gmail</span>
          </button>
          <button type="button" class="btn-open-default-mail" id="btnOpenDefaultMailConfirm" title="Open Default System Email App">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>Default Mail</span>
          </button>
          <button type="button" class="btn-copy-email" id="btnCopyEmailConfirm" title="Copy expressivemodel@gmail.com">
            <span>📋 Copy</span>
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModal = () => {
    modal.classList.remove('open');
  };

  const closeBtn = modal.querySelector('#closeEmailModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  const EMAIL_ADDRESS = 'expressivemodel@gmail.com';

  const buildBody = () => {
    const name = (document.getElementById('quickEmailName')?.value || '').trim();
    const phone = (document.getElementById('quickEmailPhone')?.value || '').trim();
    const notes = (document.getElementById('quickEmailNotes')?.value || '').trim();

    const parts = [];
    if (name) parts.push(`Name: ${name}`);
    if (phone) parts.push(`Contact / WhatsApp: ${phone}`);
    if (notes) parts.push(`Project Requirements:\n${notes}`);
    
    if (parts.length === 0) {
      return `Hello Mustafa Rampurawala,\n\nI would like to inquire about a scale model project.\n`;
    }
    return `Hello Mustafa Rampurawala,\n\n${parts.join('\n\n')}\n\nBest regards,\n${name || 'Client'}`;
  };

  const openGmailBtn = modal.querySelector('#btnOpenGmailConfirm');
  if (openGmailBtn) {
    openGmailBtn.addEventListener('click', () => {
      const subject = 'Scale Model Inquiry - Expressive Model Making';
      const body = buildBody();
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_ADDRESS)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      closeModal();
    });
  }

  const defaultMailBtn = modal.querySelector('#btnOpenDefaultMailConfirm');
  if (defaultMailBtn) {
    defaultMailBtn.addEventListener('click', () => {
      const subject = 'Scale Model Inquiry - Expressive Model Making';
      const body = buildBody();
      const mailto = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      closeModal();
    });
  }

  const copyEmailBtn = modal.querySelector('#btnCopyEmailConfirm');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL_ADDRESS).then(() => {
          copyEmailBtn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(() => { copyEmailBtn.innerHTML = '<span>📋 Copy</span>'; }, 2000);
        }).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = EMAIL_ADDRESS;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyEmailBtn.innerHTML = '<span>✓ Copied!</span>';
        setTimeout(() => { copyEmailBtn.innerHTML = '<span>📋 Copy</span>'; }, 2000);
      }
    });
  }

  return modal;
}

function openEmailModal() {
  const modal = ensureEmailModal();
  modal.classList.add('open');
  const nameInput = document.getElementById('quickEmailName');
  if (nameInput) {
    setTimeout(() => nameInput.focus(), 100);
  }
}

function initEmailHandlers() {
  document.querySelectorAll('a[href^="mailto:"], .btn-mail, .btn-email-action, [data-action="send-email"]').forEach(el => {
    if (el.dataset.emailBound) return;
    el.dataset.emailBound = 'true';
    el.addEventListener('click', function(e) {
      e.preventDefault();
      openEmailModal();
    });
  });
}

// --- 4. ACTIVE NAV & BOTTOM BAR LINK SYNC (SUPPORTS CLEAN URLS & FILE PROTOCOL) ---
function initCleanUrlsFallback() {
  if (window.location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:') && !href.includes('.')) {
        a.setAttribute('href', href + '.html');
      }
    });
  }
}

function initActiveLinks() {
  initCleanUrlsFallback();
  const rawPath = window.location.pathname.split('/').pop() || 'index';
  let normCurrent = rawPath.replace(/\.html$/, '');
  if (!normCurrent || normCurrent === '') normCurrent = 'index';

  document.querySelectorAll('.nav-link, .drawer-links a, .bottom-nav-item').forEach(link => {
    const href = link.getAttribute('href') || link.getAttribute('data-page') || '';
    let normHref = href.split('?')[0].split('#')[0].replace(/\.html$/, '').replace(/^\.\//, '');
    if (!normHref || normHref === '') normHref = 'index';

    if (normHref === normCurrent || (normCurrent === 'index' && (normHref === '' || normHref === 'index'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// --- 5. ANIMATED STATISTICS COUNTER ---
function initCounters() {
  const statNumbers = document.querySelectorAll('.stat-count');
  if (statNumbers.length > 0) {
    let statsCounted = false;
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsCounted) {
          statsCounted = true;
          statNumbers.forEach(num => {
            const target = parseInt(num.getAttribute('data-target'), 10);
            const suffix = num.getAttribute('data-suffix') || '';
            animateCounter(num, target, suffix);
          });
        }
      });
    }, { threshold: 0.2 });

    const statsElem = document.querySelector('.stats-grid-row') || document.querySelector('.heritage-grid');
    if (statsElem) statsObserver.observe(statsElem);
  }

  function animateCounter(el, target, suffix) {
    let current = 0;
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }, stepTime);
  }
}

  // --- 4. DYNAMIC GALLERY & CATEGORIES ---
  let currentGalleryData = { categories: [], items: [] };
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategoryParam = urlParams.get('category');
  let activeCategoryFilter = initialCategoryParam ? initialCategoryParam.toLowerCase() : 'all';
  let activeSearchQuery = '';
  let activeGallerySort = SafeStorage.get('emm_gallery_sort') || 'newest';
  let activeViewMode = SafeStorage.get('emm_gallery_view') || 'grid';

  function getOptimizedThumbUrl(url, width = 800) {
    if (!url) return '';
    if (url.includes('googleusercontent.com/d/') && !url.includes('=w')) {
      return `${url}=w${width}`;
    }
    return url;
  }

  const galleryGrid = document.getElementById('galleryGrid');
  const gallerySearchInput = document.getElementById('gallerySearchInput');
  const gallerySearchClear = document.getElementById('gallerySearchClear');

  const DEFAULT_CATEGORIES = [
    { id: 'CAT-bdeb87f8', name: 'Building Models', slug: 'building-models', description: 'Architectural scale replicas of commercial towers, residential townships, and institutional campuses.' },
    { id: 'CAT-79ebe2f6', name: 'Plant Models', slug: 'plant-models', description: 'Comprehensive scale replicas of chemical refineries, power facilities, industrial plants, and port logistics.' },
    { id: 'CAT-6858a1c4', name: 'Machine Models', slug: 'machine-models', description: 'Precision industrial, operational, and reverse-engineered mechanical models.' },
    { id: 'CAT-780e8f84', name: 'Miniature Models', slug: 'miniature-models', description: 'Intricate themed dioramas, waterpark complexes, vehicle miniatures, and landscape scale models.' },
    { id: 'CAT-7468a800', name: 'Monument Models', slug: 'monument-models', description: 'Intricate heritage replicas, civic cultural landmarks, and monumental structures.' },
    { id: 'CAT-dfa27f9e', name: '3D Printing', slug: '3d-printing', description: 'State-of-the-art SLA and FDM 3D printing services, rapid prototyping, and 3D scanning in Mumbai.' }
  ];

  const DEFAULT_CLIENT_PROJECTS = [
    {
      id: 'PRJ-BLD-01',
      title: 'Commercial High-Rise Tower & Retail Podium',
      category: 'building-models',
      categoryId: 'CAT-bdeb87f8',
      categoryName: 'Building Models',
      categorySlug: 'building-models',
      description: 'Precision architectural scale model featuring CNC-milled acrylic curtain walls, dynamic interior floor lighting zones, landscaped public plaza, and illuminated podium canopy.',
      mediaUrl: 'model_building.jpg',
      mediaType: 'image',
      images: [{ url: 'model_building.jpg', caption: 'Front Elevation & Podium Plaza' }, { url: 'model_architectural.jpg', caption: 'Masterplan Context View' }],
      client: 'Lodha Group Mumbai',
      createdAt: '2026-03-12T10:00:00.000Z'
    },
    {
      id: 'PRJ-PLT-02',
      title: 'Petrochemical Refinery & Industrial Complex',
      category: 'plant-models',
      categoryId: 'CAT-79ebe2f6',
      categoryName: 'Plant Models',
      categorySlug: 'plant-models',
      description: 'Comprehensive industrial refinery scale model including distillation towers, color-coded process piping networks, tank farms, cooling stacks, and structural steel truss walkways.',
      mediaUrl: 'model_plant.jpg',
      mediaType: 'image',
      images: [{ url: 'model_plant.jpg', caption: 'Full Complex Process Layout' }],
      client: 'Reliance Industries / BPCL',
      createdAt: '2026-03-05T14:30:00.000Z'
    },
    {
      id: 'PRJ-MCH-03',
      title: 'Heavy Industry Turbine & Precision Power Train',
      category: 'machine-models',
      categoryId: 'CAT-6858a1c4',
      categoryName: 'Machine Models',
      categorySlug: 'machine-models',
      description: 'Engineering cutaway demonstration model built with brass and laser-sintered polymer components showing rotor dynamics, internal bearing blocks, and mechanical drivetrain.',
      mediaUrl: 'model_machine.jpg',
      mediaType: 'image',
      images: [{ url: 'model_machine.jpg', caption: 'Precision Internal Cutaway Detail' }],
      client: 'Larsen & Toubro Heavy Engineering',
      createdAt: '2026-02-20T11:15:00.000Z'
    },
    {
      id: 'PRJ-MIN-04',
      title: 'Themed Waterfront Resort & Island Diorama',
      category: 'miniature-models',
      categoryId: 'CAT-780e8f84',
      categoryName: 'Miniature Models',
      categorySlug: 'miniature-models',
      description: 'Handcrafted scenic diorama utilizing crystal-clear epoxy water effects, botanical topography, handcrafted resort villas, ambient shoreline illumination, and scale maritime vessels.',
      mediaUrl: 'model_miniature.jpg',
      mediaType: 'image',
      images: [{ url: 'model_miniature.jpg', caption: 'Waterfront Lagoon & Island Villas' }],
      client: 'Oberoi Realty Hospitality',
      createdAt: '2026-02-14T09:45:00.000Z'
    },
    {
      id: 'PRJ-INT-05',
      title: 'Bespoke Penthouse & Commercial Cutaway Interior',
      category: 'building-models',
      categoryId: 'CAT-bdeb87f8',
      categoryName: 'Building Models',
      categorySlug: 'building-models',
      description: 'Fully furnished architectural interior model displaying scale modern furniture, textured flooring materials, ambient micro-LED downlighting, and spatial volume planning.',
      mediaUrl: 'model_interior.jpg',
      mediaType: 'image',
      images: [{ url: 'model_interior.jpg', caption: 'Furnished Cutaway Interior Volume' }],
      client: 'Piramal Realty Design Studio',
      createdAt: '2026-01-08T15:10:00.000Z'
    },
    {
      id: 'PRJ-ARC-06',
      title: 'Civic Institutional University Campus Masterplan',
      category: 'building-models',
      categoryId: 'CAT-bdeb87f8',
      categoryName: 'Building Models',
      categorySlug: 'building-models',
      description: 'Comprehensive 80-acre educational campus master plan featuring academic faculties, student housing complexes, sports infrastructure, solar array canopies, and perimeter transit roads.',
      mediaUrl: 'model_architectural.jpg',
      mediaType: 'image',
      images: [{ url: 'model_architectural.jpg', caption: 'Institutional Masterplan Overview' }],
      client: 'IIT Bombay Infrastructure Division',
      createdAt: '2025-12-18T10:30:00.000Z'
    }
  ];

  function showGallerySkeletons(count = 6) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = Array.from({ length: count }).map(() => `
      <div class="gallery-item-card skeleton-card">
        <div class="skeleton-shimmer-box skeleton-thumb"></div>
        <div class="gallery-card-info" style="padding: 20px;">
          <div class="skeleton-shimmer-box skeleton-line title"></div>
          <div class="skeleton-shimmer-box skeleton-line text"></div>
          <div class="skeleton-shimmer-box skeleton-line short"></div>
        </div>
      </div>
    `).join('');
  }

  function matchesCategory(item, filterId) {
    if (!filterId || filterId === 'all') return true;
    const norm = String(filterId).toLowerCase();
    const itemCatId = String(item.categoryId || '').toLowerCase();
    const itemCatSlug = String(item.categorySlug || '').toLowerCase();
    const itemCatName = String(item.categoryName || '').toLowerCase();

    if (itemCatId === norm || itemCatSlug === norm || itemCatName === norm) return true;

    // Check with category list
    const foundCat = (currentGalleryData.categories || []).find(c => 
      String(c.id).toLowerCase() === norm ||
      String(c.slug).toLowerCase() === norm ||
      String(c.name).toLowerCase() === norm
    );

    if (foundCat) {
      if (itemCatId === String(foundCat.id).toLowerCase() || itemCatId === String(foundCat.slug).toLowerCase()) return true;
      if (itemCatSlug === String(foundCat.slug).toLowerCase()) return true;
      if (itemCatName === String(foundCat.name).toLowerCase()) return true;
    }
    return false;
  }

  function countItemsForCategory(filterId, allItems) {
    if (!allItems) return 0;
    if (filterId === 'all') return allItems.length;
    return allItems.filter(item => matchesCategory(item, filterId)).length;
  }

  async function loadGallery() {
    // Purge legacy mock/cached projects from previous session
    const PORTFOLIO_VERSION = 'master_studio_v3';
    if (SafeStorage.get('emm_portfolio_version') !== PORTFOLIO_VERSION) {
      SafeStorage.remove('emm_projects');
      SafeStorage.remove('emm_deleted_projects');
      SafeStorage.set('emm_portfolio_version', PORTFOLIO_VERSION);
    }

    let cats = [...DEFAULT_CATEGORIES];
    let localItems = [];

    // Safely retrieve custom categories
    try {
      const savedCats = SafeStorage.get('emm_categories');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cats = parsed;
        }
      }
    } catch (e) {}

    // Populate projectMap
    const projectMap = new Map();
    DEFAULT_CLIENT_PROJECTS.forEach(p => projectMap.set(p.id, p));

    // Overlay any admin-created items from localStorage
    try {
      const savedItems = SafeStorage.get('emm_projects');
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item && item.id) projectMap.set(item.id, item);
          });
        }
      }
    } catch (e) {}

    localItems = Array.from(projectMap.values());
    localItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    currentGalleryData = { categories: cats, items: localItems };
    renderGalleryFilterTabs(cats);
    renderGalleryItems(activeCategoryFilter, activeSearchQuery);

    // Fetch from dual Google Sheets API in background
    try {
      const res = await API.request({ action: 'get_public_gallery' }, 'GET');
      if (res && res.status === 'success') {
        // Merge categories without duplicates using slug matching
        if (Array.isArray(res.categories) && res.categories.length > 0) {
          const slugMap = new Map();
          DEFAULT_CATEGORIES.forEach(c => slugMap.set(c.slug, { ...c }));
          res.categories.forEach(serverCat => {
            const key = serverCat.slug || serverCat.id;
            const existing = slugMap.get(key) || slugMap.get(serverCat.slug);
            if (existing) {
              slugMap.set(existing.slug, { ...existing, id: serverCat.id, serverId: serverCat.id, name: serverCat.name || existing.name, description: serverCat.description || existing.description });
            } else {
              slugMap.set(serverCat.slug || serverCat.id, serverCat);
            }
          });
          cats = Array.from(slugMap.values());
          SafeStorage.set('emm_categories', JSON.stringify(cats));
        }

        // Sync server items
        if (Array.isArray(res.items)) {
          projectMap.clear();
          DEFAULT_CLIENT_PROJECTS.forEach(p => projectMap.set(p.id, p));
          res.items.forEach(item => {
            if (item && item.id) {
              projectMap.set(item.id, item);
            }
          });

          const mergedItems = Array.from(projectMap.values());
          mergedItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          SafeStorage.set('emm_projects', JSON.stringify(mergedItems));
          currentGalleryData = { categories: cats, items: mergedItems };
        } else {
          currentGalleryData = { categories: cats, items: localItems };
        }
      }
    } catch (e) {
      console.warn("Public gallery loaded from local master portfolio:", e);
      currentGalleryData = { categories: cats, items: localItems };
      const dbStatus = document.getElementById('dbSyncStatus');
      if (dbStatus) dbStatus.textContent = 'ACTIVE (LOCAL READY)';
    }

    const dbStatus = document.getElementById('dbSyncStatus');
    if (dbStatus && res && res.status === 'success') {
      dbStatus.textContent = 'CONNECTED (SHEETS LIVE)';
    }

    renderGalleryFilterTabs(cats);
    renderGalleryItems(activeCategoryFilter, activeSearchQuery);

    // Deep-linking: if URL contains ?project=<id> or #project-<id>, automatically open lightbox
    const queryPrj = urlParams.get('project');
    const hashPrj = (window.location.hash && window.location.hash.startsWith('#project-')) 
      ? window.location.hash.replace('#project-', '').trim() 
      : null;
    const targetPrjId = queryPrj || hashPrj;
    if (targetPrjId) {
      const all = currentGalleryData.items || [];
      const matchIdx = all.findIndex(p => String(p.id).toLowerCase() === String(targetPrjId).toLowerCase());
      if (matchIdx !== -1) {
        setTimeout(() => openLightbox(all, matchIdx), 200);
      }
    }
  }

  // Live Cross-Tab Sync: If project uploaded in admin tab, immediately refresh open gallery
  window.addEventListener('storage', (e) => {
    if (e.key === 'emm_projects' || e.key === 'emm_categories') {
      loadGallery();
    }
  });

  // Search input listeners
  if (gallerySearchInput) {
    gallerySearchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.trim().toLowerCase();
      if (gallerySearchClear) {
        gallerySearchClear.classList.toggle('visible', activeSearchQuery.length > 0);
      }
      renderGalleryItems(activeCategoryFilter, activeSearchQuery);
    });
  }

  if (gallerySearchClear) {
    gallerySearchClear.addEventListener('click', () => {
      if (gallerySearchInput) {
        gallerySearchInput.value = '';
        activeSearchQuery = '';
        gallerySearchClear.classList.remove('visible');
        gallerySearchInput.focus();
        renderGalleryItems(activeCategoryFilter, '');
      }
    });
  }

  // Sort selector listener
  const gallerySortSelect = document.getElementById('gallerySortSelect');
  if (gallerySortSelect) {
    gallerySortSelect.value = activeGallerySort;
    gallerySortSelect.addEventListener('change', (e) => {
      activeGallerySort = e.target.value;
      SafeStorage.set('emm_gallery_sort', activeGallerySort);
      renderGalleryItems(activeCategoryFilter, activeSearchQuery);
    });
  }

  // View mode switcher (Grid vs Industrial Spec Sheet View)
  const viewModeGrid = document.getElementById('viewModeGrid');
  const viewModeList = document.getElementById('viewModeList');
  function applyViewMode(mode) {
    activeViewMode = mode;
    SafeStorage.set('emm_gallery_view', mode);
    if (galleryGrid) {
      if (mode === 'list') {
        galleryGrid.classList.add('list-view');
      } else {
        galleryGrid.classList.remove('list-view');
      }
    }
    if (viewModeGrid && viewModeList) {
      viewModeGrid.classList.toggle('active', mode === 'grid');
      viewModeList.classList.toggle('active', mode === 'list');
    }
  }
  if (viewModeGrid) {
    viewModeGrid.addEventListener('click', () => applyViewMode('grid'));
  }
  if (viewModeList) {
    viewModeList.addEventListener('click', () => applyViewMode('list'));
  }
  applyViewMode(activeViewMode);

  // Keyboard shortcut: Press / or Ctrl+K to immediately focus search
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
      if (gallerySearchInput) {
        e.preventDefault();
        gallerySearchInput.focus();
        gallerySearchInput.select();
      }
    }
  });

  function renderGalleryFilterTabs(categories) {
    const tabContainer = document.getElementById('galleryTabs');
    if (!tabContainer) return;

    tabContainer.innerHTML = '';
    const allItems = currentGalleryData.items || [];

    // "All Models" Tab
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `filter-tab ${activeCategoryFilter === 'all' ? 'active' : ''}`;
    allBtn.innerHTML = `All Models <span class="tab-count">${allItems.length}</span>`;
    allBtn.addEventListener('click', () => {
      activeCategoryFilter = 'all';
      updateActiveTab(allBtn);
      showCategoryDescription(null);
      renderGalleryItems('all', activeSearchQuery);
    });
    tabContainer.appendChild(allBtn);

    // Dynamic Category Tabs
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isAct = (activeCategoryFilter === cat.slug || activeCategoryFilter === cat.id);
      btn.className = `filter-tab ${isAct ? 'active' : ''}`;
      const count = countItemsForCategory(cat.slug || cat.id, allItems);
      btn.innerHTML = `${cat.name} <span class="tab-count">${count}</span>`;
      btn.addEventListener('click', () => {
        activeCategoryFilter = cat.slug || cat.id;
        updateActiveTab(btn);
        showCategoryDescription(cat);
        renderGalleryItems(cat.slug || cat.id, activeSearchQuery);
      });
      tabContainer.appendChild(btn);
    });

    if (activeCategoryFilter !== 'all') {
      const matchCat = categories.find(c => c.slug === activeCategoryFilter || c.id === activeCategoryFilter);
      if (matchCat) showCategoryDescription(matchCat);
    }
  }

  function updateActiveTab(activeBtn) {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  function showCategoryDescription(cat) {
    const banner = document.getElementById('categoryDescriptionBanner');
    if (!banner) return;
    if (cat && cat.description) {
      banner.innerHTML = `<strong>✨ ${cat.name}:</strong> ${cat.description}`;
      banner.classList.add('visible');
    } else {
      banner.classList.remove('visible');
    }
  }

  function updateGalleryCounter(count, total) {
    const countText = document.getElementById('galleryCountText');
    if (!countText) return;
    if (activeSearchQuery) {
      countText.textContent = `${count} of ${total} Models Found`;
    } else if (activeCategoryFilter !== 'all') {
      countText.textContent = `${count} Models`;
    } else {
      countText.textContent = `${count} Master Models`;
    }
  }

  function renderGalleryItems(filterId, searchQuery = '') {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    const allItems = currentGalleryData.items || [];
    let itemsToDisplay = allItems;

    // Filter by Category
    if (filterId && filterId !== 'all') {
      itemsToDisplay = itemsToDisplay.filter(item => matchesCategory(item, filterId));
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      itemsToDisplay = itemsToDisplay.filter(item => {
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = (item.categoryName || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // Apply sorting
    if (activeGallerySort === 'oldest') {
      itemsToDisplay.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (activeGallerySort === 'title-asc') {
      itemsToDisplay.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (activeGallerySort === 'category') {
      itemsToDisplay.sort((a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''));
    } else { // default 'newest'
      itemsToDisplay.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    updateGalleryCounter(itemsToDisplay.length, allItems.length);

    if (itemsToDisplay.length === 0) {
      if (allItems.length === 0) {
        galleryGrid.innerHTML = `
          <div class="gallery-empty-state" style="padding: 60px 20px; text-align: center; grid-column: 1 / -1;">
            <div class="gallery-empty-icon" style="font-size: 3rem; margin-bottom: 12px;">🏛️</div>
            <h3 style="font-size: 1.4rem; margin-bottom: 8px;">Studio Portfolio Catalog</h3>
            <p style="color: var(--text-muted); max-width: 540px; margin: 0 auto 20px; line-height: 1.6;">
              Our master architectural and engineering scale models are currently being curated and updated. For custom model commissions, project specifications, or immediate portfolio viewings, please contact our Byculla studio.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <a href="contact.html" class="btn-primary btn-bloat" style="padding: 10px 24px; text-decoration: none;">
                <span>Inquire With Studio ➔</span>
              </a>
              <a href="models.html" class="btn-secondary" style="padding: 10px 24px; text-decoration: none;">
                Explore Model Types
              </a>
            </div>
          </div>
        `;
      } else {
        galleryGrid.innerHTML = `
          <div class="gallery-empty-state" style="grid-column: 1 / -1;">
            <div class="gallery-empty-icon">🔍</div>
            <h3>No Scale Models Found</h3>
            <p>No project models match your current filter or search criteria. Try clearing the search or choosing another category.</p>
            <button type="button" class="btn-primary" style="margin-top:10px; padding:8px 20px;" onclick="document.getElementById('gallerySearchClear')?.click(); document.querySelector('.filter-tab')?.click();">
              Show All Models
            </button>
          </div>
        `;
      }
      return;
    }

    itemsToDisplay.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'gallery-item-card';
      card.style.animationDelay = `${Math.min(index * 35, 450)}ms`;

      const isVideo = item.mediaType === 'video';
      const localMatch = DEFAULT_CLIENT_PROJECTS.find(p => p.title === item.title || p.id === item.id);
      const localFallback = localMatch ? localMatch.mediaUrl : (item.localUrl || 'hero_showcase.jpg');
      const safeSrc = item.mediaUrl || localFallback;
      const optimizedThumb = isVideo ? safeSrc : getOptimizedThumbUrl(safeSrc, 800);
      const driveFallback = item.driveFileId 
        ? `https://drive.google.com/thumbnail?id=${item.driveFileId}&sz=w1000` 
        : (item.driveUrl || localFallback);

      card.innerHTML = `
        <span class="card-corner-tick tl"></span>
        <span class="card-corner-tick tr"></span>
        <span class="card-corner-tick bl"></span>
        <span class="card-corner-tick br"></span>
        <div class="gallery-thumb-wrap ${isVideo ? 'video-card-thumb-wrap' : ''}">
          ${isVideo 
            ? `<img src="${item.driveFileId ? `https://drive.google.com/thumbnail?id=${item.driveFileId}&sz=w800` : (item.mediaUrl || 'hero_showcase.jpg')}" alt="${item.title || 'Video'}" loading="lazy" referrerpolicy="no-referrer" style="width:100%; height:100%; object-fit:cover; opacity:0.75;" onerror="this.src='hero_showcase.jpg';" />
               <div class="video-card-poster">
                 <div class="video-play-disc" title="Click to Stream Video">
                   <span class="video-play-triangle">▶</span>
                 </div>
                 <span class="video-tag-pill">▶ HD SHOWCASE VIDEO</span>
               </div>` 
            : `<img src="${optimizedThumb}" alt="${item.title || 'Project'}" loading="lazy" referrerpolicy="no-referrer" onload="this.classList.add('loaded'); this.parentElement?.classList.add('loaded');" onerror="if(!this.dataset.retried){this.dataset.retried='1'; this.src='${driveFallback}';}else if(this.dataset.retried==='1'){this.dataset.retried='2'; this.src='https://drive.google.com/uc?export=view&id=${item.driveFileId}';}else{this.src='hero_showcase.jpg';}; this.classList.add('loaded'); this.parentElement?.classList.add('loaded');" />`}
          <div class="gallery-thumb-gradient"></div>
          <span class="gallery-overlay-badge">
            <span>✦</span> ${item.categoryName || 'Scale Model'}
          </span>
          <span class="gallery-hover-action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>${isVideo ? 'Stream Media' : 'Inspect Model'}</span>
          </span>
        </div>
        <div class="gallery-card-info">
          <div>
            <h4>${item.title || 'Untitled Model'}</h4>
            <p>${item.description || 'Custom handcrafted scale model replica by Expressive Model Making Co.'}</p>
          </div>
          <div class="gallery-card-footer">
            <span class="gallery-card-meta">
              <span>📍</span> Mumbai Studio
            </span>
            <span class="gallery-card-cta">
              <span>Inspect</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-left:3px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
        </div>
      `;

      const imgEl = card.querySelector('img');
      if (imgEl && imgEl.complete) {
        imgEl.classList.add('loaded');
        imgEl.parentElement?.classList.add('loaded');
      }

      card.addEventListener('click', () => openLightbox(itemsToDisplay, index));
      galleryGrid.appendChild(card);
    });
  }

  // --- 5. LIGHTBOX MODAL ---
  let lightboxItems = [];
  let currentLightboxIndex = 0;
  let currentLightboxImageIndex = 0;
  let currentLightboxZoom = 1.0;

  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxMedia = document.getElementById('lightboxMedia');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxWhatsAppBtn = document.getElementById('lightboxWhatsAppBtn');
  const lightboxZoomIn = document.getElementById('lightboxZoomIn');
  const lightboxZoomOut = document.getElementById('lightboxZoomOut');
  const lightboxZoomReset = document.getElementById('lightboxZoomReset');
  const lightboxFullscreen = document.getElementById('lightboxFullscreen');
  const lightboxShareBtn = document.getElementById('lightboxShareBtn');

  function applyLightboxZoom(zoom) {
    currentLightboxZoom = Math.min(3.0, Math.max(1.0, zoom));
    const activeImg = lightboxMedia ? lightboxMedia.querySelector('img, video') : null;
    if (activeImg) {
      activeImg.style.transform = `scale(${currentLightboxZoom})`;
      if (currentLightboxZoom > 1.0) {
        lightboxMedia.classList.add('zoomed');
      } else {
        lightboxMedia.classList.remove('zoomed');
      }
    }
  }

  function openLightbox(items, index) {
    if (!items || items.length === 0 || !lightboxModal) return;
    lightboxItems = items;
    currentLightboxIndex = index;
    currentLightboxImageIndex = 0;
    applyLightboxZoom(1.0);
    updateLightboxContent();
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    applyLightboxZoom(1.0);
    if (lightboxMedia) lightboxMedia.innerHTML = '';
    const strip = document.getElementById('lightboxGalleryStrip');
    if (strip) strip.innerHTML = '';
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const item = lightboxItems[currentLightboxIndex];
    if (!item) return;

    const imagesList = (Array.isArray(item.images) && item.images.length > 0)
      ? item.images
      : [{ id: 'IMG-' + (item.id || 'default') + '-01', url: item.mediaUrl, caption: item.title, driveFileId: item.driveFileId }];

    if (currentLightboxImageIndex >= imagesList.length) {
      currentLightboxImageIndex = 0;
    }

    const activeImgObj = imagesList[currentLightboxImageIndex];
    const isVideo = item.mediaType === 'video';
    const localMatch = DEFAULT_CLIENT_PROJECTS.find(p => p.title === item.title || p.id === item.id);
    const localFallback = localMatch ? localMatch.mediaUrl : (item.localUrl || 'hero_showcase.jpg');
    const safeSrc = (activeImgObj && activeImgObj.url) || item.mediaUrl || localFallback;
    const driveFallback = (activeImgObj && activeImgObj.driveFileId)
      ? `https://drive.google.com/thumbnail?id=${activeImgObj.driveFileId}&sz=w1600`
      : (item.driveFileId ? `https://drive.google.com/thumbnail?id=${item.driveFileId}&sz=w1600` : (item.driveUrl || localFallback));

    if (lightboxMedia) {
      if (isVideo) {
        let driveId = (activeImgObj && activeImgObj.driveFileId) || item.driveFileId || '';
        if (!driveId && typeof safeSrc === 'string') {
          const m = safeSrc.match(/\/d\/([a-zA-Z0-9_-]+)/) || safeSrc.match(/id=([a-zA-Z0-9_-]+)/);
          if (m) driveId = m[1];
        }

        if (driveId) {
          lightboxMedia.innerHTML = `
            <div class="lightbox-video-container" id="lightboxVideoContainer" style="position:relative; width:min(90vw, 920px); height:min(66vh, 520px); display:flex; align-items:center; justify-content:center; background:#000; border-radius:12px; overflow:hidden; box-shadow:0 24px 70px rgba(0,0,0,0.85);">
              <div class="video-buffer-spinner" id="videoBufferSpinner" style="position:absolute; z-index:1;">
                <span class="upload-spinner"></span>
                <span style="font-size:0.85rem; color:#E2E8F0; margin-top:8px;">Buffering HD Video Stream...</span>
              </div>
              <iframe src="https://drive.google.com/file/d/${driveId}/preview" allow="autoplay; fullscreen" style="width:100%; height:100%; border:none; position:relative; z-index:2;" onload="const sp = document.getElementById('videoBufferSpinner'); if(sp) sp.style.display='none';"></iframe>
            </div>
          `;
        } else {
          lightboxMedia.innerHTML = `
            <div class="lightbox-video-container" id="lightboxVideoContainer">
              <div class="video-buffer-spinner" id="videoBufferSpinner">
                <span class="upload-spinner"></span>
                <span style="font-size:0.85rem; color:#E2E8F0; margin-top:8px;">Buffering HD Video Stream...</span>
              </div>
              <video src="${safeSrc}" controls playsinline preload="metadata" style="max-width:86vw; max-height:68vh; border-radius:12px; background:#000; box-shadow:0 24px 70px rgba(0,0,0,0.85); outline:none; display:none;"></video>
            </div>
          `;
          const vEl = lightboxMedia.querySelector('video');
          const spinner = document.getElementById('videoBufferSpinner');
          if (vEl) {
            const showVideo = function () {
              if (spinner) spinner.style.display = 'none';
              vEl.style.display = 'block';
              vEl.play().catch(() => {});
            };
            vEl.oncanplay = showVideo;
            vEl.onloadeddata = showVideo;
            setTimeout(() => {
              if (vEl && vEl.style.display === 'none') {
                if (spinner) spinner.style.display = 'none';
                vEl.style.display = 'block';
              }
            }, 1200);
            vEl.onerror = function () {
              if (spinner) {
                spinner.innerHTML = `
                  <div style="color:var(--primary); font-size:1.6rem; margin-bottom:6px;">🎬</div>
                  <div style="color:#F8FAFC; font-weight:700;">High-Resolution Video Stream</div>
                  <div style="margin-top:12px;">
                    <a href="${safeSrc}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding:8px 18px; font-size:0.85rem; text-decoration:none;">View Fullscreen Video ➔</a>
                  </div>
                `;
              }
            };
          }
        }
      } else {
        lightboxMedia.innerHTML = `
          <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
            <img src="${safeSrc}" alt="${(activeImgObj && activeImgObj.caption) || item.title}" referrerpolicy="no-referrer" onload="this.classList.add('loaded')" onerror="if(!this.dataset.retried){this.dataset.retried='1'; this.src='${driveFallback}';}else if(this.dataset.retried==='1'){this.dataset.retried='2'; this.src='${localFallback}';}else{this.src='hero_showcase.jpg';}; this.classList.add('loaded');" />
          </div>
        `;
      }
    }

    // Render multi-image thumbnail strip if project has multiple photos
    const strip = document.getElementById('lightboxGalleryStrip');
    if (strip) {
      if (imagesList.length > 1) {
        strip.style.display = 'flex';
        strip.innerHTML = imagesList.map((img, idx) => `
          <button type="button" class="lightbox-thumb-btn ${idx === currentLightboxImageIndex ? 'active' : ''}" title="${img.caption || ('Image ' + (idx + 1))}" data-img-idx="${idx}">
            <img src="${getOptimizedThumbUrl(img.url || localFallback, 200)}" alt="thumbnail" />
          </button>
        `).join('');

        strip.querySelectorAll('.lightbox-thumb-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxImageIndex = parseInt(btn.getAttribute('data-img-idx'), 10);
            updateLightboxContent();
          });
        });
      } else {
        strip.style.display = 'none';
        strip.innerHTML = '';
      }
    }

    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxDesc) {
      const extraInfo = imagesList.length > 1 ? ` • Photo ${currentLightboxImageIndex + 1} of ${imagesList.length}` : '';
      lightboxDesc.textContent = (item.description || item.categoryName || '') + extraInfo;
    }
    if (lightboxCounter) lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxItems.length}`;

    if (lightboxWhatsAppBtn) {
      const waMsg = encodeURIComponent(`Hello Expressive Model Making, I am interested in this project from your gallery: "${item.title}". Could you share specifications and pricing?`);
      lightboxWhatsAppBtn.href = `https://api.whatsapp.com/send?phone=919819969376&text=${waMsg}`;
    }
  }

  function nextLightbox() {
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxItems.length;
    currentLightboxImageIndex = 0;
    applyLightboxZoom(1.0);
    updateLightboxContent();
  }

  function prevLightbox() {
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    currentLightboxImageIndex = 0;
    applyLightboxZoom(1.0);
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightbox);

  // Lightbox Inspection Toolbar Handlers
  if (lightboxZoomIn) lightboxZoomIn.addEventListener('click', () => applyLightboxZoom(currentLightboxZoom + 0.4));
  if (lightboxZoomOut) lightboxZoomOut.addEventListener('click', () => applyLightboxZoom(currentLightboxZoom - 0.4));
  if (lightboxZoomReset) lightboxZoomReset.addEventListener('click', () => applyLightboxZoom(1.0));
  if (lightboxFullscreen) {
    lightboxFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (lightboxModal && lightboxModal.requestFullscreen) lightboxModal.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });
  }
  if (lightboxShareBtn) {
    lightboxShareBtn.addEventListener('click', () => {
      const item = lightboxItems[currentLightboxIndex];
      if (!item) return;
      const shareUrl = window.location.origin + window.location.pathname + '#project-' + item.id;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert(`📐 Project Direct Link Copied to Clipboard:\n\n${shareUrl}`);
        }).catch(() => {
          prompt('Copy project direct link:', shareUrl);
        });
      } else {
        prompt('Copy project direct link:', shareUrl);
      }
    });
  }

  // Close on backdrop click
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // Keyboard navigation & CAD shortcuts
  window.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
    if (e.key === '+' || e.key === '=') applyLightboxZoom(currentLightboxZoom + 0.4);
    if (e.key === '-' || e.key === '_') applyLightboxZoom(currentLightboxZoom - 0.4);
    if (e.key === '0') applyLightboxZoom(1.0);
    if (e.key.toLowerCase() === 'f') {
      if (!document.fullscreenElement) {
        if (lightboxModal && lightboxModal.requestFullscreen) lightboxModal.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }
  });

  // Mobile Touch Swipe support for Lightbox
  let touchStartX = 0;
  let touchEndX = 0;

  if (lightboxModal) {
    lightboxModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
  }

  function handleSwipeGesture() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      if (diff < 0) nextLightbox(); // Swiped left -> next
      else prevLightbox();         // Swiped right -> prev
    }
  }

  if (galleryGrid) {
    loadGallery();
  }

  // --- 6. CLIENT TESTIMONIALS & FEEDBACK ---
  const feedbackGrid = document.getElementById('feedbackGrid');
  if (feedbackGrid) {
    loadFeedback();
  }

  function showFeedbackSkeletons(count = 3) {
    if (!feedbackGrid) return;
    feedbackGrid.innerHTML = Array.from({ length: count }).map(() => `
      <div class="feedback-card skeleton-card skeleton-review-card">
        <div class="skeleton-stars-row">
          <div class="skeleton-shimmer-box skeleton-star-item"></div>
          <div class="skeleton-shimmer-box skeleton-star-item"></div>
          <div class="skeleton-shimmer-box skeleton-star-item"></div>
          <div class="skeleton-shimmer-box skeleton-star-item"></div>
          <div class="skeleton-shimmer-box skeleton-star-item"></div>
        </div>
        <div class="skeleton-shimmer-box skeleton-line" style="width: 95%; height: 14px; margin-bottom: 8px;"></div>
        <div class="skeleton-shimmer-box skeleton-line" style="width: 88%; height: 14px; margin-bottom: 8px;"></div>
        <div class="skeleton-shimmer-box skeleton-line" style="width: 60%; height: 14px; margin-bottom: 24px;"></div>
        <div class="skeleton-author-row">
          <div class="skeleton-shimmer-box skeleton-avatar"></div>
          <div style="flex: 1;">
            <div class="skeleton-shimmer-box skeleton-line" style="width: 65%; height: 14px; margin-bottom: 6px;"></div>
            <div class="skeleton-shimmer-box skeleton-line" style="width: 40%; height: 11px;"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // --- REAL VISIT LOGGING (FOR OCTOBER 2026 ANALYTICS) ---
  (function trackRealVisit() {
    try {
      const todayKey = '2026-10-15';
      const visits = JSON.parse(SafeStorage.get('emm_pageviews_oct2026') || '{}');
      visits[todayKey] = (visits[todayKey] || 0) + 1;
      SafeStorage.set('emm_pageviews_oct2026', JSON.stringify(visits));
    } catch (e) {}
  })();

  const DEFAULT_CLIENT_FEEDBACK = [
    {
      id: 'FBK-REV-01',
      name: 'shabbir husain',
      rating: 5,
      role: 'Local Guide • 9 reviews • 83 photos',
      relativeDate: '5 years ago',
      comment: 'Excellent work by the experienced people of this company. Models are made very cleanly and professionally. Work was completed before the deadline and it was beyond expectations. It was a great pleasure working with them and I would highly recommend Expressive Model Making Co. for all types of architectural models.',
      isApproved: true,
      createdAt: '2021-10-10T10:00:00.000Z'
    },
    {
      id: 'FBK-REV-02',
      name: 'Tushar Patil',
      rating: 5,
      role: 'Local Guide • 101 reviews • 1,088 photos',
      relativeDate: '3 years ago',
      comment: 'The model of the bridge was very well made. Abobe expectations. The model was the star attraction at the event. Before time delivery. A very humble and courteous person. Pleasure to deal with.',
      isApproved: true,
      createdAt: '2023-08-15T14:30:00.000Z'
    },
    {
      id: 'FBK-REV-03',
      name: 'Pragya Sharaf',
      rating: 5,
      role: 'Verified Client • 11 reviews • 1 photo',
      relativeDate: 'a year ago',
      comment: 'We had a time sensitive requirement for our company and the team was very helpful and prompt in helping us with the requirement. The model looks just as envisioned. Thank you Expressive Model team for getting it done!',
      isApproved: true,
      createdAt: '2025-06-20T11:15:00.000Z'
    },
    {
      id: 'FBK-REV-04',
      name: 'Firdose K. Lala',
      rating: 5,
      role: 'Verified Client • 5 reviews',
      relativeDate: '3 years ago',
      comment: 'Excellent craftmanship with the minutest detail captured. As if the actaul building and areas had just been shrunk. That too in a very formidable time period. 100 on 100 here.....',
      isApproved: true,
      createdAt: '2023-11-04T09:45:00.000Z'
    },
    {
      id: 'FBK-REV-05',
      name: 'Aniket Varshney',
      rating: 5,
      role: 'Local Guide • 86 reviews • 44 photos',
      relativeDate: '7 years ago',
      comment: 'Very well equipped and experienced people. They use latest laser cutting and 3D printing tools for highest precision and detailed jobwork. Highly reliable and cost effective',
      isApproved: true,
      createdAt: '2019-04-12T16:20:00.000Z'
    }
  ];

  async function loadFeedback() {
    let reviews = [...DEFAULT_CLIENT_FEEDBACK];

    try {
      const savedFb = SafeStorage.get('emm_feedback');
      if (savedFb) {
        const parsed = JSON.parse(savedFb);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const approved = parsed.filter(r => r && r.isApproved !== false);
          if (approved.length > 0) reviews = approved;
        }
      }
    } catch (e) {}

    // INSTANT 0ms RENDER - Display immediately on load without skeletons or waiting!
    renderFeedbackList(reviews);

    // Asynchronously fetch fresh reviews from Google Sheet API in background
    try {
      const res = await API.request({ action: 'get_public_feedback' }, 'GET');
      if (res && res.status === 'success' && Array.isArray(res.reviews) && res.reviews.length > 0) {
        const approvedOnly = res.reviews.filter(r => r && (!r.rating || r.rating >= 4));
        if (approvedOnly.length > 0) {
          renderFeedbackList(approvedOnly);
          SafeStorage.set('emm_feedback', JSON.stringify(approvedOnly));
        }
      }
    } catch (e) {
      console.warn("Feedback network sync note:", e);
    }
  }

  function renderFeedbackList(reviews) {
    if (!feedbackGrid) return;

    if (!reviews || reviews.length === 0) {
      feedbackGrid.innerHTML = `
        <div class="feedback-empty-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle); box-shadow: var(--shadow-sm);">
          <div style="font-size: 2.4rem; margin-bottom: 14px;">🤝</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 8px; color: var(--text-main);">No Reviews Published Yet</h3>
          <p style="color: var(--text-muted); max-width: 580px; margin: 0 auto 16px; font-size: 0.95rem; line-height: 1.6;">
            At Expressive Model Making Co., our architectural scale models and industrial plant commissions are completed through direct client consultations and developer partnerships across Mumbai.
          </p>
          <p style="color: var(--primary); font-weight: 600; font-size: 0.92rem; margin: 0;">
            Have you commissioned a scale model with Mustafa Rampurawala? Share your verified feedback below!
          </p>
        </div>
      `;
      return;
    }

    feedbackGrid.innerHTML = reviews.map(rev => `
      <div class="feedback-card">
        <div class="feedback-stars">${'★'.repeat(rev.rating || 5)}</div>
        <p class="feedback-quote">"${escapeHtml(rev.comment)}"</p>
        <div class="feedback-author">
          <div class="author-avatar-fallback">${rev.name ? rev.name.charAt(0).toUpperCase() : 'C'}</div>
          <div class="author-info">
            <h5>${escapeHtml(rev.name)}</h5>
            <p style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(rev.role || 'Verified Client')}${rev.relativeDate ? ' • ' + rev.relativeDate : ''}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Feedback Submission Modal
  function initReviewModal() {
    const leaveReviewBtn = document.getElementById('leaveReviewBtn');
    const reviewModal = document.getElementById('reviewModal');
    const reviewModalClose = document.getElementById('reviewModalClose');
    const reviewForm = document.getElementById('reviewForm');
    const reviewAlert = document.getElementById('reviewAlert');

    if (leaveReviewBtn) leaveReviewBtn.addEventListener('click', () => reviewModal?.classList.add('open'));
    if (reviewModalClose) reviewModalClose.addEventListener('click', () => reviewModal?.classList.remove('open'));

    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const data = {
          action: 'submit_feedback',
          name: document.getElementById('revName').value,
          rating: document.getElementById('revRating').value,
          comment: document.getElementById('revComment').value
        };

        const res = await API.request(data);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Testimonial';

        if (res && res.status === 'success') {
          // Immediately save review to client cache to trigger real-time updates and push alerts
          try {
            const newFbk = {
              id: 'FBK-' + Math.random().toString(36).substr(2, 8),
              name: data.name,
              rating: parseInt(data.rating) || 5,
              role: 'Verified Client',
              relativeDate: 'Just now',
              comment: data.comment,
              isApproved: true,
              createdAt: new Date().toISOString()
            };
            let curFbk = [];
            const rawFb = SafeStorage.get('emm_feedback');
            if (rawFb) curFbk = JSON.parse(rawFb);
            curFbk.unshift(newFbk);
            SafeStorage.set('emm_feedback', JSON.stringify(curFbk));
          } catch (e) {}

          reviewAlert.style.color = '#10B981';
          reviewAlert.textContent = res.message;
          reviewForm.reset();
          setTimeout(() => {
            reviewModal?.classList.remove('open');
            reviewAlert.textContent = '';
          }, 2500);
        } else {
          reviewAlert.style.color = '#EF4444';
          reviewAlert.textContent = (res && res.message) || 'Submission failed. Please try again.';
        }
      });
    }
  }

  // --- 7. CONTACT FORM SUBMISSION ---
  function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const contactAlert = document.getElementById('contactAlert');

    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Message...';

        const formData = {
          action: 'submit_contact',
          name: document.getElementById('contactName').value,
          email: document.getElementById('contactEmail').value,
          phone: document.getElementById('contactPhone').value,
          service: document.getElementById('contactService').value,
          message: document.getElementById('contactMessage').value
        };

        const res = await API.request(formData);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Inquiry';

        if (res && res.status === 'success') {
          // Immediately save inquiry to client cache to trigger real-time updates and push alerts
          try {
            const newMsg = {
              id: 'MSG-' + Math.random().toString(36).substr(2, 8),
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              service: formData.service,
              message: formData.message,
              status: 'Unread',
              createdAt: new Date().toISOString()
            };
            let curMsgs = [];
            const rawMsg = SafeStorage.get('emm_messages');
            if (rawMsg) curMsgs = JSON.parse(rawMsg);
            curMsgs.unshift(newMsg);
            SafeStorage.set('emm_messages', JSON.stringify(curMsgs));
          } catch (e) {}

          contactAlert.style.color = '#10B981';
          contactAlert.textContent = res.message;
          contactForm.reset();
          setTimeout(() => { contactAlert.textContent = ''; }, 6000);
        } else {
          contactAlert.style.color = '#EF4444';
          contactAlert.textContent = (res && res.message) || 'Error sending message. Please try again or call us directly.';
        }
      });
    }
  }

  // Floating Quick Contact Menu Toggle & Floating Back to Top
  function initFloatingControls() {
    const floatingContactToggle = document.getElementById('floatingContactToggle');
    const floatingContactMenu = document.getElementById('floatingContactMenu');

    if (floatingContactToggle && floatingContactMenu) {
      floatingContactToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        floatingContactMenu.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!floatingContactToggle.contains(e.target) && !floatingContactMenu.contains(e.target)) {
          floatingContactMenu.classList.remove('open');
        }
      });
    }

    let backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) {
      backToTopBtn = document.createElement('button');
      backToTopBtn.id = 'backToTopBtn';
      backToTopBtn.className = 'back-to-top-btn';
      backToTopBtn.setAttribute('title', 'Back to Top');
      backToTopBtn.setAttribute('aria-label', 'Back to Top');
      backToTopBtn.innerHTML = '▲';
      document.body.appendChild(backToTopBtn);
    }

    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Analytics Logger
  function initAnalytics() {
    try {
      API.request({
        action: 'log_analytics',
        eventType: 'pageview',
        page: window.location.pathname || '/',
        device: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
        userAgent: navigator.userAgent
      });
    } catch (e) {}
  }

  // --- BUG REPORT & STUDIO FEEDBACK FEATURE ---
  function initBugReportFeature() {
    let bugBtn = document.getElementById('floatingBugReportBtn');
    if (!bugBtn) {
      bugBtn = document.createElement('button');
      bugBtn.type = 'button';
      bugBtn.id = 'floatingBugReportBtn';
      bugBtn.className = 'floating-bug-btn';
      bugBtn.setAttribute('title', 'Report a Bug / Feedback to Studio');
      bugBtn.setAttribute('aria-label', 'Report a Bug');
      bugBtn.innerHTML = '<span>🐞</span> <span class="bug-label">Report Issue</span>';
      document.body.appendChild(bugBtn);
    }

    let bugModal = document.getElementById('bugReportModal');
    if (!bugModal) {
      bugModal = document.createElement('div');
      bugModal.id = 'bugReportModal';
      bugModal.className = 'bug-report-modal-overlay';
      bugModal.innerHTML = `
        <div class="bug-report-modal-box">
          <div class="bug-report-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.5rem;">🐞</span>
              <div>
                <h3 style="margin:0; font-size:1.25rem;">Report a Bug / Studio Feedback</h3>
                <span style="font-size:0.75rem; color:var(--text-muted);">Direct feedback to Mustafa Rampurawala & Mumbai Studio Team</span>
              </div>
            </div>
            <button type="button" class="drawer-close" id="bugReportCloseBtn" aria-label="Close">&times;</button>
          </div>
          <form id="bugReportForm" style="display:flex; flex-direction:column; gap:12px; margin-top:14px;">
            <div class="form-group">
              <label for="bugReporterName">Your Name (Optional)</label>
              <input type="text" id="bugReporterName" placeholder="e.g. Architect Rajesh / Project Lead">
            </div>
            <div class="form-group">
              <label for="bugReporterContact">Email or WhatsApp (For status update)</label>
              <input type="text" id="bugReporterContact" placeholder="e.g. name@company.com or +91 98...">
            </div>
            <div class="form-group">
              <label for="bugReportCategory">Issue Category *</label>
              <select id="bugReportCategory" required>
                <option value="video">🎥 Video Playback / Streaming Issue</option>
                <option value="upload">📤 File Upload or Format Error</option>
                <option value="display">🖼️ Display, Font or Layout Glitch</option>
                <option value="typo">✍️ Typo / Data Correction</option>
                <option value="other">💡 General Studio Feedback / Suggestion</option>
              </select>
            </div>
            <div class="form-group">
              <label for="bugReportDetails">Describe what you observed *</label>
              <textarea id="bugReportDetails" rows="3" required placeholder="Please describe what happened, what device you're on, or what you experienced..."></textarea>
            </div>
            <div style="display:flex; gap:10px; margin-top:4px;">
              <button type="submit" class="btn-primary btn-bloat" style="flex:1;" id="bugSubmitBtn">
                <span>Send to Studio Team ➔</span>
              </button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(bugModal);
    }

    function openBugModal() {
      if (bugModal) {
        bugModal.classList.add('open');
        document.body.classList.add('drawer-open-lock');
        const det = document.getElementById('bugReportDetails');
        if (det) setTimeout(() => det.focus(), 150);
      }
    }

    function closeBugModal() {
      if (bugModal) {
        bugModal.classList.remove('open');
        document.body.classList.remove('drawer-open-lock');
      }
    }

    bugBtn.addEventListener('click', openBugModal);
    document.getElementById('bugReportCloseBtn')?.addEventListener('click', closeBugModal);
    bugModal.addEventListener('click', (e) => {
      if (e.target === bugModal) closeBugModal();
    });

    document.querySelectorAll('[data-action="report-bug"], .btn-bug-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openBugModal();
      });
    });

    const bugForm = document.getElementById('bugReportForm');
    if (bugForm && !bugForm.dataset.bound) {
      bugForm.dataset.bound = 'true';
      bugForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('bugSubmitBtn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="upload-spinner"></span> <span>Dispatching...</span>';
        }

        const name = document.getElementById('bugReporterName')?.value.trim() || 'Anonymous';
        const contact = document.getElementById('bugReporterContact')?.value.trim() || 'Not Provided';
        const cat = document.getElementById('bugReportCategory')?.value || 'general';
        const details = document.getElementById('bugReportDetails')?.value.trim();

        const reportData = {
          action: 'submit_contact',
          name: name,
          email: contact.includes('@') ? contact : 'expressivemodel@gmail.com',
          phone: contact,
          service: `[BUG REPORT: ${cat.toUpperCase()}]`,
          message: `Category: ${cat}\nPage: ${window.location.href}\nContact: ${contact}\n\nDetails:\n${details}`
        };

        try {
          await API.request(reportData);
        } catch (err) {}

        try {
          const bugList = JSON.parse(SafeStorage.get('emm_bug_reports') || '[]');
          bugList.unshift({
            id: 'BUG-' + Date.now().toString(36),
            name: name,
            contact: contact,
            category: cat,
            details: details,
            page: window.location.href,
            timestamp: new Date().toISOString()
          });
          SafeStorage.set('emm_bug_reports', JSON.stringify(bugList));
        } catch (err) {}

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Send to Studio Team ➔</span>';
        }
        closeBugModal();
        bugForm.reset();
        alert('🙏 Thank you for your feedback!\n\nYour report has been dispatched to Mustafa Rampurawala and our studio engineering team. We review every issue with high priority.');
      });
    }
  }

// Self-healing: Ensure full 5-orb animated aurora mesh is present on any page
function ensureMovingBgMesh() {
  const mesh = document.querySelector('.moving-bg-mesh');
  if (!mesh) return;
  for (let i = 1; i <= 5; i++) {
    if (!mesh.querySelector(`.moving-blob-${i}`)) {
      const b = document.createElement('div');
      b.className = `moving-blob moving-blob-${i}`;
      mesh.appendChild(b);
    }
  }
}

// --- MASTER APPLICATION INITIALIZER ---
function initApp() {
  ensureMovingBgMesh();
  initTheme();
  initMobileNavigation();
  initEmailHandlers();
  initActiveLinks();
  initCounters();
  initReviewModal();
  initContactForm();
  initFloatingControls();
  initAnalytics();
  initBugReportFeature();
}

// Guaranteed launch whether loaded synchronously, deferred, or interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
