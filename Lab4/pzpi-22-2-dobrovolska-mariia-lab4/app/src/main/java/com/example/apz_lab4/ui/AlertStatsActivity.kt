// AlertStatsActivity.kt (оновлений з графіком MPAndroidChart)
package com.example.apz_lab4.ui

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.apz_lab4.api.ApiService
import com.example.apz_lab4.databinding.ActivityAlertStatsBinding
import com.example.apz_lab4.models.AlertStatisticsResponse
import com.example.apz_lab4.models.DailyTrend
import com.example.apz_lab4.network.RetrofitInstance
import com.example.apz_lab4.storage.StorageHelper
import com.github.mikephil.charting.charts.BarChart
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.BarData
import com.github.mikephil.charting.data.BarDataSet
import com.github.mikephil.charting.data.BarEntry
import com.github.mikephil.charting.formatter.ValueFormatter
import kotlinx.coroutines.*

class AlertStatsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAlertStatsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAlertStatsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val token = StorageHelper.getToken(this)
        if (token == null) {
            Toast.makeText(this, "Token not found", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val api = RetrofitInstance.getInstance(this@AlertStatsActivity).create(ApiService::class.java)
                val response = api.getAlertStatistics("Bearer $token")

                if (response.isSuccessful) {
                    val data = response.body()?.data
                    withContext(Dispatchers.Main) {
                        binding.totalAlerts.text = "Всього: ${data?.summary?.totalAlerts}"
                        binding.unresolvedAlerts.text = "Невирішені: ${data?.summary?.unresolvedAlerts}"
                        binding.resolvedAlerts.text = "Вирішені: ${data?.summary?.resolvedAlerts}"

                        setupChart(data?.dailyTrend ?: emptyList(), binding.dailyTrendChart)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@AlertStatsActivity, "Помилка: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("ALERT_STATS", "Error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@AlertStatsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun setupChart(dailyTrend: List<DailyTrend>, chart: BarChart) {
        val entries = dailyTrend.mapIndexed { index, item ->
            BarEntry(index.toFloat(), item.count.toFloat())
        }

        val labels = dailyTrend.map { "${it._id.day}/${it._id.month}" }

        val dataSet = BarDataSet(entries, "Кількість сповіщень")
        dataSet.color = resources.getColor(android.R.color.holo_blue_light, theme)

        val barData = BarData(dataSet)
        chart.data = barData

        chart.description.isEnabled = false
        chart.setDrawGridBackground(false)
        chart.setFitBars(true)

        val xAxis = chart.xAxis
        xAxis.valueFormatter = object : ValueFormatter() {
            override fun getFormattedValue(value: Float): String {
                return labels.getOrElse(value.toInt()) { "" }
            }
        }
        xAxis.position = XAxis.XAxisPosition.BOTTOM
        xAxis.setDrawGridLines(false)
        xAxis.granularity = 1f
        xAxis.labelRotationAngle = -45f

        chart.axisRight.isEnabled = false
        chart.invalidate()
    }
}
