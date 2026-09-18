locals {
  account_root_arn = "arn:aws:iam::${var.expected_account_id}:root"
  s3_service       = "s3.${var.region}.amazonaws.com"
  evidence_arn     = "arn:aws:s3:::${var.resource_prefix}-evidence"
  access_logs_arn  = "arn:aws:s3:::${var.resource_prefix}-access-logs"
}

resource "aws_kms_key" "evidence" {
  description             = "Synthetic AI control evidence only"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  # Account delegation allows scoped IAM policies below to use this key.
  # In a KMS key policy, Resource "*" means this key, not every key.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AccountAdministrationAndIAMDelegation"
      Effect    = "Allow"
      Principal = { AWS = local.account_root_arn }
      Action    = "kms:*"
      Resource  = "*"
    }]
  })

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_alias" "evidence" {
  name          = "alias/${var.resource_prefix}-evidence"
  target_key_id = aws_kms_key.evidence.key_id
}

resource "aws_s3_bucket" "evidence" {
  bucket        = "${var.resource_prefix}-evidence"
  force_destroy = false
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket" "access_logs" {
  bucket        = "${var.resource_prefix}-access-logs"
  force_destroy = false
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "private" {
  for_each = {
    evidence    = aws_s3_bucket.evidence.id
    access_logs = aws_s3_bucket.access_logs.id
  }
  bucket                  = each.value
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "private" {
  for_each = {
    evidence    = aws_s3_bucket.evidence.id
    access_logs = aws_s3_bucket.access_logs.id
  }
  bucket = each.value
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "private" {
  for_each = {
    evidence    = aws_s3_bucket.evidence.id
    access_logs = aws_s3_bucket.access_logs.id
  }
  bucket = each.value
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.evidence.arn
    }
    # Object-level encryption context permits prefix-scoped KMS IAM policies.
    bucket_key_enabled = false
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      # S3 server access-log delivery requires SSE-S3 at its destination.
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [local.evidence_arn, "${local.evidence_arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
      {
        Sid       = "RequireExplicitKmsEncryption"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${local.evidence_arn}/*"
        Condition = { StringNotEquals = { "s3:x-amz-server-side-encryption" = "aws:kms" } }
      },
      {
        Sid       = "RequireExactEvidenceKey"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${local.evidence_arn}/*"
        Condition = { StringNotEquals = { "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.evidence.arn } }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [local.access_logs_arn, "${local.access_logs_arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
      {
        Sid       = "AllowEvidenceAccessLogDelivery"
        Effect    = "Allow"
        Principal = { Service = "logging.s3.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${local.access_logs_arn}/s3-access/*"
        Condition = {
          ArnEquals    = { "aws:SourceArn" = local.evidence_arn }
          StringEquals = { "aws:SourceAccount" = var.expected_account_id }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_logging" "evidence" {
  bucket        = aws_s3_bucket.evidence.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access/"
  depends_on    = [aws_s3_bucket_policy.access_logs, aws_s3_bucket_server_side_encryption_configuration.access_logs]
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    id     = "LimitedExerciseLogRetention"
    status = "Enabled"
    filter {
      prefix = "s3-access/"
    }
    expiration {
      days = var.log_retention_days
    }
    noncurrent_version_expiration {
      noncurrent_days = var.log_retention_days
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
  depends_on = [aws_s3_bucket_versioning.private]
}

resource "aws_cloudwatch_log_group" "runtime" {
  name              = "/ai-exercise/${var.resource_prefix}/runtime"
  retention_in_days = var.log_retention_days
  # CloudWatch-managed at-rest encryption. No prompts, secrets or personal data.
}
