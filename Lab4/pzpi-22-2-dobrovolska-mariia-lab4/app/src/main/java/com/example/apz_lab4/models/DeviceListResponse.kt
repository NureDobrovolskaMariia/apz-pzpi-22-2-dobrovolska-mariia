// models/DeviceListResponse.kt
package com.example.apz_lab4.models

data class DeviceListResponse(
    val status: String,
    val results: Int,
    val data: DeviceDataWrapper
)

data class DeviceDataWrapper(
    val devices: List<Device>
)

