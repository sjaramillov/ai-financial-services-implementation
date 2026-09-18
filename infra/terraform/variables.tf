variable "region" {
  description = "CHANGE: AWS commercial region approved for this synthetic exercise; no geographic default."
  type        = string
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[1-9]$", var.region)) && !startswith(var.region, "cn-")
    error_message = "Replace region with a commercial AWS region, after residency/service review."
  }
}

variable "expected_account_id" {
  description = "CHANGE: your intended 12-digit AWS account ID; account1 is a diagram label only."
  type        = string
  validation {
    condition = can(regex("^[0-9]{12}$", var.expected_account_id)) && !contains([
      join("", [for i in range(12) : "0"]),
      join("", [for i in range(12) : "1"]),
      join("", [for i in range(1, 13) : tostring(i % 10)])
    ], var.expected_account_id)
    error_message = "Replace expected_account_id with your reviewed account; example IDs are rejected."
  }
}

variable "aws_profile" {
  description = "CHANGE if using a named local AWS SSO/assume-role profile. Null uses the standard credential chain; never put secrets here."
  type        = string
  default     = null
  nullable    = true
}

variable "resource_prefix" {
  description = "CHANGE: unique lowercase prefix for new resources, 6-40 characters. Never use an existing environment's resource names."
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,38}[a-z0-9]$", var.resource_prefix)) && !strcontains(var.resource_prefix, "--")
    error_message = "Use a unique lowercase 6-40 character prefix with letters, digits and single hyphens."
  }
}

variable "runtime_trusted_role_arn" {
  description = "CHANGE: existing same-account workload role allowed to assume the synthetic evidence writer. No users, wildcard or account-root trust."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:role/[A-Za-z0-9+=,.@_/-]+$", var.runtime_trusted_role_arn))
    error_message = "Provide an existing IAM role ARN, without a wildcard."
  }
}

variable "audit_trusted_role_arn" {
  description = "CHANGE: existing same-account reviewer role, distinct from runtime, allowed to assume the evidence reader."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:role/[A-Za-z0-9+=,.@_/-]+$", var.audit_trusted_role_arn))
    error_message = "Provide an existing IAM role ARN, without a wildcard."
  }
}

variable "log_retention_days" {
  description = "CHANGE after retention review: CloudWatch and S3 access-log retention; evidence objects never expire automatically."
  type        = number
  default     = 30
  validation {
    condition     = contains([7, 14, 30, 60, 90], var.log_retention_days)
    error_message = "Choose 7, 14, 30, 60 or 90 days for this limited exercise."
  }
}
