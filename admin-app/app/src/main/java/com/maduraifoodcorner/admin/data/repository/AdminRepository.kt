package com.maduraifoodcorner.admin.data.repository

import com.maduraifoodcorner.admin.data.api.AdminApiService
import com.maduraifoodcorner.admin.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

@Singleton
class AdminRepository @Inject constructor(private val apiService: AdminApiService) {

    suspend fun getDashboardSummary(): Result<DashboardOverview> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getDashboardSummary()
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch dashboard summary"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOrders(status: String? = null, search: String? = null): Result<List<Order>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getOrders(status, search)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch orders"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOrderById(id: String): Result<Order> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getOrderById(id)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Order not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateOrderStatus(id: String, status: String): Result<Order> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateOrderStatus(id, OrderStatusUpdateRequest(status))
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to update order status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPosOrder(request: CreatePosOrderRequest): Result<Order> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createPosOrder(request)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                val errorMsg = res.errorBody()?.string() ?: res.body()?.message ?: "Failed to create POS order"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFoods(search: String? = null, category: String? = null): Result<List<FoodItem>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getFoods(search, category)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch food items"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleFoodStatus(id: String, available: Boolean): Result<FoodItem> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.toggleFoodStatus(id, mapOf("available" to available))
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to update food availability"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun bulkUpdateAvailability(available: Boolean): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.bulkUpdateAvailability(mapOf("available" to available))
            if (res.isSuccessful && res.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed bulk availability update"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createFood(request: FoodCreateRequest): Result<FoodItem> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createFood(request)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                val errorMsg = res.errorBody()?.string() ?: res.body()?.message ?: "Failed to create food item"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createFoodMultipart(
        name: String,
        category: String,
        foodType: String,
        price: Double,
        offerEnabled: Boolean,
        offerPrice: Double?,
        available: Boolean,
        availableDays: String,
        imageFile: File?,
        mimeType: String = "image/jpeg",
        originalName: String? = null
    ): Result<FoodItem> = withContext(Dispatchers.IO) {
        try {
            val namePart = name.toRequestBody("text/plain".toMediaTypeOrNull())
            val categoryPart = category.toRequestBody("text/plain".toMediaTypeOrNull())
            val foodTypePart = foodType.toRequestBody("text/plain".toMediaTypeOrNull())
            val pricePart = price.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val offerEnabledPart = offerEnabled.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val offerPricePart = offerPrice?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val availablePart = available.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val availableDaysPart = availableDays.toRequestBody("text/plain".toMediaTypeOrNull())

            val imagePart = imageFile?.let {
                val requestFile = it.asRequestBody(mimeType.toMediaTypeOrNull())
                val filename = originalName ?: it.name
                MultipartBody.Part.createFormData("image", filename, requestFile)
            }

            val res = apiService.createFoodMultipart(
                namePart, categoryPart, foodTypePart, pricePart,
                offerEnabledPart, offerPricePart, availablePart, availableDaysPart, imagePart
            )

            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                val errorMsg = res.errorBody()?.string() ?: res.body()?.message ?: "Failed to create food item"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateFoodMultipart(
        id: String,
        name: String,
        category: String,
        foodType: String,
        price: Double,
        offerEnabled: Boolean,
        offerPrice: Double?,
        available: Boolean,
        availableDays: String,
        imageFile: File?,
        mimeType: String = "image/jpeg",
        originalName: String? = null
    ): Result<FoodItem> = withContext(Dispatchers.IO) {
        try {
            val namePart = name.toRequestBody("text/plain".toMediaTypeOrNull())
            val categoryPart = category.toRequestBody("text/plain".toMediaTypeOrNull())
            val foodTypePart = foodType.toRequestBody("text/plain".toMediaTypeOrNull())
            val pricePart = price.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val offerEnabledPart = offerEnabled.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val offerPricePart = offerPrice?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val availablePart = available.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val availableDaysPart = availableDays.toRequestBody("text/plain".toMediaTypeOrNull())

            val imagePart = imageFile?.let {
                val requestFile = it.asRequestBody(mimeType.toMediaTypeOrNull())
                val filename = originalName ?: it.name
                MultipartBody.Part.createFormData("image", filename, requestFile)
            }

            val res = apiService.updateFoodMultipart(
                id, namePart, categoryPart, foodTypePart, pricePart,
                offerEnabledPart, offerPricePart, availablePart, availableDaysPart, imagePart
            )

            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                val errorMsg = res.errorBody()?.string() ?: res.body()?.message ?: "Failed to update food item"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateFood(id: String, request: FoodCreateRequest): Result<FoodItem> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateFood(id, request)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to update food item"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteFood(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteFood(id)
            if (res.isSuccessful && res.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to delete food item"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCombos(): Result<List<Combo>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getCombos()
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch combos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createCombo(request: ComboCreateRequest): Result<Combo> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createCombo(request)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to create combo"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleComboStatus(id: String, available: Boolean): Result<Combo> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.toggleComboStatus(id, mapOf("available" to available))
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to update combo status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteCombo(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteCombo(id)
            if (res.isSuccessful && res.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to delete combo"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOffers(): Result<List<Offer>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getOffers()
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch offers"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createOffer(request: OfferCreateRequest): Result<Offer> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createOffer(request)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to create offer"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleOfferStatus(id: String, available: Boolean): Result<Offer> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.toggleOfferStatus(id, mapOf("available" to available))
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to update offer status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteOffer(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteOffer(id)
            if (res.isSuccessful && res.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to delete offer"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBusinessOverviewReport(): Result<BusinessOverviewReport> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getBusinessOverviewReport()
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch business report"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSettings(): Result<RestaurantSettings> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getSettings()
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch settings"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateSettings(settings: RestaurantSettings): Result<RestaurantSettings> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateSettings(settings)
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                val errBody = res.errorBody()?.string()
                Result.failure(Exception(errBody ?: res.body()?.message ?: "Failed to update settings"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOrderingCalendar(): Result<List<CalendarDateItem>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getOrderingCalendar()
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to fetch ordering calendar"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateOrderingCalendar(items: List<CalendarDateItem>): Result<List<CalendarDateItem>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateOrderingCalendar(CalendarUpdateRequest(dates = items))
            if (res.isSuccessful && res.body()?.success == true && res.body()?.data != null) {
                Result.success(res.body()!!.data!!)
            } else {
                Result.failure(Exception(res.body()?.message ?: "Failed to update ordering calendar"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
