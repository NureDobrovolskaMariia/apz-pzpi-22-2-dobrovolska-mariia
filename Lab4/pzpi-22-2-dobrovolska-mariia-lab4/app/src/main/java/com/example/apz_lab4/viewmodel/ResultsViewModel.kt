package com.example.apz_lab4.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.apz_lab4.models.UserData
import com.example.apz_lab4.repository.ApiRepository
import kotlinx.coroutines.launch

class ResultsViewModel(private val repository: ApiRepository) : ViewModel() {

    val data = MutableLiveData<List<UserData>>()
    val error = MutableLiveData<String>()

    fun loadUserData() {
        viewModelScope.launch {
            try {
                val response = repository.getUserData()
                if (response.isSuccessful) {
                    data.postValue(response.body())
                } else {
                    error.postValue("Код помилки: ${response.code()}")
                }
            } catch (e: Exception) {
                error.postValue("Помилка: ${e.message}")
            }
        }
    }
}