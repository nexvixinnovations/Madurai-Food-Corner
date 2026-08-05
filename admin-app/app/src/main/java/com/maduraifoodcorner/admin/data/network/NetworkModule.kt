package com.maduraifoodcorner.admin.data.network

import android.content.Context
import com.maduraifoodcorner.admin.AdminApp
import com.maduraifoodcorner.admin.data.api.AdminApiService
import com.maduraifoodcorner.admin.utils.Constants
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    @Provides
    @Singleton
    fun provideDynamicHostInterceptor(): Interceptor {
        return Interceptor { chain ->
            var request = chain.request()
            try {
                val context = AdminApp.instance
                val prefs = context.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE)
                val savedIp = prefs.getString("server_ip", null)
                if (!savedIp.isNullOrBlank()) {
                    var cleanIp = savedIp.trim()
                    if (cleanIp.startsWith("http://")) cleanIp = cleanIp.substring(7)
                    if (cleanIp.startsWith("https://")) cleanIp = cleanIp.substring(8)
                    val slashIdx = cleanIp.indexOf('/')
                    if (slashIdx != -1) cleanIp = cleanIp.substring(0, slashIdx)

                    var newHost = cleanIp
                    var newPort = 5000
                    if (cleanIp.contains(":")) {
                        val parts = cleanIp.split(":")
                        newHost = parts[0]
                        newPort = parts[1].toIntOrNull() ?: 5000
                    }

                    if (newHost.isNotBlank()) {
                        val newUrl = request.url.newBuilder()
                            .host(newHost)
                            .port(newPort)
                            .build()
                        request = request.newBuilder().url(newUrl).build()
                    }
                }
            } catch (e: Exception) {
                // Fallback to default request URL
            }
            chain.proceed(request)
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        loggingInterceptor: HttpLoggingInterceptor,
        dynamicHostInterceptor: Interceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(dynamicHostInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(Constants.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideAdminApiService(retrofit: Retrofit): AdminApiService {
        return retrofit.create(AdminApiService::class.java)
    }
}
