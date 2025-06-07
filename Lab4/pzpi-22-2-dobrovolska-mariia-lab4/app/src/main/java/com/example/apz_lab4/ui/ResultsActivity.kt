// ResultsActivity.kt (виправлений для DeviceListResponse + LOG)
package com.example.apz_lab4.ui

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.apz_lab4.adapters.DeviceAdapter
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.databinding.ActivityResultsBinding
import com.example.apz_lab4.models.DeviceListResponse
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ResultsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityResultsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResultsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.recyclerView.layoutManager = LinearLayoutManager(this)

        binding.addDeviceButton.setOnClickListener {
            startActivity(Intent(this, AddDeviceActivity::class.java))
        }

        binding.profileButton.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }

        binding.logoutButton.setOnClickListener {
            StorageHelper.clearToken(this)
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
        }

        val token = StorageHelper.getToken(this)
        Log.d("TOKEN_CHECK", "Token: $token")
        if (token == null) {
            Toast.makeText(this, "Token not found", Toast.LENGTH_SHORT).show()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val api = RetrofitInstance.getInstance(this@ResultsActivity).create(ApiService::class.java)
                val response = api.getDevices("Bearer $token")
                Log.d("API_CHECK", "Response code: ${response.code()}")
                Log.d("FULL_RESPONSE", "Raw: ${response.raw()}")
                Log.d("API_CHECK", "Body: ${response.body()}")

                if (response.isSuccessful) {
                    val devices = response.body()?.data?.devices ?: emptyList()
                    Log.d("ADAPTER", "Отримано пристроїв: ${devices.size}")

                    withContext(Dispatchers.Main) {
                        if (devices.isEmpty()) {
                            Toast.makeText(this@ResultsActivity, "Немає зареєстрованих пристроїв", Toast.LENGTH_SHORT).show()
                        }
                        binding.recyclerView.adapter = DeviceAdapter(devices) { device ->
                            val intent = Intent(this@ResultsActivity, DeviceDetailsActivity::class.java)
                            intent.putExtra("deviceId", device.deviceId)
                            startActivity(intent)
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@ResultsActivity, "Помилка: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("API_ERROR", "Exception: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ResultsActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}