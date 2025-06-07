package com.example.apz_lab4.models

data class Device(
    val deviceId: String,
    val name: String,
    val type: String,
    val status: String,
    val location: String,
    val lastSeen: String,
    val firmware: String,
    val isActive: Boolean
)
