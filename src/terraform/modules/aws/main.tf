terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Create IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "mirai-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create Lambda functions
resource "aws_lambda_function" "functions" {
  for_each = {
    for func in var.functions : func.name => func
  }

  function_name = each.value.name
  description   = each.value.description
  role          = aws_iam_role.lambda_role.arn
  handler       = each.value.handler
  runtime       = each.value.runtime
  timeout       = lookup(var.function_timeout_overrides, each.value.name, 30)
  memory_size   = lookup(var.function_memory_overrides, each.value.name, 256)

  filename         = data.archive_file.lambda_zip[each.key].output_path
  source_code_hash = data.archive_file.lambda_zip[each.key].output_base64sha256

  environment {
    variables = merge(
      var.common_env_vars,
      lookup(var.function_env_overrides, each.value.name, {})
    )
  }

  tags = merge(var.tags, {
    Name = each.value.name
  })
}

# Create zip archive for each function
data "archive_file" "lambda_zip" {
  for_each = {
    for func in var.functions : func.name => func
  }

  type        = "zip"
  source_dir  = each.value.path
  output_path = "${path.module}/.packages/${each.value.name}.zip"
}

# Create Function URLs for HTTP access (optional)
resource "aws_lambda_function_url" "function_urls" {
  for_each = {
    for func in var.functions : func.name => func
    if lookup(var.enable_function_urls, func.name, false)
  }

  function_name      = aws_lambda_function.functions[each.key].function_name
  authorization_type = "NONE" # Use AWS_IAM for production

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age           = 86400
  }
}

