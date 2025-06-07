// DailyTrend.kt
package com.example.apz_lab4.models

data class DailyTrend(
    val _id: TrendDate,
    val count: Int
)

data class TrendDate(
    val year: Int,
    val month: Int,
    val day: Int
)
