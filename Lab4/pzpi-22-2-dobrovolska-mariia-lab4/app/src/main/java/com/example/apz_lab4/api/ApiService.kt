package com.example.apz_lab4.api

import com.example.apz_lab4.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<MessageResponse>

    @GET("/api/data/user")
    suspend fun getUserData(): Response<List<UserData>>

    @GET("/api/devices")
    suspend fun getDevices(
        @Header("Authorization") token: String
    ): Response<DeviceListResponse>

    @GET("/api/data/latest")
    suspend fun getLatestSensorData(
        @Query("deviceId") deviceId: String,
        @Header("Authorization") token: String
    ): Response<LatestSensorResponse>

    @GET("api/alerts")
    suspend fun getAllAlerts(
        @Header("Authorization") token: String
    ): Response<AlertResponse>

    @GET("api/alerts/critical")
    suspend fun getCriticalAlerts(
        @Header("Authorization") token: String
    ): Response<CriticalAlertResponse>

    @GET("/api/alerts/statistics")
    suspend fun getAlertStatistics(
        @Header("Authorization") token: String
    ): Response<AlertStatisticsResponse>

    @GET("/api/auth/profile")
    suspend fun getProfile(@Header("Authorization") token: String): Response<ProfileResponse>

    @GET("/api/auth/stats")
    suspend fun getUserStats(
        @Header("Authorization") token: String
    ): Response<UserStatsResponse>


    @POST("/auth/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): Response<MessageResponse>

}
