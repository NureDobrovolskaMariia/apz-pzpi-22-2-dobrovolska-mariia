//UpdateProfileRequest.kt
package com.example.apz_lab4.models

data class UpdateProfileRequest(
    val name: String? = null,
    val oldPassword: String? = null,
    val newPassword: String? = null,
    val alertSettings: AlertSettings? = null
)
