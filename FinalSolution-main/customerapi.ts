import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { getAuthenticatedClient, getWalletAddressInfo, createOutgoingPaymentPendingGrant } from './open-payments';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (replace with proper database in production)
interface CustomerGrant {
  id: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  dailyLimit: number;
  spentToday: number;
  expiresAt: string;
  createdAt: string;
  grantData: {
    continueAccessToken: string;
    continueUri: string;
    interactRef?: string;
    quoteId?: string;
    senderWalletAddress: string;
  };
  status: 'active' | 'expired' | 'suspended';
}

interface Customer {
  id: string;
  name: string;
  walletAddress: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

interface QRCodeData {
  customerId: string;
  grants: Array<{
    grantId: string;
    vendorId: string;
    vendorName: string;
    dailyLimit: number;
    expiresAt: string;
  }>;
  generatedAt: string;
  signature: string; // For verification
}

// Mock data storage
const customers: Map<string, Customer> = new Map();
const grants: Map<string, CustomerGrant> = new Map();
const vendors: Map<string, { id: string; name: string; walletAddress: string }> = new Map();

// Initialize some mock vendors
vendors.set('vendor1', { id: 'vendor1', name: 'ShopA Market', walletAddress: 'https://ilp.interledger-test.dev/shop-a' });
vendors.set('vendor2', { id: 'vendor2', name: 'MarketB Fresh', walletAddress: 'https://ilp.interledger-test.dev/market-b' });
vendors.set('vendor3', { id: 'vendor3', name: 'FoodStall C', walletAddress: 'https://ilp.interledger-test.dev/food-c' });

// Security: Generate signature for QR code
function generateQRSignature(data: Omit<QRCodeData, 'signature'>): string {
  const secret = process.env.QR_SIGNING_SECRET || 'default-secret-change-in-prod';
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

// Verify QR code signature
function verifyQRSignature(qrData: QRCodeData): boolean {
  const { signature, ...dataWithoutSignature } = qrData;
  const expectedSignature = generateQRSignature(dataWithoutSignature);
  return signature === expectedSignature;
}

// Routes

// Create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, walletAddress, phone, email } = req.body;
    
    if (!name || !walletAddress) {
      return res.status(400).json({ error: 'Name and wallet address are required' });
    }

    const customerId = uuidv4();
    const customer: Customer = {
      id: customerId,
      name,
      walletAddress,
      phone,
      email,
      createdAt: new Date().toISOString()
    };

    customers.set(customerId, customer);
    
    res.status(201).json({ 
      success: true, 
      customer: { ...customer, walletAddress: undefined } // Don't expose wallet address in response
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get customer info
app.get('/api/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  const customer = customers.get(customerId);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Get customer's active grants
  const customerGrants = Array.from(grants.values())
    .filter(grant => grant.customerId === customerId && grant.status === 'active')
    .map(grant => ({
      id: grant.id,
      vendorName: grant.vendorName,
      dailyLimit: grant.dailyLimit,
      spentToday: grant.spentToday,
      expiresAt: grant.expiresAt
    }));

  res.json({
    customer: { ...customer, walletAddress: undefined },
    grants: customerGrants
  });
});

// Get available vendors
app.get('/api/vendors', (req, res) => {
  const vendorList = Array.from(vendors.values());
  res.json({ vendors: vendorList });
});

// Create grant for vendor
app.post('/api/customers/:customerId/grants', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { vendorId, dailyLimit, expirationDays = 30 } = req.body;

    const customer = customers.get(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const vendor = vendors.get(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (!dailyLimit || dailyLimit <= 0) {
      return res.status(400).json({ error: 'Valid daily limit is required' });
    }

    // Check if grant already exists for this vendor
    const existingGrant = Array.from(grants.values())
      .find(g => g.customerId === customerId && g.vendorId === vendorId && g.status === 'active');
    
    if (existingGrant) {
      return res.status(400).json({ error: 'Active grant already exists for this vendor' });
    }

    // Create the Open Payments grant
    const client = await getAuthenticatedClient();
    const { walletAddressDetails } = await getWalletAddressInfo(client, customer.walletAddress);
    
    // Create pending grant (this would normally require user interaction)
    const pendingGrant = await createOutgoingPaymentPendingGrant(
      client,
      {
        debitAmount: { value: (dailyLimit * 100).toString(), assetCode: 'ZAR', assetScale: 2 },
        receiveAmount: { value: (dailyLimit * 100).toString(), assetCode: 'ZAR', assetScale: 2 },
        redirectUrl: `${process.env.BASE_URL}/api/grants/callback`
      },
      walletAddressDetails
    );

    const grantId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const grant: CustomerGrant = {
      id: grantId,
      customerId,
      vendorId,
      vendorName: vendor.name,
      dailyLimit,
      spentToday: 0,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      grantData: {
        continueAccessToken: pendingGrant.continue.access_token.value,
        continueUri: pendingGrant.continue.uri,
        senderWalletAddress: customer.walletAddress
      },
      status: 'active'
    };

    grants.set(grantId, grant);

    res.status(201).json({
      success: true,
      grant: {
        id: grant.id,
        vendorName: grant.vendorName,
        dailyLimit: grant.dailyLimit,
        expiresAt: grant.expiresAt,
        authorizationUrl: pendingGrant.interact?.redirect
      }
    });

  } catch (error) {
    console.error('Error creating grant:', error);
    res.status(500).json({ error: 'Failed to create grant' });
  }
});

// Complete grant authorization (callback from Open Payments)
app.get('/api/grants/callback', async (req, res) => {
  try {
    const { interact_ref, result } = req.query;
    
    if (result !== 'grant_approved') {
      return res.status(400).send('Grant authorization failed');
    }

    // Find the grant by interact_ref and update it
    const grant = Array.from(grants.values())
      .find(g => !g.grantData.interactRef); // Find pending grant
    
    if (grant && interact_ref) {
      grant.grantData.interactRef = interact_ref as string;
      grants.set(grant.id, grant);
    }

    res.send('Grant authorized successfully! You can close this window.');
  } catch (error) {
    console.error('Error in grant callback:', error);
    res.status(500).send('Error processing grant authorization');
  }
});

// Generate QR code for customer
app.post('/api/customers/:customerId/qr-code', async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = customers.get(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all active grants for this customer
    const activeGrants = Array.from(grants.values())
      .filter(grant => 
        grant.customerId === customerId && 
        grant.status === 'active' &&
        new Date(grant.expiresAt) > new Date() &&
        grant.grantData.interactRef // Only include authorized grants
      );

    if (activeGrants.length === 0) {
      return res.status(400).json({ error: 'No active authorized grants found' });
    }

    // Create QR data structure
    const qrDataWithoutSignature: Omit<QRCodeData, 'signature'> = {
      customerId,
      grants: activeGrants.map(grant => ({
        grantId: grant.id,
        vendorId: grant.vendorId,
        vendorName: grant.vendorName,
        dailyLimit: grant.dailyLimit,
        expiresAt: grant.expiresAt
      })),
      generatedAt: new Date().toISOString()
    };

    const signature = generateQRSignature(qrDataWithoutSignature);
    const qrData: QRCodeData = { ...qrDataWithoutSignature, signature };

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      grants: qrData.grants,
      generatedAt: qrData.generatedAt
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Verify QR code (for testing)
app.post('/api/qr-code/verify', (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    const parsedData: QRCodeData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    const isValid = verifyQRSignature(parsedData);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid QR code signature' });
    }

    // Check if customer exists
    const customer = customers.get(parsedData.customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      valid: true,
      customer: { ...customer, walletAddress: undefined },
      grants: parsedData.grants
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ error: 'Failed to verify QR code' });
  }
});

// Get grant details (for vendor use)
app.get('/api/grants/:grantId', (req, res) => {
  const { grantId } = req.params;
  const grant = grants.get(grantId);
  
  if (!grant) {
    return res.status(404).json({ error: 'Grant not found' });
  }

  res.json({
    success: true,
    grant: {
      id: grant.id,
      vendorId: grant.vendorId,
      vendorName: grant.vendorName,
      dailyLimit: grant.dailyLimit,
      spentToday: grant.spentToday,
      remainingToday: grant.dailyLimit - grant.spentToday,
      expiresAt: grant.expiresAt,
      status: grant.status
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PaperPay Customer API running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- POST /api/customers - Create customer`);
  console.log(`- GET /api/customers/:id - Get customer info`);
  console.log(`- GET /api/vendors - List vendors`);
  console.log(`- POST /api/customers/:id/grants - Create vendor grant`);
  console.log(`- POST /api/customers/:id/qr-code - Generate QR code`);
  console.log(`- POST /api/qr-code/verify - Verify QR code`);
});

export default app;