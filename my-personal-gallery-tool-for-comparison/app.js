// ===== STATE MANAGEMENT =====
const state = {
  allArtists: [],
  config: {},
  galleries: {},
  currentSearch: '',
  virtualScrollers: {},
  currentModalArtist: null,
  gridSize: 5, // Default grid columns
  imageObserver: null, // Intersection Observer for lazy loading

  // Ranking system state
  rankHelper: {
    eloData: {}, // { artistName: { elo: 1500, comparisons: 0 } }
    history: [], // Array of { winner, loser, winnerEloBefore, loserEloBefore }
    comparisonCount: 0,
    currentPair: null
  },

  // Comparison mode state
  comparisonMode: {
    active: false,
    slots: [null, null] // Two comparison slots
  },

  // Copy tracking
  copyHistory: {}, // { artistName: count }
  recentCopies: [] // [{ name, timestamp }, ...]
};

// ===== RANKING CONSTANTS =====
const RH_K_FACTOR = 32; // ELO K-factor
const RH_INITIAL_ELO = 1500;
const RH_TARGET_COMPARISONS = 4; // Target comparisons per artist
const RH_GRADES = ['SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
const RH_GRADE_PERCENTILES = [0.05, 0.15, 0.30, 0.50, 0.70, 0.85, 0.95, 1.0];

// ===== LAZY LOADING SETUP =====
function setupLazyLoading() {
  // Create intersection observer for lazy loading images
  state.imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src && !img.src) {
          img.src = src;
          img.removeAttribute('data-src');
          state.imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '200px' // Start loading 200px before entering viewport
  });
}

// ===== TAG COLORS =====
const TAG_COLORS = [
  '#ff6b35', '#f7931e', '#c73e1d', '#6a994e',
  '#3a86ff', '#8338ec', '#fb5607', '#ffbe0b',
  '#06ffa5', '#ff006e', '#38b000', '#3d5a80'
];

let colorIndex = 0;
const tagColorMap = {};

function getTagColor(tagName) {
  if (!tagColorMap[tagName]) {
    tagColorMap[tagName] = TAG_COLORS[colorIndex % TAG_COLORS.length];
    colorIndex++;
  }
  return tagColorMap[tagName];
}

// ===== UTILITY FUNCTIONS =====
function extractArtistName(filename) {
  const match = filename.match(/__artist_(.+?)__/);
  if (!match) return null;
  return match[1].trim().toLowerCase();
}

function showLoading() {
  document.getElementById('loadingScreen').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('errorScreen').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
}

function showError(message) {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('errorScreen').style.display = 'flex';
  document.getElementById('errorMessage').textContent = message;
}

// ===== API FUNCTIONS =====
async function fetchImages() {
  const response = await fetch('/api/images');
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error + '\n\n' + (data.message || ''));
  }
  
  return data.files;
}

async function loadConfig() {
  const response = await fetch('/api/config');
  return await response.json();
}

// Debounced save to prevent too many disk writes
let saveConfigTimer = null;
const SAVE_DEBOUNCE_MS = 1000; // Wait 1 second after last change

async function saveConfigNow() {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.config)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save config');
    }

    console.log('✓ Config saved successfully');
  } catch (error) {
    console.error('Failed to save config:', error);
    showNotification('⚠️ Failed to save changes!', 'error');
  }
}

function saveConfig() {
  // Debounce: only save after user stops making changes
  if (saveConfigTimer) {
    clearTimeout(saveConfigTimer);
  }
  saveConfigTimer = setTimeout(() => {
    saveConfigNow();
  }, SAVE_DEBOUNCE_MS);
}

// For critical saves (e.g., when closing, navigation)
function saveConfigImmediate() {
  if (saveConfigTimer) {
    clearTimeout(saveConfigTimer);
    saveConfigTimer = null;
  }
  return saveConfigNow();
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  
  if (type === 'error') {
    notification.style.background = 'rgba(255, 107, 53, 0.9)';
    notification.style.color = '#fff';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ===== IMAGE PROCESSING =====
function processImages(filenames) {
  const newArtists = [];
  const existingArtists = new Set(Object.keys(state.config.artists));
  
  filenames.forEach(filename => {
    const artistName = extractArtistName(filename);
    if (!artistName) {
      console.warn('Skipping malformed filename:', filename);
      return;
    }
    
    if (!state.config.artists[artistName]) {
      // New artist detected
      state.config.artists[artistName] = {
        filename: filename,
        favorite: false,
        tags: ['new'],
        addedDate: new Date().toISOString(),
        grade: null, // SS, S, A, B, C, D, E, F, or null
        elo: RH_INITIAL_ELO,
        comparisons: 0,
        copyCount: 0
      };
      newArtists.push(artistName);
    } else {
      // Ensure existing artists have new fields
      const artist = state.config.artists[artistName];
      if (artist.grade === undefined) artist.grade = null;
      if (artist.elo === undefined) artist.elo = RH_INITIAL_ELO;
      if (artist.comparisons === undefined) artist.comparisons = 0;
      if (artist.copyCount === undefined) artist.copyCount = 0;
    }
  });
  
  // Convert to array for rendering
  state.allArtists = Object.keys(state.config.artists)
    .map(name => ({
      name,
      ...state.config.artists[name]
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return newArtists;
}

// ===== GALLERY BUILDING =====
function buildGalleries() {
  let artists = state.allArtists;
  
  // Apply search filter if active
  if (state.currentSearch) {
    const query = state.currentSearch.toLowerCase();
    artists = artists.filter(artist => {
      const nameMatch = artist.name.includes(query);
      const tagMatch = artist.tags.some(tag => tag.includes(query));
      const favMatch = artist.favorite && (query === 'favorite' || query === 'fav');
      return nameMatch || tagMatch || favMatch;
    });
  }
  
  // Build galleries
  state.galleries = {};
  
  // All Artists
  state.galleries.all = artists;
  
  // Favorites
  state.galleries.favorites = artists.filter(a => a.favorite);
  
  // New
  state.galleries.new = artists.filter(a => a.tags.includes('new'));
  
  // Untagged (no tags except possibly 'new')
  state.galleries.untagged = artists.filter(a => {
    const nonNewTags = a.tags.filter(t => t !== 'new');
    return nonNewTags.length === 0;
  });
  
  // Tag galleries
  const allTags = new Set();
  artists.forEach(a => {
    a.tags.forEach(tag => {
      if (tag !== 'new') allTags.add(tag);
    });
  });
  
  allTags.forEach(tag => {
    state.galleries[tag] = artists.filter(a => a.tags.includes(tag));
  });
  
  // Update global tags list
  state.config.globalTags = Array.from(allTags).sort();
  
  // Render all galleries
  renderAllGalleries();
  updateStatistics();
}

// ===== STATISTICS =====
function updateStatistics() {
  document.getElementById('totalCount').textContent = state.allArtists.length;
  document.getElementById('favCount').textContent = state.galleries.favorites.length;
  document.getElementById('tagCount').textContent = state.config.globalTags.length;
}

function updateEnhancedStatistics() {
  // Update basic stats
  updateStatistics();

  // Update grade distribution
  const gradeDistribution = {};
  RH_GRADES.forEach(grade => {
    gradeDistribution[grade] = 0;
  });

  let ratedCount = 0;
  state.allArtists.forEach(artist => {
    if (artist.grade) {
      gradeDistribution[artist.grade]++;
      ratedCount++;
    }
  });

  // Update stats panel if it exists
  const ratedEl = document.getElementById('ratedCount');
  if (ratedEl) {
    ratedEl.textContent = ratedCount;
  }

  // Update grade distribution bars
  RH_GRADES.forEach(grade => {
    const countEl = document.getElementById(`gradeCount${grade}`);
    const barEl = document.getElementById(`gradeBar${grade}`);
    if (countEl && barEl) {
      const count = gradeDistribution[grade];
      countEl.textContent = count;
      const percentage = ratedCount > 0 ? (count / ratedCount) * 100 : 0;
      barEl.style.width = `${percentage}%`;
    }
  });
}

// ===== GALLERY RENDERING =====
function renderAllGalleries() {
  // Update pinned galleries
  updateGalleryCount('all', state.galleries.all.length);
  updateGalleryCount('favorites', state.galleries.favorites.length);
  updateGalleryCount('new', state.galleries.new.length);
  updateGalleryCount('untagged', state.galleries.untagged.length);
  
  // Render tag galleries
  const tagContainer = document.getElementById('tagGalleries');
  tagContainer.innerHTML = '';
  
  state.config.globalTags.forEach(tag => {
    const count = state.galleries[tag].length;
    const galleryElement = createGalleryElement(tag, count);
    tagContainer.appendChild(galleryElement);
  });
  
  // Re-render expanded galleries
  rerenderExpandedGalleries();
  
  // Update acknowledge button
  updateAcknowledgeButton();
}

function updateGalleryCount(galleryName, count) {
  const gallery = document.querySelector(`[data-gallery="${galleryName}"]`);
  if (gallery) {
    gallery.querySelector('.count').textContent = count;
  }
}

function createGalleryElement(tagName, count) {
  const div = document.createElement('div');
  div.className = 'gallery';
  div.dataset.gallery = tagName;
  
  const color = getTagColor(tagName);
  
  div.innerHTML = `
    <div class="gallery-header">
      <span class="toggle-icon">▶</span>
      <span class="gallery-title" style="color: ${color}">🏷️ ${tagName}</span>
      <span class="gallery-count">(<span class="count">${count}</span>)</span>
    </div>
    <div class="gallery-content" style="display:none;"></div>
  `;
  
  setupGalleryToggle(div);
  return div;
}

function setupGalleryToggle(galleryElement) {
  const header = galleryElement.querySelector('.gallery-header');
  const content = galleryElement.querySelector('.gallery-content');
  const galleryName = galleryElement.dataset.gallery;
  
  header.onclick = () => {
    const isExpanded = content.style.display !== 'none';
    
    if (isExpanded) {
      // Collapse
      content.style.display = 'none';
      header.classList.remove('expanded');
      
      // Remove from expanded list
      const index = state.config.uiState.expandedGalleries.indexOf(galleryName);
      if (index > -1) {
        state.config.uiState.expandedGalleries.splice(index, 1);
      }
      
      // Destroy virtual scroller
      if (state.virtualScrollers[galleryName]) {
        delete state.virtualScrollers[galleryName];
      }
    } else {
      // Expand
      content.style.display = 'block';
      header.classList.add('expanded');
      
      // Add to expanded list
      if (!state.config.uiState.expandedGalleries.includes(galleryName)) {
        state.config.uiState.expandedGalleries.push(galleryName);
      }
      
      // Render gallery content
      renderGalleryContent(galleryName, content);
    }
    
    saveConfig();
  };
}

function renderGalleryContent(galleryName, container) {
  const artists = state.galleries[galleryName] || [];
  
  if (artists.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No artists here yet</h3>
        <p>Add tags to your artists to see them in this gallery</p>
      </div>
    `;
    return;
  }
  
  // For large galleries, render in batches to avoid lag
  const BATCH_SIZE = 100;
  const shouldBatch = artists.length > 100;
  
  // Create grid container with exact number of columns
  const grid = document.createElement('div');
  grid.className = 'gallery-grid';
  grid.style.gridTemplateColumns = `repeat(${state.gridSize}, 1fr)`;
  
  // Dynamic card height based on grid size (fewer columns = taller cards)
  const cardHeight = state.gridSize <= 3 ? '400px' : state.gridSize <= 5 ? '300px' : '250px';
  grid.style.setProperty('--card-height', cardHeight);
  
  container.innerHTML = '';
  container.appendChild(grid);
  
  if (shouldBatch) {
    // Render first batch immediately
    const firstBatch = artists.slice(0, BATCH_SIZE);
    firstBatch.forEach(artist => {
      const card = createArtistCard(artist);
      grid.appendChild(card);
    });
    
    // Render remaining batches with RAF to avoid blocking
    let currentIndex = BATCH_SIZE;
    
    function renderNextBatch() {
      const batch = artists.slice(currentIndex, currentIndex + BATCH_SIZE);
      batch.forEach(artist => {
        const card = createArtistCard(artist);
        grid.appendChild(card);
      });
      
      currentIndex += BATCH_SIZE;
      
      if (currentIndex < artists.length) {
        requestAnimationFrame(renderNextBatch);
      }
    }
    
    requestAnimationFrame(renderNextBatch);
  } else {
    // Small gallery, render all at once
    artists.forEach(artist => {
      const card = createArtistCard(artist);
      grid.appendChild(card);
    });
  }
}

function rerenderExpandedGalleries() {
  state.config.uiState.expandedGalleries.forEach(galleryName => {
    const gallery = document.querySelector(`[data-gallery="${galleryName}"]`);
    if (gallery) {
      const content = gallery.querySelector('.gallery-content');
      if (content.style.display !== 'none') {
        renderGalleryContent(galleryName, content);
      }
    }
  });
}

// ===== ARTIST CARD CREATION =====
function createArtistCard(artist) {
  const card = document.createElement('div');
  card.className = 'artist-card';
  card.dataset.artist = artist.name;
  
  const tagHtml = artist.tags
    .map(tag => {
      const color = tag === 'new' ? '#ff6b35' : getTagColor(tag);
      return `<span class="tag ${tag === 'new' ? 'tag-new' : ''}" style="background: ${color}">${tag}</span>`;
    })
    .join('');

  // Grade badge HTML
  const gradeBadgeHtml = artist.grade
    ? `<span class="grade-badge grade-${artist.grade.toLowerCase()}">${artist.grade}</span>`
    : '';

  // Copy count display
  const copyCountHtml = artist.copyCount > 0
    ? `<span class="copy-count" title="Copied ${artist.copyCount} times">📋 ${artist.copyCount}</span>`
    : '';

  card.innerHTML = `
    <div class="card-image-container">
      <img data-src="artists/${artist.filename}" alt="${artist.name}" loading="lazy" data-artist="${artist.name}" style="background: #1a1a1a;">
      <div class="card-overlay"></div>
      <div class="card-actions">
        <button class="favorite-btn ${artist.favorite ? 'active' : ''}" title="Toggle favorite">
          ${artist.favorite ? '⭐' : '☆'}
        </button>
        <button class="tag-btn" title="Manage tags">🏷️</button>
      </div>
      ${gradeBadgeHtml ? `<div class="card-grade-badge">${gradeBadgeHtml}</div>` : ''}
    </div>
    <div class="card-footer">
      <div class="artist-name" data-artist="${artist.name}" title="Click to copy: ${artist.name}">${artist.name}</div>
      <div class="artist-meta">
        <div class="artist-tags">${tagHtml}</div>
        ${copyCountHtml}
      </div>
    </div>
  `;
  
  // Get the img element and observe it for lazy loading
  const img = card.querySelector('img');
  if (state.imageObserver) {
    state.imageObserver.observe(img);
  } else {
    // Fallback if observer not ready
    img.src = img.dataset.src;
  }
  
  // Event listeners
  card.querySelector('.favorite-btn').onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(artist.name);
  };
  
  card.querySelector('.tag-btn').onclick = (e) => {
    e.stopPropagation();
    openTagModal(artist.name);
  };
  
  // Image click - open lightbox (only if image is loaded)
  img.onclick = (e) => {
    e.stopPropagation();
    if (img.src) {
      openLightbox(artist.filename, artist.name);
    }
  };
  
  // Artist name click - copy to clipboard
  card.querySelector('.artist-name').onclick = (e) => {
    e.stopPropagation();
    copyArtistName(artist.name, e.target);
  };
  
  return card;
}

// ===== FAVORITE TOGGLE =====
function toggleFavorite(artistName) {
  state.config.artists[artistName].favorite = !state.config.artists[artistName].favorite;
  
  // Update in-memory state
  const artist = state.allArtists.find(a => a.name === artistName);
  if (artist) {
    artist.favorite = state.config.artists[artistName].favorite;
  }
  
  // Update only the affected cards (don't rebuild entire galleries)
  updateArtistCards(artistName);
  
  // Update counts only
  updateGalleryCounts();
  
  // Save
  saveConfig();
}

// ===== SMART CARD UPDATE (prevents blinking) =====
function updateArtistCards(artistName) {
  // Find all cards for this artist across all galleries
  const cards = document.querySelectorAll(`.artist-card[data-artist="${artistName}"]`);
  const artist = state.config.artists[artistName];

  cards.forEach(card => {
    // Update favorite button
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.className = `favorite-btn ${artist.favorite ? 'active' : ''}`;
      favoriteBtn.textContent = artist.favorite ? '⭐' : '☆';
    }

    // Update tags
    const tagsContainer = card.querySelector('.artist-tags');
    if (tagsContainer) {
      const tagHtml = artist.tags
        .map(tag => {
          const color = tag === 'new' ? '#ff6b35' : getTagColor(tag);
          return `<span class="tag ${tag === 'new' ? 'tag-new' : ''}" style="background: ${color}">${tag}</span>`;
        })
        .join('');
      tagsContainer.innerHTML = tagHtml;
    }

    // Update grade badge
    const imageContainer = card.querySelector('.card-image-container');
    const existingBadge = card.querySelector('.card-grade-badge');
    if (artist.grade) {
      const badgeHtml = `<div class="card-grade-badge"><span class="grade-badge grade-${artist.grade.toLowerCase()}">${artist.grade}</span></div>`;
      if (existingBadge) {
        existingBadge.outerHTML = badgeHtml;
      } else if (imageContainer) {
        imageContainer.insertAdjacentHTML('beforeend', badgeHtml);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }

    // Update copy count
    const artistMeta = card.querySelector('.artist-meta');
    const existingCopyCount = card.querySelector('.copy-count');
    if (artist.copyCount > 0) {
      const copyCountHtml = `<span class="copy-count" title="Copied ${artist.copyCount} times">📋 ${artist.copyCount}</span>`;
      if (existingCopyCount) {
        existingCopyCount.outerHTML = copyCountHtml;
      } else if (artistMeta) {
        artistMeta.insertAdjacentHTML('beforeend', copyCountHtml);
      }
    } else if (existingCopyCount) {
      existingCopyCount.remove();
    }
  });
}

function updateGalleryCounts() {
  // Rebuild galleries object (for counts)
  const artists = state.allArtists;
  
  state.galleries.all = artists;
  state.galleries.favorites = artists.filter(a => a.favorite);
  state.galleries.new = artists.filter(a => a.tags.includes('new'));
  state.galleries.untagged = artists.filter(a => {
    const nonNewTags = a.tags.filter(t => t !== 'new');
    return nonNewTags.length === 0;
  });
  
  const allTags = new Set();
  artists.forEach(a => {
    a.tags.forEach(tag => {
      if (tag !== 'new') allTags.add(tag);
    });
  });
  
  allTags.forEach(tag => {
    state.galleries[tag] = artists.filter(a => a.tags.includes(tag));
  });
  
  // Update only the counts in the UI
  updateGalleryCount('all', state.galleries.all.length);
  updateGalleryCount('favorites', state.galleries.favorites.length);
  updateGalleryCount('new', state.galleries.new.length);
  updateGalleryCount('untagged', state.galleries.untagged.length);
  
  updateStatistics();
  updateAcknowledgeButton();
}

// ===== TAG MODAL =====
function openTagModal(artistName) {
  state.currentModalArtist = artistName;
  const artist = state.config.artists[artistName];
  const modal = document.getElementById('tagModal');
  
  // Update modal title
  document.getElementById('modalArtistName').textContent = `Manage Tags: ${artistName}`;
  
  // Render applied tags
  const appliedContainer = document.getElementById('appliedTags');
  appliedContainer.innerHTML = '';
  
  if (artist.tags.length === 0) {
    appliedContainer.innerHTML = '<p style="color: #999; font-size: 13px;">No tags applied</p>';
  } else {
    artist.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.style.background = getTagColor(tag);
      tagEl.innerHTML = `
        ${tag}
        <button onclick="removeTag('${artistName}', '${tag}')">×</button>
      `;
      appliedContainer.appendChild(tagEl);
    });
  }
  
  // Render available tags
  const availableContainer = document.getElementById('availableTags');
  availableContainer.innerHTML = '';
  
  const availableTags = state.config.globalTags.filter(tag => !artist.tags.includes(tag));
  
  if (availableTags.length === 0) {
    availableContainer.innerHTML = '<p style="color: #999; font-size: 13px;">No other tags available</p>';
  } else {
    availableTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-btn-add';
      btn.textContent = tag;
      btn.onclick = () => quickAddTag(artistName, tag);
      availableContainer.appendChild(btn);
    });
  }
  
  modal.style.display = 'flex';
  
  // Focus input
  setTimeout(() => {
    document.getElementById('newTagInput').focus();
  }, 100);
}

function closeTagModal() {
  document.getElementById('tagModal').style.display = 'none';
  document.getElementById('newTagInput').value = '';
  state.currentModalArtist = null;
}

function addTagFromModal() {
  if (!state.currentModalArtist) return;
  
  const input = document.getElementById('newTagInput');
  const tagName = input.value.trim().toLowerCase();
  
  if (!tagName) return;
  
  const artist = state.config.artists[state.currentModalArtist];
  
  if (!artist.tags.includes(tagName)) {
    artist.tags.push(tagName);
    
    // Add to global tags if new
    if (!state.config.globalTags.includes(tagName)) {
      state.config.globalTags.push(tagName);
    }
    
    // Update in-memory state
    const artistObj = state.allArtists.find(a => a.name === state.currentModalArtist);
    if (artistObj) {
      artistObj.tags = artist.tags;
    }
    
    // Smart update - no image blinking
    updateArtistCards(state.currentModalArtist);
    updateGalleryCounts();
    
    saveConfig();
    openTagModal(state.currentModalArtist); // Refresh modal
  }
  
  input.value = '';
}

function quickAddTag(artistName, tagName) {
  const artist = state.config.artists[artistName];
  
  if (!artist.tags.includes(tagName)) {
    artist.tags.push(tagName);
    
    // Update in-memory state
    const artistObj = state.allArtists.find(a => a.name === artistName);
    if (artistObj) {
      artistObj.tags = artist.tags;
    }
    
    // Smart update - no image blinking
    updateArtistCards(artistName);
    updateGalleryCounts();
    
    saveConfig();
    openTagModal(artistName); // Refresh modal
  }
}

function removeTag(artistName, tagName) {
  const artist = state.config.artists[artistName];
  artist.tags = artist.tags.filter(t => t !== tagName);
  
  // Update in-memory state
  const artistObj = state.allArtists.find(a => a.name === artistName);
  if (artistObj) {
    artistObj.tags = artist.tags;
  }
  
  // Smart update - no image blinking
  updateArtistCards(artistName);
  updateGalleryCounts();
  
  saveConfig();
  openTagModal(artistName); // Refresh modal
}

// ===== SETTINGS MODAL =====
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  
  // Update tag count
  document.getElementById('settingsTagCount').textContent = state.config.globalTags.length;
  
  // Render tag list
  const tagList = document.getElementById('settingsTagList');
  tagList.innerHTML = '';
  
  if (state.config.globalTags.length === 0) {
    tagList.innerHTML = '<p style="color: #999;">No tags created yet</p>';
  } else {
    state.config.globalTags.forEach(tag => {
      const count = state.galleries[tag] ? state.galleries[tag].length : 0;
      const color = getTagColor(tag);
      
      const item = document.createElement('div');
      item.className = 'settings-tag-item';
      item.innerHTML = `
        <div class="settings-tag-info">
          <div class="settings-tag-color" style="background: ${color}"></div>
          <span class="settings-tag-name">${tag}</span>
          <span class="settings-tag-count">(${count} artists)</span>
        </div>
        <div class="settings-tag-actions">
          <button onclick="deleteTag('${tag}')">Delete</button>
        </div>
      `;
      tagList.appendChild(item);
    });
  }
  
  modal.style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

function deleteTag(tagName) {
  if (!confirm(`Delete tag "${tagName}"? This will remove it from all artists.`)) {
    return;
  }
  
  // Remove from all artists
  Object.values(state.config.artists).forEach(artist => {
    artist.tags = artist.tags.filter(t => t !== tagName);
  });
  
  // Remove from global tags
  state.config.globalTags = state.config.globalTags.filter(t => t !== tagName);
  
  // Update in-memory state
  state.allArtists.forEach(artist => {
    artist.tags = artist.tags.filter(t => t !== tagName);
  });
  
  buildGalleries();
  saveConfig();
  openSettingsModal(); // Refresh modal
}

function confirmReset() {
  if (!confirm('Are you sure you want to reset ALL data? This will remove all favorites and tags. This action cannot be undone.')) {
    return;
  }
  
  if (!confirm('This is your final warning. All your favorites and tags will be permanently deleted. Continue?')) {
    return;
  }
  
  // Reset all artist data
  Object.values(state.config.artists).forEach(artist => {
    artist.favorite = false;
    artist.tags = [];
  });
  
  state.config.globalTags = [];
  state.config.uiState.expandedGalleries = [];
  
  // Update in-memory state
  state.allArtists.forEach(artist => {
    artist.favorite = false;
    artist.tags = [];
  });
  
  buildGalleries();
  saveConfig();
  closeSettingsModal();
  
  alert('All data has been reset.');
}

// ===== ACKNOWLEDGE NEW =====
function acknowledgeAllNew() {
  Object.values(state.config.artists).forEach(artist => {
    artist.tags = artist.tags.filter(tag => tag !== 'new');
  });
  
  // Update in-memory state
  state.allArtists.forEach(artist => {
    artist.tags = artist.tags.filter(tag => tag !== 'new');
  });
  
  buildGalleries();
  saveConfig();
}

function updateAcknowledgeButton() {
  const btn = document.getElementById('acknowledgeNewBtn');
  const count = state.galleries.new ? state.galleries.new.length : 0;
  
  if (count > 0) {
    btn.style.display = 'block';
    document.getElementById('newCount').textContent = count;
  } else {
    btn.style.display = 'none';
  }
}

// ===== SEARCH =====
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', (e) => {
    state.currentSearch = e.target.value.toLowerCase().trim();
    buildGalleries();
  });
}

// ===== REFRESH =====
function setupRefresh() {
  document.getElementById('refreshBtn').onclick = async () => {
    showLoading();
    await init();
  };
}

// ===== IMAGE LIGHTBOX =====
function openLightbox(filename, artistName) {
  const lightbox = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImage');
  const nameEl = document.getElementById('lightboxArtistName');
  const mainContent = document.getElementById('mainContent');
  
  // Show lightbox immediately with loading state
  lightbox.style.display = 'flex';
  img.style.opacity = '0';
  img.src = ''; // Clear previous image
  nameEl.textContent = artistName;
  
  // Hide main content to reduce DOM load and improve performance
  if (mainContent) {
    mainContent.style.visibility = 'hidden';
  }
  
  // Prevent body scroll (use RAF to avoid blocking)
  requestAnimationFrame(() => {
    document.body.style.overflow = 'hidden';
  });
  
  // Load image asynchronously
  const tempImg = new Image();
  tempImg.onload = function() {
    img.src = `artists/${filename}`;
    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });
  };
  tempImg.onerror = function() {
    img.src = `artists/${filename}`; // Try direct load as fallback
    img.style.opacity = '1';
  };
  tempImg.src = `artists/${filename}`;
}

function closeLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  const img = document.getElementById('lightboxImage');
  const mainContent = document.getElementById('mainContent');
  
  lightbox.style.display = 'none';
  img.style.opacity = '0';
  img.src = ''; // Free memory
  
  // Show main content again
  if (mainContent) {
    mainContent.style.visibility = 'visible';
  }
  
  requestAnimationFrame(() => {
    document.body.style.overflow = 'auto';
  });
}

// ===== COPY ARTIST NAME =====
async function copyArtistName(artistName, element) {
  try {
    await navigator.clipboard.writeText(artistName);

    // Track the copy
    trackCopy(artistName);

    // Visual feedback
    element.classList.add('copied');
    showNotification(`✓ Copied: ${artistName}`);

    setTimeout(() => {
      element.classList.remove('copied');
    }, 1000);
  } catch (error) {
    console.error('Failed to copy:', error);
    showNotification('⚠️ Failed to copy to clipboard', 'error');
  }
}

// ===== GRID SIZE CONTROL =====
function setupGridSizeControl() {
  const slider = document.getElementById('gridSizeSlider');
  const valueDisplay = document.getElementById('gridSizeValue');

  slider.addEventListener('input', (e) => {
    state.gridSize = parseInt(e.target.value);
    valueDisplay.textContent = state.gridSize;

    // Update all visible grids immediately
    rerenderExpandedGalleries();

    // Save to config
    state.config.uiState.gridSize = state.gridSize;
    saveConfig();
  });
}

// ===== RANKING HELPER SYSTEM =====
function initRankHelper() {
  // Load ELO data from config
  if (state.config.rankHelper) {
    state.rankHelper = state.config.rankHelper;
  } else {
    state.rankHelper = {
      eloData: {},
      history: [],
      comparisonCount: 0,
      currentPair: null
    };
  }

  // Initialize ELO data for all artists
  let hasNewData = false;
  state.allArtists.forEach(artist => {
    if (!state.rankHelper.eloData[artist.name]) {
      state.rankHelper.eloData[artist.name] = {
        elo: artist.elo || RH_INITIAL_ELO,
        comparisons: artist.comparisons || 0
      };
      hasNewData = true;
    }
  });

  // Only save if we actually added new data
  if (hasNewData) {
    saveRankHelperData();
  }
}

function saveRankHelperData() {
  state.config.rankHelper = state.rankHelper;

  // Also update artist records
  Object.keys(state.rankHelper.eloData).forEach(artistName => {
    if (state.config.artists[artistName]) {
      state.config.artists[artistName].elo = state.rankHelper.eloData[artistName].elo;
      state.config.artists[artistName].comparisons = state.rankHelper.eloData[artistName].comparisons;
    }
  });

  // Use debounced save
  saveConfig();
}

function startRankHelper() {
  const pair = getNextRankPair();
  if (!pair) {
    showNotification('All artists have been compared sufficiently!', 'success');
    return;
  }

  state.rankHelper.currentPair = pair;
  displayRankPair(pair);
  updateRankProgress();
}

function getNextRankPair() {
  // Swiss tournament: pair artists with similar ELO and fewer comparisons
  const candidates = state.allArtists.map(a => ({
    name: a.name,
    elo: state.rankHelper.eloData[a.name]?.elo || RH_INITIAL_ELO,
    comparisons: state.rankHelper.eloData[a.name]?.comparisons || 0
  }));

  // Sort by comparisons (ascending) then by ELO deviation from initial
  candidates.sort((a, b) => {
    if (a.comparisons !== b.comparisons) return a.comparisons - b.comparisons;
    return Math.abs(a.elo - RH_INITIAL_ELO) - Math.abs(b.elo - RH_INITIAL_ELO);
  });

  // Get artists with fewest comparisons
  const minComparisons = candidates[0].comparisons;
  const needMoreComparisons = candidates.filter(c => c.comparisons <= minComparisons + 2);

  if (needMoreComparisons.length < 2) return null;

  // Sort by ELO for Swiss-style pairing
  needMoreComparisons.sort((a, b) => b.elo - a.elo);

  // Pick adjacent pairs (similar ELO)
  const idx = Math.floor(Math.random() * (needMoreComparisons.length - 1));
  const pair = [needMoreComparisons[idx], needMoreComparisons[idx + 1]];

  // Randomize left/right
  if (Math.random() < 0.5) pair.reverse();

  return pair;
}

function displayRankPair(pair) {
  const container = document.getElementById('rankPairContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="rank-comparison">
      <div class="rank-contestant" data-winner="${pair[0].name}">
        <img src="artists/${state.config.artists[pair[0].name].filename}" alt="${pair[0].name}">
        <div class="rank-contestant-info">
          <h3>${pair[0].name}</h3>
          <div class="rank-contestant-elo">ELO: ${Math.round(pair[0].elo)}</div>
          <div class="rank-contestant-comparisons">${pair[0].comparisons} comparisons</div>
        </div>
        <button class="rank-pick-btn" onclick="pickWinner('${pair[0].name}')">Pick This (←)</button>
      </div>

      <div class="rank-vs">VS</div>

      <div class="rank-contestant" data-winner="${pair[1].name}">
        <img src="artists/${state.config.artists[pair[1].name].filename}" alt="${pair[1].name}">
        <div class="rank-contestant-info">
          <h3>${pair[1].name}</h3>
          <div class="rank-contestant-elo">ELO: ${Math.round(pair[1].elo)}</div>
          <div class="rank-contestant-comparisons">${pair[1].comparisons} comparisons</div>
        </div>
        <button class="rank-pick-btn" onclick="pickWinner('${pair[1].name}')">Pick This (→)</button>
      </div>
    </div>
  `;
}

function pickWinner(winnerName) {
  if (!state.rankHelper.currentPair) return;

  const pair = state.rankHelper.currentPair;
  const winner = pair.find(p => p.name === winnerName);
  const loser = pair.find(p => p.name !== winnerName);

  if (!winner || !loser) return;

  // Calculate ELO changes
  const winnerData = state.rankHelper.eloData[winner.name];
  const loserData = state.rankHelper.eloData[loser.name];

  const expectedWinner = 1 / (1 + Math.pow(10, (loserData.elo - winnerData.elo) / 400));
  const expectedLoser = 1 - expectedWinner;

  const winnerEloBefore = winnerData.elo;
  const loserEloBefore = loserData.elo;

  winnerData.elo += RH_K_FACTOR * (1 - expectedWinner);
  loserData.elo += RH_K_FACTOR * (0 - expectedLoser);

  winnerData.comparisons++;
  loserData.comparisons++;

  // Record history for undo
  state.rankHelper.history.push({
    winner: winner.name,
    loser: loser.name,
    winnerEloBefore,
    loserEloBefore
  });

  state.rankHelper.comparisonCount++;

  // Visual feedback
  const winnerEl = document.querySelector(`[data-winner="${winnerName}"]`);
  if (winnerEl) {
    winnerEl.style.background = 'rgba(46, 213, 115, 0.2)';
    setTimeout(() => {
      winnerEl.style.background = '';
    }, 500);
  }

  saveRankHelperData();

  // Get next pair
  setTimeout(() => {
    startRankHelper();
  }, 600);
}

function skipRankPair() {
  startRankHelper();
}

function undoLastRank() {
  if (state.rankHelper.history.length === 0) {
    showNotification('Nothing to undo', 'error');
    return;
  }

  const last = state.rankHelper.history.pop();

  // Restore ELO
  state.rankHelper.eloData[last.winner].elo = last.winnerEloBefore;
  state.rankHelper.eloData[last.loser].elo = last.loserEloBefore;
  state.rankHelper.eloData[last.winner].comparisons--;
  state.rankHelper.eloData[last.loser].comparisons--;

  state.rankHelper.comparisonCount--;

  saveRankHelperData();
  showNotification('✓ Undone last comparison', 'success');

  startRankHelper();
}

function updateRankProgress() {
  const total = state.allArtists.length * RH_TARGET_COMPARISONS;
  const current = Object.values(state.rankHelper.eloData)
    .reduce((sum, data) => sum + data.comparisons, 0);

  const progress = Math.min(100, (current / total) * 100);
  const progressEl = document.getElementById('rankProgress');
  const progressText = document.getElementById('rankProgressText');

  if (progressEl) progressEl.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${current} / ${total} comparisons`;

  // Update confidence level
  const avgComparisons = current / state.allArtists.length;
  let confidence = 'Low';
  if (avgComparisons >= 8) confidence = 'Very High';
  else if (avgComparisons >= 6) confidence = 'High';
  else if (avgComparisons >= 4) confidence = 'Good';
  else if (avgComparisons >= 2) confidence = 'Medium';

  const confidenceEl = document.getElementById('confidenceLevel');
  if (confidenceEl) confidenceEl.textContent = confidence;
}

function getGradeForArtist(artistName) {
  const allElos = state.allArtists.map(a => state.rankHelper.eloData[a.name]?.elo || RH_INITIAL_ELO);
  const artistElo = state.rankHelper.eloData[artistName]?.elo || RH_INITIAL_ELO;

  // Count how many are below this artist
  const belowCount = allElos.filter(e => e < artistElo).length;
  const percentile = belowCount / allElos.length;

  // Find grade based on percentile
  for (let i = 0; i < RH_GRADE_PERCENTILES.length; i++) {
    if (percentile < RH_GRADE_PERCENTILES[i]) {
      return RH_GRADES[i];
    }
  }
  return RH_GRADES[RH_GRADES.length - 1];
}

function applyEloRankings() {
  if (!confirm('Apply ELO-based grades to all artists?')) return;

  state.allArtists.forEach(artist => {
    const grade = getGradeForArtist(artist.name);
    state.config.artists[artist.name].grade = grade;
    artist.grade = grade;
  });

  // Don't rebuild galleries, just update the visible cards
  updateAllVisibleCards();
  updateEnhancedStatistics();

  saveConfigImmediate(); // Immediate save for important action
  showNotification('✓ Grades applied successfully!', 'success');
}

function updateAllVisibleCards() {
  // Update all currently visible artist cards with new grades
  state.allArtists.forEach(artist => {
    updateArtistCards(artist.name);
  });
}

function restartRankHelper() {
  if (!confirm('Reset all ELO rankings? This cannot be undone.')) return;

  state.rankHelper = {
    eloData: {},
    history: [],
    comparisonCount: 0,
    currentPair: null
  };

  state.allArtists.forEach(artist => {
    state.rankHelper.eloData[artist.name] = {
      elo: RH_INITIAL_ELO,
      comparisons: 0
    };
    state.config.artists[artist.name].elo = RH_INITIAL_ELO;
    state.config.artists[artist.name].comparisons = 0;
  });

  saveRankHelperData();
  showNotification('✓ Rankings reset', 'success');
  startRankHelper();
}

// ===== COPY TRACKING =====
function trackCopy(artistName) {
  // Update copy count
  if (!state.config.artists[artistName].copyCount) {
    state.config.artists[artistName].copyCount = 0;
  }
  state.config.artists[artistName].copyCount++;

  // Update recent copies
  state.recentCopies.unshift({
    name: artistName,
    timestamp: new Date().toISOString()
  });

  // Keep only last 10
  state.recentCopies = state.recentCopies.slice(0, 10);

  // Save to config
  state.config.copyHistory = state.recentCopies;

  // Update card visually
  updateArtistCards(artistName);

  // Debounced save
  saveConfig();

  // Update panel if on stats tab
  if (document.getElementById('statisticsTab')?.classList.contains('active')) {
    updateRecentCopiesPanel();
  }
}

function updateRecentCopiesPanel() {
  const panel = document.getElementById('recentCopiesPanel');
  if (!panel) return;

  if (state.recentCopies.length === 0) {
    panel.innerHTML = '<p style="color: #666; font-size: 0.85em;">No recent copies</p>';
    return;
  }

  panel.innerHTML = state.recentCopies.map(item => {
    const timeAgo = getTimeAgo(item.timestamp);
    return `
      <div class="recent-copy-item" onclick="navigateToArtist('${item.name}')">
        <span class="recent-copy-name">${item.name}</span>
        <span class="recent-copy-time">${timeAgo}</span>
      </div>
    `;
  }).join('');
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ===== UI STATE RESTORATION =====
function restoreUIState() {
  // Restore expanded galleries
  state.config.uiState.expandedGalleries.forEach(galleryName => {
    const gallery = document.querySelector(`[data-gallery="${galleryName}"]`);
    if (gallery) {
      const header = gallery.querySelector('.gallery-header');
      const content = gallery.querySelector('.gallery-content');
      
      content.style.display = 'block';
      header.classList.add('expanded');
      
      renderGalleryContent(galleryName, content);
    }
  });
}

// ===== INITIALIZATION =====
async function init() {
  try {
    showLoading();

    // Load config
    state.config = await loadConfig();

    // Ensure UI state structure exists
    if (!state.config.uiState) {
      state.config.uiState = {
        expandedGalleries: [],
        sortOrder: 'alphabetical',
        gridSize: 5
      };
    }

    // Load saved grid size
    if (state.config.uiState.gridSize) {
      state.gridSize = state.config.uiState.gridSize;
      const slider = document.getElementById('gridSizeSlider');
      const valueDisplay = document.getElementById('gridSizeValue');
      if (slider && valueDisplay) {
        slider.value = state.gridSize;
        valueDisplay.textContent = state.gridSize;
      }
    }

    // Load copy history
    if (state.config.copyHistory) {
      state.recentCopies = state.config.copyHistory;
    }

    // Scan for images
    const files = await fetchImages();

    // Process images and detect new ones
    const newArtists = processImages(files);

    // Initialize ranking system
    initRankHelper();

    // Build galleries
    buildGalleries();

    // Restore UI state
    restoreUIState();

    // Update statistics
    updateEnhancedStatistics();

    // Update recent copies panel
    updateRecentCopiesPanel();

    // Save immediately if new artists were found
    if (newArtists.length > 0) {
      await saveConfigNow();
    }

    hideLoading();

    console.log(`Gallery loaded: ${state.allArtists.length} artists, ${newArtists.length} new`);

  } catch (error) {
    console.error('Initialization error:', error);
    showError(error.message);
  }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
  // Search
  setupSearch();
  
  // Refresh
  setupRefresh();
  
  // Grid size control
  setupGridSizeControl();
  
  // Settings
  document.getElementById('settingsBtn').onclick = openSettingsModal;
  
  // Acknowledge new
  document.getElementById('acknowledgeNewBtn').onclick = acknowledgeAllNew;
  
  // Setup gallery toggles for pinned galleries
  document.querySelectorAll('.gallery').forEach(gallery => {
    setupGalleryToggle(gallery);
  });
  
  // Close modals on background click
  document.getElementById('tagModal').onclick = (e) => {
    if (e.target.id === 'tagModal') {
      closeTagModal();
    }
  };
  
  document.getElementById('settingsModal').onclick = (e) => {
    if (e.target.id === 'settingsModal') {
      closeSettingsModal();
    }
  };
  
  document.getElementById('imageLightbox').onclick = (e) => {
    if (e.target.id === 'imageLightbox' || e.target.className === 'close-lightbox') {
      closeLightbox();
    }
  };
  
  // ESC key to close modals and lightbox
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTagModal();
      closeSettingsModal();
      closeLightbox();
    }
  });
}

// ===== TAB SWITCHING =====
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tabMap = {
    'gallery': 'galleryTab',
    'ranking': 'rankingTab',
    'comparison': 'comparisonTab',
    'statistics': 'statisticsTab'
  };

  const tabElement = document.getElementById(tabMap[tabName]);
  if (tabElement) {
    tabElement.classList.add('active');
  }

  // Set active button
  event?.target?.classList.add('active');

  // Perform tab-specific actions
  if (tabName === 'statistics') {
    updateEnhancedStatistics();
    updateRecentCopiesPanel();
  } else if (tabName === 'ranking') {
    updateRankProgress();
  }
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts in ranking tab
    const rankingTab = document.getElementById('rankingTab');
    if (!rankingTab || !rankingTab.classList.contains('active')) {
      return;
    }

    // Left arrow - pick left contestant
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const leftContestant = document.querySelector('.rank-contestant:first-child');
      if (leftContestant) {
        const artistName = leftContestant.dataset.winner;
        if (artistName) pickWinner(artistName);
      }
    }

    // Right arrow - pick right contestant
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const rightContestant = document.querySelector('.rank-contestant:last-child');
      if (rightContestant) {
        const artistName = rightContestant.dataset.winner;
        if (artistName) pickWinner(artistName);
      }
    }

    // Up arrow - skip
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      skipRankPair();
    }

    // Down arrow - undo
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      undoLastRank();
    }
  });
}

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  setupLazyLoading();
  setupEventListeners();
  setupKeyboardShortcuts();
  init();

  // Save on page unload to prevent data loss
  window.addEventListener('beforeunload', (e) => {
    if (saveConfigTimer) {
      // Force immediate save if there are pending changes
      saveConfigImmediate();
    }
  });
});
