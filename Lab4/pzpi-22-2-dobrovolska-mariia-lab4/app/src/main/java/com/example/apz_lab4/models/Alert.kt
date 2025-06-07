// models/Alert.kt
package com.example.apz_lab4.models

data class Alert(
    val _id: String,
    val deviceId: String,
    val userId: String,
    val type: String,
    val severity: String,
    val message: String,
    val currentValue: Any,
    val isResolved: Boolean,
    val emailSent: Boolean,
    val createdAt: String,
    val updatedAt: String,
    val deviceName: String?, // nullable — бо не всі мають
    val metadata: AlertMetadata
)

data class AlertMetadata(
    val temperature: Double,
    val humidity: Double,
    val lightLevel: Int
)


