# IMAP Sync

A modern web application for synchronizing IMAP mailboxes between different email accounts. Built with Next.js 15 and TypeScript.

This project was created using [bolt.new](https://bolt.new) as a starting template.

## Serverless Ready

This application is fully compatible with serverless environments like Vercel. It uses Vercel KV (Redis) for cross-instance state management, ensuring real-time sync progress updates work reliably in production.

## Features

- 🔄 Synchronize emails between IMAP mailboxes
- 🔄 Configure sync options (batch size, retries, etc.)
- 📊 Monitor sync status and logs in real-time
- 🔒 Secure connection testing
- 📱 Responsive design
- ☁️ Serverless compatible with Vercel KV integration
- 🔄 Server-Sent Events (SSE) for live progress updates

## Security

The application runs mostly on the client side, connecting directly to your IMAP servers. No data is stored on any server.

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **IMAP Library**: ImapFlow
- **Authentication**: NextAuth.js
- **State Management**: Vercel KV (Redis)
- **Real-time Updates**: Server-Sent Events (SSE)

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone https://github.com/ombicen/imapsync-nextjs.git
cd imapsync-nextjs
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables (optional for development)
```bash
cp .env.example .env.local
# Edit .env.local with your Vercel KV credentials if needed
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Vercel KV Setup (for Production)

For production deployments, you'll need to set up Vercel KV:

1. Create a Vercel KV database from your Vercel dashboard
2. Configure environment variables as described in [docs/vercel-kv-setup.md](docs/vercel-kv-setup.md)

The application will automatically fall back to in-memory storage during development if Vercel KV isn't configured.

### IMAP Configuration

The application supports both TLS/SSL and STARTTLS connections. Configure your IMAP servers with:

- Host: IMAP server hostname or IP
- Port: IMAP port (993 for SSL/TLS, 143 for plain)
- Secure: Enable for SSL/TLS connections
- TLS: Enable for STARTTLS connections
- Username: Email address
- Password: Email password

## Usage

1. Configure source and destination IMAP servers
2. Set sync options:
   - Batch size: Number of emails to process at once
   - Max retries: Number of retry attempts for failed operations
   - Retry delay: Time to wait between retries
3. Start the sync process
4. Monitor the sync status and logs in real-time

## Security

- All IMAP connections use secure TLS/SSL encryption
- Passwords are stored securely
- Connection timeouts and error handling are implemented
- Rate limiting is enforced

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Support

For support, please:

1. Check the documentation
2. Search existing issues
3. Open a new issue if needed

## Acknowledgments

- Thanks to the Next.js team for their amazing framework
- Thanks to the ImapFlow developers for their excellent IMAP library
- Thanks to all contributors who helped improve this project
