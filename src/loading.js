// Every request has a deadline so a stalled connection can be retried in the UI.
export async function fetchJSON(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function settleLoads(jobs) {
  const results = await Promise.allSettled(jobs);
  const failure = results.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
  return results.map(result => result.value);
}
