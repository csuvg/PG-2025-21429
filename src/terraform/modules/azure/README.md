# Azure Functions Module

This module deploys Azure Functions for the Mirai server.

## Prerequisites

1. Azure Resource Group must exist (or create it manually):
   ```bash
   az group create --name mirai-server-rg --location eastus
   ```

2. Azure CLI authenticated:
   ```bash
   az login
   ```

## Important Notes

### Code Deployment

Azure Functions code deployment is not fully automated in this Terraform module. After creating the Function Apps, deploy code using one of these methods:

1. **Azure Functions Core Tools** (Recommended):
   ```bash
   npm install -g azure-functions-core-tools@4
   cd features/auth/register
   func azure functionapp publish <function-app-name>
   ```

2. **VS Code Extension**:
   - Install "Azure Functions" extension
   - Right-click function folder → "Deploy to Function App"

3. **GitHub Actions / CI/CD**:
   - Use Azure Functions deployment action

4. **Manual ZIP Deploy**:
   ```bash
   az functionapp deployment source config-zip \
     --resource-group mirai-server-rg \
     --name <function-app-name> \
     --src <function.zip>
   ```

### Storage Account Naming

Storage account names must be globally unique. The module generates a unique name based on the resource group and location. If you encounter naming conflicts, you can override by modifying the storage account name in the module.

### Cost Considerations

- Each Function App is a separate resource
- Consider consolidating functions into a single Function App for cost savings
- Consumption plan (Y1) charges per execution

