# ktv-singer-infra

Infrastructure, Docker, and CI/CD configuration for the KTV Singer system.

## Contents

- `docker/Dockerfile` — Production Docker image for the Express API server
- `docker/.dockerignore` — Docker build exclusions
- `.github/workflows/ci.yml` — GitHub Actions CI pipeline (typecheck + Docker build)

## Future

- Docker Compose for local development
- Production deployment scripts
- Cloud infrastructure (Terraform/Pulumi)
- Monitoring and alerting configuration
