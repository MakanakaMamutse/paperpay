# PaperPay+

Safe Cashless Daily Payments with QR Cards + Interledger

## 🚨 The Problem

In South Africa, carrying cash for taxis, groceries, and daily essentials is unsafe, especially in cities like Johannesburg where muggings and theft are common. While debit cards are an alternative, fewer than 30% of SMMEs (small businesses) have POS machines — but over 90% of people and vendors own smartphones. We need a practical, low-tech solution.

## 💡 Our Solution

PaperPay+ gives people personalized printed QR codes, linked to their Interledger-enabled wallets:
- Users carry a QR card on a lanyard or keychain
- Vendors scan QR codes on their smartphones to receive payment instantly via Interledger
- Daily spending limits protect users in case of theft — they can only lose what's allowed per day

## ✅ Why Interledger?

- **Open & Borderless Payments**: Vendors and customers don't need the same bank or payment service
- **Low-Cost Microtransactions**: Perfect for small amounts like taxi fares
- **Hackathon Ready**: Robust APIs for rapid integration and live demonstration
- **Scalable**: Supports diverse wallets, grants, or employer funding streams

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- An Interledger/Open Payments-compatible wallet

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd paperpay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the backend**
   ```bash
   cd final-solution-main
   npm install
   npm run dev
   ```

4. **Run the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` to access the application

## 👤 Customer Features

- **Wallet Integration**: Compatible with Interledger/Open Payments wallets
- **QR Code Generation**: Register and generate unique QR codes
- **Security**: Set daily spending limits for protection
- **Management**: Regenerate QR codes if lost/stolen
- **Balance Overview**: Monitor wallet balance and transactions

## 🍭 Vendor Features

- **QR Scanner**: Web app with smartphone camera integration
- **Payment Processing**: Enter amount + description for transactions
- **Instant Settlement**: Debit customer and credit vendor via Interledger
- **Transaction History**: Complete bookkeeping and logs

## 📱 The App

Our progressive web app (PWA) includes:

### Customer Portal
- Balance overview
- Set/reset daily limits
- Generate/replace QR codes
- Freeze lost QR cards

### Vendor Portal
- Scan QR code
- Enter amount + description
- Process payments
- View transaction logs

## 📊 Why It's Effective

- **Inclusive**: Works without a bank account or debit card
- **Safe**: Limits exposure by capping daily spending
- **Simple**: Vendors only need a phone, no POS required
- **Practical**: Uses existing infrastructure (smartphones)

## 🎭 Demo Usage

Perfect for demonstrating taxi payments, grocery purchases, and daily transactions with enhanced security through daily spending limits.

## 🔧 API Integration

Built with Interledger Protocol for seamless cross-wallet transactions and micropayments.

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

[Add contact information here]

---

**PaperPay+**: The safe, cashless daily payment system using QR cards and Interledger — empowering people with instant, secure, and inclusive transactions, without the risks of carrying cash.
