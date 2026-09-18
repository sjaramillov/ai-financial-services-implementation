# Every run uses a mocked AWS provider: no credentials, API calls or resources.
# Repeated digits below are synthetic test identifiers, never deployment inputs.
mock_provider "aws" {}

variables {
  region                   = "us-east-1"
  expected_account_id      = join("", [for i in range(12) : "2"])
  resource_prefix          = "synthetic-offline-check"
  runtime_trusted_role_arn = "arn:aws:iam::${join("", [for i in range(12) : "2"])}:role/mock-runtime"
  audit_trusted_role_arn   = "arn:aws:iam::${join("", [for i in range(12) : "2"])}:role/mock-auditor"
}

run "security_boundaries" {
  # Mock apply only fills computed fields in memory; it does not call AWS.
  command = apply

  assert {
    condition = alltrue([
      for block in aws_s3_bucket_public_access_block.private :
      block.block_public_acls && block.block_public_policy && block.ignore_public_acls && block.restrict_public_buckets
    ])
    error_message = "Both buckets must block every form of public access."
  }

  assert {
    condition = alltrue([
      for bucket in aws_s3_bucket_versioning.private : bucket.versioning_configuration[0].status == "Enabled"
    ])
    error_message = "Evidence and access logs must preserve versions."
  }

  assert {
    condition = (
      one(aws_s3_bucket_server_side_encryption_configuration.evidence.rule).apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms" &&
      aws_kms_key.evidence.enable_key_rotation
    )
    error_message = "Evidence must use a rotating customer-managed KMS key."
  }

  assert {
    condition = toset(flatten([
      for statement in jsondecode(aws_iam_role_policy.evidence_writer.policy).Statement : statement.Action
    ])) == toset(["s3:PutObject", "kms:GenerateDataKey", "logs:CreateLogStream", "logs:PutLogEvents"])
    error_message = "Runtime must not gain read, delete, decrypt or broader permissions."
  }

  assert {
    condition = toset(flatten([
      for statement in jsondecode(aws_iam_role_policy.evidence_reader.policy).Statement : statement.Action
    ])) == toset(["s3:ListBucket", "s3:ListBucketVersions", "s3:GetObject", "s3:GetObjectVersion", "kms:Decrypt"])
    error_message = "Reviewer must not gain writes, deletion or infrastructure administration."
  }

  assert {
    condition = alltrue([
      for role_policy in [aws_iam_role_policy.evidence_writer.policy, aws_iam_role_policy.evidence_reader.policy] :
      alltrue([for statement in jsondecode(role_policy).Statement : statement.Resource != "*"])
    ])
    error_message = "Identity permissions must remain scoped to explicit resources."
  }

  assert {
    condition = (
      jsondecode(aws_iam_role_policy.evidence_writer.policy).Statement[0].Resource == "arn:aws:s3:::synthetic-offline-check-evidence/synthetic/*" &&
      jsondecode(aws_iam_role_policy.evidence_writer.policy).Statement[1].Condition.StringEquals["kms:ViaService"] == "s3.us-east-1.amazonaws.com"
    )
    error_message = "Runtime access must stay within the synthetic prefix and S3-mediated encryption."
  }

  assert {
    condition = (
      jsondecode(aws_s3_bucket_policy.evidence.policy).Statement[0].Effect == "Deny" &&
      jsondecode(aws_s3_bucket_policy.evidence.policy).Statement[0].Condition.Bool["aws:SecureTransport"] == "false" &&
      jsondecode(aws_s3_bucket_policy.evidence.policy).Statement[1].Condition.StringNotEquals["s3:x-amz-server-side-encryption"] == "aws:kms" &&
      jsondecode(aws_s3_bucket_policy.evidence.policy).Statement[2].Condition.StringNotEquals["s3:x-amz-server-side-encryption-aws-kms-key-id"] == aws_kms_key.evidence.arn
    )
    error_message = "Uploads must require TLS and the exact configured KMS key."
  }

  assert {
    condition = (
      jsondecode(aws_s3_bucket_policy.access_logs.policy).Statement[1].Condition.StringEquals["aws:SourceAccount"] == var.expected_account_id &&
      jsondecode(aws_s3_bucket_policy.access_logs.policy).Statement[1].Condition.ArnEquals["aws:SourceArn"] == "arn:aws:s3:::synthetic-offline-check-evidence" &&
      aws_cloudwatch_log_group.runtime.retention_in_days == 30
    )
    error_message = "Log delivery must be bound to this source account/bucket and runtime retention must remain bounded."
  }
}

run "reject_shared_identity" {
  command = plan
  variables {
    audit_trusted_role_arn = "arn:aws:iam::${join("", [for i in range(12) : "2"])}:role/mock-runtime"
  }
  expect_failures = [aws_iam_role.evidence_writer]
}

run "reject_cross_account_trust" {
  command = plan
  variables {
    audit_trusted_role_arn = "arn:aws:iam::${join("", [for i in range(12) : "3"])}:role/mock-auditor"
  }
  expect_failures = [aws_iam_role.evidence_reader]
}

run "reject_account_placeholder" {
  command = plan
  variables {
    expected_account_id = "REPLACE_WITH_12_DIGIT_ACCOUNT_ID"
  }
  expect_failures = [var.expected_account_id]
}
