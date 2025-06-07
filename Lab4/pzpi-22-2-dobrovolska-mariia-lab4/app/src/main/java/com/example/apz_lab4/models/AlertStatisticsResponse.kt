//AlertStatisticsResponse.kt
package com.example.apz_lab4.models

data class AlertStatisticsResponse(
    val status: String,
    val period: String,
    val data: AlertStatisticsData
)

data class AlertStatisticsData(
    val summary: AlertSummary,
    val byType: List<AlertGroup>,
    val bySeverity: List<AlertGroup>,
    val byDevice: List<DeviceAlertStat>,
    val dailyTrend: List<DailyTrend>
)

data class AlertSummary(
    val totalAlerts: Int,
    val unresolvedAlerts: Int,
    val resolvedAlerts: Int
)

data class AlertGroup(
    val _id: String,
    val count: Int,
    val unresolved: Int
)

data class DeviceAlertStat(
    val _id: String,
    val count: Int,
    val unresolved: Int,
    val lastAlert: String,
    val deviceName: String
)

data class AlertDailyTrend(
    val _id: AlertDay,
    val count: Int
)

data class AlertDay(
    val year: Int,
    val month: Int,
    val day: Int
)
