// AlertsActivity.kt (оновлений: фільтрація та сортування)
package com.example.apz_lab4.ui

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.apz_lab4.adapters.AlertsAdapter
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.databinding.ActivityAlertsBinding
import com.example.apz_lab4.models.Alert
import com.example.apz_lab4.models.AlertResponse
import com.example.apz_lab4.models.CriticalAlertResponse
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import kotlinx.coroutines.*
import retrofit2.Response

class AlertsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAlertsBinding
    private var fullAlerts: List<Alert> = emptyList()
    private var isSortedByDate = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAlertsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.recyclerView.layoutManager = LinearLayoutManager(this)

        val token = StorageHelper.getToken(this)
        if (token == null) {
            Toast.makeText(this, "Token not found", Toast.LENGTH_SHORT).show()
            return
        }

        binding.allAlertsButton.setOnClickListener {
            loadAlerts(token, isCritical = false)
        }

        binding.filterTemperature.setOnClickListener {
            applyFilter("TEMPERATURE")
        }

        binding.filterHumidity.setOnClickListener {
            applyFilter("HUMIDITY")
        }


        binding.sortByDate.setOnClickListener {
            isSortedByDate = !isSortedByDate
            applySorting()
        }

        loadAlerts(token, isCritical = true)
    }

    private fun loadAlerts(token: String, isCritical: Boolean) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val api = RetrofitInstance.getInstance(this@AlertsActivity).create(ApiService::class.java)

                val response: Response<*> = if (isCritical) {
                    api.getCriticalAlerts("Bearer $token")
                } else {
                    api.getAllAlerts("Bearer $token")
                }

                if (response.isSuccessful) {
                    val alerts = when (response.body()) {
                        is CriticalAlertResponse -> (response.body() as CriticalAlertResponse).data.criticalAlerts
                        is AlertResponse -> (response.body() as AlertResponse).data.alerts
                        else -> emptyList()
                    }

                    fullAlerts = alerts
                    Log.d("ALERTS", "Alerts loaded: ${alerts.size}")

                    withContext(Dispatchers.Main) {
                        binding.recyclerView.adapter = AlertsAdapter(alerts)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@AlertsActivity, "Помилка: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("ALERTS", "Error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@AlertsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun applyFilter(type: String) {
        val filtered = fullAlerts.filter { it.type.equals(type, ignoreCase = true) }
        binding.recyclerView.adapter = AlertsAdapter(filtered)
    }

    private fun applySorting() {
        val sorted = if (isSortedByDate) {
            fullAlerts.sortedByDescending { it.createdAt }
        } else {
            fullAlerts
        }
        binding.recyclerView.adapter = AlertsAdapter(sorted)
    }
}


