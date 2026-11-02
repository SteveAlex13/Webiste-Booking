/**
 * Load Midtrans Snap.js script dynamically.
 */
export function loadSnapScript(clientKey, isProduction = false) {
  return new Promise((resolve, reject) => {
    const scriptId = 'midtrans-snap-script';
    if (document.getElementById(scriptId)) {
      resolve(window.snap);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload = () => {
      resolve(window.snap);
    };

    script.onerror = () => {
      reject(new Error('Gagal memuat script Midtrans Snap.'));
    };

    document.body.appendChild(script);
  });
}

/**
 * Open Snap popup with callbacks.
 */
export function openSnapModal(snapToken, callbacks = {}) {
  if (window.snap) {
    window.snap.pay(snapToken, {
      onSuccess: function (result) {
        if (callbacks.onSuccess) callbacks.onSuccess(result);
      },
      onPending: function (result) {
        if (callbacks.onPending) callbacks.onPending(result);
      },
      onError: function (result) {
        if (callbacks.onError) callbacks.onError(result);
      },
      onClose: function () {
        if (callbacks.onClose) callbacks.onClose();
      },
    });
  } else {
    console.error('Midtrans Snap is not loaded.');
    if (callbacks.onError) callbacks.onError(new Error('Snap JS not loaded'));
  }
}

