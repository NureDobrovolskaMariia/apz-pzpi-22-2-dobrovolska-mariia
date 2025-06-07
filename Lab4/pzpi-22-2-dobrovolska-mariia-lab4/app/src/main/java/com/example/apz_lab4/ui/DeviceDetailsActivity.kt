//  DeviceDetailsActivity.kt (оновлений: відображення всіх даних + перехід на AlertsActivity)
package com.example.apz_lab4.ui

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.databinding.ActivityDeviceDetailsBinding
import com.example.apz_lab4.models.LatestSensorResponse
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DeviceDetailsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDeviceDetailsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDeviceDetailsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val deviceId = intent.getStringExtra("deviceId")
        if (deviceId == null) {
            Toast.makeText(this, "Device ID not provided", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        val token = StorageHelper.getToken(this)
        if (token == null) {
            Toast.makeText(this, "Token not found", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // 🔍 Логування для дебагу
        Log.d("DETAILS", "Token: Bearer $token")
        Log.d("DETAILS", "Device ID: $deviceId")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val api = RetrofitInstance.getInstance(this@DeviceDetailsActivity).create(ApiService::class.java)
                val response = api.getLatestSensorData(deviceId, "Bearer $token")

                if (response.isSuccessful) {
                    val item = response.body()?.data?.devices?.firstOrNull()

                    withContext(Dispatchers.Main) {
                        if (item != null) {
                            binding.deviceName.text = item.device.name
                            binding.deviceStatus.text = item.device.status

                            val d = item.data
                            binding.tempText.text = "Температура: ${d.temperature} °C"
                            binding.humidityText.text = "Вологість: ${d.humidity} %"
                            binding.lightText.text = "Освітлення: ${d.lightLevel} lux"
                            binding.timestampText.text = "Час: ${d.timestamp}"
                        } else {
                            Toast.makeText(this@DeviceDetailsActivity, "Дані відсутні", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    Log.e("DETAILS", "Помилка відповіді: ${response.code()} ${response.errorBody()?.string()}")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@DeviceDetailsActivity, "Помилка: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("SENSOR_ERROR", "${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@DeviceDetailsActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }

        binding.alertsButton.setOnClickListener {
            val intent = Intent(this, AlertsActivity::class.java)
            intent.putExtra("deviceId", deviceId)
            startActivity(intent)
        }

        binding.alertStatsButton.setOnClickListener {
            val intent = Intent(this, AlertStatsActivity::class.java)
            startActivity(intent)
        }

    }
}
