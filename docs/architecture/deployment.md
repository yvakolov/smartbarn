# Deployment Architecture and IaC

Status: **FIXED architectural principle**

Smart Barn deployment must follow dependency inversion: application and domain code must not depend on a specific hosting provider.

## Core rule

The application depends on infrastructure contracts. Provider-specific infrastructure implements those contracts.

```text
Smart Barn application
        │
        ▼
Deployment contracts
        │
        ├── PostgreSQL connection
        ├── object storage
        ├── secrets/configuration
        ├── container runtime
        └── ingress/network
                 │
                 ▼
        provider adapters
        ├── Supabase
        ├── Railway
        ├── VPS / Docker
        ├── Kubernetes
        └── other cloud providers
```

## Portable deployment unit

Backend services are packaged as OCI/Docker images. A hosting provider must not be required by application code.

The NestJS API receives infrastructure only through environment/configuration contracts such as:

- `DATABASE_URL`
- HTTP listen port
- storage endpoint/credentials where required
- authentication configuration
- observability endpoints

No provider SDK may leak into the domain layer.

## Database

The canonical database technology is PostgreSQL.

Prisma is the application persistence adapter and migration mechanism. Supabase may host PostgreSQL, but application persistence must remain PostgreSQL/Prisma-oriented rather than Supabase-specific.

Direct Supabase SDK/database access from frontend feature code is not the default architecture. Backend APIs remain the primary boundary.

## IaC

Infrastructure is defined as code from the beginning.

Preferred tool family: OpenTofu/Terraform-compatible HCL.

Repository structure:

```text
infra/
├── README.md
├── modules/
│   ├── application/
│   ├── database/
│   ├── networking/
│   └── observability/
├── providers/
│   ├── railway/
│   ├── supabase/
│   ├── docker-vps/
│   └── kubernetes/
└── environments/
    ├── dev/
    ├── staging/
    └── production/
```

Provider directories are adapters. Application/domain code must not change when an adapter changes.

## CI/CD boundary

GitHub Actions orchestrates delivery but is not itself part of the application architecture.

Expected flow:

```text
push / release
    ↓
lint + test + build
    ↓
Docker/OCI image
    ↓
container registry
    ↓
IaC plan/apply
    ↓
target infrastructure
```

Secrets are stored in GitHub environment secrets or the target secret manager and are never committed to the repository or Terraform/OpenTofu state in plaintext where avoidable.

## Future API Gateway

A future .NET/F# API Gateway is an outer delivery adapter and does not replace the domain model or persistence abstractions.

```text
Internet
   ↓
.NET / F# API Gateway
   ↓
NestJS services
   ↓
Prisma
   ↓
PostgreSQL
```

This gateway can later own cross-cutting concerns such as routing, authentication enforcement, rate limiting, protocol adaptation and aggregation without coupling the internal Smart Barn services to the hosting provider.
