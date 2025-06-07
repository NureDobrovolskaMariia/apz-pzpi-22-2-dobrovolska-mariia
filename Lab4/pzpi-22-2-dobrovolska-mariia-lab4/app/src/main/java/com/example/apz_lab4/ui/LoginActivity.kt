package com.example.apz_lab4.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.viewModels
import androidx.lifecycle.Observer
import com.example.apz_lab4.databinding.ActivityLoginBinding
import com.example.apz_lab4.repository.ApiRepository
import com.example.apz_lab4.storage.StorageHelper
import com.example.apz_lab4.viewmodel.LoginViewModel
import com.example.apz_lab4.viewmodel.ViewModelFactory
import com.example.apz_lab4.ui.ResultsActivity


class LoginActivity : ComponentActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels {
        ViewModelFactory(ApiRepository(applicationContext))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.loginButton.setOnClickListener {
            val email = binding.emailInput.text.toString()
            val password = binding.passwordInput.text.toString()

            if (email.isNotEmpty() && password.isNotEmpty()) {
                viewModel.login(email, password)
            } else {
                Toast.makeText(this, "Введіть email і пароль", Toast.LENGTH_SHORT).show()
            }
        }

        binding.registerRedirect.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        viewModel.loginResponse.observe(this, Observer { response ->
            response?.let {
                StorageHelper.saveToken(this, it.token)
                Toast.makeText(this, "Успішний вхід", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, ResultsActivity::class.java))
                finish()
            }
        })

        viewModel.errorMessage.observe(this, Observer { msg ->
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
        })
    }
}