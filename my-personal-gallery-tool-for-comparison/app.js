// ===== STATE MANAGEMENT =====
const state = {
  allArtists: [],
  config: {},
  galleries: {},
  currentSearch: '',
  virtualScrollers: {},
  currentModalArtist: null,
  gridSize: 5, // Default grid columns
  imageObserver: null // Intersection Observer for lazy loading
};

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

async function saveConfig() {
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
        addedDate: new Date().toISOString()
      };
      newArtists.push(artistName);
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
    </div>
    <div class="card-footer">
      <div class="artist-name" data-artist="${artist.name}" title="Click to copy: ${artist.name}">${artist.name}</div>
      <div class="artist-tags">${tagHtml}</div>
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
  const cards = document.querySelectorAll(`[data-artist="${artistName}"]`);
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
      slider.value = state.gridSize;
      valueDisplay.textContent = state.gridSize;
    }
    
    // Scan for images
    const files = await fetchImages();
    
    // Process images and detect new ones
    const newArtists = processImages(files);
    
    // Build galleries
    buildGalleries();
    
    // Restore UI state
    restoreUIState();
    
    // Save if new artists were found
    if (newArtists.length > 0) {
      await saveConfig();
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

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  setupLazyLoading();
  setupEventListeners();
  init();
});
