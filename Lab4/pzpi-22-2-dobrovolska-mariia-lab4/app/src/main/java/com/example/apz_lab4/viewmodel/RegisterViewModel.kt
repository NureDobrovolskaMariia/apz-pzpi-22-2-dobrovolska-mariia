package com.example.apz_lab4.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.apz_lab4.models.RegisterRequest
import com.example.apz_lab4.repository.ApiRepository
import kotlinx.coroutines.launch

class RegisterViewModel(private val repository: ApiRepository) : ViewModel() {

    val registerSuccess = MutableLiveData<Boolean>()
    val errorMessage = MutableLiveData<String>()

    fun register(name: String, email: String, password: String) {
        viewModelScope.launch {
            try {
                val response = repository.register(RegisterRequest(name, email, password))
                if (response.isSuccessful) {
                    registerSuccess.postValue(true)
                } else {
                    errorMessage.postValue("Помилка реєстрації: ${response.code()}")
                }
            } catch (e: Exception) {
                errorMessage.postValue("Помилка: ${e.message}")
            }
        }
    }
}