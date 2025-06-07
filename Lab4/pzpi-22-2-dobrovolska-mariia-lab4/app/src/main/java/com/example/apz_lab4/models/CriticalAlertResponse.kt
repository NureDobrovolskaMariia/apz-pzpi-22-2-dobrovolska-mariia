// models/CriticalAlertResponse.kt
package com.example.apz_lab4.models

data class CriticalAlertResponse(
    val status: String,
    val results: Int,
    val data: CriticalAlertsData
)

data class CriticalAlertsData(
    val criticalAlerts: List<Alert>
)
