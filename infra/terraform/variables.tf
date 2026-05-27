variable "cloud_id" {
  type        = string
  description = "Yandex Cloud id."
}

variable "folder_id" {
  type        = string
  description = "Yandex Cloud folder id."
}

variable "zone" {
  type        = string
  description = "Yandex Cloud availability zone."
  default     = "ru-central1-a"
}

variable "domain_name" {
  type        = string
  description = "Optional host name, for example home.example.com. Leave empty while using the VM IP."
  default     = ""
}

variable "ssh_public_key" {
  type        = string
  description = "Public SSH key allowed to access the VM."
}

variable "vm_cores" {
  type        = number
  description = "VM CPU cores."
  default     = 2
}

variable "vm_memory_gb" {
  type        = number
  description = "VM memory in GB."
  default     = 4
}

variable "boot_disk_gb" {
  type        = number
  description = "Boot disk size."
  default     = 40
}

variable "ubuntu_image_id" {
  type        = string
  description = "Ubuntu image id. Resolve with `yc compute image list --folder-id standard-images`."
}
