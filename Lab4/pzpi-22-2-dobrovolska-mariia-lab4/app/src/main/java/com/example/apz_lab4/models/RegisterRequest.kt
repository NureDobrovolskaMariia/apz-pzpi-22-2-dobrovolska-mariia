package com.example.apz_lab4.models

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)