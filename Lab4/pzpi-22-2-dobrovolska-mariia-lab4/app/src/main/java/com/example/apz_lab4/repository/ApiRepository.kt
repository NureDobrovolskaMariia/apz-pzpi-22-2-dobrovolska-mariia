package com.example.apz_lab4.repository

import android.content.Context
import com.example.apz_lab4.models.*
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.api.ApiService
import retrofit2.Response

class ApiRepository(private val context: Context) {

    private val api: ApiService = RetrofitInstance
        .getInstance(context)
        .create(ApiService::class.java)

    suspend fun login(request: LoginRequest): Response<LoginResponse> {
        return api.login(request)
    }

    suspend fun register(request: RegisterRequest): Response<MessageResponse> {
        return api.register(request)
    }

    suspend fun getUserData(): Response<List<UserData>> {
        return api.getUserData()
    }
}