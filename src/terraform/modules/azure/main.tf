terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Create Storage Account for Azure Functions
# Note: Storage account names must be globally unique, 3-24 characters, lowercase alphanumeric
resource "azurerm_storage_account" "functions_storage" {
  name                     = "${replace(replace(var.resource_group, "-", ""), "_", "")}func${substr(md5("${var.resource_group}${var.location}"), 0, 8)}"
  resource_group_name      = var.resource_group
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.tags
}

# Create App Service Plan (Consumption Plan for serverless)
resource "azurerm_service_plan" "functions_plan" {
  name                = "mirai-functions-plan"
  resource_group_name = var.resource_group
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption plan

  tags = var.tags
}

# Create Azure Functions
resource "azurerm_linux_function_app" "functions" {
  for_each = {
    for func in var.functions : func.name => func
  }

  name                = replace("${each.value.name}-${substr(md5(each.value.name), 0, 8)}", "_", "-")
  resource_group_name = var.resource_group
  location            = var.location
  service_plan_id     = azurerm_service_plan.functions_plan.id

  storage_account_name       = azurerm_storage_account.functions_storage.name
  storage_account_access_key  = azurerm_storage_account.functions_storage.primary_access_key
  functions_extension_version = "~4"

  site_config {
    application_stack {
      node_version = "20"
    }
  }

  app_settings = merge(
    {
      FUNCTIONS_WORKER_RUNTIME       = "node"
      WEBSITE_NODE_DEFAULT_VERSION   = "~20"
      WEBSITE_RUN_FROM_PACKAGE       = "1"
      APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.functions[each.key].instrumentation_key
    },
    var.common_env_vars,
    lookup(var.function_env_overrides, each.value.name, {})
  )

  tags = merge(var.tags, {
    Name = each.value.name
  })
}

# Application Insights for monitoring
resource "azurerm_application_insights" "functions" {
  for_each = {
    for func in var.functions : func.name => func
  }

  name                = "${each.value.name}-insights"
  location            = var.location
  resource_group_name = var.resource_group
  application_type    = "Node.JS"

  tags = var.tags
}

# Create zip archive for each function
data "archive_file" "function_zip" {
  for_each = {
    for func in var.functions : func.name => func
  }

  type        = "zip"
  source_dir  = each.value.path
  output_path = "${path.module}/.packages/${each.value.name}.zip"
}

# Note: Azure Functions code deployment is typically done via:
# 1. Azure Functions Core Tools: func azure functionapp publish <app-name>
# 2. VS Code Azure Functions extension
# 3. GitHub Actions / Azure DevOps pipelines
# 
# The Function App infrastructure is created above, but code deployment
# may need to be done separately using one of the methods above.
# 
# Alternatively, you can use azurerm_app_service_source_control or
# azurerm_storage_blob + azurerm_function_app_function for Terraform-managed deployments.

