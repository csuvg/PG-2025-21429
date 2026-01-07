output "function_urls" {
  description = "Map of function names to their URLs"
  value = {
    for k, v in google_cloudfunctions2_function.functions : k => v.service_config[0].uri
  }
}

output "function_names" {
  description = "List of deployed function names"
  value = [for k, v in google_cloudfunctions2_function.functions : k]
}

