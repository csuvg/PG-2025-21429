# AWS Outputs
output "aws_function_arns" {
  description = "Map of function names to their ARNs (AWS)"
  value       = var.cloud_provider == "aws" ? module.aws_functions[0].function_arns : null
}

output "aws_function_urls" {
  description = "Map of function names to their URLs (AWS)"
  value       = var.cloud_provider == "aws" ? module.aws_functions[0].function_urls : null
}

# Azure Outputs
output "azure_function_urls" {
  description = "Map of function names to their URLs (Azure)"
  value       = var.cloud_provider == "azure" ? module.azure_functions[0].function_urls : null
}

# GCP Outputs
output "gcp_function_urls" {
  description = "Map of function names to their URLs (GCP)"
  value       = var.cloud_provider == "gcp" ? module.gcp_functions[0].function_urls : null
}

output "deployed_functions" {
  description = "List of all deployed function names"
  value       = [for func in local.all_functions : func.name]
}

