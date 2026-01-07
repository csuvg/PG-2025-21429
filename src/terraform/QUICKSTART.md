# Quick Start Guide

## 1. Choose Your Cloud Provider

Edit `terraform.tfvars` (create from `terraform.tfvars.example`):

```bash
cp terraform.tfvars.example terraform.tfvars
```

Set `cloud_provider` to one of:
- `aws` - AWS Lambda
- `azure` - Azure Functions  
- `gcp` - Google Cloud Functions

## 2. Configure Cloud Credentials

### AWS
```bash
aws configure
# or set environment variables:
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### Azure
```bash
az login
az account set --subscription "your-subscription-id"
```

### GCP
```bash
gcloud auth application-default login
gcloud config set project your-project-id
```

## 3. Set Configuration Values

Edit `terraform.tfvars`:
```hcl
cloud_provider = "aws"  # or "azure" or "gcp"
mongodb_uri     = "mongodb://your-connection-string"
aws_region      = "us-east-1"  # if using AWS
```

## 4. Deploy

### Option A: Using the deployment script
```bash
./deploy.sh aws apply
```

### Option B: Using Terraform directly
```bash
terraform init
terraform plan
terraform apply
```

## 5. Verify Deployment

```bash
terraform output
```

## List All Functions

To see what functions will be deployed:
```bash
./scripts/list-functions.sh
```

## Common Commands

```bash
# Plan deployment
./deploy.sh aws plan

# Apply changes
./deploy.sh aws apply

# View outputs
./deploy.sh aws output

# Destroy all resources
./deploy.sh aws destroy
```

## Next Steps

1. Configure API Gateway / Function URLs for HTTP access
2. Set up monitoring and alerts
3. Configure CI/CD pipelines
4. Review security settings (IAM roles, network access)

For detailed documentation, see [README.md](./README.md)

