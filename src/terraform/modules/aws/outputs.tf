output "function_arns" {
  description = "Map of function names to their ARNs"
  value = {
    for k, v in aws_lambda_function.functions : k => v.arn
  }
}

output "function_urls" {
  description = "Map of function names to their Function URLs (if enabled)"
  value = {
    for k, v in aws_lambda_function_url.function_urls : k => v.function_url
  }
}

output "function_names" {
  description = "List of deployed function names"
  value = [for k, v in aws_lambda_function.functions : k]
}

