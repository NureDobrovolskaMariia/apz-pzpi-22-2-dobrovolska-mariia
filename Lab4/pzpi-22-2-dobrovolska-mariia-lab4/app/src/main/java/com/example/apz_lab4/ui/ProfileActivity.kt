// ProfileActivity.kt
package com.example.apz_lab4.ui

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.databinding.ActivityProfileBinding
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import kotlinx.coroutines.*

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val token = StorageHelper.getToken(this)
        if (token == null) {
            Toast.makeText(this, "Token not found", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val api = RetrofitInstance.getInstance(this@ProfileActivity).create(ApiService::class.java)

                //  1. Отримання профілю
                val response = api.getProfile("Bearer $token")
                if (response.isSuccessful) {
                    val user = response.body()?.data?.user
                    withContext(Dispatchers.Main) {
                        user?.let {
                            binding.nameText.text = "Ім’я: ${it.name}"
                            binding.emailText.text = "Email: ${it.email}"
                            binding.roleText.text = "Роль: ${it.role}"

                            val devicesText = if (it.devices.isNotEmpty())
                                it.devices.joinToString("\n") { d -> "• ${d.name} (${d.status})" }
                            else "Немає пристроїв"

                            binding.devicesText.text = devicesText
                        }
                    }
                } else {
                    Log.e("PROFILE", "Profile fetch error: ${response.code()} - ${response.errorBody()?.string()}")
                }

                //  2. Отримання статистики
                val statsResponse = api.getUserStats("Bearer $token")
                Log.d("PROFILE", "Stats response code: ${statsResponse.code()}")
                if (statsResponse.isSuccessful) {
                    val stats = statsResponse.body()?.data
                    Log.d("PROFILE", "Stats data: $stats")
                    withContext(Dispatchers.Main) {
                        binding.deviceCountText.text = "Кількість пристроїв: ${stats?.deviceCount ?: 0}"
                        binding.recentAlertsText.text = "Останні алерти: ${stats?.recentAlertsCount ?: 0}"
                        binding.unresolvedAlertsText.text = "Невирішені алерти: ${stats?.unresolvedAlertsCount ?: 0}"
                        binding.memberSinceText.text = "Зареєстрований з: ${stats?.memberSince?.take(10) ?: "-"}"
                    }
                } else {
                    Log.e("PROFILE", "Stats fetch error: ${statsResponse.code()} - ${statsResponse.errorBody()?.string()}")
                }

            } catch (e: Exception) {
                Log.e("PROFILE", "Exception: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ProfileActivity, "Помилка: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        //  Перехід до налаштувань
        binding.settingsButton.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }
    }
}
