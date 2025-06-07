package com.example.apz_lab4.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.apz_lab4.models.LoginRequest
import com.example.apz_lab4.models.LoginResponse
import com.example.apz_lab4.repository.ApiRepository
import kotlinx.coroutines.launch

class LoginViewModel(private val repository: ApiRepository) : ViewModel() {

    val loginResponse = MutableLiveData<LoginResponse?>()
    val errorMessage = MutableLiveData<String>()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            try {
                val response = repository.login(LoginRequest(email, password))
                if (response.isSuccessful) {
                    loginResponse.postValue(response.body())
                } else {
                    errorMessage.postValue("Помилка входу: ${response.code()}")
                }
            } catch (e: Exception) {
                errorMessage.postValue("Помилка: ${e.message}")
            }
        }
    }
}