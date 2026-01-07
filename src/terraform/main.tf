terraform {
  required_version = ">= 1.0"

  required_providers {
    # AWS Provider
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    # Azure Provider
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    # GCP Provider
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    # Archive provider for creating zip files
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Configure providers based on selected cloud
provider "aws" {
  region = var.aws_region
  # AWS credentials should be configured via environment variables or AWS credentials file
  # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
}

provider "azurerm" {
  features {}
  # Azure credentials should be configured via environment variables
  # ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_SUBSCRIPTION_ID, ARM_TENANT_ID
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  # GCP credentials should be configured via environment variables
  # GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS
}

# Local values for discovering Lambda functions
locals {
  # Discover all Lambda functions from features directory (excluding node_modules)
  feature_functions = [
    for path in fileset("${path.module}/../features", "**/index.js") :
    {
      name        = replace(replace(path, "/index.js", ""), "/", "-")
      path        = dirname("${path.module}/../features/${path}")
      handler     = "index.handler"
      runtime     = "nodejs20.x" # Default, can be overridden per function
      description = "Lambda function: ${replace(replace(path, "/index.js", ""), "/", " ")}"
    } if !can(regex("node_modules", path))
  ]

  # Discover Lambda authorizers from middleware directory (excluding node_modules)
  middleware_functions = [
    for path in fileset("${path.module}/../middleware", "**/index.js") :
    {
      name        = "authorizer-${replace(replace(path, "/index.js", ""), "/", "-")}"
      path        = dirname("${path.module}/../middleware/${path}")
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      description = "Lambda authorizer: ${replace(replace(path, "/index.js", ""), "/", " ")}"
    } if !can(regex("node_modules", path))
  ]

  # Combine all functions
  all_functions = concat(local.feature_functions, local.middleware_functions)

  # Common environment variables for all functions
  common_env_vars = {
    URI         = var.mongodb_uri
    BACKEND_URL = var.backend_url
  }
}

# Deploy based on selected cloud provider
module "aws_functions" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  source = "./modules/aws"

  functions                  = local.all_functions
  common_env_vars            = local.common_env_vars
  region                     = var.aws_region
  tags                       = var.tags
  function_timeout_overrides = var.function_timeout_overrides
  function_memory_overrides  = var.function_memory_overrides
  function_env_overrides     = {}
  enable_function_urls       = {}
}

module "azure_functions" {
  count  = var.cloud_provider == "azure" ? 1 : 0
  source = "./modules/azure"

  functions              = local.all_functions
  common_env_vars        = local.common_env_vars
  resource_group         = var.azure_resource_group
  location               = var.azure_location
  tags                   = var.tags
  function_env_overrides = {}
}

module "gcp_functions" {
  count  = var.cloud_provider == "gcp" ? 1 : 0
  source = "./modules/gcp"

  functions                  = local.all_functions
  common_env_vars            = local.common_env_vars
  project_id                 = var.gcp_project_id
  region                     = var.gcp_region
  labels                     = var.tags
  function_timeout_overrides = var.function_timeout_overrides
  function_memory_overrides  = var.function_memory_overrides
  function_max_instances     = {}
  function_env_overrides     = {}
  enable_public_access       = {}
}

