import { API_URL } from './constants';

/**
 * Lightweight HTTP client that manages session cookies for API calls.
 * Used in global setup/teardown to seed and clean test data.
 */
export class ApiClient {
  private baseUrl: string;
  private cookies: string[] = [];

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = `${baseUrl}/api`;
  }

  private async request(
    method: string,
    path: string,
    body?: any,
  ): Promise<{ status: number; data: any; headers: Headers }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.cookies.length > 0) {
      headers['Cookie'] = this.cookies.join('; ');
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });

    // Capture set-cookie headers
    const setCookie = res.headers.getSetCookie?.() || [];
    if (setCookie.length > 0) {
      this.cookies = setCookie.map((c) => c.split(';')[0]);
    }

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    }

    return { status: res.status, data, headers: res.headers };
  }

  async get(path: string) {
    return this.request('GET', path);
  }

  async post(path: string, body?: any) {
    return this.request('POST', path, body);
  }

  async put(path: string, body?: any) {
    return this.request('PUT', path, body);
  }

  async delete(path: string) {
    return this.request('DELETE', path);
  }

  // ── Auth ──────────────────────────────────────────────

  async loginC2C(email: string, password: string): Promise<any> {
    const res = await this.post('/auth/login', { email, password });
    if (res.status !== 200) {
      throw new Error(`C2C login failed (${res.status}): ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }

  async loginBusiness(email: string, password: string, organizationId?: string): Promise<any> {
    const body: any = { email, password };
    if (organizationId) body.organization_id = organizationId;
    const res = await this.post('/business/auth/login', body);
    if (res.status !== 200) {
      throw new Error(`B2B login failed (${res.status}): ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }

  async registerUser(email: string, password: string, name: string): Promise<any> {
    const res = await this.post('/auth/register', { email, password, name });
    return res;
  }

  // ── Admin ─────────────────────────────────────────────

  async createOrganization(data: {
    name: string;
    type: string;
    subscription_plan?: string;
    subscription_status?: string;
    default_location?: { latitude: number; longitude: number; address?: string };
  }): Promise<any> {
    const res = await this.post('/admin/organizations', data);
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Create org failed (${res.status}): ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }

  async addOrgMember(orgId: string, email: string, role: string): Promise<any> {
    const res = await this.post(`/admin/organizations/${orgId}/members`, { email, role });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Add member failed (${res.status}): ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }

  // ── Items ─────────────────────────────────────────────

  async createC2CItem(data: {
    type: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    date_time?: string;
  }): Promise<any> {
    const res = await this.post('/items', data);
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Create C2C item failed (${res.status}): ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }

  async createBusinessItem(data: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    date_time?: string;
  }): Promise<any> {
    const res = await this.post('/business/items', data);
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Create B2B item failed (${res.status}): ${JSON.stringify(res.data)}`);
    }
    return res.data;
  }

  // ── Matches ───────────────────────────────────────────

  async getBusinessMatchesList(foundItemId?: string): Promise<any> {
    const params = foundItemId ? `?found_item_id=${foundItemId}` : '';
    const res = await this.get(`/business/items/matches/list${params}`);
    return res.data;
  }

  async getDashboardStats(): Promise<any> {
    const res = await this.get('/business/items/dashboard/stats');
    return res.data;
  }
}
