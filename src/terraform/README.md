# Terraform Infrastructure for Mirai Server

This Terraform configuration provides a cloud-agnostic deployment solution for Mirai server Lambda functions. It supports deployment to AWS Lambda, Azure Functions, and Google Cloud Functions.

## Prerequisites

1. **Terraform** (>= 1.0)

   ```bash
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

2. **Cloud Provider CLI/Authentication:**
   - **AWS**: Configure AWS CLI or set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - **Azure**: Install Azure CLI and run `az login`
   - **GCP**: Install gcloud CLI and run `gcloud auth application-default login`

## Project Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── terraform.tfvars.example   # Example configuration file
├── modules/
│   ├── aws/                   # AWS Lambda module
│   ├── azure/                 # Azure Functions module
│   └── gcp/                   # GCP Cloud Functions module
└── README.md                  # This file
```

## Quick Start

1. **Copy the example configuration:**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your specific values:

   ```hcl
   cloud_provider = "aws"  # or "azure" or "gcp"
   mongodb_uri     = "your-mongodb-connection-string"
   aws_region      = "us-east-1"
   ```

3. **Initialize Terraform:**

   ```bash
   cd terraform
   terraform init
   ```

4. **Review the deployment plan:**

   ```bash
   terraform plan
   ```

5. **Deploy:**
   ```bash
   terraform apply
   ```

## Configuration

### Cloud Provider Selection

Set `cloud_provider` in `terraform.tfvars` to one of:

- `aws` - Deploys to AWS Lambda
- `azure` - Deploys to Azure Functions
- `gcp` - Deploys to Google Cloud Functions

### Automatic Function Discovery

The Terraform configuration automatically discovers all Lambda functions from:

- `features/` directory - All feature Lambda functions
- `middleware/` directory - All Lambda authorizers

Functions are identified by finding `index.js` files in these directories.

### Environment Variables

Common environment variables are set for all functions:

- `URI` - MongoDB connection string
- `BACKEND_URL` - Backend API base URL

Additional environment variables can be added via `function_env_overrides` in the variables.

## Cloud-Specific Setup

### AWS Lambda

**Requirements:**

- AWS account with appropriate permissions
- AWS credentials configured (via AWS CLI, environment variables, or IAM role)

**Features:**

- Automatic IAM role creation
- Lambda Function URLs (optional, configurable)
- CloudWatch Logs integration

**Example:**

```hcl
cloud_provider = "aws"
aws_region     = "us-east-1"
```

### Azure Functions

**Requirements:**

- Azure subscription
- Azure CLI installed and authenticated (`az login`)
- Resource group created (or Terraform will create it)

**Features:**

- Consumption plan (serverless)
- Application Insights for monitoring
- Automatic storage account creation

**Example:**

```hcl
cloud_provider      = "azure"
azure_resource_group = "mirai-server-rg"
azure_location      = "eastus"
```

**Note:** Azure Functions require the resource group to exist before deployment. Create it manually or modify the configuration to create it.

### Google Cloud Functions

**Requirements:**

- GCP project with billing enabled
- Cloud Functions API enabled
- Application Default Credentials configured

**Features:**

- Cloud Storage for source code
- Automatic scaling
- IAM-based access control

**Example:**

```hcl
cloud_provider = "gcp"
gcp_project_id = "your-project-id"
gcp_region      = "us-central1"
```

**Enable APIs:**

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
```

## Function Customization

### Override Runtime

```hcl
function_runtime_overrides = {
  "register" = "nodejs18.x"
}
```

### Override Timeout

```hcl
function_timeout_overrides = {
  "register" = 60  # seconds
}
```

### Override Memory

```hcl
function_memory_overrides = {
  "register" = 512  # MB
}
```

### Function-Specific Environment Variables

```hcl
# In variables.tf, add:
variable "function_env_overrides" {
  type = map(map(string))
  default = {
    "register" = {
      "SPECIAL_VAR" = "value"
    }
  }
}
```

## Deployment

### Full Deployment

```bash
terraform apply
```

### Destroy All Resources

```bash
terraform destroy
```

### Update Single Function

Terraform will detect changes and update only the modified function.

## Outputs

After deployment, view outputs:

```bash
terraform output
```

Outputs include:

- Function URLs/ARNs
- Function names
- Deployment information

## Troubleshooting

### AWS

- **Permission errors**: Ensure IAM user/role has Lambda, IAM, and CloudWatch permissions
- **Package size**: Lambda packages must be < 50MB (unzipped) or < 250MB (zipped)

### Azure

- **Resource group**: Ensure resource group exists or create it first
- **Storage account names**: Must be globally unique (3-24 characters, lowercase)

### GCP

- **APIs**: Ensure required APIs are enabled
- **Billing**: Ensure billing is enabled for the project
- **Quotas**: Check Cloud Functions quotas in your project

## Cost Considerations

- **AWS Lambda**: Pay per request and compute time (Free tier: 1M requests/month)
- **Azure Functions**: Consumption plan charges per execution (Free tier: 1M requests/month)
- **GCP Cloud Functions**: Pay per invocation and compute time (Free tier: 2M invocations/month)

## Best Practices

1. **Use separate workspaces** for different environments (dev, staging, prod)
2. **Store secrets** in cloud provider secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
3. **Enable monitoring** and set up alerts
4. **Use versioning** for production deployments
5. **Review costs** regularly using cloud provider cost management tools

## Migrating Between Clouds

To migrate from one cloud to another:

1. Update `cloud_provider` in `terraform.tfvars`
2. Update cloud-specific variables
3. Run `terraform plan` to see what will be created/destroyed
4. Run `terraform apply` to deploy to the new cloud
5. Test thoroughly before destroying old resources

## Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
