output "app_ip" {
  value       = yandex_vpc_address.app.external_ipv4_address[0].address
  description = "Static public IP for the HomeMonitor VM."
}

output "container_registry_id" {
  value       = yandex_container_registry.app.id
  description = "Yandex Container Registry id."
}

output "telemetry_bucket" {
  value       = yandex_storage_bucket.telemetry.bucket
  description = "Object Storage bucket for raw telemetry."
}

output "backups_bucket" {
  value       = yandex_storage_bucket.backups.bucket
  description = "Object Storage bucket for database backups."
}
