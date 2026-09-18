resource "aws_iam_role" "evidence_writer" {
  name                 = "${var.resource_prefix}-evidence-writer"
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = var.runtime_trusted_role_arn }
      Action    = "sts:AssumeRole"
    }]
  })
  lifecycle {
    precondition {
      condition     = startswith(var.runtime_trusted_role_arn, "arn:aws:iam::${var.expected_account_id}:role/")
      error_message = "Runtime trust must name a role in expected_account_id."
    }
    precondition {
      condition     = var.runtime_trusted_role_arn != var.audit_trusted_role_arn
      error_message = "Runtime and audit must use distinct trusted source roles."
    }
  }
}

resource "aws_iam_role_policy" "evidence_writer" {
  name = "synthetic-evidence-write-only"
  role = aws_iam_role.evidence_writer.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "WriteSyntheticEvidence"
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${local.evidence_arn}/synthetic/*"
      },
      {
        Sid      = "EncryptEvidenceThroughS3Only"
        Effect   = "Allow"
        Action   = ["kms:GenerateDataKey"]
        Resource = aws_kms_key.evidence.arn
        Condition = {
          StringEquals = { "kms:ViaService" = local.s3_service }
          StringLike   = { "kms:EncryptionContext:aws:s3:arn" = "${local.evidence_arn}/synthetic/*" }
        }
      },
      {
        Sid      = "WriteExistingRuntimeLogGroup"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.runtime.arn}:log-stream:*"
      }
    ]
  })
}

resource "aws_iam_role" "evidence_reader" {
  name                 = "${var.resource_prefix}-evidence-reader"
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = var.audit_trusted_role_arn }
      Action    = "sts:AssumeRole"
    }]
  })
  lifecycle {
    precondition {
      condition     = startswith(var.audit_trusted_role_arn, "arn:aws:iam::${var.expected_account_id}:role/")
      error_message = "Audit trust must name a role in expected_account_id."
    }
  }
}

resource "aws_iam_role_policy" "evidence_reader" {
  name = "synthetic-evidence-read-only"
  role = aws_iam_role.evidence_reader.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListSyntheticEvidenceOnly"
        Effect   = "Allow"
        Action   = ["s3:ListBucket", "s3:ListBucketVersions"]
        Resource = local.evidence_arn
        Condition = {
          StringLike = { "s3:prefix" = ["synthetic/", "synthetic/*"] }
        }
      },
      {
        Sid      = "ReadSyntheticEvidenceVersions"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:GetObjectVersion"]
        Resource = "${local.evidence_arn}/synthetic/*"
      },
      {
        Sid      = "DecryptEvidenceThroughS3Only"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = aws_kms_key.evidence.arn
        Condition = {
          StringEquals = { "kms:ViaService" = local.s3_service }
          StringLike   = { "kms:EncryptionContext:aws:s3:arn" = "${local.evidence_arn}/synthetic/*" }
        }
      }
    ]
  })
}
