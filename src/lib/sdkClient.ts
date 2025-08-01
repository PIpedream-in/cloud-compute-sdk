/**
 * SDK Client for Cloud Compute Platform
 * 
 * Example usage:
 * 
 * import { CloudComputeSDK } from './lib/sdkClient'
 * 
 * const sdk = new CloudComputeSDK({
 *   baseUrl: 'https://your-project.supabase.co/functions/v1',
 *   apiKey: 'your-api-key'
 * })
 * 
 * // Check wallet balance
 * const balance = await sdk.wallet.getBalance()
 * 
 * // Create deployment
 * const deployment = await sdk.deployments.create({
 *   cloud_inventory_id: 'uuid',
 *   rental_duration_hours: 24
 * })
 */

export interface SDKConfig {
  baseUrl: string
  apiKey: string
}

export interface CloudProvider {
  id: string
  name: string
  display_name: string
  description?: string
  logo_url?: string
  is_active: boolean
}

export interface CloudRegion {
  id: string
  provider_id: string
  region_code: string
  region_name: string
  is_active: boolean
}

export interface CloudInventory {
  id: string
  provider_id: string
  region_id: string
  instance_type: string
  price_usd_hr: number
  vcpu?: number
  memory?: string
  storage_type?: string
  storage_total_gb?: number
  accel_model?: string
  accel_count?: number
  accel_mem_mib?: number
  is_active: boolean
  minimum_hours: number
  availability_type: string
  class?: string
}

export interface ProviderTemplate {
  id: string
  provider_id: string
  template_name: string
  display_name: string
  description?: string
  operating_system: string
  os_family: string
  template_type: string
  default_username: string
  supported_instance_types?: string[]
  is_active: boolean
}

export interface CreateDeploymentRequest {
  cloud_inventory_id: string
  rental_duration_hours?: number
  deployment_type?: 'cloud' | 'private'
  ssh_public_key?: string
  tags?: Record<string, any>
}

export interface Deployment {
  deployment_id: string
  status: string
  cost_usd: number
  duration_hours: number
  created_at: string
}

export interface APIKey {
  id: string
  keyName: string
  apiKey?: string
  permissions: string[]
  isActive: boolean
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
}

export interface UsageSummary {
  period: { start_date: string; end_date: string }
  summary: {
    total_calls: number
    successful_calls: number
    failed_calls: number
    total_cost_usd: number
    success_rate: string
  }
  endpoint_breakdown: Array<{
    endpoint: string
    calls: number
    cost_usd: number
  }>
}

export class CloudComputeSDK {
  private baseUrl: string
  private apiKey: string

  constructor(config: SDKConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    // Parse body once, fall back gracefully if JSON parsing fails.
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch (_) {
      parsed = { error: 'Failed to parse response body as JSON' };
    }

    if (!response.ok) {
      // Narrow to extract an error message if present.
      let message = `HTTP ${response.status}`;
      if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'error' in parsed &&
          typeof (parsed as any).error === 'string'
      ) {
        message = (parsed as any).error;
      }
      throw new Error(message);
    }

    return parsed as T;
  }


  // Cloud Providers Management
  providers = {
    list: async (): Promise<{ data: CloudProvider[] }> => {
      return this.request<{ data: CloudProvider[] }>('/sdk-providers')
    },

    getRegions: async (providerId?: string): Promise<{ data: CloudRegion[] }> => {
      const searchParams = new URLSearchParams()
      if (providerId) searchParams.set('provider_id', providerId)
      
      const endpoint = `/sdk-providers/regions${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<{ data: CloudRegion[] }>(endpoint)
    },

    getTemplates: async (providerId?: string): Promise<{ data: ProviderTemplate[] }> => {
      const searchParams = new URLSearchParams()
      if (providerId) searchParams.set('provider_id', providerId)
      
      const endpoint = `/sdk-providers/templates${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<{ data: ProviderTemplate[] }>(endpoint)
    },
  }

  // Cloud Inventory Management
  inventory = {
    list: async (params?: {
      provider_id?: string
      region_id?: string
      instance_type?: string
      min_vcpu?: number
      max_price_usd_hr?: number
      accel_model?: string
      availability_type?: string
      limit?: number
      offset?: number
    }): Promise<{ data: CloudInventory[] }> => {
      const searchParams = new URLSearchParams()
      if (params?.provider_id) searchParams.set('provider_id', params.provider_id)
      if (params?.region_id) searchParams.set('region_id', params.region_id)
      if (params?.instance_type) searchParams.set('instance_type', params.instance_type)
      if (params?.min_vcpu) searchParams.set('min_vcpu', params.min_vcpu.toString())
      if (params?.max_price_usd_hr) searchParams.set('max_price_usd_hr', params.max_price_usd_hr.toString())
      if (params?.accel_model) searchParams.set('accel_model', params.accel_model)
      if (params?.availability_type) searchParams.set('availability_type', params.availability_type)
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      
      const endpoint = `/sdk-inventory${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<{ data: CloudInventory[] }>(endpoint)
    },

    get: async (inventoryId: string): Promise<{ data: CloudInventory }> => {
      return this.request<{ data: CloudInventory }>(`/sdk-inventory/${inventoryId}`)
    },

    getByProvider: async (providerName: string, params?: {
      region_code?: string
      instance_type?: string
      min_vcpu?: number
      max_price_usd_hr?: number
      limit?: number
      offset?: number
    }): Promise<{ data: CloudInventory[] }> => {
      const searchParams = new URLSearchParams()
      searchParams.set('provider', providerName)
      if (params?.region_code) searchParams.set('region_code', params.region_code)
      if (params?.instance_type) searchParams.set('instance_type', params.instance_type)
      if (params?.min_vcpu) searchParams.set('min_vcpu', params.min_vcpu.toString())
      if (params?.max_price_usd_hr) searchParams.set('max_price_usd_hr', params.max_price_usd_hr.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      
      const endpoint = `/sdk-inventory/provider/${providerName}${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<{ data: CloudInventory[] }>(endpoint)
    },
  }

  // Deployment Management
  deployments = {
    create: async (params: CreateDeploymentRequest): Promise<{ message: string; data: Deployment }> => {
      return this.request<{ message: string; data: Deployment }>('/sdk-deployments', {
        method: 'POST',
        body: JSON.stringify(params),
      })
    },

    list: async (params?: { 
      limit?: number
      offset?: number
      status?: string 
    }): Promise<{ data: any[] }> => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      if (params?.status) searchParams.set('status', params.status)
      
      const endpoint = `/sdk-deployments${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<{ data: any[] }>(endpoint)
    },

    get: async (deploymentId: string): Promise<{ data: any }> => {
      return this.request<{ data: any }>(`/sdk-deployments/${deploymentId}`)
    },
  }

  // Usage Tracking
  usage = {
    getLogs: async (params?: {
      limit?: number
      offset?: number
      start_date?: string
      end_date?: string
      endpoint?: string
    }): Promise<{ data: any[] }> => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      if (params?.start_date) searchParams.set('start_date', params.start_date)
      if (params?.end_date) searchParams.set('end_date', params.end_date)
      if (params?.endpoint) searchParams.set('endpoint', params.endpoint)
      
      const endpoint = `/sdk-usage-tracking/logs${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<{ data: any[] }>(endpoint)
    },

    getSummary: async (params?: { start_date?: string; end_date?: string }): Promise<UsageSummary> => {
      const searchParams = new URLSearchParams()
      if (params?.start_date) searchParams.set('start_date', params.start_date)
      if (params?.end_date) searchParams.set('end_date', params.end_date)
      
      const endpoint = `/sdk-usage-tracking/summary${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<UsageSummary>(endpoint)
    },

    getBilling: async (params?: { start_date?: string; end_date?: string }): Promise<any> => {
      const searchParams = new URLSearchParams()
      if (params?.start_date) searchParams.set('start_date', params.start_date)
      if (params?.end_date) searchParams.set('end_date', params.end_date)
      
      const endpoint = `/sdk-usage-tracking/billing${searchParams.toString() ? `?${searchParams}` : ''}`
      return this.request<any>(endpoint)
    },
  }
}

// Example usage documentation
export const EXAMPLE_USAGE = `
// Initialize the SDK
const sdk = new CloudComputeSDK({
  baseUrl: 'https://iblofngyjjxyafjayxkt.supabase.co/functions/v1',
  apiKey: 'your-api-key-here'
})

// List all available cloud providers
const providers = await sdk.providers.list()
console.log('Available providers:', providers.data)

// Get regions for AWS
const awsRegions = await sdk.providers.getRegions('aws-provider-id')
console.log('AWS regions:', awsRegions.data)

// Get templates for AWS
const awsTemplates = await sdk.providers.getTemplates('aws-provider-id')
console.log('AWS templates:', awsTemplates.data)

// List all inventory
const allInventory = await sdk.inventory.list()
console.log('All available machines:', allInventory.data)

// Filter AWS machines by region and specs
const awsMachines = await sdk.inventory.getByProvider('aws', {
  region_code: 'us-east-1',
  min_vcpu: 4,
  max_price_usd_hr: 1.0
})
console.log('Filtered AWS machines:', awsMachines.data)

// Get specific inventory details
const machineDetails = await sdk.inventory.get('inventory-id')
console.log('Machine details:', machineDetails.data)

// Create a deployment
const deployment = await sdk.deployments.create({
  cloud_inventory_id: 'your-inventory-id',
  rental_duration_hours: 24,
  ssh_public_key: 'ssh-rsa AAAAB3...'
})

// Get usage summary
const usage = await sdk.usage.getSummary({
  start_date: '2025-01-01T00:00:00Z',
  end_date: '2025-01-31T23:59:59Z'
})

// INVENTORY STRUCTURE EXPLANATION:
// 
// 1. PROVIDERS: Each provider (AWS, Vultr, VAST AI) has different machine types
//    - AWS: EC2 instances (t3.micro, m5.large, g4dn.xlarge, etc.)
//    - Vultr: VPS instances (vc2-1c-1gb, vcg-g1-1c-3gb, etc.) 
//    - VAST AI: GPU instances (RTX 4090, A100, H100, etc.)
//
// 2. REGIONS: Each provider has different regions
//    - AWS: us-east-1, eu-west-1, ap-southeast-1, etc.
//    - Vultr: ewr, lax, fra, etc.
//    - VAST AI: Global locations
//
// 3. TEMPLATES: Each provider has deployment templates
//    - AWS: AMI images (Ubuntu 20.04, Windows Server, Deep Learning AMI)
//    - Vultr: OS templates (Ubuntu, CentOS, Debian, etc.)
//    - VAST AI: Docker images for ML/AI workloads
//
// 4. INVENTORY FILTERING:
//    - By provider: Filter machines by specific cloud provider
//    - By region: Filter by geographical location
//    - By specs: Filter by CPU cores, memory, GPU, price
//    - By availability: instant, on-demand, spot instances
//
// Example workflow:
// 1. List providers → Choose AWS/Vultr/VAST
// 2. Get regions for chosen provider → Select region
// 3. Get templates for provider → Choose OS/Docker image
// 4. List inventory with filters → Find suitable machine
// 5. Create deployment with inventory_id + template
`