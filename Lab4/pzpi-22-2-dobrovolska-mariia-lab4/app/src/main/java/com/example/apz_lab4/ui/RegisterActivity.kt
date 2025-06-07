package com.example.apz_lab4.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.viewModels
import androidx.lifecycle.Observer
import com.example.apz_lab4.databinding.ActivityRegisterBinding
import com.example.apz_lab4.repository.ApiRepository
import com.example.apz_lab4.viewmodel.RegisterViewModel
import com.example.apz_lab4.viewmodel.ViewModelFactory
import com.example.apz_lab4.ui.LoginActivity

class RegisterActivity : ComponentActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val viewModel: RegisterViewModel by viewModels {
        ViewModelFactory(ApiRepository(applicationContext))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.registerButton.setOnClickListener {
            val name = binding.nameInput.text.toString()
            val email = binding.emailInput.text.toString()
            val password = binding.passwordInput.text.toString()
            val confirmPassword = binding.confirmPasswordInput.text.toString()

            if (name.isNotEmpty() && email.isNotEmpty() && password == confirmPassword) {
                viewModel.register(name, email, password)
            } else {
                Toast.makeText(this, "Перевірте введені дані", Toast.LENGTH_SHORT).show()
            }
        }

        binding.loginRedirect.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }

        viewModel.registerSuccess.observe(this, Observer { success ->
            if (success) {
                Toast.makeText(this, "Успішна реєстрація", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
        })

        viewModel.errorMessage.observe(this, Observer { msg ->
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
        })
    }
}
