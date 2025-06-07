//UserStatsResponse
package com.example.apz_lab4.models

data class UserStatsResponse(
    val status: String,
    val data: UserStats
)

data class UserStats(
    val deviceCount: Int,
    val recentAlertsCount: Int,
    val unresolvedAlertsCount: Int,
    val memberSince: String
)

