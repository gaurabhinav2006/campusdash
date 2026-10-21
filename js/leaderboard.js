import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

export class GlobalLeaderboard {
  constructor() {
    this.url = String(SUPABASE_URL || '').replace(/\/$/, '').replace(/\/rest\/v1\/?$/, '');
    this.key = String(SUPABASE_PUBLISHABLE_KEY || '');
    this.enabled = this.url.includes('.supabase.co') &&
      !this.url.includes('YOUR_PROJECT_REF') &&
      this.key &&
      !this.key.includes('YOUR_');
  }

  headers(extra = {}) {
    return {
      apikey: this.key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extra
    };
  }

  async isNameAvailable(name) {
    if (!this.enabled) return { available: true, configured: false, error: '' };
    const query = new URLSearchParams({ select: 'name', name: `eq.${String(name).trim()}` });
    try {
      const response = await fetch(`${this.url}/rest/v1/campus_scores?${query}`, {
        cache: 'no-store',
        headers: this.headers()
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Name check failed (${response.status}): ${body.slice(0, 240)}`);
      }
      const rows = await response.json();
      return { available: !Array.isArray(rows) || rows.length === 0, configured: true, error: '' };
    } catch (error) {
      console.warn('Name availability check failed.', error);
      return { available: false, configured: true, error: error.message || 'Could not check whether that name is available.' };
    }
  }

  async list(limit = 5) {
    if (!this.enabled) {
      return { rows: [], configured: false, error: 'Global leaderboard is not configured yet.' };
    }

    const query = new URLSearchParams({
      select: 'name,score,distance,coins,created_at',
      order: 'score.desc,created_at.asc',
      limit: String(limit)
    });

    try {
      const response = await fetch(`${this.url}/rest/v1/campus_scores?${query}`, {
        cache: 'no-store',
        headers: this.headers()
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Leaderboard read failed (${response.status}): ${body.slice(0, 240)}`);
      }

      const rows = await response.json();
      return { rows: Array.isArray(rows) ? rows : [], configured: true, error: '' };
    } catch (error) {
      console.warn('Global leaderboard read failed.', error);
      return { rows: [], configured: true, error: error.message || 'Could not reach the global leaderboard.' };
    }
  }

  async submit(entry) {
    if (!this.enabled) return { ok: false, configured: false };

    const payload = {
      name: String(entry.name || 'Runner').trim().slice(0, 18),
      score: Math.max(0, Math.floor(Number(entry.score) || 0)),
      distance: Math.max(0, Math.floor(Number(entry.distance) || 0)),
      coins: Math.max(0, Math.floor(Number(entry.coins) || 0))
    };

    try {
      const response = await fetch(`${this.url}/rest/v1/rpc/submit_campus_score`, {
        method: 'POST',
        cache: 'no-store',
        headers: this.headers(),
        body: JSON.stringify({
          p_name: payload.name,
          p_score: payload.score,
          p_distance: payload.distance,
          p_coins: payload.coins
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Leaderboard submit failed (${response.status}): ${body.slice(0, 240)}`);
      }

      return { ok: true, configured: true };
    } catch (error) {
      console.warn('Global leaderboard submit failed.', error);
      return { ok: false, configured: true, error: error.message || 'Could not submit score.' };
    }
  }
}
