variable "functions" {
  description = "List of Azure Functions to deploy"
  type = list(object({
    name        = string
    path        = string
    handler     = string
    runtime     = string
    description = string
  }))
}

variable "common_env_vars" {
  description = "Common environment variables for all functions"
  type        = map(string)
}

variable "resource_group" {
  description = "Azure resource group name"
  type        = string
}

variable "location" {
  description = "Azure location/region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "function_env_overrides" {
  description = "Environment variable overrides per function"
  type        = map(map(string))
  default     = {}
}

