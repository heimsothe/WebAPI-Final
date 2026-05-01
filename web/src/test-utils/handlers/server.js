/*
- File: server.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: MSW Node setupServer that combines all per-resource handlers.
Imported by setupTests.js to start/stop around each test, and by individual
tests via `import { server } from '...'` to opt into error variants
with `server.use(handlers.X.errorVariants.Y)`.
 */

import { setupServer } from 'msw/node';
import { handlers as authHandlers } from './auth';
import { handlers as packagesHandlers } from './packages';
import { handlers as gmailHandlers } from './gmail';
import { handlers as exclusionsHandlers } from './exclusions';

export const server = setupServer(
  ...authHandlers,
  ...packagesHandlers,
  ...gmailHandlers,
  ...exclusionsHandlers
);
