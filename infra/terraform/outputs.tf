# Outputs contain resource identifiers after an authorized deployment.
# Keep their values and all state files out of the public repository.
output "evidence_bucket_name" {
  description = "Private synthetic evidence bucket; client keys must start with synthetic/."
  value       = aws_s3_bucket.evidence.id
}

output "evidence_kms_key_arn" {
  description = "Client PutObject requests must explicitly supply this KMS key ARN and aws:kms encryption."
  value       = aws_kms_key.evidence.arn
}

output "evidence_writer_role_arn" {
  value = aws_iam_role.evidence_writer.arn
}

output "evidence_reader_role_arn" {
  value = aws_iam_role.evidence_reader.arn
}

output "runtime_log_group_name" {
  value = aws_cloudwatch_log_group.runtime.name
}
