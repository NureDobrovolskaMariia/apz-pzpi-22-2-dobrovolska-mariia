// models/AlertResponse.kt
package com.example.apz_lab4.models

data class AlertResponse(
    val status: String,
    val results: Int,
    val data: AlertsData
)

data class AlertsData(
    val alerts: List<Alert>
)
