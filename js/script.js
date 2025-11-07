// JavaScript to fetch APOD data and render simple image/video cards (beginner-friendly)

// URL with APOD data
const API_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const space_facts = ['It would take nine years to walk to the moon.', 'Mars is called the Red Planet because of its red coloring, which comes from the large amount of iron oxide – known on Earth as rust – on the planet’s surface.', 'Mercury’s temperature varies from -280° F on its night side to 800° F during the day.', 'If you can spot the Andromeda Galaxy with your naked eyes, you can see something 14.7 billion billion miles away.', 'The Sun is 400 times larger than the Moon, but also 400 times as far away, making both objects appear to be the same size in our sky.', 'Jupiter is the largest planet. It could contain the other seven planets in just 70 percent of its volume.', 'Stars don’t twinkle until their light passes through Earth’s atmosphere.', 'If Earth were the size of a tennis ball, the Sun would be a sphere 24 feet across, approximately 0.5 mile away.', 'Of the 9,113 official features on the Moon, a mere 421 (4.6 percent) are not craters.', 'Driving a car to the nearest star at 70 mph would take more than 356 billion years.'];

// Small helper to pause execution for a given number of milliseconds
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Convert common video links to embeddable iframe URLs (YouTube, Vimeo).
// Falls back to returning the original URL for sources that already work in an iframe.
function toEmbedUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    // YouTube watch URL -> embed URL
    if (host.includes('youtube.com') && u.searchParams.has('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }

    // youtu.be short link -> embed
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

    // Vimeo -> player.vimeo.com link
    if (host.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }

    // If it's already an embed-style URL or a direct video file, return as-is
    return url;
  } catch (err) {
    // If URL construction fails, return original string
    return url;
  }
}

// Wait for the page to be ready before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  const getImageBtn = document.getElementById('getImageBtn');
  getImageBtn.addEventListener('click', fetchAndRenderImages);
});

function showRandomFact() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  // Pick a random fact
  const idx = Math.floor(Math.random() * space_facts.length);
  const fact = space_facts[idx] || '';

  // Create or update a container for the fact
  let factEl = document.getElementById('space-facts');
  factEl.style.textAlign = 'center';
  factEl.style.margin = '12px 0';
  factEl.style.fontSize = '18px';
  factEl.style.color = '#f1f1f1';
  factEl.innerHTML = `
    <h2 style="text-align:center;margin:0 0 8px 0;font-size:20px;color:#f1f1f1;font-family:Helvetica, sans-serif;">Did you know?</h2>
    <p style="text-align:center;margin:0;font-size:18px;color:#f1f1f1;font-family:Public Sans, sans-serif;white-space:pre-wrap;">${fact}</p>
  `;
}

// Fetch the JSON data and render the gallery
async function fetchAndRenderImages() {
  const gallery = document.getElementById('gallery');

  // Show a loading message while we fetch
  gallery.innerHTML = `<div class="placeholder"><p>Loading images…</p></div>`;

  // Keep track of when loading started so we can ensure at least 1s visible
  const loadingStart = Date.now();

  try {
    // Fetch the data from the provided URL
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    // Parse the JSON array
    const items = await response.json();

    // Ensure the loading message stays visible for at least 2 seconds
    const elapsed = Date.now() - loadingStart;
    if (elapsed < 2000) {
      await delay(2000 - elapsed);
    }

    // Clear gallery before rendering
    gallery.innerHTML = '';

    // If no items, show a message
    if (!Array.isArray(items) || items.length === 0) {
      gallery.innerHTML = `<div class="placeholder"><p>No images found.</p></div>`;
      return;
    }

    showRandomFact();

    // Create a card for each item
    items.forEach(item => {
      // Use safe defaults for fields that might be missing
      const mediaUrl = item.url || item.hdurl || '';
      const mediaType = item.media_type || 'image';
      const title = item.title || 'Untitled';
      const date = item.date || item.date_created || 'Unknown date';

      // Create card element
      const card = document.createElement('div');
      card.className = 'gallery-item';

      // For videos, prefer a thumbnail if provided; otherwise show a simple play placeholder.
      let thumbHtml = '';
      if (mediaType === 'video') {
        const thumb = item.thumbnail_url || item.thumbnail || '';
        if (thumb) {
          thumbHtml = `<img src="${thumb}" alt="${title} (video thumbnail)" class="card-image" />`;
        } else {
          // simple SVG placeholder with play icon
          thumbHtml = `
            <div class="card-image" style="display:flex;align-items:center;justify-content:center;height:200px;background:#000;color:#fff;border-radius:4px;">
              <div style="text-align:center;">
                <div style="font-size:36px;line-height:1;">▶</div>
                <div style="font-size:14px;margin-top:6px;">Video</div>
              </div>
            </div>
          `;
        }
      } else {
        // image
        thumbHtml = mediaUrl ? `<img src="${mediaUrl}" alt="${title}" class="card-image" />` : '';
      }

      // Insert card HTML using a template literal
      card.innerHTML = `
        ${thumbHtml}
        <div class="card-body">
          <h3 class="card-title">${title}</h3>
          <p class="card-date">${date}</p>
        </div>
      `;

      // Open a modal when the card is clicked
      card.addEventListener('click', () => {
        openCard(item);
      });

      // Add the card to the gallery
      gallery.appendChild(card);
    });
  } catch (error) {
    // Ensure the loading message is visible for at least 1 second even on error
    const elapsed = Date.now() - loadingStart;
    if (elapsed < 1000) {
      await delay(1000 - elapsed);
    }

    // Show a simple error message and log details for debugging
    gallery.innerHTML = `<div class="placeholder"><p>Failed to load images. Try again later.</p></div>`;
    console.error('Error fetching images:', error);
  }
}

// Function to open a modal showing a larger image or embedded video, title, date and explanation
function openCard(item) {
  // Safe defaults for fields
  const title = item.title || 'Untitled';
  const date = item.date || item.date_created || 'Unknown date';
  const explanation = item.explanation || '';
  const mediaUrl = item.url || item.hdurl || '';
  const mediaType = item.media_type || 'image';

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  // Basic inline styles so the modal is usable even without CSS file changes
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.7)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';
  overlay.style.padding = '20px';

  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '900px';
  modal.style.width = '100%';
  modal.style.maxHeight = '90vh';
  modal.style.overflow = 'auto';
  modal.style.background = '#fff';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
  modal.style.position = 'relative';
  modal.style.padding = '16px';

  // Build media HTML depending on media type
  let mediaHtml = '';
  if (mediaType === 'video') {
    // If it's a direct video file (mp4/webm), use <video controls>.
    const lower = mediaUrl.toLowerCase();
    const isDirectVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg');

    if (isDirectVideo) {
      mediaHtml = `
        <div style="text-align:center;">
          <video controls style="max-width:100%;height:auto;border-radius:4px;">
            <source src="${mediaUrl}" />
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    } else {
      // Try to convert common links to embed URLs for iframes (YouTube/Vimeo)
      const embed = toEmbedUrl(mediaUrl);
      mediaHtml = `
        <div style="width:100%;height:480px;max-height:60vh;">
          <iframe src="${embed}" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe>
        </div>
      `;
    }
  } else {
    // image
    mediaHtml = `
      <div style="text-align:center;">
        <img src="${mediaUrl}" alt="${title}" style="max-width:100%;height:auto;border-radius:4px;" />
      </div>
    `;
  }

  // Modal inner HTML with title, date and explanation
  modal.innerHTML = `
    <button class="modal-close" aria-label="Close" style="position:absolute;right:8px;top:8px;border:none;background:#222;color:#fff;padding:6px 10px;border-radius:4px;cursor:pointer;">×</button>
    <div class="modal-media">${mediaHtml}</div>
    <div class="modal-info" style="margin-top:12px;">
      <h2 style="margin:0 0 6px 0;">${title}</h2>
      <p style="margin:0 0 12px 0;color:#666;">${date}</p>
      <p style="margin:0 0 12px 0;white-space:pre-wrap;">${explanation}</p>
    </div>
  `;

  // Append modal to overlay then overlay to body
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Function to remove the modal and cleanup listeners
  function closeModal() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    document.removeEventListener('keydown', onKeyDown);
  }

  // Close when clicking the close button
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  // Close when clicking outside the modal content (on the overlay)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Close on Escape key
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }
  document.addEventListener('keydown', onKeyDown);
}
