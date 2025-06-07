// DevicesActivity.kt (виправлений під DeviceListResponse)
package com.example.apz_lab4.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.apz_lab4.R
import com.example.apz_lab4.adapters.DeviceAdapter
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.models.DeviceListResponse
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DevicesActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_devices)

        recyclerView = findViewById(R.id.devicesRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)

        val token = StorageHelper.getToken(this)
        if (token == null) {
            Toast.makeText(this, "Помилка: токен не знайдено", Toast.LENGTH_SHORT).show()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val api = RetrofitInstance.getInstance(this@DevicesActivity).create(ApiService::class.java)
                val response = api.getDevices("Bearer $token")
                if (response.isSuccessful) {
                    val devices = response.body()?.data?.devices ?: emptyList()
                    withContext(Dispatchers.Main) {
                        recyclerView.adapter = DeviceAdapter(devices) { device ->
                            val intent = Intent(this@DevicesActivity, DeviceDetailsActivity::class.java)
                            intent.putExtra("deviceId", device.deviceId)
                            startActivity(intent)
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@DevicesActivity, "Помилка: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@DevicesActivity, "Помилка: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}

