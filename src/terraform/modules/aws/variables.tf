variable "functions" {
  description = "List of Lambda functions to deploy"
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

variable "region" {
  description = "AWS region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
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

variable "function_env_overrides" {
  description = "Environment variable overrides per function"
  type        = map(map(string))
  default     = {}
}

variable "enable_function_urls" {
  description = "Enable Function URLs for specific functions"
  type        = map(bool)
  default     = {}
}

