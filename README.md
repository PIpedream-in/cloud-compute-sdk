# Pipedream Cloud Compute SDK

Official TypeScript/JavaScript SDK for interacting with the Pipedream Cloud Compute Platform.

https://pipedream.in

## Installation

```bash
npm i @pipedream.in/cloud-compute-sdk
```

## Quick Start

```typescript
import { CloudComputeSDK } from '@pipedream/cloud-compute-sdk'

// Initialize the SDK
const sdk = new CloudComputeSDK({
  baseUrl: 'https://iblofngyjjxyafjayxkt.supabase.co/functions/v1',
  apiKey: 'your-api-key-here'
})

// List available cloud providers
const providers = await sdk.providers.list()
console.log('Available providers:', providers.data)

// Get inventory for specific provider
const inventory = await sdk.inventory.getByProvider('aws', {
  region_code: 'us-east-1',
  min_vcpu: 4,
  max_price_usd_hr: 2.0
})

// Create a deployment
const deployment = await sdk.deployments.create({
  cloud_inventory_id: 'your-inventory-id',
  rental_duration_hours: 24,
  ssh_public_key: 'ssh-rsa AAAAB3...'
})
```

## API Reference

### Authentication

Get your API key from the [Pipedream Dashboard](https://pipedream.in/api-keys).

### Providers

```typescript
// List all cloud providers
const providers = await sdk.providers.list()

// Get regions for a provider
const regions = await sdk.providers.getRegions('provider-id')

// Get templates for a provider  
const templates = await sdk.providers.getTemplates('provider-id')
```

### Inventory

```typescript
// List all inventory with filters
const inventory = await sdk.inventory.list({
  provider_id: 'aws-provider-id',
  min_vcpu: 4,
  max_price_usd_hr: 1.0,
  limit: 20
})

// Get inventory by provider name
const awsInventory = await sdk.inventory.getByProvider('aws', {
  region_code: 'us-east-1',
  instance_type: 'm5.large'
})

// Get specific inventory item
const item = await sdk.inventory.get('inventory-id')
```

### Deployments

```typescript
// Create deployment
const deployment = await sdk.deployments.create({
  cloud_inventory_id: 'inventory-id',
  rental_duration_hours: 24,
  ssh_public_key: 'optional-ssh-key',
  tags: { project: 'my-project' }
})

// List deployments
const deployments = await sdk.deployments.list({
  status: 'active',
  limit: 10
})

// Get specific deployment
const deployment = await sdk.deployments.get('deployment-id')
```

### Usage Analytics

```typescript
// Get usage logs
const logs = await sdk.usage.getLogs({
  start_date: '2025-01-01T00:00:00Z',
  end_date: '2025-01-31T23:59:59Z',
  limit: 100
})

// Get usage summary
const summary = await sdk.usage.getSummary({
  start_date: '2025-01-01T00:00:00Z', 
  end_date: '2025-01-31T23:59:59Z'
})

// Get billing information
const billing = await sdk.usage.getBilling({
  start_date: '2025-01-01T00:00:00Z',
  end_date: '2025-01-31T23:59:59Z'
})
```

## Provider Structure

### Available Providers
- **AWS**: EC2 instances (t3.micro, m5.large, g4dn.xlarge, etc.)
- **Vultr**: VPS instances (vc2-1c-1gb, vcg-g1-1c-3gb, etc.) 
- **VAST AI**: GPU instances (RTX 4090, A100, H100, etc.)

### Inventory Filtering
Filter machines by:
- Provider and region
- CPU cores, memory, GPU specifications
- Price range
- Availability type (instant, on-demand, spot)

## Error Handling

```typescript
try {
  const deployment = await sdk.deployments.create({
    cloud_inventory_id: 'invalid-id'
  })
} catch (error) {
  console.error('Deployment failed:', error.message)
  // Handle specific error types
  if (error.message.includes('Insufficient wallet balance')) {
    // Redirect to wallet top-up
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions for all methods and responses.

## License

MIT

## Support

- [Documentation](https://pipedream.in/docs)
- [Discord](https://discord.gg/t4dw6gHe)
- [Telegram](https://t.me/+CmuV-D5KHJczMjM1)
- Email: hello@pipedream.in