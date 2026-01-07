terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Create Cloud Storage bucket for function source code
resource "google_storage_bucket" "functions_source" {
  name     = "${var.project_id}-functions-source-${substr(md5(var.project_id), 0, 8)}"
  location = var.region

  uniform_bucket_level_access = true

  labels = var.labels
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

# Upload source code to Cloud Storage
resource "google_storage_bucket_object" "function_source" {
  for_each = {
    for func in var.functions : func.name => func
  }

  name   = "${each.value.name}-${data.archive_file.function_zip[each.key].output_md5}.zip"
  bucket = google_storage_bucket.functions_source.name
  source = data.archive_file.function_zip[each.key].output_path
}

# Create Cloud Functions
resource "google_cloudfunctions2_function" "functions" {
  for_each = {
    for func in var.functions : func.name => func
  }

  name        = each.value.name
  location    = var.region
  description = each.value.description

  build_config {
    runtime     = "nodejs20"
    entry_point = "handler"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = google_storage_bucket_object.function_source[each.key].name
      }
    }
  }

  service_config {
    max_instance_count             = lookup(var.function_max_instances, each.value.name, 100)
    min_instance_count             = 0
    available_memory               = "${lookup(var.function_memory_overrides, each.value.name, 256)}M"
    timeout_seconds                = lookup(var.function_timeout_overrides, each.value.name, 60)
    environment_variables          = merge(
      var.common_env_vars,
      lookup(var.function_env_overrides, each.value.name, {})
    )
    ingress_settings               = "ALLOW_ALL"
    all_traffic_on_latest_revision = true
  }

  labels = merge(var.labels, {
    function_name = each.value.name
  })
}

# Create IAM member for unauthenticated access (optional, adjust for production)
resource "google_cloudfunctions2_function_iam_member" "public_access" {
  for_each = {
    for func in var.functions : func.name => func
    if lookup(var.enable_public_access, func.name, false)
  }

  project        = var.project_id
  location       = var.region
  cloud_function = google_cloudfunctions2_function.functions[each.key].name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

