#!/bin/bash

# Script to list all discovered Lambda functions
# This helps verify that Terraform will discover all functions correctly

echo "=== Lambda Functions Discovery ==="
echo ""

echo "Feature Functions:"
find ../features -name "index.js" -type f -not -path "*/node_modules/*" | while read -r file; do
    relative_path=$(echo "$file" | sed 's|../features/||' | sed 's|/index.js||')
    function_name=$(echo "$relative_path" | tr '/' '-')
    echo "  - $function_name (path: features/$relative_path)"
done

echo ""
echo "Middleware Functions (Authorizers):"
find ../middleware -name "index.js" -type f -not -path "*/node_modules/*" | while read -r file; do
    relative_path=$(echo "$file" | sed 's|../middleware/||' | sed 's|/index.js||')
    function_name="authorizer-$(echo "$relative_path" | tr '/' '-')"
    echo "  - $function_name (path: middleware/$relative_path)"
done

echo ""
echo "=== Total Functions ==="
feature_count=$(find ../features -name "index.js" -type f -not -path "*/node_modules/*" | wc -l | tr -d ' ')
middleware_count=$(find ../middleware -name "index.js" -type f -not -path "*/node_modules/*" | wc -l | tr -d ' ')
total=$((feature_count + middleware_count))
echo "Features: $feature_count"
echo "Authorizers: $middleware_count"
echo "Total: $total"

