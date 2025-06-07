// AlertsAdapter.kt
package com.example.apz_lab4.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.apz_lab4.databinding.ItemAlertBinding
import com.example.apz_lab4.models.Alert

class AlertsAdapter(private val alerts: List<Alert>) : RecyclerView.Adapter<AlertsAdapter.AlertViewHolder>() {

    inner class AlertViewHolder(val binding: ItemAlertBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AlertViewHolder {
        val binding = ItemAlertBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return AlertViewHolder(binding)
    }

    override fun getItemCount() = alerts.size

    override fun onBindViewHolder(holder: AlertViewHolder, position: Int) {
        val alert = alerts[position]
        with(holder.binding) {
            alertMessage.text = alert.message
            alertType.text = "Тип: ${alert.type}, Рівень: ${alert.severity}"
            alertDate.text = "Дата: ${alert.createdAt}"
        }
    }
}
