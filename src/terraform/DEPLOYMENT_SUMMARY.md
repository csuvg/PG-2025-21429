# Terraform Deployment Summary

## Overview

This Terraform configuration provides a **cloud-agnostic** deployment solution for all Mirai server Lambda functions. It automatically discovers and deploys:

- **34 Feature Functions** from the `features/` directory
- **2 Authorizer Functions** from the `middleware/` directory
- **Total: 36 Functions**

## Supported Cloud Providers

✅ **AWS Lambda** - Full support with automatic IAM roles and Function URLs  
✅ **Azure Functions** - Infrastructure creation (code deployment via Azure Functions Core Tools)  
✅ **Google Cloud Functions** - Full support with Cloud Storage integration

## Architecture

```
terraform/
├── main.tf                          # Main configuration with auto-discovery
├── variables.tf                     # All configurable variables
├── outputs.tf                       # Deployment outputs
├── terraform.tfvars.example         # Example configuration
├── deploy.sh                        # Deployment helper script
├── modules/
│   ├── aws/                         # AWS Lambda module
│   ├── azure/                       # Azure Functions module
│   └── gcp/                         # GCP Cloud Functions module
└── scripts/
    └── list-functions.sh            # Function discovery verification
```

## Key Features

1. **Automatic Function Discovery**
   - Scans `features/` and `middleware/` directories
   - Excludes `node_modules` automatically
   - Creates appropriate function names and paths

2. **Cloud-Agnostic Design**
   - Single configuration file
   - Switch providers by changing one variable
   - Consistent interface across clouds

3. **Environment Variables**
   - Common variables applied to all functions
   - Per-function overrides supported
   - Secure handling of sensitive data

4. **Customization**
   - Runtime version overrides
   - Memory allocation overrides
   - Timeout configuration
   - Function-specific environment variables

## Quick Start

1. **Copy configuration:**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`:**
   ```hcl
   cloud_provider = "aws"  # or "azure" or "gcp"
   mongodb_uri     = "your-mongodb-uri"
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh aws apply
   ```

## Discovered Functions

Run the discovery script to see all functions:
```bash
./scripts/list-functions.sh
```

This will show you exactly which functions Terraform will deploy.

## Deployment Workflow

### AWS Lambda
1. Creates IAM execution role
2. Packages each function with dependencies
3. Deploys as individual Lambda functions
4. Optionally creates Function URLs for HTTP access

### Azure Functions
1. Creates storage account
2. Creates Function App (Consumption Plan)
3. Creates Application Insights for monitoring
4. **Note:** Code deployment via Azure Functions Core Tools recommended

### Google Cloud Functions
1. Creates Cloud Storage bucket for source code
2. Packages and uploads function code
3. Deploys Cloud Functions (2nd gen)
4. Configures IAM access (optional public access)

## Configuration Variables

See `terraform.tfvars.example` for all available variables:
- Cloud provider selection
- Region/location settings
- MongoDB connection string
- Resource tags/labels
- Function-specific overrides

## Next Steps After Deployment

1. **API Gateway Configuration**
   - AWS: Configure API Gateway with Lambda integrations
   - Azure: Configure Function App HTTP triggers
   - GCP: Configure Cloud Functions HTTP triggers

2. **Monitoring & Logging**
   - AWS: CloudWatch Logs (automatic)
   - Azure: Application Insights (automatic)
   - GCP: Cloud Logging (automatic)

3. **Security**
   - Review IAM roles/permissions
   - Configure network access
   - Set up secrets management
   - Enable authentication/authorization

4. **CI/CD**
   - Integrate with GitHub Actions
   - Set up automated deployments
   - Configure environment-specific configs

## Cost Estimation

Approximate monthly costs (varies by usage):

- **AWS Lambda**: ~$0-20/month (Free tier: 1M requests)
- **Azure Functions**: ~$0-20/month (Free tier: 1M requests)
- **GCP Cloud Functions**: ~$0-20/month (Free tier: 2M invocations)

*Actual costs depend on execution frequency, duration, and memory usage*

## Troubleshooting

### Common Issues

1. **Function not discovered**
   - Ensure `index.js` exists in function directory
   - Check that path doesn't include `node_modules`

2. **Deployment fails**
   - Verify cloud provider credentials
   - Check region/zone availability
   - Review Terraform error messages

3. **Package size limits**
   - AWS: 50MB (unzipped) or 250MB (zipped)
   - Azure: 500MB (App Service Plan dependent)
   - GCP: 500MB source code limit

### Getting Help

- Review cloud provider documentation
- Check Terraform provider documentation
- See `README.md` for detailed information
- Run `terraform plan` to preview changes

## Migration Between Clouds

To migrate from one cloud to another:

1. Update `cloud_provider` in `terraform.tfvars`
2. Update cloud-specific variables
3. Run `terraform plan` to review changes
4. Deploy to new cloud: `terraform apply`
5. Test thoroughly
6. Destroy old resources: `terraform destroy` (in old workspace)

## Security Best Practices

1. ✅ Never commit `terraform.tfvars` with secrets
2. ✅ Use cloud provider secret managers for sensitive data
3. ✅ Enable MFA for cloud provider accounts
4. ✅ Use least-privilege IAM roles
5. ✅ Enable logging and monitoring
6. ✅ Regularly review and rotate credentials

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Google Cloud Functions Documentation](https://cloud.google.com/functions/docs)

