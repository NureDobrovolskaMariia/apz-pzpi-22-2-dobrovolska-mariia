// adapters/DeviceAdapter.kt
package com.example.apz_lab4.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.apz_lab4.R
import com.example.apz_lab4.models.Device

class DeviceAdapter(
    private val devices: List<Device>,
    private val onItemClick: (Device) -> Unit
) : RecyclerView.Adapter<DeviceAdapter.DeviceViewHolder>() {

    class DeviceViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val nameTextView: TextView = itemView.findViewById(R.id.deviceName)
        val statusTextView: TextView = itemView.findViewById(R.id.deviceStatus)
        val statusIndicator: View = itemView.findViewById(R.id.statusIndicator)
        val detailsButton: Button = itemView.findViewById(R.id.deviceDetailsButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DeviceViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_device, parent, false)
        return DeviceViewHolder(view)
    }

    override fun onBindViewHolder(holder: DeviceViewHolder, position: Int) {
        val device = devices[position]
        holder.nameTextView.text = "🥚 ${device.name}"

        // Встановлюємо статус
        if (device.status.lowercase() == "online") {
            holder.statusTextView.text = "Онлайн"
            holder.statusTextView.setTextColor(Color.parseColor("#4CAF50"))
            holder.statusIndicator.setBackgroundResource(R.drawable.status_online)
        } else {
            holder.statusTextView.text = "Офлайн"
            holder.statusTextView.setTextColor(Color.parseColor("#F44336"))
            holder.statusIndicator.setBackgroundResource(R.drawable.status_offline)
        }

        holder.detailsButton.setOnClickListener { onItemClick(device) }
    }

    override fun getItemCount(): Int = devices.size
}
