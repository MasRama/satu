# 🌟 Satu - Your Unified WhatsApp Experience

> "Satu" means "One" in Indonesian - One bot, endless possibilities.

A sleek and powerful WhatsApp bot framework that unifies your WhatsApp experience. Built with TypeScript and Baileys, Satu provides a robust foundation for creating your own WhatsApp automation with elegance and simplicity. Whether you're building a business automation, group management, or just a fun bot, Satu makes it seamless.

## ✨ Features

- 🔐 **Persistent Authentication**: Never lose your session with SQLite-based session storage
- 📱 **QR Code Support**: Effortless login with QR code scanning
- 🎮 **Command Handler**: Intuitive command system for easy bot interaction
- 🔄 **Auto Reconnect**: Smart reconnection handling for uninterrupted service
- 📝 **TypeScript Support**: Full type safety and modern development experience
- 🗄️ **Database Integration**: Lightning-fast SQLite database with better-sqlite3
- 🚦 **Status Management**: Real-time connection status tracking
- 📋 **Logging System**: Comprehensive logging with Pino

## 🛠️ Prerequisites

- Node.js v14 or higher
- npm or yarn
- SQLite3

## 🚀 Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/MasRama/satu.git
cd satu
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up the database**
```bash
npx knex migrate:latest
```

4. **Start the bot**
```bash
npm run dev
# or
yarn dev
```

5. **Scan QR Code**
When you first run the bot, it will generate a QR code in the console. Scan this with your WhatsApp to authenticate.

## 💡 Usage

### Basic Commands
The bot comes with a command handler system. Here's how to use it:

```typescript
// Example command in your chat
!help     // Shows available commands
!ping     // Check if bot is responsive
// Add your custom commands
```

### Creating Custom Commands
Add new commands by creating files in the `commands` directory:

```typescript
// commands/example.ts
export default {
  name: 'example',
  description: 'An example command',
  execute: async (msg, args) => {
    // Your command logic here
  }
}
```

## 🏗️ Project Structure

```
src/
├── commands/        # Bot commands
├── services/        # Core services
│   ├── BaileyAuth.ts    # Authentication handling
│   └── WhatsApp.ts      # Main WhatsApp client
├── utils/           # Utility functions
└── index.ts         # Entry point
```

## 🔧 Configuration

The bot can be configured through environment variables and the `config` directory:

- Database settings in `knexfile.ts`
- WhatsApp client options in `src/services/WhatsApp.ts`
- Command settings in `src/commands/index.ts`

## 📚 API Documentation

### WhatsApp Service
```typescript
// Send a message
WhatsApp.sendMessage(jid: string, message: string)

// Get connection status
WhatsApp.status // Returns: 'disconnected' | 'connecting' | 'connected' | 'qr'

// Check if ready
WhatsApp.ready // Returns: boolean
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - The awesome WhatsApp Web API library
- [Knex.js](http://knexjs.org/) - SQL query builder
- [TypeScript](https://www.typescriptlang.org/) - For the amazing type system

---

Made with ❤️ using TypeScript and Baileys
