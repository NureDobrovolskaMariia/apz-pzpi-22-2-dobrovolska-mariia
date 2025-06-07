// models/ProfileResponse.kt
package com.example.apz_lab4.models

data class ProfileResponse(
    val status: String,
    val data: ProfileData
)

data class ProfileData(
    val user: User
)

data class User(
    val _id: String,
    val name: String,
    val email: String,
    val role: String,
    val alertSettings: AlertSettings,
    val devices: List<UserDevice>,
    val emailNotifications: Boolean,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class AlertSettings(
    val temperature: Range,
    val humidity: Range
)

data class Range(
    val min: Int,
    val max: Int
)

data class UserDevice(
    val _id: String,
    val deviceId: String,
    val name: String,
    val status: String,
    val location: String,
    val lastSeen: String
)
