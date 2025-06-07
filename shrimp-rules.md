# Satu WhatsApp Bot - Development Guidelines

## Project Overview

- **Technology Stack**: TypeScript, Baileys WhatsApp API, SQLite, Knex.js, Pino Logger
- **Architecture**: Service-based with command handler pattern
- **Database**: SQLite with Knex migrations
- **Hot Reload**: Enabled via tsx - NEVER restart server manually

## Architecture Rules

### Core Directory Structure
- **NEVER** modify the following directory structure:
  - `commands/` - Command handlers only
  - `services/` - Core services (WhatsApp, BaileyAuth, Database)
  - `utils/` - Utility functions (logger)
  - `database/migrations/` - Database schema migrations
- **ALWAYS** maintain the singleton pattern for WhatsApp service
- **ALWAYS** use the existing Database service for all database operations

### File Dependencies
- `index.ts` → `services/WhatsApp.ts` (entry point dependency)
- `services/WhatsApp.ts` → `services/BaileyAuth.ts` + `commands/index.ts` + `utils/logger.ts`
- `commands/index.ts` → `commands/loader.ts` (auto-loads all commands)
- **NEVER** create circular dependencies between services

## Command Development Standards

### Command Structure
- **MUST** implement the `Command` interface:
  ```typescript
  interface Command {
    name: string;
    description: string;
    execute: (msg: proto.IWebMessageInfo) => Promise<void>;
  }
  ```
- **MUST** place all new commands in `commands/` directory
- **MUST** export as default from command files
- **ALWAYS** use async/await pattern in execute function

### Command Registration
- **NEVER** manually register commands in `commands/index.ts`
- **ALWAYS** rely on `commands/loader.ts` for automatic loading
- **MUST** follow naming convention: lowercase filename = command name

### Command Prefix
- **NEVER** change the PREFIX constant (`#`) without updating documentation
- **ALWAYS** use PREFIX from `commands/index.ts` for consistency

## Service Modification Rules

### WhatsApp Service
- **NEVER** modify rate limiting configuration without explicit requirement
- **NEVER** change queue settings (concurrent: 3, maxRetries: 3)
- **NEVER** modify reconnection logic unless fixing bugs
- **ALWAYS** use the existing message queue for sending messages
- **MUST** use `WhatsApp.sendMessage()` method, never direct client access

### BaileyAuth Service
- **NEVER** modify session management logic
- **NEVER** change database table structure for bailey_auths
- **ALWAYS** use existing auth state management

### Database Service
- **ALWAYS** use the exported `db` instance from `services/Database.ts`
- **NEVER** create direct database connections
- **MUST** create migrations for schema changes in `database/migrations/`

## Database Standards

### Migration Rules
- **MUST** use Knex migration format
- **ALWAYS** create migrations with descriptive timestamps
- **NEVER** modify existing migration files
- **MUST** test migrations with `npx knex migrate:latest`

### Query Patterns
- **ALWAYS** use Knex query builder, never raw SQL
- **MUST** handle database errors with try-catch
- **ALWAYS** use transactions for multi-table operations

## Logging Standards

### Logger Usage
- **ALWAYS** import logger from `utils/logger.ts`
- **MUST** use appropriate log levels:
  - `logger.info()` - General information
  - `logger.error()` - Error conditions
  - `logger.connection()` - Connection status
  - `logger.command()` - Command execution
  - `logger.message()` - Message processing
- **NEVER** use console.log except in index.ts for startup messages

## File Interaction Rules

### Multi-file Coordination
- When modifying command functionality:
  - **MUST** update command file in `commands/`
  - **MAY** need to update `README.md` if adding new features
- When adding new services:
  - **MUST** place in `services/` directory
  - **MUST** update imports in dependent files
  - **MUST** follow singleton pattern if stateful

### Import Patterns
- **ALWAYS** use relative imports for local modules
- **MUST** import types from `@whiskeysockets/baileys` when needed
- **NEVER** import entire modules when only specific functions needed

## Development Workflow

### Hot Reload Rules
- **NEVER** restart the development server manually
- **ALWAYS** rely on tsx hot reload for TypeScript changes
- **ONLY** restart if database migrations are applied

### Testing Commands
- **MUST** test new commands in WhatsApp chat with `#commandname`
- **ALWAYS** verify command registration in startup logs
- **MUST** check for TypeScript errors before deployment

## Prohibited Actions

### Code Modifications
- **NEVER** modify the WhatsApp client initialization parameters
- **NEVER** change the browser identification in WhatsApp service
- **NEVER** modify the QR code generation logic
- **NEVER** change the message queue implementation
- **NEVER** modify the rate limiter settings without explicit requirement

### File Operations
- **NEVER** delete core service files
- **NEVER** rename the main service classes
- **NEVER** move files between core directories
- **NEVER** create duplicate service instances

### Database Operations
- **NEVER** drop the bailey_auths table
- **NEVER** modify session data directly in database
- **NEVER** create raw database connections

## AI Decision Guidelines

### Priority Order for Changes
1. **Command additions** - Safest, add to `commands/` directory
2. **Utility functions** - Add to `utils/` directory
3. **Database schema** - Create migrations only
4. **Service modifications** - Highest risk, require careful consideration

### When to Avoid Changes
- If modification affects WhatsApp connection stability
- If change impacts message queue or rate limiting
- If modification requires server restart (conflicts with hot reload)
- If change affects session management or authentication

### Error Handling Decisions
- **ALWAYS** wrap database operations in try-catch
- **ALWAYS** log errors with appropriate context
- **NEVER** suppress errors silently
- **MUST** provide fallback behavior for non-critical failures

### Performance Considerations
- **NEVER** create synchronous operations in message handlers
- **ALWAYS** use the existing queue system for message sending
- **MUST** respect rate limiting for WhatsApp API calls
- **AVOID** blocking operations in command execution

## Examples

### ✅ Correct Command Implementation
```typescript
// commands/hello.ts
import { proto } from '@whiskeysockets/baileys';
import WhatsApp from '../services/WhatsApp';

export default {
  name: 'hello',
  description: 'Send hello message',
  execute: async (msg: proto.IWebMessageInfo) => {
    const from = msg.key.remoteJid!;
    await WhatsApp.sendMessage(from, 'Hello from Satu bot!');
  }
};
```

### ❌ Incorrect Command Implementation
```typescript
// DON'T DO THIS - Direct client access
export default {
  execute: async (msg: proto.IWebMessageInfo) => {
    WhatsApp.client.sendMessage(msg.key.remoteJid!, { text: 'Hello' });
  }
};
```

### ✅ Correct Database Usage
```typescript
import db from '../services/Database';

const users = await db.from('users').select('*');
```

### ❌ Incorrect Database Usage
```typescript
// DON'T DO THIS - Direct connection
import sqlite3 from 'better-sqlite3';
const db = sqlite3('database.sqlite3');
``` 