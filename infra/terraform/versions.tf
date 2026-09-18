terraform {
  required_version = ">= 1.7.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# CHANGE: select a reviewed account/region and an existing short-lived identity.
# No backend or credentials are embedded. See README before using this reference.
provider "aws" {
  region              = var.region
  profile             = var.aws_profile
  allowed_account_ids = [var.expected_account_id]

  default_tags {
    tags = {
      Project        = var.resource_prefix
      Environment    = "synthetic-exercise"
      Classification = "synthetic-only"
      ManagedBy      = "terraform"
    }
  }
}
