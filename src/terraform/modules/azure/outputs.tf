output "function_urls" {
  description = "Map of function names to their URLs"
  value = {
    for k, v in azurerm_linux_function_app.functions : k => "https://${v.default_hostname}/api/${k}"
  }
}

output "function_names" {
  description = "List of deployed function names"
  value = [for k, v in azurerm_linux_function_app.functions : k]
}

