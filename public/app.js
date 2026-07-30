const form = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const statusBox = document.getElementById('status');
const resultEmpty = document.getElementById('result-empty');
const resultCard = document.getElementById('result-card');
const shortLink = document.getElementById('short-link');
const shortCode = document.getElementById('short-code');
const copyButton = document.getElementById('copy-link');
const clearHistoryButton = document.getElementById('clear-history');
const historyList = document.getElementById('history-list');

const storageKey = 'skibidi-shortener-history';
let latestLink = '';

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 6)));
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle('error', isError);
}

function renderLatestLink(link) {
  latestLink = link;
  shortLink.textContent = link;
  shortLink.href = link;
  shortCode.textContent = link.replace(window.location.origin + '/', '');
  resultEmpty.classList.add('hidden');
  resultCard.classList.remove('hidden');
}

function renderHistory() {
  const items = readHistory();

  if (!items.length) {
    historyList.innerHTML = '<p class="empty-state">No links yet. Your clipboard is still a virgin.</p>';
    return;
  }

  historyList.innerHTML = items
    .map(
      (item) => `
        <article class="history-item">
          <a href="${item.shortLink}" target="_blank" rel="noreferrer">${item.shortLink}</a>
          <small>${formatTime(item.createdAt)} · ${item.originalUrl}</small>
        </article>
      `
    )
    .join('');
}

function saveToHistory(originalUrl, shortLinkValue) {
  const items = readHistory();
  items.unshift({
    originalUrl,
    shortLink: shortLinkValue,
    createdAt: Date.now()
  });
  writeHistory(items);
  renderHistory();
}

copyButton.addEventListener('click', async () => {
  if (!latestLink) {
    return;
  }

  try {
    await navigator.clipboard.writeText(latestLink);
    setStatus('Copied. The link is now free-range.' );
  } catch {
    setStatus('Copy failed. The clipboard is being dramatic.', true);
  }
});

clearHistoryButton.addEventListener('click', () => {
  localStorage.removeItem(storageKey);
  renderHistory();
  setStatus('History cleared. The brainrot has been reset.');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();
  if (!url) {
    setStatus('Drop a valid URL first.', true);
    return;
  }

  setStatus('Shortening... please wait while the meme machine does its thing.');

  try {
    const response = await fetch('/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.errors?.[0]?.msg || 'Failed to shorten URL.';
      throw new Error(message);
    }

    const shortLinkValue = `${window.location.origin}/${payload.shortCode}`;
    renderLatestLink(shortLinkValue);
    saveToHistory(url, shortLinkValue);
    setStatus('Done. Your link is cooked and ready to deploy.');
    form.reset();
    urlInput.focus();
  } catch (error) {
    setStatus(error.message || 'Something broke while shortening the link.', true);
  }
});

renderHistory();