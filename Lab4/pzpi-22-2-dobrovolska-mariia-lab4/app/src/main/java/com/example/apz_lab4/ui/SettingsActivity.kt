// SettingsActivity.kt
package com.example.apz_lab4.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.databinding.ActivitySettingsBinding
import com.example.apz_lab4.models.AlertSettings
import com.example.apz_lab4.models.Range
import com.example.apz_lab4.models.UpdateProfileRequest
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import kotlinx.coroutines.*

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val token = StorageHelper.getToken(this)
        if (token == null) {
            Toast.makeText(this, "Token not found", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Збереження профілю
        binding.saveProfileBtn.setOnClickListener {
            val name = binding.nameInput.text.toString()
            val oldPassword = binding.currentPasswordInput.text.toString()
            val newPassword = binding.newPasswordInput.text.toString()
            val confirmPassword = binding.confirmPasswordInput.text.toString()

            if (newPassword != confirmPassword) {
                Toast.makeText(this, "Паролі не співпадають", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val api = RetrofitInstance.getInstance(this@SettingsActivity).create(ApiService::class.java)
                    val body = UpdateProfileRequest(
                        name = name,
                        oldPassword = oldPassword,
                        newPassword = if (newPassword.isNotEmpty()) newPassword else null
                    )
                    val response = api.updateProfile("Bearer $token", body)

                    withContext(Dispatchers.Main) {
                        if (response.isSuccessful) {
                            Toast.makeText(this@SettingsActivity, "Профіль оновлено", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(this@SettingsActivity, "Помилка збереження профілю", Toast.LENGTH_SHORT).show()
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@SettingsActivity, "Помилка: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }

        // Збереження алертів
        binding.saveAlertsBtn.setOnClickListener {
            val tMin = binding.tempMinInput.text.toString().toIntOrNull()
            val tMax = binding.tempMaxInput.text.toString().toIntOrNull()
            val hMin = binding.humidityMinInput.text.toString().toIntOrNull()
            val hMax = binding.humidityMaxInput.text.toString().toIntOrNull()

            if (tMin == null || tMax == null || hMin == null || hMax == null) {
                Toast.makeText(this, "Заповніть усі поля алертів", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val api = RetrofitInstance.getInstance(this@SettingsActivity).create(ApiService::class.java)
                    val body = UpdateProfileRequest(
                        alertSettings = AlertSettings(
                            temperature = Range(tMin, tMax),
                            humidity = Range(hMin, hMax)
                        )
                    )
                    val response = api.updateProfile("Bearer $token", body)

                    withContext(Dispatchers.Main) {
                        if (response.isSuccessful) {
                            Toast.makeText(this@SettingsActivity, "Алерти збережено", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(this@SettingsActivity, "Помилка збереження алертів", Toast.LENGTH_SHORT).show()
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@SettingsActivity, "Помилка: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}
