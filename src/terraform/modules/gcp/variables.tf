variable "functions" {
  description = "List of Cloud Functions to deploy"
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

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}

variable "function_timeout_overrides" {
  description = "Timeout overrides per function (seconds)"
  type        = map(number)
  default     = {}
}

variable "function_memory_overrides" {
  description = "Memory overrides per function (MB)"
  type        = map(number)
  default     = {}
}

variable "function_max_instances" {
  description = "Max instances per function"
  type        = map(number)
  default     = {}
}

variable "function_env_overrides" {
  description = "Environment variable overrides per function"
  type        = map(map(string))
  default     = {}
}

variable "enable_public_access" {
  description = "Enable public access for specific functions"
  type        = map(bool)
  default     = {}
}

