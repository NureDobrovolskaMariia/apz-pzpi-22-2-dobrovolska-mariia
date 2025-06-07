// models/LatestSensorResponse.kt
package com.example.apz_lab4.models

import com.google.gson.annotations.SerializedName

// Головна відповідь від /data/latest
data class LatestSensorResponse(
    val status: String,
    val results: Int,
    val data: LatestSensorDataWrapper
)

data class LatestSensorDataWrapper(
    val devices: List<SensorWrapper>
)

// Один пристрій + останні дані
data class SensorWrapper(
    val device: DeviceInfo,
    val data: SensorData
)

// Інформація про сам пристрій
data class DeviceInfo(
    val id: String,
    val name: String,
    val status: String
)

// Дані з сенсорів
data class SensorData(
    @SerializedName("_id") val id: String,
    val deviceId: String,
    val userId: String,
    val temperature: Int,
    val humidity: Int,
    val lightLevel: Int,
    val autoMode: Boolean,
    val rssi: Int,
    val timestamp: String,
    val createdAt: String,
    val updatedAt: String,
    val deviceStatus: DeviceStatus
)

data class DeviceStatus(
    val heater: Boolean,
    val humidifier: Boolean,
    val fan: Boolean,
    val turner: Boolean
)
