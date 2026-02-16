const codeReader = new ZXing.BrowserMultiFormatReader();

const video       = document.getElementById('video');
const resultDiv   = document.getElementById('result');
const restartBtn  = document.getElementById('restartBtn');

let currentStream = null;

async function startScanner() {
  try {
    // Stop any previous stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    video.srcObject = currentStream;
    resultDiv.classList.add('hidden');
    restartBtn.classList.add('hidden');

    codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
      if (result) {
        const tag = result.getText().trim();
        showAssetInfo(tag);
        // You can stop scanning here if you want single scan behavior:
        // codeReader.reset();
      }
      if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error(err);
      }
    });
  } catch (err) {
    resultDiv.innerHTML = `<strong style="color:#d32f2f">Camera error:</strong> ${err.message}`;
    resultDiv.classList.remove('hidden');
  }
}

async function showAssetInfo(tag) {
  try {
    const response = await fetch('assets.json');
    if (!response.ok) throw new Error('Cannot load assets.json');

    const assets = await response.json();

    if (assets[tag]) {
      const a = assets[tag];
      resultDiv.innerHTML = `
        <h2>Asset Found</h2>
        <table>
          <tr><th>Tag</th><td>${tag}</td></tr>
          <tr><th>Type</th><td>${escapeHtml(a.assetTypeName || '—')}</td></tr>
          <tr><th>Description</th><td>${escapeHtml(a.description || '—')}</td></tr>
          <tr><th>Quantity</th><td>${a.qty || '—'}</td></tr>
          <tr><th>Building</th><td>${escapeHtml(a.buildingName || '—')}</td></tr>
          <tr><th>Area / Floor</th><td>${escapeHtml(a.buildingArea || '—')} • ${escapeHtml(a.floorName || '—')}</td></tr>
          <tr><th>System</th><td>${escapeHtml(a.systemName || '—')}</td></tr>
          <tr><th>Country</th><td>${escapeHtml(a.countryOfOrigin || '—')}</td></tr>
        </table>
      `;
    } else {
      resultDiv.innerHTML = `<p class="not-found">Asset <strong>${tag}</strong> not found in database.</p>`;
    }

    resultDiv.classList.remove('hidden');
    restartBtn.classList.remove('hidden');

  } catch (err) {
    resultDiv.innerHTML = `<strong style="color:#d32f2f">Error:</strong> ${err.message}`;
    resultDiv.classList.remove('hidden');
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Restart button
restartBtn.addEventListener('click', startScanner);

// Start on load
startScanner();

// Optional: restart when page becomes visible again (useful on mobile)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    startScanner();
  }
});
