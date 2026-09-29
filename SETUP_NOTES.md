# Setup Notes

- The supplied product README calls for Docker/PostgreSQL, but Docker was not installed in this environment and the original app/schema was not provided.
- Node.js 22.16.0 and npm 11.18.0 were available. The project was scaffolded with Next.js and uses process memory so the buyer/admin flow can run without a database service.
- The initial `create-next-app` dependency installation was interrupted. Running `npm install` from the new project completed successfully.
- Chromium installed successfully and the local Playwright journey passed.
- This setup deviation means the project does not satisfy the original assessment's requirement to test its Prisma-backed application.