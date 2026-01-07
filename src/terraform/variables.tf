variable "cloud_provider" {
  description = "Cloud provider to deploy to: aws, azure, or gcp"
  type        = string
  default     = "aws"
  validation {
    condition     = contains(["aws", "azure", "gcp"], var.cloud_provider)
    error_message = "Cloud provider must be one of: aws, azure, gcp"
  }
}

# AWS Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-2"
}

# Azure Variables
variable "azure_resource_group" {
  description = "Azure resource group name"
  type        = string
  default     = "mirai-server-rg"
}

variable "azure_location" {
  description = "Azure location/region"
  type        = string
  default     = "eastus"
}

# GCP Variables
variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}

variable "gcp_region" {
  description = "GCP region for deployment"
  type        = string
  default     = "us-central1"
}

# Common Variables
variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "backend_url" {
  description = "Backend API base URL"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags/labels for all resources"
  type        = map(string)
  default = {
    Project     = "Mirai"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# Function-specific overrides
variable "function_runtime_overrides" {
  description = "Runtime overrides for specific functions (function_name -> runtime)"
  type        = map(string)
  default     = {}
}

variable "function_timeout_overrides" {
  description = "Timeout overrides for specific functions in seconds (function_name -> timeout)"
  type        = map(number)
  default     = {}
}

variable "function_memory_overrides" {
  description = "Memory overrides for specific functions in MB (function_name -> memory)"
  type        = map(number)
  default     = {}
}

