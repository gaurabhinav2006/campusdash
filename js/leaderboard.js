import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

export class GlobalLeaderboard {
  constructor() {
    this.url = String(SUPABASE_URL || '').replace(/\/$/, '');
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
      ...extra
    };
  }

  async list(limit = 25) {
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
        headers: this.headers()
      });

      if (!response.ok) {
        throw new Error(`Leaderboard read failed (${response.status}).`);
      }

      const rows = await response.json();
      return { rows: Array.isArray(rows) ? rows : [], configured: true, error: '' };
    } catch (error) {
      console.warn('Global leaderboard read failed.', error);
      return { rows: [], configured: true, error: 'Could not reach the global leaderboard.' };
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
      const response = await fetch(`${this.url}/rest/v1/campus_scores`, {
        method: 'POST',
        headers: this.headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Leaderboard submit failed (${response.status}).`);
      }

      return { ok: true, configured: true };
    } catch (error) {
      console.warn('Global leaderboard submit failed.', error);
      return { ok: false, configured: true };
    }
  }
}
