#!/bin/bash

# Deployment script for Mirai Server Terraform infrastructure
# Usage: ./deploy.sh [provider] [action]
# Example: ./deploy.sh aws apply

set -e

PROVIDER=${1:-aws}
ACTION=${2:-plan}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate provider
if [[ ! "$PROVIDER" =~ ^(aws|azure|gcp)$ ]]; then
    echo -e "${RED}Error: Invalid provider. Must be one of: aws, azure, gcp${NC}"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(init|plan|apply|destroy|output)$ ]]; then
    echo -e "${RED}Error: Invalid action. Must be one of: init, plan, apply, destroy, output${NC}"
    exit 1
fi

echo -e "${GREEN}Deploying to: ${PROVIDER}${NC}"
echo -e "${GREEN}Action: ${ACTION}${NC}"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}Warning: terraform.tfvars not found. Copying from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${YELLOW}Please edit terraform.tfvars with your configuration before proceeding.${NC}"
    exit 1
fi

# Set provider in terraform.tfvars if not already set
if ! grep -q "cloud_provider.*=.*\"${PROVIDER}\"" terraform.tfvars; then
    echo -e "${YELLOW}Updating cloud_provider to ${PROVIDER} in terraform.tfvars${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/cloud_provider.*=.*\".*\"/cloud_provider = \"${PROVIDER}\"/" terraform.tfvars
    else
        # Linux
        sed -i "s/cloud_provider.*=.*\".*\"/cloud_provider = \"${PROVIDER}\"/" terraform.tfvars
    fi
fi

# Provider-specific checks
case $PROVIDER in
    aws)
        echo -e "${GREEN}Checking AWS credentials...${NC}"
        if ! aws sts get-caller-identity &>/dev/null; then
            echo -e "${RED}Error: AWS credentials not configured${NC}"
            echo "Please configure AWS credentials using:"
            echo "  - AWS CLI: aws configure"
            echo "  - Environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
            exit 1
        fi
        ;;
    azure)
        echo -e "${GREEN}Checking Azure credentials...${NC}"
        if ! az account show &>/dev/null; then
            echo -e "${RED}Error: Azure credentials not configured${NC}"
            echo "Please login using: az login"
            exit 1
        fi
        ;;
    gcp)
        echo -e "${GREEN}Checking GCP credentials...${NC}"
        if ! gcloud auth application-default print-access-token &>/dev/null; then
            echo -e "${RED}Error: GCP credentials not configured${NC}"
            echo "Please configure using: gcloud auth application-default login"
            exit 1
        fi
        ;;
esac

# Execute Terraform command
case $ACTION in
    init)
        echo -e "${GREEN}Initializing Terraform...${NC}"
        terraform init
        ;;
    plan)
        echo -e "${GREEN}Planning Terraform deployment...${NC}"
        terraform init -upgrade
        terraform plan
        ;;
    apply)
        echo -e "${GREEN}Applying Terraform configuration...${NC}"
        terraform init -upgrade
        terraform apply
        echo -e "${GREEN}Deployment complete!${NC}"
        echo -e "${GREEN}View outputs with: ./deploy.sh ${PROVIDER} output${NC}"
        ;;
    destroy)
        echo -e "${RED}WARNING: This will destroy all resources!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Cancelled."
            exit 0
        fi
        terraform destroy
        ;;
    output)
        terraform output
        ;;
esac

