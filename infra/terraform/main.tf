resource "yandex_vpc_network" "home_monitor" {
  name = "homemonitor-network"
}

resource "yandex_vpc_subnet" "home_monitor" {
  name           = "homemonitor-subnet"
  zone           = var.zone
  network_id     = yandex_vpc_network.home_monitor.id
  v4_cidr_blocks = ["10.42.0.0/24"]
}

resource "yandex_vpc_address" "app" {
  name = "homemonitor-static-ip"

  external_ipv4_address {
    zone_id = var.zone
  }
}

resource "yandex_vpc_security_group" "app" {
  name       = "homemonitor-app-sg"
  network_id = yandex_vpc_network.home_monitor.id

  ingress {
    protocol       = "TCP"
    description    = "HTTP"
    v4_cidr_blocks = ["0.0.0.0/0"]
    port           = 80
  }

  ingress {
    protocol       = "TCP"
    description    = "HTTPS"
    v4_cidr_blocks = ["0.0.0.0/0"]
    port           = 443
  }

  ingress {
    protocol       = "TCP"
    description    = "SSH"
    v4_cidr_blocks = ["0.0.0.0/0"]
    port           = 22
  }

  egress {
    protocol       = "ANY"
    description    = "Outbound internet"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "yandex_iam_service_account" "app" {
  name        = "homemonitor-app"
  description = "HomeMonitor VM and Object Storage access"
}

resource "yandex_resourcemanager_folder_iam_member" "storage_editor" {
  folder_id = var.folder_id
  role      = "storage.editor"
  member    = "serviceAccount:${yandex_iam_service_account.app.id}"
}

resource "yandex_container_registry" "app" {
  name = "homemonitor"
}

resource "yandex_storage_bucket" "telemetry" {
  bucket = "homemonitor-telemetry-${var.folder_id}"

  lifecycle_rule {
    id      = "raw-telemetry-30-days"
    enabled = true

    expiration {
      days = 30
    }
  }
}

resource "yandex_storage_bucket" "backups" {
  bucket = "homemonitor-backups-${var.folder_id}"

  lifecycle_rule {
    id      = "backups-90-days"
    enabled = true

    expiration {
      days = 90
    }
  }
}

resource "yandex_compute_instance" "app" {
  name        = "homemonitor-app"
  platform_id = "standard-v3"
  zone        = var.zone

  resources {
    cores  = var.vm_cores
    memory = var.vm_memory_gb
  }

  boot_disk {
    initialize_params {
      image_id = var.ubuntu_image_id
      size     = var.boot_disk_gb
      type     = "network-ssd"
    }
  }

  network_interface {
    subnet_id          = yandex_vpc_subnet.home_monitor.id
    security_group_ids = [yandex_vpc_security_group.app.id]
    nat                = true
    nat_ip_address     = yandex_vpc_address.app.external_ipv4_address[0].address
  }

  service_account_id = yandex_iam_service_account.app.id

  metadata = {
    user-data = templatefile("${path.module}/cloud-init.yaml.tftpl", {
      ssh_public_key = var.ssh_public_key
      domain_name    = var.domain_name
    })
  }
}
